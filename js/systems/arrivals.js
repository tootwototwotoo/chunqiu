// 流动事件：NPC 抵达新城市时触发
//
// 与 timeline/random 事件同构，用 EVENT_KINDS 注册表注册 kind='arrival'。
// 每条 ARRIVAL 一年一次；触发与玩家位置无关（天下事），
// 但若玩家恰好与该人物在同一城，事件升级为「相逢」：
//   标题加「· 相逢」、正文追加遇见一句、追加第三个选项「登门相访」
//   （meetNpc 录入名鉴 + 增交情），其余选项也附带结识收益。

import { ARRIVALS } from '../data/arrivals.js';
import { NPC_MAP } from '../data/npcs.js';
import { queueEvent } from './events.js';
import { addLog, player } from '../state.js';
import { cityAt } from './movement.js';

// 相逢时的额外选项：登门相访（录入名鉴 + 交情）
// rel 效果按 events.applyEffects 的字段约定：e.id 为人物 id，且自动 meetNpc
const MEET_CHOICE = (def) => ({
  label: `登门相访`,
  effects: [{ t: 'rel', id: def.id, v: 12 }],
  text: `你登门相访，与${def.name}纵谈半日。他记住了你的名字，录于名鉴。`,
});
// 相逢时原选项附带的结识收益（追加在选项效果之后）
const MEET_BONUS = (def) => [{ t: 'rel', id: def.id, v: 6 }];

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

    // 相逢判定：玩家所在城 == 该人物此年实际所在城
    const npcCity = cityAt(def, year);
    const together = player(st).cityId === npcCity;

    const ev = {
      id: 'arr_' + key,
      title: together ? `${a.title} · 相逢` : a.title,
      body: together
        ? `${a.body}\n\n你恰在${npcCity === undefined ? '' : ''}此地，得与其人会面。`
        : a.body,
      choices: together
        ? [
            ...a.choices.map(c => ({
              label: c.label,
              effects: [...(c.effects ?? []), ...MEET_BONUS(def)],
              text: `${c.text}\n（因当面交谈，你与${def.name}结识。）`,
            })),
            MEET_CHOICE(def),
          ]
        : a.choices.map(c => ({
            label: c.label,
            effects: c.effects ?? [],
            text: c.text,
          })),
      effects: [],
      // 供测试与结算逻辑使用
      together, npc: a.npc,
    };
    out.push(queueEvent(st, 'arrival', ev));
    addLog(st, together
      ? `你与${def.name}相逢于城中。`
      : `${def.name}至${evTitlePlace(a.title)}。`, together ? 'gain' : 'war');
  }
  return out;
}

// 从标题提取地名（如「孔子适卫」→「卫」）——标题多为「人物 + 至/于/入 X」
function evTitlePlace(title) {
  const m = title.match(/[于适入至在][^·]*$/);
  return m ? m[0].slice(1) : title;
}
