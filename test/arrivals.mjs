// 流动事件：人物抵达触发
import { newGame, migrateState, rel } from '../js/state.js';
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

// ---------------- 相逢联动：玩家恰在同城 ----------------
{
  // 玩家在曲阜 → 孔子归鲁事件升级为相逢
  const st = newGame({ name: 'x', profession: 'youxia', seed: 3, era: 'wuyue' });
  st.flags.noAutosave = true;
  st.player.cityId = 'qufu';
  advanceDays(st, (-484 - st.time.year) * 360 + 1);
  const ev = pendingEvents(st).find(w => w.ev.id === 'arr_kong_zi@-484');
  ok(ev.ev.title.includes('相逢'), '同城时标题升级为「相逢」', ev.ev.title);
  ok(ev.ev.choices.length === 3, '相逢时追加「登门相访」', String(ev.ev.choices.length));
  ok(ev.ev.choices.some(c => c.label === '登门相访'), '登门相访选项存在');

  const prep = prepareEvent(st, ev);
  const meet = prep.ev.choices.find(c => c.label === '登门相访');
  const r = resolveChoice(st, prep.ev, meet, 'arrival');
  ok(r.ok, '登门相访可结算', r.text?.slice(0, 20));
  ok(rel(st, 'kong_zi').met, '结识孔子（met=true）');
  ok(st.player.cards.includes('kong_zi'), '录入名鉴');
  ok(rel(st, 'kong_zi').aff >= 12, '交情提升', String(rel(st, 'kong_zi').aff));

  // 原选项也附带结识收益（效果里含 rel）
  const st1b = newGame({ name: 'x', profession: 'youxia', seed: 3, era: 'wuyue' });
  st1b.flags.noAutosave = true;
  st1b.player.cityId = 'qufu';
  advanceDays(st1b, (-484 - st1b.time.year) * 360 + 1);
  const ev1b = pendingEvents(st1b).find(w => w.ev.id === 'arr_kong_zi@-484');
  const hasRel = ev1b.ev.choices.filter(c => c.label !== '登门相访')
    .every(c => (c.effects ?? []).some(e => e.t === 'rel'));
  ok(hasRel, '相逢时原选项附带结识收益');
}

// 玩家异地 → 普通听说形态
{
  const st = newGame({ name: 'x', profession: 'youxia', seed: 3, era: 'wuyue' });
  st.flags.noAutosave = true;
  st.player.cityId = 'linzi';
  advanceDays(st, (-484 - st.time.year) * 360 + 1);
  const ev = pendingEvents(st).find(w => w.ev.id === 'arr_kong_zi@-484');
  ok(!ev.ev.title.includes('相逢'), '异地时保持普通形态', ev.ev.title);
  ok(ev.ev.choices.length === 2, '异地时只有原选项', String(ev.ev.choices.length));
  const r = resolveChoice(st, prepareEvent(st, ev), ev.ev.choices[0], 'arrival');
  ok(r.ok, '异地结算正常');
  ok(!rel(st, 'kong_zi').met, '异地不结识（未登门）');
}

console.log(fails ? `\n失败 ${fails} 项 ✗` : '\n流动事件通过 ✓');
process.exit(fails ? 1 : 0);
