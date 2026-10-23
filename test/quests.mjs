// 差事结算与去重回归测试
import { newGame, player } from '../js/state.js';
import { completeQuest, sanitizeQuests, checkArrivalQuests, refreshBoard } from '../js/systems/quests.js';
import { seekOffice } from '../js/systems/progression.js';

let fails = 0;
const ok = (c, m) => { console.log(`${c ? '✓' : '✗'} ${m}`); if (!c) fails++; };

const st = newGame({ name: '差事', profession: 'youxia', seed: 3 });
const q = { id: 't1', kind: 'duel', mode: 'check', title: '测试差事甲', status: 'active', reward: { money: 10, fame: 1 } };
st.quests.active.push(q);
completeQuest(st, q, true);
ok(st.quests.active.length === 0, '完成后从「进行中」移除');
ok(st.quests.done.length === 1 && st.quests.done[0].id === 't1', '进入「已了」一次');

completeQuest(st, q, true);
ok(st.quests.done.filter(x => x.id === 't1').length === 1, '重复结算不会重复入「已了」');

// 出行类差事
const t = { id: 't2', kind: 'escort', mode: 'travel', title: '测试差事乙', status: 'active', targetCity: 'linzi', exp: 99999, reward: {} };
st.quests.active.push(t);
const done = checkArrivalQuests(st, 'linzi');
ok(done.length === 1 && st.quests.active.length === 0, '抵达结算后不留「进行中」');

// 失败/已误差事
const f = { id: 't3', kind: 'duel', mode: 'check', title: '失败差事', status: 'active', reward: {} };
st.quests.active.push(f);
completeQuest(st, f, false);
ok(!st.quests.active.some(x => x.id === 't3'), '失败后从「进行中」移除');
ok(st.quests.done.filter(x => x.id === 't3').length === 1, '失败差事只入「已了」一次');

// 旧存档污染：active 里混入已误项、done 重复、同 id 两处都有
st.quests.active.push({ id: 'legacy', status: 'failed', title: '旧差事', reward: {} });
st.quests.active.push({ id: 't3', status: 'active', title: '同 id 残留', reward: {} });
st.quests.done.push({ id: 't1', status: 'done', title: '重复' });
sanitizeQuests(st);
ok(st.quests.active.length === 0, '清理旧存档：active 无已误/已了项');
ok(new Set(st.quests.done.map(x => x.id)).size === st.quests.done.length, '清理旧存档：done 无重复');
ok(!st.quests.active.some(x => st.quests.done.some(d => d.id === x.id)), '同 id 不会同时存在于两处');

console.log(fails ? `\n失败 ${fails} 项 ✗` : '\n差事去重通过 ✓');
process.exit(fails ? 1 : 0);
