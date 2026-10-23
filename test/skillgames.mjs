// 八种技艺小游戏与经验减半
import { newGame } from '../js/state.js';
import {
  SKILL_KIND, startSkillGame, recordHit, answerChoice, answerPrice, answerMath,
  matchPair, trainingExp, skillGameSummary,
} from '../js/systems/skillGames.js';

let fails = 0;
const ok = (c, m, x = '') => { console.log(`${c ? '✓' : '✗'} ${m}${x ? ' — ' + x : ''}`); if (!c) fails++; };

const skills = Object.keys(SKILL_KIND);
ok(skills.length === 8, '八种技艺各有一套小游戏');
ok(new Set(Object.values(SKILL_KIND)).size === 8, '八套小游戏类型互不相同');

const st = newGame({ name: '修习', profession: 'youxia', seed: 9 });

// 时机类
for (const skill of ['jianshu', 'sheshu']) {
  const g = startSkillGame(st, skill);
  recordHit(st, g, 'perfect'); recordHit(st, g, 'perfect'); recordHit(st, g, 'perfect');
  ok(g.done && g.quality === 'perfect', `${skill} 时机类可满分`, g.quality);
  ok(skillGameSummary(g).includes(skill === 'sheshu' ? '三箭' : '精妙'), `${skill} 有成绩摘要`);
}

// 阵法
{
  const g = startSkillGame(st, 'bingfa');
  while (!g.done) answerChoice(st, g, g.questions[g.round - 1].correct);
  ok(g.quality === 'perfect', '兵法阵法全对为精妙', g.quality);
}

// 辩才
{
  const g = startSkillGame(st, 'biancai');
  while (!g.done) answerChoice(st, g, g.questions[g.round - 1].bias);
  ok(g.quality === 'perfect', '辩才对症下药为精妙', g.quality);
}

// 权谋
{
  const g = startSkillGame(st, 'quanmou');
  while (!g.done) answerChoice(st, g, g.questions[g.round - 1].culprit);
  ok(g.quality === 'perfect', '权谋识破为精妙', g.quality);
}

// 商贾
{
  const g = startSkillGame(st, 'shanggu');
  while (!g.done) answerPrice(st, g, g.questions[g.round - 1].correct);
  ok(g.quality === 'perfect', '商贾估价准确为精妙', g.quality);
}

// 算术
{
  const g = startSkillGame(st, 'suanshu');
  while (!g.done) answerMath(st, g, g.questions[g.round - 1].answer);
  ok(g.quality === 'perfect', '算术全对为精妙', g.quality);
}

// 学问配对
{
  const g = startSkillGame(st, 'xuewen');
  for (const pair of g.pairs) {
    const li = g.leftOrder.indexOf(pair.l);
    const ri = g.rightOrder.indexOf(pair.r);
    matchPair(st, g, li, ri);
  }
  ok(g.done && g.quality === 'perfect', '典籍配对全对为精妙', g.quality);
  ok(g.matched.length === 4, '四对全部配对');
}

// 经验减半
ok(trainingExp(0, 'perfect') === 11, '完美经验 22→11', String(trainingExp(0, 'perfect')));
ok(trainingExp(0, 'good') === 6, '良好经验 12→6', String(trainingExp(0, 'good')));
ok(trainingExp(0, 'miss') === 2, '生疏经验 3→2', String(trainingExp(0, 'miss')));
ok(trainingExp(4, 'perfect') === 13, '等级加成减半（4级+2）', String(trainingExp(4, 'perfect')));
ok(trainingExp(0, 'perfect', 2) === 13, '地利加成计入', String(trainingExp(0, 'perfect', 2)));

// 答错会拉低评价
{
  const g = startSkillGame(st, 'bingfa');
  answerChoice(st, g, 'nope');
  ok(g.hits[0] === 'miss', '阵法答错记失败');
}

console.log(fails ? `\n失败 ${fails} 项 ✗` : '\n八套修习小游戏通过 ✓');
process.exit(fails ? 1 : 0);
