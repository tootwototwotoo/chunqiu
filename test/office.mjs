// 求仕与晋升机制
import { newGame, player } from '../js/state.js';
import { seekOffice, officeChance, officeCooldownLeft, checkPromotion } from '../js/systems/progression.js';

let fails = 0;
const ok = (c, m, x = '') => { console.log(`${c ? '✓' : '✗'} ${m}${x ? ' — ' + x : ''}`); if (!c) fails++; };

// 初始成算与实测成功率
const s0 = newGame({ name: '求仕', profession: 'youxia', seed: 1 });
const c0 = officeChance(s0);
ok(c0 >= 0.4 && c0 <= 0.55, '初始廷对成算合理（名声 0 时仅作参考）', `${Math.round(c0 * 100)}%`);

let wins = 0;
const N = 400;
for (let i = 1; i <= N; i++) {
  const st = newGame({ name: 'x', profession: 'youxia', seed: i });
  st.player.fame = 20;
  for (let k = 0; k < 3; k++) st.quests.done.push({ id: `d${k}`, title: `差事${k}`, status: 'done', reward: {} });
  if (seekOffice(st, 'zhou').ok) wins++;
}
const rate = wins / N;
ok(rate > 0.55, '名声 20 时求仕成功率较高', `${Math.round(rate * 100)}%`);

// 高属性几乎必成
const s1 = newGame({ name: '高', profession: 'youxia', seed: 2 });
s1.player.fame = 70;
for (let k = 0; k < 3; k++) s1.quests.done.push({ id: `e${k}`, title: `差事${k}`, status: 'done', reward: {} });
s1.player.stats.zheng = 85;
s1.player.stats.mei = 85;
s1.player.skills.biancai = 8;
ok(officeChance(s1) >= 0.95, '高属性成算封顶 95%');

// 成功出仕：归属、爵位、功勋
const s2 = newGame({ name: '仕', profession: 'youxia', seed: 3 });
s2.player.fame = 70; s2.player.stats.zheng = 85; s2.player.stats.mei = 85; s2.player.skills.biancai = 8;
for (let k = 0; k < 3; k++) s2.quests.done.push({ id: `f${k}`, title: `差事${k}`, status: 'done', reward: {} });
s2.player.merit = 120;
let r = null;
for (let i = 0; i < 10 && !(r && r.ok); i++) { delete s2.flags.lastOffice; r = seekOffice(s2, 'qi'); }
ok(!!r && r.ok, '出仕成功', r && r.msg);
ok(player(s2).stateId === 'qi', '归属齐国');
ok(player(s2).rank >= 1, '获得爵位', String(player(s2).rank));
ok(player(s2).merit >= 120, '功勋保留', String(player(s2).merit));
ok(officeCooldownLeft(s2) > 0, '出仕后进入冷却');

// 名声不足时不得出仕
const s3 = newGame({ name: '无名', profession: 'youxia', seed: 4 });
s3.player.fame = 0;
const r3 = seekOffice(s3, 'qi');
ok(!r3.ok && r3.msg.includes('名声'), '名声不足被拒', r3.msg);

const s3b = newGame({ name: '无功', profession: 'youxia', seed: 5 });
s3b.player.fame = 30;
const r3b = seekOffice(s3b, 'qi');
ok(!r3b.ok && r3b.msg.includes('实绩'), '差事不足被拒', r3b.msg);

// 每月晋升：功勋达标后升一级
const s4 = newGame({ name: '晋升', profession: 'youxia', seed: 6 });
s4.player.stateId = 'qi';
s4.player.rank = 1;
s4.player.merit = 100;
const p1 = checkPromotion(s4);
ok(!!p1 && p1.rank === '中士', '功勋达标擢升一级', p1 && p1.rank);
ok(player(s4).rank === 2, '爵位写入状态');

console.log(fails ? `\n失败 ${fails} 项 ✗` : '\n求仕与晋升通过 ✓');
process.exit(fails ? 1 : 0);
