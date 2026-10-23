// 五套册命试炼小游戏的逻辑（与 DOM 无关，便于测试）
import { R } from '../state.js';
import { clamp, ri } from '../util.js';

// ---------------- 围捕 ----------------
export function startHunt(st, variant) {
  const n = variant.params.n;
  return {
    kind: 'hunt', n, turns: variant.params.turns, maxTurns: variant.params.turns,
    target: R.int(st, 0, n * n - 1), searched: Array(n * n).fill(null), wrong: 0,
    done: false, success: false, log: ['贼首藏匿于乡野之间，搜之。'],
  };
}
export function huntSearch(st, g, idx) {
  if (g.done || g.searched[idx] != null) return g;
  const n = g.n;
  const tx = g.target % n, ty = Math.floor(g.target / n);
  const x = idx % n, y = Math.floor(idx / n);
  const d = Math.abs(tx - x) + Math.abs(ty - y);
  g.searched[idx] = d;
  g.turns--;
  if (d === 0) {
    g.done = true; g.success = true;
    g.log.push('你一脚踹开柴门，贼首正在其中——拿下了！');
  } else {
    g.wrong++;
    g.log.push(d <= 2 ? '此处痕迹甚近，贼首当在左近。' : d <= 4 ? '有些踪迹，但还不对。' : '一无所获，方向错了。');
    if (g.turns <= 0) { g.done = true; g.success = false; g.log.push('日落时分，贼首已远遁。'); }
  }
  return g;
}

// ---------------- 折冲 ----------------
const NEG_CARDS = {
  li: { name: '言利', hint: '陈说通商之利', prog: 18, sus: 4 },
  yi: { name: '晓义', hint: '以礼义相责', prog: 15, sus: -8 },
  ming: { name: '动名', hint: '许以诸侯之名', prog: 17, sus: 3 },
  shi: { name: '陈势', hint: '以形势相迫', prog: 23, sus: 16 },
};
export const NEG_CARD_LIST = Object.entries(NEG_CARDS).map(([id, c]) => ({ id, ...c }));

export function startNegotiation(st, variant) {
  return {
    kind: 'neg', progress: 15, suspicion: 18, round: 1, maxRounds: variant.params.rounds,
    goal: variant.params.goal, suspicionMax: variant.params.suspicionMax, bias: variant.params.bias,
    done: false, success: false, log: ['宾主落座，案上茶烟未散。'],
  };
}
export function negotiate(st, g, cardId) {
  if (g.done) return g;
  const card = NEG_CARDS[cardId];
  let prog = card.prog, sus = card.sus;
  if (cardId === g.bias) { prog += 9; sus -= 2; }
  else if ((cardId === 'li' && g.bias === 'yi') || (cardId === 'yi' && g.bias === 'li')) sus += 6;
  g.progress = clamp(g.progress + prog, 0, 140);
  g.suspicion = clamp(g.suspicion + sus + 3 + ri(st, 0, 4), 0, 120);
  g.log.push(`你${card.name}：${card.hint}。`);
  g.round++;
  if (g.round > g.maxRounds) {
    g.done = true;
    g.success = g.progress >= g.goal && g.suspicion <= g.suspicionMax;
    g.log.push(g.success ? '对方终于颔首，盟辞可成。' : g.suspicion > g.suspicionMax ? '对方拂袖而起，谈判破裂。' : '火候未到，对方只肯含糊其辞。');
  }
  return g;
}

// ---------------- 治邑 ----------------
const GOV_EVENTS = {
  famine: [
    { t: '流民塞道，开仓则费，闭门则怨。', min: -6, fisc: -4 },
    { t: '豪强囤粮，市价腾贵。', min: -4, fisc: -3 },
    { t: '疫气初起，医者奔走。', min: -8, def: -2 },
    { t: '一场秋雨，旱情稍解。', min: 6 },
  ],
  flood: [
    { t: '河决一处，堤防告急。', def: -10 },
    { t: '民夫逃亡，工期延误。', min: -5, def: -3 },
    { t: '新堤合龙，水势渐缓。', def: 9 },
    { t: '邻邑运来木石。', fisc: 6, def: 3 },
  ],
  war: [
    { t: '征发民夫，田野少人。', min: -6 },
    { t: '军前索饷，府库告急。', fisc: -8 },
    { t: '前军小捷，士气可用。', def: 6 },
    { t: '犒师之费不可省。', fisc: -5, def: 4 },
  ],
};
const GOV_POLICIES = [
  { id: 'farm', name: '劝农', hint: '民生+12 府库-4', min: 12, fisc: -4 },
  { id: 'wall', name: '修防', hint: '城防+12 民生-5', def: 12, min: -5 },
  { id: 'trade', name: '通商', hint: '府库+12 民生-3', fisc: 12, min: -3 },
  { id: 'relief', name: '赈济', hint: '民生+9 府库-9', min: 9, fisc: -9 },
];
export const GOV_POLICY_LIST = GOV_POLICIES;

export function startGovernance(st, variant) {
  return {
    kind: 'gov', turn: 1, maxTurns: variant.params.turns,
    min: 48, def: 48, fisc: 52,
    thresholds: variant.params.thresholds, scenario: variant.params.scenario,
    done: false, success: false, log: ['受命治邑，案上簿书如山。'],
  };
}
export function govern(st, g, policyId) {
  if (g.done) return g;
  const pol = GOV_POLICIES.find(p => p.id === policyId);
  g.min = clamp(g.min + (pol.min ?? 0), 0, 100);
  g.def = clamp(g.def + (pol.def ?? 0), 0, 100);
  g.fisc = clamp(g.fisc + (pol.fisc ?? 0), 0, 100);
  g.log.push(`行「${pol.name}」。`);
  const ev = R.pick(st, GOV_EVENTS[g.scenario]);
  g.min = clamp(g.min + (ev.min ?? 0), 0, 100);
  g.def = clamp(g.def + (ev.def ?? 0), 0, 100);
  g.fisc = clamp(g.fisc + (ev.fisc ?? 0), 0, 100);
  g.log.push(ev.t);
  g.turn++;
  if (g.turn > g.maxTurns) {
    g.done = true;
    const th = g.thresholds;
    g.success = g.min >= th.min && g.def >= th.def && g.fisc >= th.fisc;
    g.log.push(g.success ? '一岁既终，三事俱备，邑人相庆。' : '岁末考绩，仍有阙失。');
  }
  return g;
}

// ---------------- 军略 ----------------
const FORMATIONS = {
  fang: { name: '方阵', beats: 'yuan' },
  yuan: { name: '圆阵', beats: 'yan' },
  yan: { name: '雁行', beats: 'fang' },
};
export const FORMATION_LIST = Object.entries(FORMATIONS).map(([id, f]) => ({ id, ...f }));
const TERRAIN = { plain: 'fang', pass: 'yan', water: 'yuan' };

export function startBattle(st, variant) {
  return {
    kind: 'war', round: 1, maxRounds: variant.params.rounds,
    troops: 100, morale: 62, enemyTroops: 100, enemyMorale: 62,
    terrain: variant.params.terrain, enemy: variant.params.enemy,
    done: false, success: false, log: ['两军对阵，鼓声渐急。'],
  };
}
export function battleRound(st, g, formation) {
  if (g.done) return g;
  const enemy = R.pick(st, ['fang', 'yuan', 'yan']);
  const bonus = TERRAIN[g.terrain];
  const terrainText = { plain: '平原', pass: '隘口', water: '水泽' }[g.terrain] ?? '原野';
  let playerDmg = 9 + g.morale / 12 + (formation === bonus ? 4 : 0);
  let enemyDmg = 9 + g.enemyMorale / 12 + (enemy === bonus ? 4 : 0);
  if (FORMATIONS[formation].beats === enemy) {
    g.enemyTroops = clamp(g.enemyTroops - Math.round(playerDmg), 0, 100);
    g.enemyMorale = clamp(g.enemyMorale - 7, 0, 100);
    g.morale = clamp(g.morale + 2, 0, 100);
    g.log.push(`你以${FORMATIONS[formation].name}破敌${FORMATIONS[enemy].name}，${terrainText}之上敌军却退。`);
  } else if (FORMATIONS[enemy].beats === formation) {
    g.troops = clamp(g.troops - Math.round(enemyDmg), 0, 100);
    g.morale = clamp(g.morale - 7, 0, 100);
    g.enemyMorale = clamp(g.enemyMorale + 2, 0, 100);
    g.log.push(`敌军以${FORMATIONS[enemy].name}冲你的${FORMATIONS[formation].name}，前阵折损。`);
  } else {
    g.troops = clamp(g.troops - Math.round(enemyDmg * 0.7), 0, 100);
    g.enemyTroops = clamp(g.enemyTroops - Math.round(playerDmg * 0.7), 0, 100);
    g.log.push('两军缠斗，各有折损。');
  }
  g.round++;
  if (g.troops <= 0 || g.enemyTroops <= 0 || g.round > g.maxRounds) {
    g.done = true;
    g.success = g.enemyTroops <= 0 || (g.enemyTroops < g.troops && g.morale >= g.enemyMorale);
    g.log.push(g.success ? '敌军退去，你整师而还。' : '我军力竭，只得收兵。');
  }
  return g;
}

// ---------------- 定礼 ----------------
export function startRites(st, variant) {
  const trueOrder = [...variant.params.rites];
  // 洗牌得到正确次序（仪式本身无固定先后，试炼以秘定次序为准）
  for (let i = trueOrder.length - 1; i > 0; i--) {
    const j = Math.floor(R.next(st) * (i + 1));
    [trueOrder[i], trueOrder[j]] = [trueOrder[j], trueOrder[i]];
  }
  const clues = [];
  const used = new Set();
  let guard = 0;
  while (clues.length < variant.params.clues && guard++ < 60) {
    const i = ri(st, 0, trueOrder.length - 2);
    const j = ri(st, i + 1, trueOrder.length - 1);
    const key = `${i}-${j}`;
    if (used.has(key)) continue;
    used.add(key);
    clues.push({ before: trueOrder[i], after: trueOrder[j], i, j });
  }
  return {
    kind: 'rite', trueOrder, clues, slots: [], attempts: 3, hints: 1, usedHints: 0,
    done: false, success: false, log: ['礼官捧册而立，请你定其次序。'],
  };
}
export function riteSubmit(st, g, order) {
  if (g.done) return g;
  const wrong = order.filter((x, i) => x !== g.trueOrder[i]).length;
  if (wrong === 0) {
    g.done = true; g.success = true;
    g.log.push('次序既定，礼官颔首：「可矣。」');
    return g;
  }
  g.attempts--;
  g.lastWrong = wrong;
  g.log.push(`次序有误（${wrong}处不合）。`);
  if (g.attempts <= 0) {
    g.done = true; g.success = false;
    g.log.push('三次皆误，礼官摇头退下。');
  }
  return g;
}
export function riteHint(st, g) {
  if (g.done || g.usedHints >= g.hints) return g;
  const idx = ri(st, 0, g.trueOrder.length - 1);
  g.usedHints++;
  g.revealed = g.revealed ?? {};
  g.revealed[idx] = g.trueOrder[idx];
  g.log.push(`有人低声道：第${idx + 1}位当是「${g.trueOrder[idx]}」。`);
  return g;
}

// ---------------- 评价 ----------------
export function evaluateGame(g) {
  let performance = 0, success = false;
  if (g.kind === 'hunt') {
    success = g.success;
    const completion = success ? 50 : 20;
    const efficiency = 20 * (g.turns / g.maxTurns);
    const intact = g.wrong <= Math.ceil(g.maxTurns / 3) ? 10 : 4;
    const execution = 20 * (1 - g.wrong / g.maxTurns);
    performance = completion + efficiency + intact + execution;
  } else if (g.kind === 'neg') {
    success = g.success;
    const completion = 50 * Math.min(1, g.progress / g.goal);
    const efficiency = 20 * ((g.maxRounds - g.round + 1) / g.maxRounds);
    const intact = g.suspicion <= 55 ? 10 : g.suspicion <= g.suspicionMax ? 6 : 2;
    const execution = 20 * clamp((g.progress - g.suspicion) / 60, 0, 1);
    performance = completion + efficiency + intact + execution;
  } else if (g.kind === 'gov') {
    success = g.success;
    const th = g.thresholds;
    const completion = 50 * clamp(((Math.min(g.min, th.min) / th.min) + Math.min(g.def, th.def) / th.def + Math.min(g.fisc, th.fisc) / th.fisc) / 3, 0, 1);
    const efficiency = 20 * ((g.maxTurns - g.turn + 1) / g.maxTurns);
    const intact = g.min >= 45 && g.def >= 45 && g.fisc >= 45 ? 10 : 5;
    const slacks = [g.min - th.min, g.def - th.def, g.fisc - th.fisc];
    const execution = 20 * clamp(slacks.reduce((a, b) => a + b, 0) / 90, 0, 1);
    performance = completion + efficiency + intact + execution;
  } else if (g.kind === 'war') {
    success = g.success;
    const completion = success ? 50 : 50 * (1 - g.enemyTroops / 100);
    const efficiency = 20 * ((g.maxRounds - g.round + 1) / g.maxRounds);
    const intact = 10 * (g.troops / 100);
    const execution = 20 * clamp((g.morale - g.enemyMorale + 60) / 120, 0, 1);
    performance = completion + efficiency + intact + execution;
  } else if (g.kind === 'rite') {
    success = g.success;
    const completion = success ? 50 : 20;
    const efficiency = 20 * (g.attempts / 3);
    const intact = g.usedHints === 0 ? 10 : 4;
    const execution = 20 * clamp(1 - (g.lastWrong ?? 0) / g.trueOrder.length, 0, 1);
    performance = completion + efficiency + intact + execution;
  }
  return { success, performance: Math.round(clamp(performance, 5, 100)) };
}
