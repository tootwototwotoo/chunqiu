// 三回合廷对：国君问政，布衣应对；第三问为追问
import { AUDIENCE_QUESTIONS, AUDIENCE_FOLLOW_UPS } from '../data/audience.js';
import { NPC_MAP } from '../data/npcs.js';
import { CITY_MAP } from '../data/world.js';
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

const FOLLOW_BY_QUESTION = {
  famine: 'fu_grain', army: 'fu_army', clans: 'fu_clans', justice: 'fu_justice',
  oath: 'fu_oath', flood: 'fu_river', talent: 'fu_talent', diplomacy: 'fu_meeting',
};

export function audienceRuler(st, stateId) {
  const owner = (cityId) => st.world.owner[cityId] ?? CITY_MAP[cityId]?.state;
  const here = Object.values(st.npc).filter(x => x.alive && x.city && owner(x.city) === stateId);
  // 优先真正的国君；其次才找该国其他在世人物
  const ruler = here.find(x => NPC_MAP[x.id]?.role === 'ruler');
  return NPC_MAP[ruler?.id ?? here[0]?.id] ?? null;
}

export function audienceHeart(st, stateId) {
  return audienceRuler(st, stateId)?.bias ?? STATE_HEART[stateId] ?? 'li';
}

export function startAudience(st, stateId) {
  const p = player(st);
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
