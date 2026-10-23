// 三回合廷对：国君问政，布衣应对
import { AUDIENCE_QUESTIONS } from '../data/audience.js';
import { NPC_MAP } from '../data/npcs.js';
import { CITY_MAP } from '../data/world.js';
import { R } from '../state.js';
import { shuffle, clamp } from '../util.js';

const OPPOSITE = { li: 'yi', yi: 'li', ming: 'shi', shi: 'ming' };
const BASE = { hit: 15, reason: 5, evade: -10 };

export function audienceRuler(st, stateId) {
  const owner = (cityId) => st.world.owner[cityId] ?? CITY_MAP[cityId]?.state;
  const n = Object.values(st.npc).find(x => x.alive && x.city && owner(x.city) === stateId);
  return n ? NPC_MAP[n.id] ?? null : null;
}

export function startAudience(st, stateId) {
  const ruler = audienceRuler(st, stateId);
  const questions = shuffle(st, AUDIENCE_QUESTIONS).slice(0, 3);
  return {
    stateId, rulerName: ruler?.name ?? '国君',
    heart: ruler?.bias ?? 'li',
    questions, round: 1, maxRounds: 3,
    agreement: 50, history: [], log: [],
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
    a.success = a.agreement >= 70;
    a.log.push(a.success ? `${a.rulerName}颔首：「可矣。」` : `${a.rulerName}摇头：「空言无补。」`);
  } else {
    a.log.push(`${a.rulerName}：「${currentQuestion(a).q}」`);
  }
  return a;
}
