// 世界数据完整性：道路、特产、各国都城与求仕入口
import { newGame, player } from '../js/state.js';
import { STATES, CITIES, ROADS, CITY_MAP, STATE_LABEL_POS } from '../js/data/world.js';
import { GOODS } from '../js/data/goods.js';
import { shortestPath } from '../js/systems/pathfind.js';
import { seekOffice } from '../js/systems/progression.js';

let fails = 0;
const ok = (c, m, x = '') => { console.log(`${c ? '✓' : '✗'} ${m}${x ? ' — ' + x : ''}`); if (!c) fails++; };

// 道路两端必须是有效城邑
const badRoad = ROADS.filter(([a, b]) => !CITY_MAP[a] || !CITY_MAP[b]);
ok(badRoad.length === 0, '道路两端均有效', badRoad.map(r => r.join('-')).join(','));

// 每个国家至少一城、至少一个可谒见的都城
for (const sid of Object.keys(STATES)) {
  const cities = CITIES.filter(c => c.state === sid);
  ok(cities.length > 0, `${STATES[sid].name}国有城邑`);
  const court = cities.filter(c => c.tags.includes('court'));
  ok(court.length > 0, `${STATES[sid].name}国有朝廷（可求仕）`, cities.map(c => c.name).join('/'));
}

// 特产必须是有效货物
const badGoods = CITIES.filter(c => !GOODS[c.good]);
ok(badGoods.length === 0, '城邑特产合法', badGoods.map(c => c.id).join(','));

// 全城互通
const st = newGame({ name: '世界', profession: 'youxia', seed: 1 });
let unreachable = 0;
for (const a of CITIES) for (const b of CITIES) {
  if (a.id === b.id) continue;
  if (!shortestPath(a.id, b.id, st)) unreachable++;
}
ok(unreachable === 0, '31 城全互通', String(unreachable));

// 地名标注位置不越界
const out = STATE_LABEL_POS.filter(([, x, y]) => x < 0 || x > 940 || y < 0 || y > 660);
ok(out.length === 0, '国名标注在地图范围内', out.map(o => o[0]).join(','));

// 无主君的小国也能正常出仕，且不会写入非法关系
const st2 = newGame({ name: '求仕', profession: 'youxia', seed: 2 });
st2.player.fame = 60;
st2.player.stats.zheng = 90;
st2.player.stats.mei = 90;
st2.player.skills.biancai = 8;
let res = null;
for (let i = 0; i < 20 && !(res && res.ok); i++) {
  delete st2.flags.lastOffice;
  res = seekOffice(st2, 'ju');
}
ok(!!res && res.ok, '可在莒国出仕', res && res.msg);
ok(!('null' in st2.player.relations) && !(null in st2.player.relations), '无主君时不写入非法关系');
ok(player(st2).stateId === 'ju', '出仕后归属莒国');

console.log(fails ? `\n失败 ${fails} 项 ✗` : '\n世界数据检查通过 ✓');
process.exit(fails ? 1 : 0);
