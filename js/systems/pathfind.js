// 道路最短路：旅行与差事计时共用，避免循环依赖
import { ROADS, CITY_MAP } from '../data/world.js';

const ADJ = {};
for (const [a, b, d] of ROADS) {
  (ADJ[a] ||= []).push({ to: b, days: d });
  (ADJ[b] ||= []).push({ to: a, days: d });
}

const isWinter = (t) => Math.floor((t.month - 1) / 3) === 3;

export function roadDays(st, base, destCity) {
  let d = base;
  if (isWinter(st.time)) d *= 1.2;
  if (st.time.month >= 6 && st.time.month <= 8) d *= 1.05; // 雨季
  const owner = st.world.owner[destCity];
  if (st.world.wars?.includes(`${owner}`)) d *= 1.1;
  return d;
}

/** 返回 { path, days } 或 null（无路可通） */
export function shortestPath(from, to, st) {
  if (from === to) return { path: [from], days: 0 };
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

export function routeDays(st, from, to) {
  return shortestPath(from, to, st)?.days ?? null;
}
