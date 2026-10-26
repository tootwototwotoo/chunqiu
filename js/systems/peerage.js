// 册命之试与五等爵：任务生成、评价、请封概率、失败循环
import { PEERAGES } from '../data/defs.js';
import { TRIAL_RANKS, TRIAL_BY_ID, variantsOfRank } from '../data/trials.js';
import { CITY_MAP } from '../data/world.js';
import { player, addLog, addMoney, addFame, addGoods, R } from '../state.js';
import { shortestPath } from './pathfind.js';
import { clamp, absDay } from '../util.js';
import { evaluateGame } from './trialGames.js';
import { biPetitionBonus } from './treasures.js';

const careerProf = (p) => ['youxia', 'shuike', 'xuezhe'].includes(p.profession);

export function peerageNext(st) {
  const p = player(st);
  const cur = p.peerage ? p.peerage.rank : -1;
  const next = PEERAGES[cur + 1];
  return next ? { idx: cur + 1, next } : null;
}

export function trialVariant(trial) {
  return trial ? TRIAL_BY_ID[trial.variantId] ?? null : null;
}

function pickVariant(st, rank, excludeId) {
  let pool = variantsOfRank(rank);
  if (pool.length > 1 && excludeId) pool = pool.filter(v => v.id !== excludeId);
  return R.pick(st, pool);
}

function makeTrial(st, rank, variant, extra = {}) {
  const now = absDay(st.time);
  const meta = TRIAL_RANKS[rank];
  const target = variant.targetCity ?? 'luoyi';
  const route = target !== 'luoyi' ? (shortestPath('luoyi', target, st)?.days ?? 10) : 0;
  return {
    rank, variantId: variant.id, targetCity: target,
    status: extra.status ?? 'active',
    availableDay: extra.availableDay ?? now,
    startedDay: now,
    exp: extra.status === 'pending' ? null : now + meta.days + route,
    performance: null,
  };
}

export function canAcceptTrial(st) {
  const p = player(st);
  if (!careerProf(p)) return { ok: false, msg: '商贾不入册命。' };
  const info = peerageNext(st);
  if (!info) return { ok: false, msg: '已至公爵，无可再封。' };
  if (!p.stateId) return { ok: false, msg: '须先出仕立功。' };
  if (p.cityId !== 'luoyi') return { ok: false, msg: '领受册命之试须至洛邑。' };
  if (p.merit < info.next.merit) return { ok: false, msg: `功勋不足（${p.merit}/${info.next.merit}）。` };
  if (p.fame < info.next.fame) return { ok: false, msg: `名声不足（${p.fame}/${info.next.fame}）。` };
  const tr = p.peerageTrial;
  if (tr) {
    const now = absDay(st.time);
    if (tr.status === 'active') return { ok: false, msg: '册命之试尚未完成。' };
    if (tr.status === 'done') return { ok: false, msg: '试炼已成，可请封于周。' };
    if (now < (tr.availableDay ?? 0)) return { ok: false, msg: `周室议而未决，${tr.availableDay - now} 日后可领新试。` };
  }
  return { ok: true, next: info.next, idx: info.idx };
}

export function acceptTrial(st) {
  const chk = canAcceptTrial(st);
  if (!chk.ok) return chk;
  const p = player(st);
  const prev = p.peerageTrial;
  // 失败后已经生成好的新试炼，领受时沿用同一道题
  const variant = (prev && prev.status === 'pending' && trialVariant(prev))
    ? trialVariant(prev)
    : pickVariant(st, chk.idx, prev?.variantId);
  p.peerageTrial = makeTrial(st, chk.idx, variant);
  addLog(st, `领受册命之试「${variant.title}」。`, 'big');
  return { ok: true, trial: p.peerageTrial, variant, targetCity: variant.targetCity ?? 'luoyi' };
}

export function canStartTrial(st) {
  const p = player(st);
  const tr = p.peerageTrial;
  if (!tr || tr.status !== 'active') return { ok: false };
  const variant = trialVariant(tr);
  if (!variant) return { ok: false, msg: '试炼数据缺失。' };
  const target = variant.targetCity ?? 'luoyi';
  if (p.cityId !== target) return { ok: false, msg: `须至${CITY_MAP[target].name}开始。`, target };
  if (tr.exp != null && absDay(st.time) > tr.exp) {
    failTrial(st, '限期已过，试炼未成。');
    return { ok: false, msg: '限期已过，试炼失败。' };
  }
  return { ok: true, variant, target };
}

export function finishTrial(st, game) {
  const p = player(st);
  const tr = p.peerageTrial;
  if (!tr || tr.status !== 'active') return { ok: false, msg: '并无进行中的试炼。' };
  const result = evaluateGame(game);
  tr.performance = result.performance;
  p.peerageHistory = p.peerageHistory ?? [];
  const variant = trialVariant(tr);
  if (result.success) {
    tr.status = 'done';
    p.peerageHistory.push({ year: st.time.year, rank: tr.rank, variant: tr.variantId, result: 'done', performance: result.performance });
    addLog(st, `册命之试「${variant?.title ?? ''}」成，评价 ${result.performance}。`, 'gain');
    return { ok: true, success: true, performance: result.performance, variant };
  }
  // 任务失败：不加诚意，换新题，短暂冷却
  p.peerageHistory.push({ year: st.time.year, rank: tr.rank, variant: tr.variantId, result: 'failed', performance: result.performance });
  addLog(st, `册命之试「${variant?.title ?? ''}」未成，周室另命新试。`, 'war');
  const nextVariant = pickVariant(st, tr.rank, tr.variantId);
  p.peerageTrial = makeTrial(st, tr.rank, nextVariant, { status: 'pending', availableDay: absDay(st.time) + 15 });
  return { ok: true, success: false, performance: result.performance, variant, nextVariant };
}

export function failTrial(st, reason) {
  const p = player(st);
  const tr = p.peerageTrial;
  if (!tr || tr.status !== 'active') return null;
  addLog(st, `${reason}周室另命新试。`, 'war');
  const nextVariant = pickVariant(st, tr.rank, tr.variantId);
  p.peerageTrial = makeTrial(st, tr.rank, nextVariant, { status: 'pending', availableDay: absDay(st.time) + 15 });
  return nextVariant;
}

export function checkTrialExpiry(st) {
  const p = player(st);
  const tr = p.peerageTrial;
  if (!tr || tr.status !== 'active' || tr.exp == null) return null;
  if (absDay(st.time) > tr.exp) return failTrial(st, '册命之试逾期未成，');
  return null;
}

// ---------------- 请封 ----------------
export function petitionChance(st) {
  const p = player(st);
  const tr = p.peerageTrial;
  const info = peerageNext(st);
  if (!info) return 0;
  const meta = TRIAL_RANKS[info.idx];
  const perf = tr?.status === 'done' ? (tr.performance ?? 50) : 0;
  const fameBonus = Math.min(0.10, p.fame / 2000);
  const rankBonus = (p.rank ?? 0) * 0.01;
  const pity = Math.min(0.34, (p.peerageFails ?? 0) * 0.10);
  const bi = biPetitionBonus(st);
  const raw = meta.base + perf * 0.0035 + fameBonus + rankBonus + pity + bi;
  return clamp(raw, meta.floor, 0.95);
}

export function canPetition(st) {
  const p = player(st);
  if (!careerProf(p)) return { ok: false, msg: '商贾不入册命。' };
  const info = peerageNext(st);
  if (!info) return { ok: false, msg: '已至公爵，无可再封。' };
  if (!p.stateId) return { ok: false, msg: '须先出仕立功。' };
  if (p.cityId !== 'luoyi') return { ok: false, msg: '册命须至洛邑，请于周天子。' };
  const tr = p.peerageTrial;
  if (!tr || tr.status !== 'done') return { ok: false, msg: '尚未完成册命之试。' };
  if (p.merit < info.next.merit) return { ok: false, msg: `功勋不足（${p.merit}/${info.next.merit}）。` };
  if (p.fame < info.next.fame) return { ok: false, msg: `名声不足（${p.fame}/${info.next.fame}）。` };
  if (p.money < 300) return { ok: false, msg: '贽礼需金三百。' };
  return { ok: true, next: info.next, idx: info.idx, chance: petitionChance(st) };
}

export function petition(st) {
  const chk = canPetition(st);
  if (!chk.ok) return chk;
  const p = player(st);
  const info = peerageNext(st);
  const chance = petitionChance(st);
  const guaranteed = (p.peerageFails ?? 0) >= 5;
  const win = guaranteed || R.next(st) < chance;
  const variant = trialVariant(p.peerageTrial);
  p.peerageHistory = p.peerageHistory ?? [];
  if (win) {
    addMoney(st, -300);
    // 玄璧助封，成则献出
    if ((p.inventory.bi ?? 0) > 0) { addGoods(st, 'bi', -1); addLog(st, '以玄璧为贽，周室纳之。', 'big'); }
    const fief = p.homeCity ?? p.cityId;
    p.peerage = { rank: info.idx, fief, year: st.time.year };
    p.peerageFails = 0;
    p.peerageTrial = null;
    addFame(st, 8);
    addLog(st, `周天子册命，受封${info.next.name}爵，食邑${CITY_MAP[fief].name}。`, 'big');
    p.peerageHistory.push({ year: st.time.year, rank: info.idx, variant: variant?.id, result: 'granted', performance: chk.chance });
    return {
      ok: true, success: true, peer: info.next, fief, chance,
      msg: `周天子册命：受封${info.next.name}爵，食邑${CITY_MAP[fief].name}，每月食禄${info.next.income}金。`,
    };
  }
  // 失败：贽礼退半、名声小损、诚意累积、换新题
  addMoney(st, -150);
  addFame(st, -2, true);
  p.peerageFails = (p.peerageFails ?? 0) + 1;
  const nextVariant = pickVariant(st, info.idx, variant?.id);
  p.peerageTrial = makeTrial(st, info.idx, nextVariant, { status: 'pending', availableDay: absDay(st.time) + 30 });
  p.peerageHistory.push({ year: st.time.year, rank: info.idx, variant: variant?.id, result: 'denied', performance: chk.chance });
  addLog(st, `请封${info.next.name}爵未准，周室命另试其事。`, 'war');
  return {
    ok: true, success: false, chance, nextVariant,
    msg: `周室议而未决：「${nextVariant.title}」——先成此事，再来请封。`,
  };
}

// 给 UI 用的汇总
export function peerageSummary(st) {
  const p = player(st);
  const info = peerageNext(st);
  const tr = p.peerageTrial;
  const variant = trialVariant(tr);
  const now = absDay(st.time);
  const cd = tr && tr.status === 'pending' ? Math.max(0, (tr.availableDay ?? 0) - now) : 0;
  return {
    current: p.peerage ? PEERAGES[p.peerage.rank] : null,
    next: info?.next ?? null,
    idx: info?.idx ?? null,
    trial: tr,
    variant,
    trialTarget: variant ? (variant.targetCity ?? 'luoyi') : null,
    cooldown: cd,
    fails: p.peerageFails ?? 0,
    chance: petitionChance(st),
    guarantee: (p.peerageFails ?? 0) >= 5,
  };
}

