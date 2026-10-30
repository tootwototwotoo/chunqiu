// 旅行：最短路、行程、途中遭遇
import { CITY_MAP } from '../data/world.js';
import { addStamina, addMoney, addLog } from '../state.js';
import { advanceDays } from './calendar.js';
import { shortestPath } from './pathfind.js';
import { checkArrivalQuests } from './quests.js';
import { arriveHauls } from './haul.js';
import { VEHICLES } from '../data/merchant.js';
export { shortestPath } from './pathfind.js';

export function travelPlan(st, toCityId) {
  if (toCityId === st.player.cityId) return null;
  const sp = shortestPath(st.player.cityId, toCityId, st);
  if (!sp) return null;
  const days = sp.days;
  const cost = Math.max(4, Math.round(days * 2.2));
  // 有车马舟船者，体力消耗按工具系数折算
  const factor = vehicleStaminaFactor(st);
  const stamina = Math.round(days * 2.1 * factor);
  return { days, cost, stamina, path: sp.path };
}

function vehicleStaminaFactor(st) {
  const id = st.player?.vehicle;
  if (!id || id === 'foot') return 1;
  return VEHICLES[id]?.stamina ?? 1;
}

// 逐段行程计划：把 path 拆成相邻城的腿，供动画播放
export function travelLegs(st, toCityId) {
  const plan = travelPlan(st, toCityId);
  if (!plan) return null;
  const legs = [];
  for (let i = 1; i < plan.path.length; i++) {
    const a = plan.path[i - 1], b = plan.path[i];
    const d = shortestPath(a, b, st)?.days ?? 1;
    legs.push({ from: a, to: b, days: Math.max(1, d) });
  }
  return { ...plan, legs };
}

// 单步行进：走完当前腿的剩余天数（供动画逐帧驱动）。
// 返回 { arrived, notes, events, ... } 形式与 travelTo 一致。
export function travelTo(st, toCityId) {
  const plan = travelPlan(st, toCityId);
  if (!plan) return { ok: false, msg: '无路可通。' };
  if (st.player.money < plan.cost) return { ok: false, msg: '盘缠不足。' };
  if (st.player.stamina < 8) return { ok: false, msg: '体力不济，先歇息几日罢。' };
  addMoney(st, -plan.cost, true);
  const res = advanceDays(st, plan.days, { travel: true });
  addStamina(st, -plan.stamina);
  st.player.cityId = toCityId;
  st.player.visitedCities = [...new Set([...(st.player.visitedCities ?? [st.player.homeCity]), toCityId])];
  st.stats.travelDays += plan.days;
  const arr = checkArrivalQuests(st, toCityId);
  // 在途货单运抵卸货
  const unload = arriveHauls(st, toCityId);
  addLog(st, `行${plan.days}日，抵${CITY_MAP[toCityId].name}。${plan.cost ? `路费${plan.cost}金。` : ''}`);
  return {
    ok: true, days: plan.days, cost: plan.cost,
    notes: [...res.notes, ...(unload.notes ?? [])],
    events: res.events, promotions: res.promotions, quests: arr, died: res.died,
    unloaded: unload.arrived ?? 0,
  };
}

