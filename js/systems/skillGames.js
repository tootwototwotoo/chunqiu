// 八种技艺的修习小游戏逻辑（与 DOM 无关）
import { R } from '../state.js';
import { GOODS } from '../data/goods.js';
import { clamp, ri } from '../util.js';

export const SKILL_KIND = {
  jianshu: 'timing',   // 剑术：三连斩，时机条
  sheshu: 'target',    // 射术：移动靶，三次放箭
  bingfa: 'formation', // 兵法：阵法相克
  biancai: 'rhetoric', // 辩才：对症下药
  quanmou: 'deduction',// 权谋：识破通敌
  shanggu: 'price',    // 商贾：估价
  suanshu: 'math',     // 算术：心算
  xuewen: 'match',     // 学问：典籍配对
};

const HIT_SCORE = { perfect: 1, good: 0.65, miss: 0.15 };

const FORMS = {
  fang: { name: '方阵', beats: 'yuan' },
  yuan: { name: '圆阵', beats: 'yan' },
  yan: { name: '雁行', beats: 'fang' },
};
const FORM_IDS = Object.keys(FORMS);
export const FORM_INFO = FORMS;
export const FORM_LIST = FORM_IDS.map(id => ({ id, ...FORMS[id] }));
const counterOf = (enemy) => FORM_IDS.find(k => FORMS[k].beats === enemy);

const BIAS = { li: '好利', yi: '重义', ming: '好名', shi: '慕强' };
const ARG_OPTS = [
  { id: 'li', name: '言利', hint: '以通商之利动之' },
  { id: 'yi', name: '晓义', hint: '以礼义相责' },
  { id: 'ming', name: '动名', hint: '许以诸侯之名' },
  { id: 'shi', name: '陈势', hint: '以形势相迫' },
];
const OPPOSITE = { li: 'yi', yi: 'li', ming: 'shi', shi: 'ming' };
export const BIAS_NAMES = BIAS;
export const ARG_OPTIONS = ARG_OPTS;

const MATCH_BANK = [
  ['《道德经》', '老子'],
  ['《春秋》', '孔子'],
  ['《孙子兵法》', '孙武'],
  ['《管子》', '管仲'],
  ['《左传》', '左丘明'],
  ['《诗经》', '孔子删订'],
];

export function startSkillGame(st, skill) {
  const kind = SKILL_KIND[skill];
  const g = { skill, kind, round: 1, maxRounds: 3, hits: [], done: false, score: 0 };
  if (kind === 'formation') {
    g.questions = Array.from({ length: 3 }, () => {
      const enemy = R.pick(st, FORM_IDS);
      return { enemy, correct: counterOf(enemy), terrain: R.pick(st, ['平原', '隘口', '水泽']) };
    });
  } else if (kind === 'rhetoric') {
    g.questions = Array.from({ length: 3 }, () => ({ bias: R.pick(st, Object.keys(BIAS)) }));
  } else if (kind === 'deduction') {
    const names = ['甲', '乙', '丙'];
    g.questions = Array.from({ length: 3 }, () => {
      const culprit = ri(st, 0, 2);
      const others = [0, 1, 2].filter(i => i !== culprit);
      const ex = R.pick(st, others);
      const pair = [culprit, others.find(i => i !== ex)].sort(() => 0.5 - R.next(st));
      return {
        culprit, names,
        clue1: `「${names[ex]}」昨夜不在馆舍。`,
        clue2: `有人见「${pair[0]}」或「${pair[1]}」出入敌营。`,
      };
    });
  } else if (kind === 'price') {
    g.questions = Array.from({ length: 3 }, () => {
      const goodId = R.pick(st, Object.keys(GOODS));
      const good = GOODS[goodId];
      const actual = Math.max(3, Math.round(good.base * (0.7 + R.next(st) * 0.7)));
      const hint = Math.max(2, Math.round(actual * (0.9 + R.next(st) * 0.2)));
      const opts = new Set([actual]);
      while (opts.size < 4) {
        const f = R.pick(st, [0.65, 0.78, 0.88, 1.12, 1.25, 1.4]);
        const v = Math.max(2, Math.round(actual * f));
        if (v !== actual) opts.add(v);
      }
      const options = [...opts];
      for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(R.next(st) * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
      }
      return { good, actual, hint, options, correct: options.indexOf(actual) };
    });
  } else if (kind === 'math') {
    g.questions = Array.from({ length: 3 }, () => {
      const op = R.pick(st, ['+', '-', '×']);
      let a, b, answer;
      if (op === '+') { a = ri(st, 12, 89); b = ri(st, 12, 89); answer = a + b; }
      else if (op === '-') { a = ri(st, 30, 99); b = ri(st, 5, a - 1); answer = a - b; }
      else { a = ri(st, 11, 29); b = ri(st, 3, 9); answer = a * b; }
      return { a, b, op, answer };
    });
  } else if (kind === 'match') {
    const picked = [];
    const pool = [...MATCH_BANK];
    while (picked.length < 4) {
      const i = Math.floor(R.next(st) * pool.length);
      picked.push(pool.splice(i, 1)[0]);
    }
    const left = picked.map(p => p[0]);
    const right = picked.map(p => p[1]);
    for (let i = left.length - 1; i > 0; i--) { const j = Math.floor(R.next(st) * (i + 1)); [left[i], left[j]] = [left[j], left[i]]; }
    for (let i = right.length - 1; i > 0; i--) { const j = Math.floor(R.next(st) * (i + 1)); [right[i], right[j]] = [right[j], right[i]]; }
    g.pairs = picked.map(([l, r]) => ({ l, r }));
    g.leftOrder = left;
    g.rightOrder = right;
    g.matched = [];
    g.wrong = 0;
    g.attempts = 0;
    g.selectedLeft = null;
  }
  return g;
}

function finalize(g) {
  g.done = true;
  if (g.kind === 'match') {
    const matched = g.matched.length;
    g.score = clamp(matched / 4 - g.wrong * 0.06, 0, 1);
  } else {
    const sum = g.hits.reduce((a, q) => a + (HIT_SCORE[q] ?? 0), 0);
    g.score = clamp(sum / g.maxRounds, 0, 1);
  }
  g.quality = g.score >= 0.85 ? 'perfect' : g.score >= 0.5 ? 'good' : 'miss';
  return g;
}

export function recordHit(st, g, quality) {
  if (g.done) return g;
  g.hits.push(quality);
  g.round++;
  if (g.round > g.maxRounds || g.hits.length >= g.maxRounds) finalize(g);
  return g;
}

// 阵法 / 辩才 / 权谋：选择题
export function answerChoice(st, g, choice) {
  if (g.done) return g;
  const q = g.questions[g.round - 1];
  let quality = 'miss';
  if (g.kind === 'formation') {
    quality = choice === q.correct ? 'perfect' : 'miss';
  } else if (g.kind === 'rhetoric') {
    if (choice === q.bias) quality = 'perfect';
    else if (OPPOSITE[q.bias] === choice) quality = 'miss';
    else quality = 'good';
  } else if (g.kind === 'deduction') {
    quality = Number(choice) === q.culprit ? 'perfect' : 'miss';
  }
  return recordHit(st, g, quality);
}

// 商贾估价
export function answerPrice(st, g, index) {
  if (g.done) return g;
  const q = g.questions[g.round - 1];
  const v = q.options[index];
  const diff = Math.abs(v - q.actual) / q.actual;
  const quality = index === q.correct ? 'perfect' : diff <= 0.12 ? 'good' : 'miss';
  return recordHit(st, g, quality);
}

// 算术
export function answerMath(st, g, value) {
  if (g.done) return g;
  const q = g.questions[g.round - 1];
  const quality = Number(value) === q.answer ? 'perfect' : 'miss';
  return recordHit(st, g, quality);
}

// 学问配对：返回是否配对成功
export function matchPair(st, g, leftIdx, rightIdx) {
  if (g.done) return { ok: false, done: g.done };
  g.attempts++;
  const l = g.leftOrder[leftIdx];
  const r = g.rightOrder[rightIdx];
  const idx = g.pairs.findIndex(p => p.l === l && p.r === r);
  let ok = false;
  if (idx >= 0 && !g.matched.includes(idx)) {
    g.matched.push(idx);
    ok = true;
  } else {
    g.wrong++;
  }
  if (g.matched.length >= 4 || g.attempts >= 8 || g.wrong >= 4) finalize(g);
  return { ok, done: g.done };
}

export function finalizeSkillGame(st, g) {
  return g.done ? g : finalize(g);
}

// 修习经验：较旧版整体减半（完美 22→11，良好 12→6，生疏 3→2）
export function trainingExp(level, quality, bonus = 0) {
  const base = { perfect: 11, good: 6, miss: 2 }[quality] ?? 2;
  return base + Math.round(level * 0.5) + (bonus ?? 0);
}

export function skillGameSummary(g) {
  const count = q => g.hits.filter(h => h === q).length;
  if (g.kind === 'timing') return `三次出手：精妙 ${count('perfect')}、尚可 ${count('good')}`;
  if (g.kind === 'target') return `三箭：中的 ${count('perfect')}、略偏 ${count('good')}`;
  if (g.kind === 'match') return `配对 ${g.matched.length}/4，误 ${g.wrong} 次`;
  return `三问：精妙 ${count('perfect')}、尚可 ${count('good')}`;
}
