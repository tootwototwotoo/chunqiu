// 流动事件：人物抵达触发
import { newGame, migrateState } from '../js/state.js';
import { advanceDays } from '../js/systems/calendar.js';
import { pendingEvents, prepareEvent, resolveChoice, isEventKind } from '../js/systems/events.js';
import { ARRIVALS } from '../js/data/arrivals.js';
import { HISTORY_MOVES } from '../js/systems/movement.js';
import { NPC_MAP } from '../js/data/npcs.js';
import { CITY_MAP } from '../js/data/world.js';

let fails = 0;
const ok = (c, m, x = '') => { console.log(`${c ? '✓' : '✗'} ${m}${x ? ' — ' + x : ''}`); if (!c) fails++; };

// ---------------- 数据 ----------------
{
  ok(ARRIVALS.length >= 20, '到达事件数量', String(ARRIVALS.length));
  const bad = [];
  const seen = new Set();
  for (const a of ARRIVALS) {
    const key = `${a.npc}@${a.year}`;
    if (seen.has(key)) bad.push('重复 ' + key);
    seen.add(key);
    if (!NPC_MAP[a.npc]) bad.push('无人物 ' + a.npc);
    if (!CITY_MAP[a.city]) bad.push('无城 ' + a.city);
    const moves = HISTORY_MOVES[a.npc];
    const near = moves?.some(([y, c]) => c === a.city && Math.abs(y - a.year) <= 3);
    if (!near) bad.push('与轨迹不符 ' + key);
    if (!a.title || !a.body || !a.choices?.length) bad.push('字段缺 ' + key);
  }
  ok(bad.length === 0, '到达事件与轨迹吻合、字段完整', bad.slice(0, 3).join(','));

  // 效果类型合法
  const { EFFECT_TYPES } = await import('../js/systems/events.js');
  const badFx = ARRIVALS.flatMap(a => a.choices.flatMap(c => c.effects ?? []))
    .filter(e => !EFFECT_TYPES.includes(e.t));
  ok(badFx.length === 0, '效果类型合法', badFx.map(e => e.t).join(','));
}

// ---------------- kind 注册 ----------------
{
  ok(isEventKind('arrival'), 'arrival 已注册为事件 kind');
}

// ---------------- 运行时触发与结算 ----------------
{
  const st = newGame({ name: 'x', profession: 'youxia', seed: 3, era: 'wuyue' });
  st.flags.noAutosave = true;
  advanceDays(st, (-497 - st.time.year) * 360 + 1);

  const evs = pendingEvents(st).filter(w => w.kind === 'arrival');
  ok(evs.length >= 2, '-497 年触发多个到达事件', evs.map(e => e.ev.id).join(','));
  ok(evs.some(e => e.ev.id === 'arr_kong_zi@-497'), '孔子适卫事件触发');
  ok(evs.some(e => e.ev.id === 'arr_sun_wu@-512'), '孙子见吴王事件触发');

  // 一年只发一次：把现有到达事件全部结掉，再推一年，不应再发
  while (pendingEvents(st).some(w => w.kind === 'arrival')) {
    const w = pendingEvents(st).find(x => x.kind === 'arrival');
    const prep = prepareEvent(st, w);
    resolveChoice(st, prep.ev, prep.ev.choices[0], 'arrival');
  }
  advanceDays(st, 360);
  const again = pendingEvents(st).filter(w => w.kind === 'arrival' && w.ev.id === 'arr_kong_zi@-497');
  ok(again.length === 0, '同一事件不重复触发');

  // 结算：skillxp 生效（30 点恰够学问 0→1 级，故断言「等级或经验任一提升」）
  const st2 = newGame({ name: 'x', profession: 'youxia', seed: 3, era: 'wuyue' });
  st2.flags.noAutosave = true;
  advanceDays(st2, (-497 - st2.time.year) * 360 + 1);
  const ev = pendingEvents(st2).find(w => w.ev.id === 'arr_kong_zi@-497');
  const prep = prepareEvent(st2, ev);
  const lvBefore = st2.player.skills.xuewen;
  const expBefore = st2.player.skillExp.xuewen ?? 0;
  const r = resolveChoice(st2, prep.ev, prep.ev.choices[1], 'arrival');
  ok(r.ok, '孔子适卫可结算', r.text?.slice(0, 20));
  ok(st2.player.skills.xuewen > lvBefore || (st2.player.skillExp.xuewen ?? 0) > expBefore,
    '问学提升（经验或等级）',
    `lv ${lvBefore}→${st2.player.skills.xuewen}, exp ${expBefore}→${st2.player.skillExp.xuewen}`);
  ok(!st2.events.pending.some(p => p.id === 'arr_kong_zi@-497'), '结算后出队');
}

// ---------------- 存档往返 ----------------
{
  const st = newGame({ name: 'x', profession: 'youxia', seed: 3, era: 'wuyue' });
  st.flags.noAutosave = true;
  advanceDays(st, (-497 - st.time.year) * 360 + 1);
  const m = migrateState(JSON.parse(JSON.stringify(st)));
  ok(m.events.pending.some(p => p.kind === 'arrival'), '到达事件随存档保留');
  ok((m.flags.arrivalFired ?? []).length > 0, '已触发记录随存档保留');
}

console.log(fails ? `\n失败 ${fails} 项 ✗` : '\n流动事件通过 ✓');
process.exit(fails ? 1 : 0);
