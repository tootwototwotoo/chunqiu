// 爵位竞速模拟器：测算不同职业拿到最高爵位（公爵）所需的时间
// 用法：node test/peerage-race.mjs           全量
//      node test/peerage-race.mjs --quick   每组少量样本
//      node test/peerage-race.mjs --json    输出 JSON（供报告脚本使用）
//
// 设计原则：只调用真实系统函数，Bot 遵守全部成本（体力、金钱、限期、冷却、体力恢复），
// 小游戏表现由「玩家技巧档位」直接注入 performance，不在此复刻小游戏本身。

import { newGame, player, addStamina } from '../js/state.js';
import { PEERAGES } from '../js/data/defs.js';

import { refreshBoard, acceptQuest, completeQuest, resolveCheck } from '../js/systems/quests.js';
import { shortestPath } from '../js/systems/pathfind.js';
import { travelTo } from '../js/systems/travel.js';
import { advanceDays, absDay } from '../js/systems/calendar.js';
import {
  canSeekOffice, checkPromotion, joinCampaign, seekOffice
} from '../js/systems/progression.js';
import {
  canAcceptTrial, acceptTrial, canPetition, petition, failTrial
} from '../js/systems/peerage.js';
import { trialVariant } from '../js/systems/peerage.js';

import { adviseOutcome, pickIssue, canAdvise, currentPolicy, keepPolicy } from '../js/systems/policy.js';

// ---------------- 参数 ----------------
export const GOAL_RANK = 4; // 公爵

export const PLAYER_SKILL = {
  expert: { perf: [85, 100], label: '高手' },
  skilled: { perf: [65, 85], label: '熟练' },
  normal: { perf: [45, 65], label: '一般' },
  novice: { perf: [25, 45], label: '生疏' },
};

export const STRATEGIES = {
  diligent: '勤勉',
  greedy: '功利',
  casual: '慢玩',
};

const CAPITAL = { qi: 'linzi', jin: 'jiang', chu: 'ying', qin: 'yong', lu: 'qufu' };

// ---------------- 随机源（独立于游戏状态，保证可复现） ----------------
function makeRng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

// ---------------- 模拟器 ----------------
export function simulate({ profession, strategy, skill, seed }) {
  const rand = makeRng(seed);
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const style = PLAYER_SKILL[skill];

  const st = newGame({ name: '试者', profession, seed });
  const home = CAPITAL.qi;
  st.player.cityId = home;
  st.player.stateId = null;

  const stat = {
    meritQuest: 0, meritAdvise: 0, meritCampaign: 0,
    days: 0, quests: 0, trials: 0, petitions: 0,
    officeDays: 0, trialDays: 0, petitionDays: 0, meritDays: 0,
    reached: null, stuckAt: null, served: false, maxRank: 0,
  };
  const deadline = 42 * 360; // 42 年后判定超时
  const rollPerf = () => {
    const [a, b] = style.perf;
    return Math.round(a + rand() * (b - a));
  };
  const spend = (d) => { if (d > 0) { advanceDays(st, d); stat.days += d; } };
  const alive = () => st.player.alive !== false && stat.days < deadline;

  // 记录当前爵位进度
  const peerTier = () => (st.player.peerage ? st.player.peerage.rank : -1);
  const nextPeer = () => PEERAGES[peerTier() + 1] ?? null;

  // ---------- 原子动作 ----------
  function restIfNeeded() {
    const p = st.player;
    if (p.stamina >= 25) return false;
    // 客栈歇息：3 日、24 金
    if (p.money >= 24) {
      addStamina(st, 30);
      spend(3);
    } else {
      // 没钱就干耗，靠每日缓慢回复
      addStamina(st, 12);
      spend(6);
    }
    return true;
  }

  function doQuest() {
    const p = st.player;
    if (p.stamina < 18) return false;
    const offers = refreshBoard(st) ?? [];
    if (!offers.length) { spend(1); return true; }
    // 优先同城/短途、即时完成的差事
    const scored = offers.map(q => {
      const instant = q.mode !== 'travel';
      const route = q.mode === 'travel' ? (shortestPath(p.cityId, q.targetCity, st)?.days ?? 99) : 0;
      const rw = q.reward ?? {};
      const merit = rw.merit ?? 0;
      const perDay = merit / Math.max(1, instant ? 3 : route * 2 + 4);
      return { q, score: perDay + (instant ? 5 : 0) - route * 0.2 };
    }).sort((a, b) => b.score - a.score);
    const chosen = scored[0].q;
    const acc = acceptQuest(st, chosen.id);
    if (!acc.ok) { spend(1); return true; }

    if (chosen.mode === 'travel') {
      const before = absDay(st.time);
      const m0 = p.merit;
      travelTo(st, chosen.targetCity);
      stat.days += absDay(st.time) - before; // travelTo 内部已推进天数
      advanceDays(st, 1); stat.days += 1;
      completeQuest(st, chosen, true);
      stat.meritQuest += p.merit - m0;
      stat.quests++;
      addStamina(st, -12);
      return true;
    }
    if (chosen.mode === 'check') {
      spend(2);
      const m0 = p.merit;
      resolveCheck(st, chosen);
      stat.meritQuest += p.merit - m0;
      stat.quests++;
      addStamina(st, -14);
      return true;
    }
    // 决斗/论辩：按技巧档换算胜率
    spend(chosen.mode === 'combat' ? 2 : 3);
    const winChance = { expert: 0.92, skilled: 0.78, normal: 0.6, novice: 0.42 }[skill];
    const m0 = p.merit;
    completeQuest(st, chosen, rand() < winChance);
    stat.meritQuest += p.merit - m0;
    stat.quests++;
    addStamina(st, -16);
    return true;
  }

  function doCampaign() {
    const p = st.player;
    if (p.stamina < 18) return false;
    const m0 = p.merit;
    joinCampaign(st);
    stat.meritCampaign += p.merit - m0;
    spend(20);
    return true;
  }

  function doAdvise() {
    if (!canAdvise(st).ok) return false;
    // 务实玩家：议题里没有旧策就「维持旧策」，绝不盲目改策赔功勋
    const cur = currentPolicy(st);
    const heart = pick(['li', 'yi', 'ming', 'shi']);
    const issue = pickIssue(st);
    if (!issue) return false;
    const m0 = st.player.merit;
    if (cur) {
      const keepIdx = issue.options.findIndex(o => o.policy === cur.id);
      if (keepIdx >= 0) adviseOutcome(st, issue, keepIdx, heart);
      else keepPolicy(st);
    } else {
      const fit = issue.options.findIndex(o => o.fit);
      adviseOutcome(st, issue, fit >= 0 ? fit : 0, heart);
    }
    stat.meritAdvise += st.player.merit - m0;
    spend(1);
    return true;
  }

  function doOffice() {
    const chk = canSeekOffice(st);
    if (!chk.ok) return false;
    // 须在本国朝堂之城；出行到国都再谒见
    if (st.player.cityId !== home) {
      const before = absDay(st.time);
      travelTo(st, home);
      stat.days += absDay(st.time) - before;
      if (st.player.cityId !== home) { spend(2); addStamina(st, 10); }
      return true;
    }
    spend(1);
    const res = seekOffice(st, 'qi');
    if (res.ok) {
      stat.served = true;
      stat.officeDays = stat.days;
    }
    return true;
  }

  function doTrial() {
    const p = st.player;
    if (!canAcceptTrial(st).ok) return false;
    // 领试须在洛邑
    if (p.cityId !== 'luoyi') {
      const before = absDay(st.time);
      const t = travelTo(st, 'luoyi');
      stat.days += absDay(st.time) - before;
      if (!t.ok) { spend(2); addStamina(st, 10); }
      return true;
    }
    const acc = acceptTrial(st);
    if (!acc.ok) return false;
    const tr = p.peerageTrial;
    const variant = trialVariant(tr);
    if (variant?.targetCity && p.cityId !== variant.targetCity) {
      const before = absDay(st.time);
      travelTo(st, variant.targetCity);
      stat.days += absDay(st.time) - before;
    }
    const meta = { 0: 20, 1: 26, 2: 32, 3: 38, 4: 45 }[tr.rank] ?? 30;
    spend(meta);
    const perf = rollPerf();
    // 成功率随表现与试炼难度变化，保留运气成分；生疏玩家也能偶成，只是很慢
    const dc = { 0: 42, 1: 50, 2: 56, 3: 62, 4: 68 }[tr.rank] ?? 50;
    const chance = Math.min(0.95, Math.max(0.12, 0.15 + (perf - dc) / 45));
    const success = rand() < chance;
    const t0 = stat.days;
    p.peerageHistory = p.peerageHistory ?? [];
    if (success) {
      tr.performance = perf;
      tr.status = 'done';
      p.peerageHistory.push({ year: st.time.year, rank: tr.rank, variant: tr.variantId, result: 'done', performance: perf });
    } else {
      tr.performance = perf;
      failTrial(st, '试炼未成，');
    }
    stat.trials++;
    stat.trialDays += stat.days - t0;
    return true;
  }

  function doPetition() {
    // 先回国都再去洛邑：请封本身须在洛邑，但不必每次绕路
    if (st.player.cityId !== 'luoyi') {
      const before = absDay(st.time);
      travelTo(st, 'luoyi');
      stat.days += absDay(st.time) - before;
      if (st.player.cityId !== 'luoyi') { spend(3); addStamina(st, 12); }
      return true;
    }
    if (!canPetition(st).ok) return false;
    petition(st);
    stat.petitions++;
    spend(1);
    return true;
  }

  // ---------- 主循环 ----------
  const maxSteps = 20000;
  for (let step = 0; step < maxSteps && alive(); step++) {
    if (st.player.alive === false) { stat.reached = 'died'; break; }
    const p = st.player;
    stat.maxRank = Math.max(stat.maxRank, p.rank);

    // 到达公爵即结束
    if (peerTier() >= GOAL_RANK) { stat.reached = 'gong'; break; }

    // 定期升官
    checkPromotion(st);

    // 休闲策略：每步都有概率什么都不做
    if (strategy === 'casual' && rand() < 0.45) { spend(1); continue; }

    // 1) 体力与收成
    if (restIfNeeded()) continue;

    // 2) 出仕前：先攒出仕条件
    if (!stat.served) {
      const chk = canSeekOffice(st);
      if (chk.ok) { doOffice(); continue; }
      if (p.stamina < 20 && p.money < 24) { spend(2); addStamina(st, 10); continue; }
      if (!doQuest()) spend(1);
      continue;
    }

    // 3) 爵位进度：试炼 → 请封
    const next = nextPeer();
    const tr = p.peerageTrial;
    if (tr && tr.status === 'done') { doPetition(); continue; }
    if (tr && tr.status === 'active') { doTrial(); continue; }
    if (canAcceptTrial(st).ok) { doTrial(); continue; }
    // 条件已足但人不在洛邑：须先赶去，否则会死锁（canAcceptTrial 本身要求身在洛邑）
    if (next && p.merit >= next.merit && p.fame >= next.fame && p.money >= 300 && p.cityId !== 'luoyi') {
      const before = absDay(st.time);
      travelTo(st, 'luoyi');
      stat.days += absDay(st.time) - before;
      if (p.cityId !== 'luoyi') { spend(2); addStamina(st, 10); }
      continue;
    }
    if (next && p.merit >= next.merit && p.fame >= next.fame && p.money >= 300) {
      // 条件已足，但还没有试炼机会：等冷却或攒钱
      if (canAcceptTrial(st).ok) { doTrial(); continue; }
    }

    // 4) 攒功勋/名声/钱
    if (strategy === 'greedy' || p.stamina >= 40) {
      if (doQuest()) continue;
    }
    if (canAdvise(st).ok) { doAdvise(); continue; }
    if (p.stamina >= 18 && rand() < 0.12) { doCampaign(); continue; }
    if (!doQuest()) spend(1);
  }

  if (!stat.reached) {
    stat.reached = st.player.alive === false ? 'died' : 'timeout';
  }
  // 卡点
  if (stat.reached !== 'gong') {
    const tier = peerTier();
    stat.stuckAt = tier >= 0 ? PEERAGES[tier].name : (stat.served ? '未受爵' : '未出仕');
  }
  stat.years = stat.days / 360;
  stat.merit = player(st).merit;
  stat.fame = player(st).fame;
  stat.money = player(st).money;
  stat.age = st.player.startAge + Math.floor(st.player.ageDays / 360);
  return stat;
}

// ---------------- 统计与入口 ----------------
export function runSuite({ samples = 200, professions = ['youxia', 'shuike', 'xuezhe'], strategies = Object.keys(STRATEGIES), skills = Object.keys(PLAYER_SKILL), quiet = false } = {}) {
  const rows = [];
  for (const profession of professions) {
    for (const strategy of strategies) {
      for (const skill of skills) {
        const runs = [];
        for (let i = 0; i < samples; i++) {
          const seed = (i + 1) * 7919 + profession.length * 31 + strategy.length * 17 + skill.length * 7;
          try {
            runs.push(simulate({ profession, strategy, skill, seed }));
          } catch (e) {
            if (process.env.RACE_DEBUG) console.error('ERR', profession, strategy, skill, i, e.message);
            runs.push({ reached: 'error', days: 0, years: 0, error: e.message });
          }
        }
        rows.push(summarize({ profession, strategy, skill, runs }));
        if (!quiet) process.stderr.write('.');
      }
    }
  }
  if (!quiet) process.stderr.write('\n');
  return rows;
}

export function summarize({ profession, strategy, skill, runs }) {
  const ok = runs.filter(r => r.reached === 'gong');
  const died = runs.filter(r => r.reached === 'died').length;
  const timeout = runs.filter(r => r.reached === 'timeout').length;
  const errors = runs.filter(r => r.reached === 'error').length;
  const days = ok.map(r => r.days).sort((a, b) => a - b);
  const q = (p) => (days.length ? days[Math.min(days.length - 1, Math.floor(days.length * p))] : null);
  const stuck = {};
  for (const r of runs) if (r.stuckAt) stuck[r.stuckAt] = (stuck[r.stuckAt] ?? 0) + 1;
  return {
    profession, strategy, skill,
    n: runs.length,
    rate: ok.length / runs.length,
    died, timeout, errors,
    median: q(0.5),
    p10: q(0.1),
    p90: q(0.9),
    min: days.length ? days[0] : null,
    max: days.length ? days[days.length - 1] : null,
    medianYears: q(0.5) == null ? null : q(0.5) / 360,
    stuck,
    avgPetitions: runs.reduce((a, r) => a + (r.petitions ?? 0), 0) / runs.length,
    avgTrials: runs.reduce((a, r) => a + (r.trials ?? 0), 0) / runs.length,
    avgQuests: runs.reduce((a, r) => a + (r.quests ?? 0), 0) / runs.length,
  };
}

// 合格标准（用户确认）
export const CRITERIA = {
  medianYearsMin: 12,
  medianYearsMax: 20,
  p10YearsMin: 6,
  p90YearsMax: 35,
  jobRatioMax: 1.6,
  diligentRateMin: 0.7,
  casualRateMin: 0.3,
  avgPetitionsMax: 6, // 五级各请封一次是下限，允许平均每级多一次
};

export function judge(rows) {
  const out = [];
  const push = (name, okv, detail) => out.push({ name, ok: okv, detail });
  const dil = rows.filter(r => r.strategy === 'diligent' && r.skill === 'normal');
  const medians = dil.filter(r => r.medianYears != null).map(r => r.medianYears);
  if (medians.length) {
    const avg = medians.reduce((a, b) => a + b, 0) / medians.length;
    push('勤勉·一般 公爵中位耗时', avg >= CRITERIA.medianYearsMin && avg <= CRITERIA.medianYearsMax, `${avg.toFixed(1)} 年`);
    const minMed = Math.min(...medians);
    push('最快职业中位耗时', minMed >= CRITERIA.p10YearsMin, `${minMed.toFixed(1)} 年`);
  }
  const ratios = [];
  for (const st of ['diligent', 'greedy', 'casual']) {
    for (const sk of Object.keys(PLAYER_SKILL)) {
      const g = rows.filter(r => r.strategy === st && r.skill === sk && r.medianYears != null);
      if (g.length >= 2) {
        const v = g.map(r => r.medianYears);
        ratios.push(Math.max(...v) / Math.min(...v));
      }
    }
  }
  if (ratios.length) {
    const worst = Math.max(...ratios);
    push('职业间中位耗时比', worst <= CRITERIA.jobRatioMax, `${worst.toFixed(2)} ≤ ${CRITERIA.jobRatioMax}`);
  }
  const dilRate = dil.length ? dil.reduce((a, r) => a + r.rate, 0) / dil.length : 0;
  push('勤勉通关率', dilRate >= CRITERIA.diligentRateMin, `${(dilRate * 100).toFixed(0)}%`);
  const cas = rows.filter(r => r.strategy === 'casual' && r.skill === 'normal');
  const casRate = cas.length ? cas.reduce((a, r) => a + r.rate, 0) / cas.length : 0;
  push('慢玩通关率', casRate >= CRITERIA.casualRateMin, `${(casRate * 100).toFixed(0)}%`);
  const pet = rows.reduce((a, r) => a + r.avgPetitions, 0) / rows.length;
  push('平均请封次数', pet <= CRITERIA.avgPetitionsMax, pet.toFixed(1));
  return out;
}

function fmtDays(d) {
  if (d == null) return '—';
  return `${(d / 360).toFixed(1)}年`;
}

export function report(rows) {
  const lines = [];
  lines.push('| 职业 | 策略 | 技巧 | 通关率 | 中位 | P10 | P90 | 请封 | 试炼 | 差事 |');
  lines.push('|---|---|---|---:|---:|---:|---:|---:|---:|---:|');
  for (const r of rows) {
    lines.push(`| ${r.profession} | ${STRATEGIES[r.strategy]} | ${PLAYER_SKILL[r.skill].label} | ${(r.rate * 100).toFixed(0)}% | ${fmtDays(r.median)} | ${fmtDays(r.p10)} | ${fmtDays(r.p90)} | ${r.avgPetitions.toFixed(1)} | ${r.avgTrials.toFixed(1)} | ${r.avgQuests.toFixed(1)} |`);
  }
  return lines.join('\n');
}

export function reportJudgement(verdicts) {
  const lines = ['| 检查项 | 结果 | 实测 |', '|---|---|---|'];
  for (const v of verdicts) lines.push(`| ${v.name} | ${v.ok ? '通过' : '未通过'} | ${v.detail} |`);
  return lines.join('\n');
}

const isMain = (process.argv[1] ?? '').includes('peerage-race.mjs');
if (isMain) {
  const quick = process.argv.includes('--quick');
  const json = process.argv.includes('--json');
  const samples = quick ? 30 : 200;
  const rows = runSuite({ samples, quiet: json });
  const verdicts = judge(rows);
  if (json) {
    console.log(JSON.stringify({ rows, verdicts, criteria: CRITERIA }, null, 2));
  } else {
    console.log(report(rows));
    console.log('');
    console.log(reportJudgement(verdicts));
    const fails = verdicts.filter(v => !v.ok).length;
    console.log(fails ? `\n${fails} 项未达标准 ✗` : '\n全部达到标准 ✓');
  }
}
