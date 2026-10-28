// 国君更替：驾崩与继位
// 只对「所仕之国」与「声名最盛之国」弹窗，其余只入纪事，避免刷屏。
import { RULERS, rulerStageOf } from '../data/npcs.js';
import { STATES } from '../data/world.js';
import { player, addFame, addLog } from '../state.js';
import { clamp } from '../util.js';
import { queueEvent } from './events.js';

const reignOf = (n) => n.reign ?? [n.birth, n.death];

// 某国在某年的在位国君（只认 stage === 'ruler'，公子与前国君不算）
export function rulerAt(stateId, year) {
  return RULERS.find(n => n.state === stateId && rulerStageOf(n, year) === 'ruler') ?? null;
}

// 该国上一位国君（在位期结束年小于本年）
export function previousRuler(stateId, year) {
  const list = RULERS
    .filter(n => n.state === stateId)
    .map(n => ({ n, span: reignOf(n) }))
    .filter(x => x.span[1] != null && x.span[1] < year)
    .sort((a, b) => b.span[1] - a.span[1]);
  return list[0]?.n ?? null;
}

// 本年发生更替的国家（有国君在去年身故，或今年有新君即位）
export function reignChanges(st) {
  const year = st.time.year;
  const out = [];
  for (const stateId of Object.keys(STATES)) {
    const curent = rulerAt(stateId, year);
    if (!curent) continue;
    // 以「本年即位」为准，不依赖去年是否有人在位。
    // 前任卒年与新君即位年之间常有空档年（如晋侯缗 -678 卒、献公 -676 立），
    // 用 rulerAt(year-1) 判定会漏掉这批更替。
    if (reignOf(curent)[0] !== year) continue;
    const prev = rulerAt(stateId, year - 1) ?? previousRuler(stateId, year);
    if (prev?.id === curent.id) continue;
    // prev 为空 = 前人已卒、新君未立的空位年（史籍多有缺载），仍算作「新君即位」
    out.push({ state: stateId, from: prev, to: curent });
  }
  return out;
}

// 生成更替事件（不强推弹窗，由调用方决定）
export function makeReignEvent(st, change) {
  const { state, from, to } = change;
  const stateName = STATES[state]?.name ?? state;
  const fromSpan = from ? reignOf(from) : null;
  const years = fromSpan && fromSpan[1] != null && fromSpan[0] != null
    ? fromSpan[1] - fromSpan[0] + 1 : null;
  // 无前任（空位年）时改写出「国人立之」的说法
  const title = from ? `${from.name}薨，${to.name}即位` : `${to.name}立为${stateName}君`;
  const body = from
    ? `${from.name}${years ? `在位${years}年，` : ''}于本年薨。${to.name}继立。${to.desc ?? ''}`
    : `${stateName}君位空悬已久。本年${to.name}立。${to.desc ?? ''}`;
  return {
    id: `reign_${state}_${to.id}`,
    state, from, to,
    effects: [],
    title,
    body,
    choices: [
      {
        label: '往吊旧君', hint: '重义',
        effects: [{ t: 'fame', v: 4 }],
        text: `你赴${stateName}吊丧，${to.name}谢你：「先君之丧，辱君远来。」`,
      },
      {
        label: '贺新君即位', hint: '好利',
        effects: [{ t: 'fame', v: 2 }],
        text: `你持礼入贺，${to.name}受之，命人记下你的名字。`,
      },
      {
        label: '不涉其国', hint: '',
        effects: [],
        text: '君位更迭，于你不过是又一条传闻。',
      },
    ],
  };
}

// 是否值得弹窗：玩家所仕之国，或国势最强之国
export function isNotable(st, stateId) {
  if (player(st).stateId === stateId) return true;
  const strongest = Object.entries(st.world.power ?? {})
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))[0]?.[0];
  return stateId === strongest;
}

// 应用更替带来的世界影响（国势涨落、玩家与新君的交情）
export function applyReignEffect(st, change) {
  const { state, from, to } = change;
  const p = player(st);

  const stateName = STATES[state]?.name ?? state;
  const notes = [];
  if (from) {
    // 旧君薨：国势下跌；新君即位：稍稍回升
    st.world.power[state] = clamp((st.world.power[state] ?? 30) - 8, 5, 100);
    st.world.power[state] = clamp((st.world.power[state] ?? 30) + 3, 5, 100);
    notes.push(`${stateName}君位更迭，国势稍损。`);
  } else {
    // 空位年立君：只是补位，不算旧君新丧，国势小幅回升
    st.world.power[state] = clamp((st.world.power[state] ?? 30) + 3, 5, 100);
    notes.push(`${stateName}久无君，本年立${to.name}，国人稍安。`);
  }

  // 玩家若与该国有旧交：新君若是老朋友则保留，否则按初识处理
  const newRulerRel = p.relations?.[to.id];
  if (newRulerRel && newRulerRel.met) {
    notes.push(`新君${to.name}是你旧识，交情如故。`);
  } else {
    // 未相识则保持未识状态，不做惩罚——下次见面按初识计
    if (newRulerRel) {
      newRulerRel.met = false;
      newRulerRel.aff = 0;
    }
    notes.push(`新君${to.name}与你素未谋面。`);
  }

  // 旧君曾为知己：名声受损（无前任的空位年不适用）
  const oldRel = from ? p.relations?.[from.id] : null;
  if (oldRel?.met && oldRel.aff >= 75) {
    addFame(st, -3, true);
    notes.push(`旧君${from.name}曾与你为知己，闻其薨，名声稍损。`);
  }

  addLog(st, from
    ? `${STATES[state]?.name ?? state}${from.name}薨，${to.name}即位。`
    : `${to.name}立为${STATES[state]?.name ?? state}君。`, 'war');
  return notes;
}

// 每次进入新的一月检查一次；同一年内不重复处理
export function collectReignChanges(st, prevChanges = []) {
  const year = st.time.year;
  if (st.flags.reignCheckedYear === year) return { events: [], notes: [] };
  st.flags.reignCheckedYear = year;

  const changes = reignChanges(st).filter(c => !prevChanges.includes(c.to.id));
  if (!changes.length) return { events: [], notes: [] };

  const notable = changes.filter(c => isNotable(st, c.state));
  const quiet = changes.filter(c => !isNotable(st, c.state));

  const notes = [];
  for (const c of quiet) {
    notes.push(...applyReignEffect(st, c));
  }
  return {
    events: notable.map(c => queueEvent(st, 'reign', makeReignEvent(st, c))),
    noteworthy: notable,
    notes,
  };
}
