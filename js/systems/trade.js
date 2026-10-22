// 买卖与行情
import { GOODS } from '../data/goods.js';
import { CITIES, CITY_MAP } from '../data/world.js';
import { player, addMoney, addGoods, goodsCount, caravanFree, addLog, R, basePriceOf } from '../state.js';
import { ri, clamp } from '../util.js';

export function priceAt(st, cityId, goodId) {
  return st.world.prices[cityId]?.[goodId] ?? basePriceOf(st, cityId, goodId);
}

export function levyOf(st) {
  const sk = player(st).skills.shanggu ?? 0;
  const base = player(st).profession === 'shangren' ? 0.9 : 0.82;
  return clamp(base + sk * 0.012, 0.8, 0.99);
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
  const err = canBuy(st, goodId, qty);
  if (err) return { ok: false, msg: err };
  const cid = player(st).cityId;
  const price = priceAt(st, cid, goodId);
  addMoney(st, -Math.round(price * qty), true);
  addGoods(st, goodId, qty);
  // 买入抬价
  st.world.prices[cid][goodId] = Math.max(3, Math.round(price * (1 + 0.0025 * qty)));
  st.stats.trades++;
  addLog(st, `于${CITY_MAP[cid].name}买入${GOODS[goodId].name}${qty}${GOODS[goodId].unit}，付${Math.round(price * qty)}金。`);
  return { ok: true, cost: Math.round(price * qty), price };
}

export function sell(st, goodId, qty) {
  const inv = player(st).inventory[goodId] ?? 0;
  if (qty <= 0) return { ok: false, msg: '数量不足。' };
  if (inv < qty) return { ok: false, msg: '货不够。' };
  const cid = player(st).cityId;
  const price = priceAt(st, cid, goodId);
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
