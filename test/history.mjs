import { newGame } from '../js/state.js';
import { advanceDays } from '../js/systems/calendar.js';
import { TIMELINE } from '../js/data/events.js';
import { prepareEvent, resolveChoice, choiceAvailable, finishEvent } from '../js/systems/events.js';

const st = newGame({ name: '史官', profession: 'youxia', seed: 9 });
const fired = new Set();
let choicesTaken = 0, errors = [];
for (let i = 0; i < 3100; i++) {
  // 保其不死，仅为观察历史
  st.player.health = 100; st.player.alive = true; st.player.stamina = 100;
  const res = advanceDays(st, 30, {});
  for (const w of res.events) {
    prepareEvent(st, w);
    if (w.kind === 'timeline') {
      fired.add(w.ev.id);
      const avail = (w.ev.choices ?? []).filter(c => choiceAvailable(st, c));
      for (const c of avail.slice(0, 1)) {
        try { resolveChoice(st, w.ev, c, w.kind); choicesTaken++; }
        catch (e) { errors.push(w.ev.id + ': ' + e.message); }
      }
    }
    finishEvent(st, w.kind, w.ev.id);
  }
  // 复国，避免 owner 变化导致异常
  st.player.alive = true;
}
const missing = TIMELINE.filter(e => !fired.has(e.id));
console.log(`触发 ${fired.size}/${TIMELINE.length} 个历史事件，选项 ${choicesTaken} 次`);
if (missing.length) console.log('未触发:', missing.map(m => m.id).join(', '));
if (errors.length) console.log('错误:', errors.slice(0, 5));
console.log(`世界状态：霸主=${st.world.hegemon || '无'} 周势=${st.world.power.zhou} 齐势=${st.world.power.qi} 楚势=${st.world.power.chu}`);
console.log(errors.length || missing.length ? '有问题 ✗' : '历史线全部通过 ✓');
process.exit(errors.length || missing.length ? 1 : 0);
