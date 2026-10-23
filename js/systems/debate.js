// 三回合论辩：认同度、三选一、证据与三档结局
import { DEBATES, DEBATE_BY_ID, TAGS, OPPOSITE } from '../data/debates/index.js';
import { CITY_MAP } from '../data/world.js';
import { player, addFame, addRel, addMoney, addMerit, addLog, R } from '../state.js';
import { clamp } from '../util.js';

const BIAS_NAME = { li: '好利', yi: '重义', ming: '好名', shi: '慕强' };
export const biasName = (b) => BIAS_NAME[b] ?? '难测';
export const BIAS_TIP = {
  li: '看重实际利益，宜以「讲利害」动之',
  yi: '看重礼义名节，宜以「讲道义」动之',
  ming: '看重声名与旧制，宜以「引先例」动之',
  shi: '看重实力与形势，宜以「陈形势」动之',
};
export { TAGS };

const BASE_SCORE = { hit: 15, reason: 5, evade: -10 };
const HEART_BONUS = 5;
const EVIDENCE_BONUS = 10;
const DEFAULT_EFFECTS = {
  success: { fame: 4, rel: 6 },
  compromise: { fame: 1, rel: 3 },
  fail: { fame: -2, rel: -3 },
};

const dayOf = (t) => (t.year + 722) * 360 + (t.month - 1) * 30 + t.day;

export function pickDebateScenario(st, { category = null, heart = null, exclude = null } = {}) {
  let pool = DEBATES.filter(d => (!category || d.category === category) && (!heart || d.heart === heart));
  if (!pool.length) pool = DEBATES.filter(d => !heart || d.heart === heart);
  if (!pool.length) pool = DEBATES;
  if (exclude && pool.length > 1) pool = pool.filter(d => d.id !== exclude);
  return R.pick(st, pool);
}

export function startDebate(st, npc, opts = {}) {
  const scenario = opts.scenario ?? pickDebateScenario(st, {
    category: opts.category, heart: npc?.bias, exclude: opts.exclude,
  });
  const heart = scenario.heart;
  return {
    scenario, heart,
    opponent: {
      name: npc?.name ?? scenario.opponent.name,
      title: npc?.title ?? scenario.opponent.title,
      authority: scenario.authority,
    },
    round: 1, maxRounds: 3, agreement: 50,
    evidenceUsed: false, evidenceApplied: false,
    history: [], log: [scenario.desc, `${npc?.name ?? scenario.opponent.name}：「${scenario.concerns[0].q}」`],
    over: false, result: null,
    npcId: npc?.id ?? null,
    opts,
  };
}

export function currentConcern(d) {
  return d.scenario.concerns[d.round - 1] ?? null;
}

export function useEvidence(st, d) {
  if (d.over) return { ok: false, msg: '论辩已结束。' };
  if (d.evidenceUsed) return { ok: false, msg: '本局已经出示过证据。' };
  const ev = d.scenario.evidence;
  if (!ev) return { ok: false, msg: '你并无可用证据。' };
  if (ev.concern !== d.round - 1) {
    return { ok: false, msg: `「${ev.name}」与眼下所虑无关。` };
  }
  d.evidenceUsed = true;
  d.evidenceApplied = true;
  d.agreement = clamp(d.agreement + EVIDENCE_BONUS, 0, 100);
  d.log.push(`你出示「${ev.name}」：${ev.text}【证据】认同+${EVIDENCE_BONUS}`);
  return { ok: true, msg: `出示「${ev.name}」，认同度 +${EVIDENCE_BONUS}。` };
}

export function debateChoose(st, d, index) {
  if (d.over) return d;
  const concern = currentConcern(d);
  const opt = concern?.options?.[index];
  if (!opt) return d;
  const base = BASE_SCORE[opt.level] ?? 0;
  const heartMod = opt.tag === d.heart ? HEART_BONUS : OPPOSITE[d.heart] === opt.tag ? -HEART_BONUS : 0;
  const evidence = d.evidenceApplied ? EVIDENCE_BONUS : 0;
  const delta = base + heartMod;
  d.agreement = clamp(d.agreement + delta, 0, 100);
  d.history.push({
    round: d.round, text: opt.text, tag: opt.tag, level: opt.level,
    base, heartMod, evidence, delta, agreement: d.agreement,
  });
  d.log.push(`你：${opt.text}`);
  d.log.push(`${opt.reply}【${TAGS[opt.tag].name}】切中${base >= 0 ? '+' : ''}${base}${heartMod ? ` 心性${heartMod > 0 ? '+' : ''}${heartMod}` : ''}${evidence ? ` 证据+${evidence}` : ''} 认同${delta >= 0 ? '+' : ''}${delta}`);
  d.evidenceApplied = false;
  d.round++;
  if (d.round > d.maxRounds) finish(d);
  else d.log.push(`${d.opponent.name}：「${currentConcern(d).q}」`);
  return d;
}

function finish(d) {
  d.over = true;
  d.result = d.agreement >= 70 ? 'success' : d.agreement >= 40 ? 'compromise' : 'fail';
  d.log.push(d.scenario.outcomes[d.result]);
}

export function debateResult(d) {
  return d.result;
}

export function settleDebate(st, d, npcId, opts = {}) {
  st.stats.debates++;
  if (d.result === 'success') st.stats.debateWins++;
  const effects = { ...DEFAULT_EFFECTS[d.result], ...(d.scenario.effects?.[d.result] ?? {}) };
  if (effects.fame) addFame(st, effects.fame, true);
  if (effects.money) addMoney(st, effects.money, true);
  if (effects.merit && ['youxia', 'shuike', 'xuezhe'].includes(player(st).profession)) addMerit(st, effects.merit, true);
  if (effects.rel) {
    const id = npcId ?? d.npcId;
    if (id) addRel(st, id, effects.rel);
  }
  let followup = null;
  if (d.result === 'compromise' && d.scenario.authority && d.scenario.followup) {
    followup = createFollowupQuest(st, d);
  }
  const label = { success: '说服成功', compromise: '达成妥协', fail: '谈判失败' }[d.result];
  addLog(st, `论辩「${d.scenario.title}」${label}（认同 ${d.agreement}）。`, d.result === 'fail' ? 'war' : 'gain');
  return { result: d.result, agreement: d.agreement, scenario: d.scenario, followup, effects };
}

function createFollowupQuest(st, d) {
  const f = d.scenario.followup;
  const now = dayOf(st.time);
  const days = f.days ?? 15;
  const q = {
    id: `df_${d.scenario.id}_${now}_${R.int(st, 100, 999)}`,
    kind: 'followup', mode: f.mode, title: f.title, desc: f.desc,
    giverName: d.opponent.name, originCity: st.player.cityId,
    targetCity: f.targetCity ?? null,
    checkSkill: f.checkSkill ?? null, dc: f.dc ?? 42,
    enemy: f.enemy ?? null,
    days, exp: now + days, reward: f.reward ?? {},
    status: 'active', cityId: st.player.cityId, followup: true,
  };
  st.quests.active.push(q);
  addLog(st, `因妥协而生新差事：「${q.title}」。`, 'gain');
  return q;
}

// 兼容旧调用
export function debatePreview(st, npc) {
  return { bias: npc?.bias, biasText: biasName(npc?.bias), scenario: pickDebateScenario(st, { heart: npc?.bias }) };
}
