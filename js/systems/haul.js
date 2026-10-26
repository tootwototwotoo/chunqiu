// 运输系统：载重、装运、在途、遇劫
// 贩夫与行商即时交割；坐贾以上须成批装运，装运与在途都耗时。
import { VEHICLES, BULK_TRADE, HAUL_RISK } from '../data/merchant.js';
import { CITY_MAP } from '../data/world.js';
import { GOODS } from '../data/goods.js';
import { player, addLog, addMoney, addGoods, R } from '../state.js';
import { rankIndexOf } from './merchant.js';
import { absDay } from '../util.js';

const isMerchant = (st) => player(st).profession === 'shangren';

// ---------- 工具 ----------
export function vehicleOf(st) {
  const id = player(st).vehicle ?? 'foot';
  return VEHICLES[id] ?? VEHICLES.foot;
}

export function vehicleCapacity(st) {
  const p = player(st);
  const v = vehicleOf(st);
  // 徒步时用原始的 caravan（商人 24）
  return v.id === 'foot' ? (p.caravan ?? VEHICLES.foot.capacity) : v.capacity;
}

export function canBuyVehicle(st, vehicleId) {
  const def = VEHICLES[vehicleId];
  if (!def) return { ok: false, msg: '并无此器。' };
  if (!isMerchant(st)) return { ok: false, msg: '运输工具唯商贾购置。' };
  const p = player(st);
  if (p.vehicle === vehicleId) return { ok: false, msg: `已在用${def.name}。` };
  if (rankIndexOf(st) < def.minRank) {
    return { ok: false, msg: `须至${['贩夫', '行商', '坐贾', '巨商', '商盟之主', '陶朱公'][def.minRank]}方可置${def.name}。` };
  }
  if (p.money < def.price) return { ok: false, msg: `${def.name}需金${def.price}。` };
  if (def.water) {
    const city = CITY_MAP[p.cityId];
    if (!city?.water) return { ok: false, msg: '舟船须于水路之邑购置。' };
  }
  return { ok: true, cost: def.price, def };
}

export function buyVehicle(st, vehicleId) {
  const chk = canBuyVehicle(st, vehicleId);
  if (!chk.ok) return chk;
  const p = player(st);
  addMoney(st, -chk.cost, true);
  p.vehicle = vehicleId;
  // 换用更大的工具时，行囊上限同步提高
  p.caravan = Math.max(p.caravan ?? 0, chk.def.capacity);
  addLog(st, `置${chk.def.name}，载重${chk.def.capacity}。`, 'gain');
  return { ok: true, def: chk.def, msg: `置得${chk.def.name}，一次可运载重${chk.def.capacity}。` };
}

// 舟船只能在水路城之间走
export function canUseVehicleOn(st, fromCityId, toCityId) {
  const v = vehicleOf(st);
  if (!v.water) return { ok: true };
  const a = CITY_MAP[fromCityId], b = CITY_MAP[toCityId];
  if (!a?.water || !b?.water) {
    return { ok: false, msg: `${v.name}循水而行，${!a?.water ? a?.name : b?.name}不通水路，须改走车马。` };
  }
  return { ok: true };
}

// ---------- 交割规则 ----------
export function bulkRuleOf(st) {
  const r = rankIndexOf(st);
  return BULK_TRADE[Math.min(r, BULK_TRADE.length - 1)];
}

export function isInstantTrade(st) {
  return bulkRuleOf(st).instant;
}

export function minTradeQty(st) {
  return bulkRuleOf(st).minQty;
}

// ---------- 在途货单 ----------
export function haulsOf(st) {
  const p = player(st);
  if (!Array.isArray(p.hauls)) p.hauls = [];
  return p.hauls;
}

export function haulsAt(st) {
  return haulsOf(st).filter(h => h.to === player(st).cityId);
}

// 装运天数：按载重 ÷ 装运速度
export function loadDays(st, totalBulk) {
  const v = vehicleOf(st);
  if (!v.load) return Math.ceil(totalBulk / 40); // 徒步靠人力
  return Math.max(1, Math.ceil(totalBulk / v.load));
}

// 发起一次大宗采购：付款 → 装运 → 生成在途单
export function startHaul(st, goodId, qty, toCityId, unitPrice) {
  const p = player(st);
  if (!isMerchant(st)) return { ok: false, msg: '唯商贾可行大宗货运。' };
  const rule = bulkRuleOf(st);
  if (qty < rule.minQty) return { ok: false, msg: `须成批交易，至少${rule.minQty}${GOODS[goodId].unit}。` };
  const use = canUseVehicleOn(st, p.cityId, toCityId);
  if (!use.ok) return use;

  const bulk = (GOODS[goodId]?.bulk ?? 1) * qty;
  const cap = vehicleCapacity(st);
  if (bulk > cap) return { ok: false, msg: `载重不足（需${bulk}，${vehicleOf(st).name}仅${cap}）。` };

  const cost = unitPrice * qty;
  if (p.money < cost) return { ok: false, msg: `货款需${cost}金。` };

  addMoney(st, -cost, true);
  const days = loadDays(st, bulk);
  haulsOf(st).push({
    id: `h${absDay(st.time)}_${R.int(st, 100, 999)}`,
    goodId, qty, from: p.cityId, to: toCityId,
    bulk, cost, loaded: days, startedDay: absDay(st.time),
    escorted: false,
  });
  addLog(st, `于${CITY_MAP[p.cityId].name}办货${GOODS[goodId].name}${qty}${GOODS[goodId].unit}，装运${days}日。`);
  return {
    ok: true, days, cost, bulk,
    msg: `办货${qty}${GOODS[goodId].unit}，付${cost}金。装运需${days}日，装毕后随你运往${CITY_MAP[toCityId].name}。`,
  };
}

// 抵达目的城时结算：卸载入库，并判定遇劫
export function arriveHauls(st, cityId) {
  const p = player(st);
  const list = haulsOf(st);
  const arrived = list.filter(h => h.to === cityId);
  if (!arrived.length) return { ok: true, notes: [] };

  const notes = [];
  for (const h of arrived) {
    const days = absDay(st.time) - h.startedDay;
    let loss = 0;
    // 途程越长越易遇劫
    const risk = HAUL_RISK.base + Math.max(0, days - HAUL_RISK.longDay) * HAUL_RISK.perLongDay;
    const eff = h.escorted ? risk * HAUL_RISK.escortHalve : risk;
    if (R.chance(st, Math.min(0.6, eff))) {
      loss = Math.round(h.qty * HAUL_RISK.lossRate);
      if (loss > 0) {
        addLog(st, `途中遇劫，折损${GOODS[h.goodId].name}${loss}${GOODS[h.goodId].unit}。`, 'war');
        notes.push(`途中遇劫，折损${GOODS[h.goodId].name}${loss}${GOODS[h.goodId].unit}。`);
      }
    }
    const kept = h.qty - loss;
    if (kept > 0) addGoods(st, h.goodId, kept);
    notes.push(`${GOODS[h.goodId].name}${kept}${GOODS[h.goodId].unit}运抵${CITY_MAP[cityId].name}。`);
  }
  p.hauls = list.filter(h => h.to !== cityId);
  return { ok: true, notes, arrived: arrived.length };
}

// 为某批货雇护卫
export function escortHaul(st, haulId) {
  const h = haulsOf(st).find(x => x.id === haulId);
  if (!h) return { ok: false, msg: '并无此单。' };
  if (h.escorted) return { ok: false, msg: '此单已有护卫。' };
  if (player(st).money < HAUL_RISK.escortCost) return { ok: false, msg: `雇护卫需${HAUL_RISK.escortCost}金。` };
  addMoney(st, -HAUL_RISK.escortCost, true);
  h.escorted = true;
  return { ok: true, msg: `为此单雇护卫，遇劫风险减半（费${HAUL_RISK.escortCost}金）。` };
}

export function haulSummary(st) {
  return haulsOf(st).map(h => ({
    ...h,
    goodName: GOODS[h.goodId]?.name ?? h.goodId,
    unit: GOODS[h.goodId]?.unit ?? '',
    toName: CITY_MAP[h.to]?.name ?? h.to,
    fromName: CITY_MAP[h.from]?.name ?? h.from,
    days: absDay(st.time) - h.startedDay,
  }));
}
