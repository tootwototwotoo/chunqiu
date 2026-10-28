// 三回合廷对：国君问政，布衣应对；第三问为追问
import { AUDIENCE_QUESTIONS, AUDIENCE_FOLLOW_UPS } from '../data/audience.js';
import { NPC_MAP, rulerStageOf } from '../data/npcs.js';
import { CITY_MAP } from '../data/world.js';
import { canTakeOffice } from './progression.js';
import { player, skillLevel, R } from '../state.js';
import { shuffle, clamp } from '../util.js';

const OPPOSITE = { li: 'yi', yi: 'li', ming: 'shi', shi: 'ming' };
const BASE = { hit: 15, reason: 7, evade: -5 };
const SUCCESS = 70;

// 没有对应 NPC 的小国，也有固定心性，避免一律好利
const STATE_HEART = {
  zhou: 'ming', qi: 'li', jin: 'shi', qin: 'yi', chu: 'shi', lu: 'yi',
  song: 'ming', wei: 'yi', zheng: 'shi', yan: 'yi', wu: 'shi', yue: 'shi',
  chen: 'ming', cai: 'ming', cao: 'li', ju: 'ming', zhu: 'yi', sui: 'yi', xu: 'ming',
};

// 每题对应一条追问；未列出的题目会随机取一条，避免反复出仕时追问重复
const FOLLOW_BY_QUESTION = {
  famine: 'fu_grain', army: 'fu_army', clans: 'fu_clans', justice: 'fu_justice',
  oath: 'fu_oath', flood: 'fu_river', talent: 'fu_talent', diplomacy: 'fu_meeting',
  trade: 'fu_trade', scholars: 'fu_scholars', plague: 'fu_plague',
  saltiron: 'fu_saltiron', luxury: 'fu_luxury', heir: 'fu_heir',
  tribute_king: 'fu_tribute', granary: 'fu_granary',
};

// 缺国君的国家的名号（周室及若干小国在世人物里没有 role: 'ruler'）
const RULER_TITLE = {
  zhou: '周天子', qi: '齐侯', jin: '晋侯', qin: '秦伯', chu: '楚王', lu: '鲁侯',
  song: '宋公', wei: '卫侯', zheng: '郑伯', yan: '燕侯', wu: '吴王', yue: '越王',
  chen: '陈侯', cai: '蔡侯', cao: '曹伯', ju: '莒子', zhu: '邾子', sui: '随侯', xu: '许男',
};

export function audienceRuler(st, stateId) {
  const year = st.time.year;
  // 国君按「国」而非「所在城」查找：君主可能驻于陪都，但只要在该国境内即在位
  const owners = st.world.owner;
  const ruler = Object.values(st.npc)
    .filter(x => x.alive && x.city && (owners[x.city] ?? CITY_MAP[x.city]?.state) === stateId)
    .map(x => NPC_MAP[x.id])
    .find(d => d?.role === 'ruler' && rulerStageOf(d, year) === 'ruler');
  if (ruler) return ruler;

  // 史料缺载的年份：以「国名 + 爵位」为名，明确标注史料缺失
  const label = RULER_TITLE[stateId] ?? '国君';
  return {
    id: null,
    name: label,
    title: label,
    bias: STATE_HEART[stateId] ?? 'li',
    synthetic: true,
    desc: `${label}。此君之名史籍失载，仅存国号与爵位。`,
  };
}

export function audienceHeart(st, stateId) {
  return audienceRuler(st, stateId)?.bias ?? STATE_HEART[stateId] ?? 'li';
}

export function startAudience(st, stateId) {
  const p = player(st);
  const gate = canTakeOffice(st);
  if (!gate.ok) return { ok: false, msg: gate.msg };
  const ruler = audienceRuler(st, stateId);
  const heart = ruler?.bias ?? STATE_HEART[stateId] ?? 'li';
  const pool = shuffle(st, AUDIENCE_QUESTIONS);
  const first = pool[0];
  const second = pool[1];
  const follow = AUDIENCE_FOLLOW_UPS.find(f => f.id === FOLLOW_BY_QUESTION[first.id])
    ?? R.pick(st, AUDIENCE_FOLLOW_UPS);
  const questions = [first, second, follow].map(q => ({ ...q, options: shuffle(st, q.options) }));
  // 政略、辩才、名声决定起始认同
  const start = clamp(50 + Math.floor(p.stats.zheng / 20) + Math.floor(skillLevel(st, 'biancai') / 2) + Math.floor(p.fame / 20), 50, 65);
  return {
    stateId, rulerName: ruler?.name ?? '国君',
    heart, questions, round: 1, maxRounds: 3,
    agreement: start, start, history: [], log: [ `${ruler?.name ?? '国君'}：「${questions[0].q}」` ],
    over: false, success: false,
  };
}

export function currentQuestion(a) {
  return a.questions[a.round - 1] ?? null;
}

export function audienceAnswer(st, a, index) {
  if (a.over) return a;
  const q = currentQuestion(a);
  const opt = q?.options?.[index];
  if (!opt) return a;
  const base = BASE[opt.level] ?? 0;
  const heartMod = opt.tag === a.heart ? 5 : OPPOSITE[a.heart] === opt.tag ? -5 : 0;
  const delta = base + heartMod;
  a.agreement = clamp(a.agreement + delta, 0, 100);
  a.history.push({ round: a.round, text: opt.text, tag: opt.tag, level: opt.level, base, heartMod, delta, agreement: a.agreement });
  a.log.push(`你：${opt.text}`);
  a.log.push(`${opt.reply}【切中${base >= 0 ? '+' : ''}${base}${heartMod ? ` 心性${heartMod > 0 ? '+' : ''}${heartMod}` : ''}】认同${delta >= 0 ? '+' : ''}${delta}`);
  a.round++;
  if (a.round > a.maxRounds) {
    a.over = true;
    a.success = a.agreement >= SUCCESS;
    a.log.push(a.success ? `${a.rulerName}颔首：「可矣。」` : `${a.rulerName}摇头：「空言无补。」`);
  } else {
    a.log.push(`${a.rulerName}：「${currentQuestion(a).q}」`);
  }
  return a;
}

export const AUDIENCE_SUCCESS = SUCCESS;
