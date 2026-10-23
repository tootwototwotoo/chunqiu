// 功勋结算：显示即兑现；未出仕累积；商人无仕途不计；出仕按功勋授爵
import { newGame, player } from '../js/state.js';
import { completeQuest, refreshBoard, questRewardText } from '../js/systems/quests.js';
import { seekOffice } from '../js/systems/progression.js';

let fails = 0;
const ok = (c, m, x = '') => { console.log(`${c ? '✓' : '✗'} ${m}${x ? ' — ' + x : ''}`); if (!c) fails++; };

// 未出仕的游侠也应记功，并写入纪事
const w = newGame({ name: '功勋', profession: 'youxia', seed: 11 });
const mq = { id: 'm1', kind: 'duel', mode: 'check', title: '除害', status: 'active', reward: { money: 10, merit: 12 } };
w.quests.active.push(mq);
const mr = completeQuest(w, mq, true);
ok(player(w).merit === 12, '未出仕也记功勋', String(player(w).merit));
ok(mr.merit === 12, '结算结果返回功勋');
ok(w.log[0].text.includes('功勋+12'), '纪事写明功勋', w.log[0].text);

// 商人：榜文不承诺功勋，结算不记，奖励文本也不显示
const sh = newGame({ name: '商', profession: 'shangren', seed: 12 });
const board = refreshBoard(sh, true);
ok(board.length > 0, '商人榜文生成');
ok(board.every(q => !q.reward?.merit), '商人榜文不列功勋');
const sq = { id: 'm2', kind: 'supply', mode: 'travel', title: '运货', status: 'active', targetCity: 'linzi', exp: 9999, reward: { money: 10, merit: 9 } };
sh.quests.active.push(sq);
completeQuest(sh, sq, true);
ok(player(sh).merit === 0, '商人不记功勋');
ok(!questRewardText(sq, sh).includes('功勋'), '商人奖励文本不显示功勋', questRewardText(sq, sh));

// 出仕：布衣功勋保留，按功勋授予初爵（不超过上士）
const w2 = newGame({ name: '仕', profession: 'youxia', seed: 13 });
w2.player.merit = 200;
w2.player.fame = 40;
let off = null;
for (let i = 0; i < 12 && !(off && off.ok); i++) {
  delete w2.flags.lastOffice;
  off = seekOffice(w2, 'qi');
}
ok(!!off && off.ok, '出仕成功', off && off.msg);
ok(player(w2).merit >= 100, '出仕保留布衣功勋', String(player(w2).merit));
ok(player(w2).rank >= 1 && player(w2).rank <= 3, '按功勋授初爵（不超过上士）', String(player(w2).rank));
ok(off && off.msg.includes('上士'), '任命文本与爵位一致', off && off.msg);

// 改仕他国：功勋折半、从士做起
const before = player(w2).merit;
let sw = null;
for (let i = 0; i < 12 && !(sw && sw.ok); i++) {
  delete w2.flags.lastOffice;
  w2.player.fame = 60;
  sw = seekOffice(w2, 'jin');
}
if (sw && sw.ok) {
  ok(player(w2).merit <= Math.ceil(before / 2), '改仕他国功勋折半', `${before} → ${player(w2).merit}`);
  ok(player(w2).rank === 1, '改仕从士做起', String(player(w2).rank));
}

console.log(fails ? `\n失败 ${fails} 项 ✗` : '\n功勋结算通过 ✓');
process.exit(fails ? 1 : 0);
