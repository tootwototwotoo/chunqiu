// 问政：向有见识的女性请教时局
import { newGame } from '../js/state.js';
import { askAdvice, adviseStatus, CAN_ADVISE, INSIGHT_TYPES } from '../js/systems/relations.js';
import { NPC_MAP } from '../js/data/npcs.js';
import { advanceDays } from '../js/systems/calendar.js';

let fails = 0;
const ok = (c, m, x = '') => { console.log(`${c ? '✓' : '✗'} ${m}${x ? ' — ' + x : ''}`); if (!c) fails++; };

// 前 685（桓公之世）四种专长的女性都在世
const newSt = (era = 'huan') => {
  const st = newGame({ name: 'x', profession: 'youxia', seed: 4, era });
  st.flags.noAutosave = true;
  return st;
};
const findNoble = (st, insight) => Object.values(st.npc)
  .find(n => NPC_MAP[n.id]?.role === 'noble' && n.alive && (!insight || NPC_MAP[n.id].insight === insight));

// ---------------- 资格判断 ----------------
{
  const st = newSt();
  const n = findNoble(st);
  ok(!!n, '城中有在世女性', NPC_MAP[n.id].name);
  ok(CAN_ADVISE(n.id), '女性可问政');
  ok(!CAN_ADVISE('kong_zi'), '名士不提供问政');

  ok(!adviseStatus(st, n.id).ok, '交情不足时不可问政');
  st.player.relations[n.id] = { met: true, aff: 25 };
  const okStatus = adviseStatus(st, n.id);
  ok(okStatus.ok, '交情足够时可问政');
  ok(INSIGHT_TYPES[okStatus.topic] ?? true, '返回专长标签', okStatus.topic);

  st.player.stamina = 2;
  ok(!adviseStatus(st, n.id).ok, '体力不足不可问政');
}

// ---------------- 四种专长都能产出情报 ----------------
for (const kind of ['court', 'diplo', 'army', 'people']) {
  const st = newSt();
  const n = findNoble(st, kind);
  if (!n) { ok(false, `${kind} 专长有可问之人`); continue; }
  st.player.relations[n.id] = { met: true, aff: 40 };
  st.player.stamina = 100;
  const r = askAdvice(st, n.id);
  ok(r.ok && r.text && r.note, `${kind} 专长产出情报`, r.text?.slice(0, 26) ?? r.msg);
}

// ---------------- 消耗与冷却 ----------------
{
  const st = newSt();
  const n = findNoble(st, 'court');
  st.player.relations[n.id] = { met: true, aff: 40 };
  st.player.stamina = 100;
  const s0 = st.player.stamina, f0 = st.player.fame;
  askAdvice(st, n.id);
  ok(st.player.stamina === s0 - 6, '消耗 6 点体力', `${s0} → ${st.player.stamina}`);
  ok(st.player.fame === f0 + 1, '名声 +1');
  ok(!adviseStatus(st, n.id).ok, '问过后进入冷却');

  // 冷却按日推进解除
  advanceDays(st, 21);
  st.player.stamina = 100;
  ok(adviseStatus(st, n.id).ok, '20 日后可再问');
}

// ---------------- 内政专长报所仕之国 ----------------
{
  const st = newSt();
  const n = findNoble(st, 'court');
  st.player.relations[n.id] = { met: true, aff: 40 };
  st.player.stamina = 100;
  st.player.stateId = 'qi';
  const r = askAdvice(st, n.id);
  ok(/齐/.test(r.text), '内政专长报所仕之国', r.text);
}

// ---------------- 名士可教、女性可问政 ----------------
{
  const st = newSt('wuyue');   // 前 515，名士最盛
  const scholars = Object.values(st.npc)
    .filter(n => NPC_MAP[n.id]?.role === 'scholar' && n.alive);
  ok(scholars.length >= 5, '城中/世上有多位在世名士', String(scholars.length));
  const teachable = scholars.filter(n => NPC_MAP[n.id].teach?.length);
  ok(teachable.length >= 4, '名士多可授艺', String(teachable.length));
}

console.log(fails ? `\n失败 ${fails} 项 ✗` : '\n问政与名士通过 ✓');
process.exit(fails ? 1 : 0);
