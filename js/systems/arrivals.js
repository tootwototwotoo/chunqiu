// 流动事件：NPC 抵达新城市时触发
//
// 与 timeline/random 事件同构，用 EVENT_KINDS 注册表注册 kind='arrival'。
// 每条 ARRIVAL 一年一次；玩家是否在同一城不影响触发（天下事），
// 但事件选项本身常含「与之结交」的收益。
//
// 触发逻辑在 calendar.onMonth 的 collectArrivals 中调用。

import { ARRIVALS } from '../data/arrivals.js';
import { NPC_MAP } from '../data/npcs.js';
import { queueEvent } from './events.js';
import { addLog } from '../state.js';

export const ARRIVAL_BY_KEY = new Map(
  ARRIVALS.map(a => [`${a.npc}@${a.year}`, a]));

// 收集本月应触发的到达事件
export function collectArrivals(st) {
  const out = [];
  const year = st.time.year;
  const month = st.time.month;
  // 一月集中触发，减少月结成本
  if (month !== 1) return out;

  st.flags.arrivalFired = st.flags.arrivalFired ?? [];
  for (const a of ARRIVALS) {
    if (a.year !== year) continue;
    const key = `${a.npc}@${a.year}`;
    if (st.flags.arrivalFired.includes(key)) continue;
    const def = NPC_MAP[a.npc];
    if (!def) continue;
    st.flags.arrivalFired.push(key);

    const ev = {
      id: 'arr_' + key,
      title: a.title,
      body: a.body,
      choices: a.choices.map(c => ({
        label: c.label,
        effects: c.effects ?? [],
        text: c.text,
      })),
      effects: [],
    };
    out.push(queueEvent(st, 'arrival', ev));
    addLog(st, `${def.name}至${a.title.replace(/^.+?于|^.+?至|^.+?适/, '')}。`, 'war');
  }
  return out;
}
