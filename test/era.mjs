import { newGame, player } from '../js/state.js';
import { ERAS } from '../js/data/defs.js';
import { advanceDays } from '../js/systems/calendar.js';
import { NPC_MAP, npcAlive } from '../js/data/npcs.js';
import { collectTimeline } from '../js/systems/events.js';

for (const era of ERAS) {
  const st = newGame({ name: '试', profession: 'xuezhe', era: era.id, seed: 3 });
  const alive = Object.values(NPC_MAP).filter(n => npcAlive(n, st.time.year));
  console.log(`${era.name}（前${-st.time.year}）: 在世名人 ${alive.length}，已录事件 ${st.events.fired.length}`);
  // 推进 25 年看事件
  let fired = 0;
  for (let i = 0; i < 25; i++) {
    st.player.health = 100; st.player.alive = true;
    const r = advanceDays(st, 360, {});
    fired += r.events.filter(e => e.kind === 'timeline').length;
  }
  console.log(`   25年内新发历史事件: ${fired}`);
}
const st = newGame({ name: '孙武门客', profession: 'youxia', era: 'wuyue', seed: 11 });
console.log('吴越期名人:', Object.values(st.npc).filter(n => n.alive).map(n => NPC_MAP[n.id]?.name).filter(Boolean).join('、'));
