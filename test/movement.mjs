// NPC 流动：史载轨迹 + 规则游历
import { newGame, migrateState } from '../js/state.js';
import { advanceDays } from '../js/systems/calendar.js';
import { NPC_MAP } from '../js/data/npcs.js';
import { CITY_MAP } from '../js/data/world.js';
import { HISTORY_MOVES, cityAt, MOVE_PROFILE } from '../js/systems/movement.js';

let fails = 0;
const ok = (c, m, x = '') => { console.log(`${c ? '✓' : '✗'} ${m}${x ? ' — ' + x : ''}`); if (!c) fails++; };
const newSt = (era) => {
  const st = newGame({ name: 'x', profession: 'youxia', seed: 3, era });
  st.flags.noAutosave = true;
  return st;
};

// ---------------- 史载轨迹 ----------------
{
  ok(Object.keys(HISTORY_MOVES).length >= 15, '史载轨迹人物数量', String(Object.keys(HISTORY_MOVES).length));

  // 轨迹有效：城存在、年份在生卒内、单调升
  let bad = 0;
  for (const [id, moves] of Object.entries(HISTORY_MOVES)) {
    const def = NPC_MAP[id];
    if (!def) { bad++; continue; }
    let last = -99999;
    for (const [y, c] of moves) {
      if (!CITY_MAP[c]) { bad++; console.log('  ✗', id, c); }
      if (y < (def.birth ?? -9999) || y > (def.death ?? 9999)) { bad++; console.log('  ✗ 越界', id, y); }
      if (y < last) { bad++; console.log('  ✗ 非升序', id); }
      last = y;
    }
  }
  ok(bad === 0, '全部轨迹有效（城存在、年内、升序）');

  // 孔子：-500 在鲁，-496 在卫，-486 在陈/蔡
  const k = NPC_MAP.kong_zi;
  ok(cityAt(k, -500) === 'qufu', '孔子 -500 在曲阜', cityAt(k, -500));
  ok(cityAt(k, -496) === 'diqiu', '孔子 -496 在卫帝丘', cityAt(k, -496));
  ok(cityAt(k, -489) === 'shangcai', '孔子 -489 在蔡上蔡', cityAt(k, -489));
  ok(cityAt(k, -483) === 'qufu', '孔子 -483 归鲁', cityAt(k, -483));

  // 运行时：推进月结后 NPC 真的移城
  const st = newSt('wuyue');
  const y0 = st.time.year;
  advanceDays(st, (-496 - y0) * 360 + 1);
  ok(st.npc.kong_zi.city === 'diqiu', '月结后孔子移至帝丘', st.npc.kong_zi.city);
}

// ---------------- 规则流动 ----------------
{
  // 在位国君不动
  ok(MOVE_PROFILE.ruler === 'special', '国君走 special 档（在位不动、非在位游历）');
  ok(MOVE_PROFILE.minister === 'none' && MOVE_PROFILE.general === 'none',
    '在职卿相将帅不动');

  // 42 年后应有人迁城，且分布更均匀
  const st = newSt('jinchu');
  const origin = {};
  for (const n of Object.values(st.npc)) origin[n.id] = n.city;
  for (let i = 0; i < 42 * 360; i++) advanceDays(st, 1);
  let moved = 0;
  const byCity = {};
  for (const n of Object.values(st.npc)) {
    if (n.alive) { (byCity[n.city] ||= []).push(1); if (n.city !== origin[n.id]) moved++; }
  }
  ok(moved >= 10, '42 年间有 NPC 迁城', String(moved));
  const counts = Object.values(byCity).map(l => l.length);
  ok(Math.max(...counts) <= 12, '最挤的城不过度拥挤', 'max=' + Math.max(...counts));
  ok(Object.keys(byCity).length >= 25, '有人居住的城不少于 25', String(Object.keys(byCity).length));
}

// ---------------- 存档往返 ----------------
{
  const st = newSt('wuyue');
  advanceDays(st, (-496 - st.time.year) * 360 + 1);
  const before = JSON.stringify(Object.values(st.npc).map(n => [n.id, n.city]));
  const m = migrateState(JSON.parse(JSON.stringify(st)));
  const after = JSON.stringify(Object.values(m.npc).map(n => [n.id, n.city]));
  ok(before === after, '迁移后的位置随存档完整保留');
}

console.log(fails ? `\n失败 ${fails} 项 ✗` : '\nNPC 流动通过 ✓');
process.exit(fails ? 1 : 0);
