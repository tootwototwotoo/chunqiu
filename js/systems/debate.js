// 三回合论辩：认同度、三选一、证据与三档结局
import { DEBATES, EVIDENCE_BY_ID, TAGS, OPPOSITE, TOPIC_NAMES } from '../data/debates/index.js';
import { VOICES } from '../data/debates/voices.js';
import { LINES } from '../data/debates/lines.js';
import { isCareerProfession } from '../data/defs.js';

import { player, addFame, addRel, addMoney, addMerit, addLog, addStamina, hasEvidence, R } from '../state.js';
import { clamp, absDay } from '../util.js';

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
// 论辩消耗：半日 · 8 体力。此前完全无消耗，可无限刷名声与交情。
export const DEBATE_COST = { stamina: 8, days: 0.5 };

// 熟练：同一人同一场景再辩，起始认同 +5，累计上限 +15
export const FAMILIAR_BONUS = 5;
export const FAMILIAR_CAP = 15;
export function familiarKey(npcId, scenarioId) { return `${npcId}#${scenarioId}`; }
export function familiarityOf(st, npcId, scenarioId) {
  const table = st.flags?.debateFamiliar ?? {};
  return Math.min(FAMILIAR_CAP, (table[familiarKey(npcId, scenarioId)] ?? 0) * FAMILIAR_BONUS);
}
export function bumpFamiliarity(st, npcId, scenarioId) {
  if (!npcId || !scenarioId) return;
  const table = (st.flags.debateFamiliar ||= {});
  const k = familiarKey(npcId, scenarioId);
  table[k] = Math.min(FAMILIAR_CAP / FAMILIAR_BONUS, (table[k] ?? 0) + 1);
}

const DEFAULT_EFFECTS = {
  success: { fame: 4, rel: 6 },
  compromise: { fame: 1, rel: 3 },
  fail: { fame: -2, rel: -3 },
};


// 有专属题库时，抽到专属场景的概率（其余抽通用题库）
export const VOICE_RATIO = 0.6;

export const voiceOf = (npcId) => (npcId ? VOICES[npcId] ?? null : null);

// 该人物的专属场景集合（同局内排除已抽过的）
export function voiceScenarios(npcId, { exclude = null } = {}) {
  const v = voiceOf(npcId);
  if (!v) return [];
  return v.debates.filter(d => d.id !== exclude);
}

export function pickDebateScenario(st, { category = null, heart = null, exclude = null, npcId = null } = {}) {
  // 有专属题库的人物：按比例抽专属场景，其余仍走通用题库
  const specific = voiceScenarios(npcId, { exclude });
  if (specific.length && R.chance(st, VOICE_RATIO)) return R.pick(st, specific);

  let pool = DEBATES.filter(d => (!category || d.category === category) && (!heart || d.heart === heart));
  if (!pool.length) pool = DEBATES.filter(d => !heart || d.heart === heart);
  if (!pool.length) pool = DEBATES;
  if (exclude && pool.length > 1) pool = pool.filter(d => d.id !== exclude);
  return R.pick(st, pool);
}

export function canDebate(st) {
  const p = player(st);
  if (p.stamina < DEBATE_COST.stamina) {
    return { ok: false, msg: `精神不济（需 ${DEBATE_COST.stamina} 力）。` };
  }
  return { ok: true };
}

export function startDebate(st, npc, opts = {}) {
  const gate = canDebate(st);
  if (!gate.ok) return gate;
  addStamina(st, -DEBATE_COST.stamina);
  const scenario = opts.scenario ?? pickDebateScenario(st, {
    category: opts.category, heart: npc?.bias, exclude: opts.exclude, npcId: npc?.id,
  });
  const heart = scenario.heart;
  return {
    scenario, heart,
    opponent: {
      name: npc?.name ?? scenario.opponent.name,
      title: npc?.title ?? scenario.opponent.title,
      authority: scenario.authority,
    },
    round: 1, maxRounds: 3,
    agreement: 50 + familiarityOf(st, npc?.id, scenario.id),
    familiar: familiarityOf(st, npc?.id, scenario.id),
    evidenceUsed: false, evidenceApplied: false,
    history: [],
    log: [
      scenario.desc,
      // 先自陈一句，再入题（B 级取 LINES，A 级取人物 intro）
      ...(() => {
        const own = (npc?.id && LINES[npc.id]) || voiceOf(npc?.id)?.intro;
        return own ? [`${npc.name}：「${own}」`] : [];
      })(),
      `${npc?.name ?? scenario.opponent.name}：「${scenario.concerns[0].q}」`,
    ],
    // 开场白仅供界面展示，不参与判定：
    // B 级取 LINES，A 级取人物自己的 intro
    line: (npc?.id && LINES[npc.id]) || voiceOf(npc?.id)?.intro || null,
    // 该人物的论辩主题（A 级才有），显示在弹窗副标题
    theme: voiceOf(npc?.id)?.theme ?? null,
    over: false, result: null,
    npcId: npc?.id ?? null,
    opts,
  };
}

export function currentConcern(d) {
  return d.scenario.concerns[d.round - 1] ?? null;
}

export function useEvidence(st, d, evidenceId) {
  if (d.over) return { ok: false, msg: '论辩已结束。' };
  if (d.evidenceUsed) return { ok: false, msg: '本局已经出示过证据。' };
  const ev = EVIDENCE_BY_ID[evidenceId];
  if (!ev) return { ok: false, msg: '并无此证据。' };
  if (!hasEvidence(st, evidenceId)) return { ok: false, msg: '你尚未掌握此证据。' };
  const topic = currentConcern(d)?.topic ?? d.scenario.topic;
  if (ev.topic !== topic) {
    return { ok: false, msg: `「${ev.name}」与眼下所虑（${TOPIC_NAMES[topic] ?? topic}）无关。` };
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


export function settleDebate(st, d, npcId, _opts = {}) {
  st.stats.debates++;
  bumpFamiliarity(st, npcId ?? d.npcId, d.scenario.id);
  if (d.result === 'success') st.stats.debateWins++;
  const effects = { ...DEFAULT_EFFECTS[d.result], ...(d.scenario.effects?.[d.result] ?? {}) };
  if (effects.fame) addFame(st, effects.fame, true);
  if (effects.money) addMoney(st, effects.money, true);
  if (effects.merit && isCareerProfession(player(st).profession)) addMerit(st, effects.merit, true);
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
  const now = absDay(st.time);
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

