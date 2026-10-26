// 旅行：最短路、行程、途中遭遇
import { CITY_MAP } from '../data/world.js';
import { R, player, addStamina, addMoney, addLog, addHealth, city } from '../state.js';
import { advanceDays } from './calendar.js';
import { shortestPath } from './pathfind.js';
import { checkArrivalQuests } from './quests.js';
export { shortestPath } from './pathfind.js';

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
  st.player.visitedCities = [...new Set([...(st.player.visitedCities ?? [st.player.homeCity]), toCityId])];
  st.stats.travelDays += plan.days;
  const arr = checkArrivalQuests(st, toCityId);
  addLog(st, `行${plan.days}日，抵${CITY_MAP[toCityId].name}。${plan.cost ? `路费${plan.cost}金。` : ''}`);
  return { ok: true, days: plan.days, cost: plan.cost, notes: res.notes, events: res.events, promotions: res.promotions, quests: arr, died: res.died };
}

