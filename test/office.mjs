// 求仕与晋升机制
import { newGame, player } from '../js/state.js';
import { seekOffice, officeChance, officeCooldownLeft, checkPromotion } from '../js/systems/progression.js';

let fails = 0;
const ok = (c, m, x = '') => { console.log(`${c ? '✓' : '✗'} ${m}${x ? ' — ' + x : ''}`); if (!c) fails++; };

// 初始成算与实测成功率
const s0 = newGame({ name: '求仕', profession: 'youxia', seed: 1 });
const c0 = officeChance(s0);
ok(c0 >= 0.6 && c0 <= 0.75, '初始求仕成算合理', `${Math.round(c0 * 100)}%`);

let wins = 0;
const N = 400;
for (let i = 1; i <= N; i++) {
  const st = newGame({ name: 'x', profession: 'youxia', seed: i });
  if (seekOffice(st, 'zhou').ok) wins++;
}
const rate = wins / N;
ok(rate > 0.55 && rate < 0.85, '实测成功率与显示一致', `${Math.round(rate * 100)}%`);

// 高属性几乎必成
const s1 = newGame({ name: '高', profession: 'youxia', seed: 2 });
s1.player.fame = 70;
s1.player.stats.zheng = 85;
s1.player.stats.mei = 85;
s1.player.skills.biancai = 8;
ok(officeChance(s1) >= 0.95, '高属性成算封顶 95%');

// 成功出仕：归属、爵位、功勋
const s2 = newGame({ name: '仕', profession: 'youxia', seed: 3 });
s2.player.fame = 70; s2.player.stats.zheng = 85; s2.player.stats.mei = 85; s2.player.skills.biancai = 8;
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

// 每月晋升：功勋达标后升一级
const s4 = newGame({ name: '晋升', profession: 'youxia', seed: 5 });
s4.player.stateId = 'qi';
s4.player.rank = 1;
s4.player.merit = 100;
const p1 = checkPromotion(s4);
ok(!!p1 && p1.rank === '中士', '功勋达标擢升一级', p1 && p1.rank);
ok(player(s4).rank === 2, '爵位写入状态');

console.log(fails ? `\n失败 ${fails} 项 ✗` : '\n求仕与晋升通过 ✓');
process.exit(fails ? 1 : 0);
