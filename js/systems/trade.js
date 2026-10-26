// 买卖与行情
import { GOODS, isTreasure } from '../data/goods.js';
import { TREASURES, TREASURE_IDS, treasuresInCity } from '../data/treasures.js';
import { CITIES, CITY_MAP } from '../data/world.js';
import { player, addMoney, addGoods, caravanFree, addLog, basePriceOf } from '../state.js';
import { clamp } from '../util.js';
import { currentPolicy } from './policy.js';

export function priceAt(st, cityId, goodId) {
  return st.world.prices[cityId]?.[goodId] ?? basePriceOf(st, cityId, goodId);
}

export function policyPriceMod(st, goodId) {
  const pol = currentPolicy(st);
  if (!pol) return 1;
  if (pol.id === 'farm' && goodId === 'su') return 0.88;
  if (pol.id === 'trade') return 0.97;
  return 1;
}

export function levyOf(st) {
  const sk = player(st).skills.shanggu ?? 0;
  const base = player(st).profession === 'shangren' ? 0.9 : 0.82;
  const pol = currentPolicy(st)?.id === 'trade' ? 0.04 : 0;
  return clamp(base + sk * 0.012 + pol, 0.8, 0.99);
}

export function canBuy(st, goodId, qty) {
  const p = priceAt(st, player(st).cityId, goodId);
  const bulk = (GOODS[goodId]?.bulk ?? 1) * qty;
  if (qty <= 0) return '数量不足。';
  if (p * qty > player(st).money) return '金钱不足。';
  if (bulk > caravanFree(st)) return '行囊已满。';
  return null;
}

export function buy(st, goodId, qty) {
  if (isTreasure(goodId)) return { ok: false, msg: `${GOODS[goodId].name}为珍稀之物，只在「珍宝」页出售。` };
  const err = canBuy(st, goodId, qty);
  if (err) return { ok: false, msg: err };
  const cid = player(st).cityId;
  const price = Math.round(priceAt(st, cid, goodId) * policyPriceMod(st, goodId));
  addMoney(st, -Math.round(price * qty), true);
  addGoods(st, goodId, qty);
  // 买入抬价
  st.world.prices[cid][goodId] = Math.max(3, Math.round(price * (1 + 0.0025 * qty)));
  st.stats.trades++;
  addLog(st, `于${CITY_MAP[cid].name}买入${GOODS[goodId].name}${qty}${GOODS[goodId].unit}，付${Math.round(price * qty)}金。`);
  return { ok: true, cost: Math.round(price * qty), price };
}

export function sell(st, goodId, qty) {
  if (isTreasure(goodId)) return { ok: false, msg: `${GOODS[goodId].name}为珍稀之物，市集不敢收。` };
  const inv = player(st).inventory[goodId] ?? 0;
  if (qty <= 0) return { ok: false, msg: '数量不足。' };
  if (inv < qty) return { ok: false, msg: '货不够。' };
  const cid = player(st).cityId;
  const price = Math.round(priceAt(st, cid, goodId) * policyPriceMod(st, goodId));
  const gain = Math.round(price * qty * levyOf(st));
  addGoods(st, goodId, -qty);
  addMoney(st, gain, true);
  st.world.prices[cid][goodId] = Math.max(3, Math.round(price * (1 - 0.002 * qty)));
  st.stats.trades++;
  addLog(st, `于${CITY_MAP[cid].name}卖出${GOODS[goodId].name}${qty}${GOODS[goodId].unit}，得${gain}金。`, 'gain');
  return { ok: true, gain, price };
}

// 各地行情（按卖价高到低），商贾技能等级决定能看多远
export function bestMarkets(st, goodId, limit = 5) {
  const cid = player(st).cityId;
  const rows = CITIES.filter(c => c.id !== cid).map(c => ({
    city: c,
    price: priceAt(st, c.id, goodId),
    dist: Math.abs(c.x - CITY_MAP[cid].x) + Math.abs(c.y - CITY_MAP[cid].y),
  }));
  rows.sort((a, b) => b.price - a.price);
  return rows.slice(0, limit);
}

export function inventoryRows(st) {
  return Object.entries(player(st).inventory).filter(([, q]) => q > 0).map(([g, q]) => ({
    good: GOODS[g], id: g, qty: q,
    price: priceAt(st, player(st).cityId, g),
  }));
}

export function tradeSummary(st, goodId) {
  const cid = player(st).cityId;
  const price = priceAt(st, cid, goodId);
  const locals = CITIES.filter(c => c.id !== cid);
  let best = null;
  for (const c of locals) {
    const p = priceAt(st, c.id, goodId);
    if (!best || p > best.p) best = { c, p };
  }
  return { price, best, spread: best ? best.p - price : 0 };
}


// ---------------- 珍宝市 ----------------
const dayNum = (t) => (t.year + 722) * 360 + (t.month - 1) * 30 + t.day;

// 单种珍宝在某城的状态
export function treasureStatus(st, gemId, cityId = player(st).cityId) {
  const def = TREASURES[gemId];
  if (!def || !def.cities.includes(cityId)) return { available: false, reason: '此城无此珍宝', left: 0, price: 0, def };
  const w = st.world.treasures?.[gemId];
  const c = w?.cities?.[cityId];
  if (!w || !c) return { available: false, reason: '此城暂无此珍宝', left: 0, price: w?.price ?? def.base, def };
  const now = dayNum(st.time);
  // 只读：不在此处改写 nextDay，判断是否到货即可
  const left = c.nextDay && c.nextDay > now ? c.nextDay - now : 0;
  return { available: !left, left, price: w.price, def };
}

// 本城所有珍宝的状态
export function treasureList(st, cityId = player(st).cityId) {
  return treasuresInCity(cityId).map(id => ({ id, ...treasureStatus(st, id, cityId) }));
}

export function buyTreasure(st, gemId, cityId = player(st).cityId) {
  const def = TREASURES[gemId];
  if (!def || !def.cities.includes(cityId)) return { ok: false, msg: '此城并无此宝。' };
  const status = treasureStatus(st, gemId, cityId);
  if (!status.available) return { ok: false, msg: `本城${def.name}已售罄，${status.left} 日后才会再有。` };
  if (player(st).money < status.price) return { ok: false, msg: `${def.name}价 ${status.price} 金，囊中不足。` };
  addMoney(st, -status.price, true);
  addGoods(st, gemId, 1);
  const w = st.world.treasures[gemId];
  w.cities[cityId].nextDay = 0; // 到货即清倒计时，由写入路径负责
  w.sold = (w.sold ?? 0) + 1;
  w.price = Math.round(w.price * def.step);
  w.cities[cityId].nextDay = dayNum(st.time) + def.restock;
  st.world.treasuresCollected = st.world.treasuresCollected ?? {};
  st.world.treasuresCollected[gemId] = true;
  addLog(st, `以 ${status.price} 金购得${def.name}。`, 'big');
  return {
    ok: true, price: status.price, nextPrice: w.price, def,
    msg: `购得${def.name}，价 ${status.price} 金。此后${def.name}价上涨至 ${w.price} 金。`,
  };
}

// 兼容旧接口
export function jadeStatus(st, cityId = player(st).cityId) {
  return treasureStatus(st, 'yu', cityId);
}
export function buyJade(st, cityId = player(st).cityId) {
  return buyTreasure(st, 'yu', cityId);
}

// 已收藏的珍宝种类数
export function treasuresOwnedKinds(st) {
  return TREASURE_IDS.filter(id => (player(st).inventory[id] ?? 0) > 0).length;
}
