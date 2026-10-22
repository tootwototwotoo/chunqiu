// 旅行：最短路、行程、途中遭遇
import { ROADS, CITY_MAP } from '../data/world.js';
import { R, player, addStamina, addMoney, addLog, addHealth, city } from '../state.js';
import { advanceDays, seasonOf, absDay } from './calendar.js';
import { checkArrivalQuests } from './quests.js';
import { ri, clamp } from '../util.js';

const ADJ = {};
for (const [a, b, d] of ROADS) {
  (ADJ[a] ||= []).push({ to: b, days: d });
  (ADJ[b] ||= []).push({ to: a, days: d });
}

export function shortestPath(from, to, st) {
  const dist = {}, prev = {}, seen = new Set();
  for (const id of Object.keys(CITY_MAP)) dist[id] = Infinity;
  dist[from] = 0;
  while (true) {
    let u = null, best = Infinity;
    for (const id of Object.keys(CITY_MAP)) if (!seen.has(id) && dist[id] < best) { best = dist[id]; u = id; }
    if (!u || u === to) break;
    seen.add(u);
    for (const e of ADJ[u] || []) {
      const w = roadDays(st, e.days, e.to);
      if (dist[u] + w < dist[e.to]) { dist[e.to] = dist[u] + w; prev[e.to] = u; }
    }
  }
  if (!isFinite(dist[to])) return null;
  const path = [to];
  let cur = to;
  while (cur !== from) { cur = prev[cur]; if (!cur) return null; path.unshift(cur); }
  return { path, days: Math.round(dist[to]) };
}

function roadDays(st, base, destCity) {
  let d = base;
  if (seasonOf(st.time) === '冬') d *= 1.2;
  if (st.time.month >= 6 && st.time.month <= 8) d *= 1.05; // 雨季
  const owner = st.world.owner[destCity];
  if (st.world.wars?.includes(`${owner}`)) d *= 1.1;
  return d;
}

export function travelPlan(st, toCityId) {
  if (toCityId === st.player.cityId) return null;
  const sp = shortestPath(st.player.cityId, toCityId, st);
  if (!sp) return null;
  const days = sp.days;
  const cost = Math.max(4, Math.round(days * 2.2));
  const stamina = Math.round(days * 2.1);
  return { days, cost, stamina, path: sp.path };
}

export function travelTo(st, toCityId) {
  const plan = travelPlan(st, toCityId);
  if (!plan) return { ok: false, msg: '无路可通。' };
  if (st.player.money < plan.cost) return { ok: false, msg: '盘缠不足。' };
  if (st.player.stamina < 8) return { ok: false, msg: '体力不济，先歇息几日罢。' };
  addMoney(st, -plan.cost, true);
  const res = advanceDays(st, plan.days, { travel: true });
  addStamina(st, -plan.stamina);
  st.player.cityId = toCityId;
  st.stats.travelDays += plan.days;
  const arr = checkArrivalQuests(st, toCityId);
  addLog(st, `行${plan.days}日，抵${CITY_MAP[toCityId].name}。${plan.cost ? `路费${plan.cost}金。` : ''}`);
  return { ok: true, days: plan.days, cost: plan.cost, notes: res.notes, events: res.events, promotions: res.promotions, quests: arr, died: res.died };
}

export function encounterOnRoad(st) {
  // 途中偶遇，返回轻量事件
  const roll = R.next(st);
  if (roll < 0.16) {
    const kind = R.pick(st, ['rumor', 'refugee', 'merchant', 'soldier', 'hermit']);
    const texts = {
      rumor: `路遇行脚商人，说起${R.pick(st, Object.values(CITY_MAP)).name}的行情有变。`,
      refugee: '道旁有流民携幼而行，你分了半囊干粮。',
      merchant: '一支商队与你同行一程，车辙深深。',
      soldier: '一队戍卒擦肩而过，甲叶上还带着霜。',
      hermit: '山道旁有老者对弈，见你经过，点了点头。',
    };
    if (kind === 'refugee') { addMoney(st, -10); addStamina(st, 4); }
    return { text: texts[kind] };
  }
  return null;
}
