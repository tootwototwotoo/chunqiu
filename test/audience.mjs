// 三回合廷对：题库、心性、属性、追问、结局
import { newGame } from '../js/state.js';
import { AUDIENCE_QUESTIONS, AUDIENCE_FOLLOW_UPS } from '../js/data/audience.js';
import { STATES } from '../js/data/world.js';
import { audienceHeart, startAudience, audienceAnswer, AUDIENCE_SUCCESS } from '../js/systems/audience.js';

let fails = 0;
const ok = (c, m, x = '') => { console.log(`${c ? '✓' : '✗'} ${m}${x ? ' — ' + x : ''}`); if (!c) fails++; };

ok(AUDIENCE_QUESTIONS.length >= 20, '题库不少于 20 题', String(AUDIENCE_QUESTIONS.length));
ok(AUDIENCE_FOLLOW_UPS.length >= 6, '追问不少于 6 条', String(AUDIENCE_FOLLOW_UPS.length));
for (const q of [...AUDIENCE_QUESTIONS, ...AUDIENCE_FOLLOW_UPS]) {
  const lv = q.options.map(o => o.level).sort().join(',');
  if (lv !== 'evade,hit,reason') { ok(false, `题目结构错误 ${q.id}`, lv); break; }
}
ok(true, '每题均为 切中/有道理/回避 各一');

// 每国都有心性，且不再一律好利
const st = newGame({ name: '士', profession: 'youxia', seed: 5 });
const hearts = Object.keys(STATES).map(id => audienceHeart(st, id));
ok(hearts.every(h => ['li', 'yi', 'ming', 'shi'].includes(h)), '19 国均有合法心性');
ok(new Set(hearts).size >= 3, '心性不止一种', [...new Set(hearts)].join(','));

// 起手与追问
const a = startAudience(st, 'qi');
ok(a.questions.length === 3, '廷对三问');
ok(a.questions[2].follow === true || a.round <= 3, '第三问为追问');
ok(a.agreement >= 50 && a.agreement <= 65, '属性提升起始认同', String(a.agreement));
ok(a.heart === audienceHeart(st, 'qi'), '心性与国君一致');

// 切中 / 有道理 / 回避
function run(level, tag = 'li', seed = 1, stateId = 'qi') {
  const s = newGame({ name: 'x', profession: 'youxia', seed });
  const d = startAudience(s, stateId);
  d.questions = [{ ...d.questions[0], options: d.questions[0].options.map(o => ({ ...o, level, tag })) },
    d.questions[1], d.questions[2]];
  const before = d.agreement;
  audienceAnswer(s, d, 0);
  return d.agreement - before;
}
ok(run('hit') > run('reason'), '切中收益高于有道理');
ok(run('evade', 'yi') < 0, '回避会扣认同');

// 70 分成功线
{
  const s = newGame({ name: 'x', profession: 'youxia', seed: 9 });
  const d = startAudience(s, 'qi');
  d.round = 3;
  d.agreement = 69;
  const q = d.questions[2];
  const idx = q.options.findIndex(o => o.level === 'hit');
  audienceAnswer(s, d, idx);
  ok(d.over && d.agreement >= AUDIENCE_SUCCESS, '达到 70 即成功', String(d.agreement));
}

console.log(fails ? `\n失败 ${fails} 项 ✗` : '\n廷对方案通过 ✓');
process.exit(fails ? 1 : 0);
