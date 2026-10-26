// 商人竞速模拟器：测算不同策略下的商人阶次进度
// 用法：node test/merchant-race.mjs          全量
//      node test/merchant-race.mjs --quick  每组少量样本
//      node test/merchant-race.mjs --json   输出 JSON
//
// 设计原则同 peerage-race：只调用真实系统函数，Bot 遵守全部成本
// （体力、金钱、限期、运力、商盟月缴）。

import { newGame } from '../js/state.js';
import { MERCHANT_RANKS, TOP_RANK } from '../js/data/merchant.js';
import { CITIES } from '../js/data/world.js';
import { GOODS, PLAIN_GOODS } from '../js/data/goods.js';
import {
  rankIndexOf, merchantRank, nextMerchantRank,
  normShops, shopAt, openShop, canOpenShop, upgradeShop, canUpgradeShop,
  hireClerk, canHire,
  canGetPermit, getPermit, hasPermit,
  giveAway, canGive, trackPeakMoney,
} from '../js/systems/merchant.js';
import { signPact, canSignPact, pactList, hasPact } from '../js/systems/pact.js';
import { startHaul, arriveHauls, canBuyVehicle, buyVehicle, isInstantTrade, minTradeQty } from '../js/systems/haul.js';
import { buy, sell, priceAt, levyOf } from '../js/systems/trade.js';
import { travelTo, travelPlan } from '../js/systems/travel.js';
import { advanceDays } from '../js/systems/calendar.js';

export const GOAL_RANK = TOP_RANK;

export const STRATEGIES = {
  trade: '跑商',
  shops: '建号',
  mixed: '混合',
};

const CAPITAL = { qi: 'linzi' };

// ---------- 单局 ----------
export function simulate({ strategy, seed }) {
  const st = newGame({ name: '商', profession: 'shangren', seed });
  const p = st.player;
  const home = CAPITAL.qi;
  p.cityId = home;

  const stat = {
    days: 0, trips: 0, shops: 0, pacts: 0, parleys: 0, givenAway: 0,
    peak: p.money, reached: null, stuckAt: null, maxRank: 0, vehicle: 'foot',
  };
  const deadline = 42 * 360;
  const spend = (d) => { if (d > 0) { advanceDays(st, d); stat.days += d; } };
  const alive = () => st.player.alive !== false && stat.days < deadline;
  const rankNow = () => rankIndexOf(st);

  // ---------- 动作 ----------
  // 找最优单程：本城买、他城卖
  function bestTrip() {
    let best = null;
    const cap = p.caravan ?? 24;
    const minQ = isInstantTrade(st) ? 1 : minTradeQty(st);
    for (const g of PLAIN_GOODS) {
      const bulk = GOODS[g].bulk ?? 1;
      const here = priceAt(st, p.cityId, g);
      if (here <= 0) continue;
      let qty = Math.min(Math.floor(cap / bulk), Math.floor(Math.max(0, p.money - 300) / here));
      if (qty < minQ) continue;
      if (!isInstantTrade(st)) qty = Math.max(minQ, qty);
      for (const c of CITIES) {
        if (c.id === p.cityId) continue;
        const plan = travelPlan(st, c.id);
        if (!plan) continue;
        const there = priceAt(st, c.id, g);
        const unit = there * levyOf(st, c.id) - here;
        if (unit <= 0) continue;
        const gross = unit * qty - plan.cost;
        const perDay = gross / (plan.days + (isInstantTrade(st) ? 0 : 2));
        if (!best || perDay > best.perDay) best = { g, qty, to: c.id, perDay, gross, days: plan.days, unitPrice: here };
      }
    }
    return best;
  }

  function doTrip() {
    const t = bestTrip();
    if (!t || t.gross <= 0) return false;
    if (p.stamina < 22) { spend(4); return false; }
    if (isInstantTrade(st)) {
      if (!buy(st, t.g, t.qty).ok) return false;
      if (!travelTo(st, t.to).ok) return false;
      sell(st, t.g, t.qty);
    } else {
      const h = startHaul(st, t.g, t.qty, t.to, t.unitPrice);
      if (!h.ok) return false;
      advanceDays(st, h.days);
      stat.days += h.days;
      if (!travelTo(st, t.to).ok) return false;
      arriveHauls(st, t.to);
      sell(st, t.g, t.qty);
    }
    stat.trips++;
    stat.peak = Math.max(stat.peak, p.money);
    return true;
  }

  // 领籍并开号（只在本城操作）
  function tryPermitAndShop() {
    if (shopAt(st, p.cityId)) return false;
    if (!hasPermit(st, p.cityId)) {
      if (canGetPermit(st, p.cityId).ok) {
        const r = getPermit(st, p.cityId);
        spend(3);
        return r.ok;
      }
      return false;
    }
    if (canOpenShop(st, p.cityId).ok) {
      openShop(st, p.cityId);
      stat.shops = normShops(st).length;
      return true;
    }
    return false;
  }

  function doUpgrade() {
    for (const shop of normShops(st)) {
      const up = canUpgradeShop(st, shop.city);
      if (up.ok && p.money - up.cost >= 5000) { upgradeShop(st, shop.city); return true; }
    }
    for (const shop of normShops(st)) {
      if (canHire(st, shop.city).ok && p.money >= 5000) { hireClerk(st, shop.city); return true; }
    }
    return false;
  }

  function doVehicle() {
    for (const id of ['cart', 'oxcart', 'wain', 'boat']) {
      const chk = canBuyVehicle(st, id);
      if (chk.ok && p.money - chk.cost >= 1500) { buyVehicle(st, id); stat.vehicle = id; return true; }
    }
    return false;
  }

  function doPact() {
    const stateId = st.world.owner[p.cityId];
    const chk = canSignPact(st, stateId);
    if (!chk.ok) return false;
    const r = signPact(st, stateId);
    if (r.ok) { stat.pacts = pactList(st).length; return true; }
    return false;
  }

  function doGive() {
    for (const kind of ['relief', 'army', 'road']) {
      if (canGive(st, kind, p.cityId).ok) {
        const r = giveAway(st, kind, p.cityId);
        if (r.ok) { stat.givenAway = p.givenAway ?? 0; return true; }
      }
    }
    return false;
  }

  stat.shops = normShops(st).length;

  // ---------- 主循环：每步只做一件事 ----------
  let steps = 0;
  while (steps++ < 20000 && alive()) {
    if (st.player.alive === false) { stat.reached = 'died'; break; }
    trackPeakMoney(st);
    stat.maxRank = Math.max(stat.maxRank, rankNow());
    if (rankNow() >= GOAL_RANK) { stat.reached = 'taozhu'; break; }
    if (p.stamina < 22) { spend(4); continue; }

    // 陶朱公两道门槛：先攒够峰值金钱，再散财
    if (rankNow() === TOP_RANK - 1) {
      const needPeak = MERCHANT_RANKS[TOP_RANK].peak;
      const needGiven = MERCHANT_RANKS[TOP_RANK].given;
      const peakOk = Math.max(p.money, p.peakMoney ?? 0) >= needPeak;
      const givenOk = (p.givenAway ?? 0) >= needGiven;
      if (!peakOk) {
        // 先攒钱，别急着散
        if (doTrip()) continue;
        spend(2);
        continue;
      }
      if (!givenOk && doGive()) continue;
    }

    // 阶次要求的商号数，任何路线都必须满足
    const needShops = nextMerchantRank(st)?.shops ?? 0;
    if (normShops(st).length < needShops) {
      if (p.money > 2500 && tryPermitAndShop()) continue;
      if (doTrip()) continue;
      spend(2);
      continue;
    }

    // 策略差异：建号路线在富余时多铺号，跑商路线只升工具
    if (strategy === 'shops' && p.money > 50000 && tryPermitAndShop()) continue;
    if (strategy === 'mixed' && p.money > 80000 && tryPermitAndShop()) continue;

    // 商盟之主：须有一盟（须在该国朝堂之城）
    if (rankNow() >= 3 && pactList(st).length === 0) {
      if (doPact()) continue;
      // 找一个可达的朝堂之城去请盟
      const courtCity = CITIES.find(c => c.tags.includes('court') && !hasPact(st, st.world.owner[c.id]));
      if (courtCity && p.cityId !== courtCity.id) {
        const tr = travelTo(st, courtCity.id);
        if (tr.ok) { stat.days += tr.days; continue; }
      }
    }

    // 钱到了当前阶次的现金门槛就不该再乱花，先升阶
    const nextMoney = nextMerchantRank(st)?.money ?? 0;
    // 已达当前阶次门槛、只差最后一阶时，先去把商盟办了
    const needPact = (nextMerchantRank(st)?.pacts ?? 0) > pactList(st).length;
    const shortOfNext = p.money < nextMoney && !(needPact && p.money > nextMoney * 0.9);
    if (shortOfNext) {
      if (doTrip()) continue;
      spend(2);
      continue;
    }

    // 满足阶次门槛后，先升运输工具（商人的主要杠杆）
    if (doVehicle()) continue;

    // 策略差异：扩张的积极程度
    if (strategy === 'shops') {
      if (p.money > 30000 && doUpgrade()) continue;
      if (p.money > 20000 && doVehicle()) continue;
      if (p.money > 20000 && tryPermitAndShop()) continue;
    } else if (strategy === 'mixed') {
      if (p.money > 20000 && doVehicle()) continue;
      if (p.money > 30000 && doUpgrade()) continue;
    } else {
      if (p.money > 12000 && doVehicle()) continue;
    }

    if (doTrip()) continue;
    spend(2);
  }

  if (!stat.reached) stat.reached = st.player.alive === false ? 'died' : 'timeout';
  if (stat.reached !== 'taozhu') {
    stat.stuckAt = MERCHANT_RANKS[rankNow()]?.name ?? '?';
  }
  stat.years = stat.days / 360;
  stat.money = Math.round(p.money);
  stat.finalRank = merchantRank(st).name;
  stat.rankIdx = rankNow();
  stat.givenAway = Math.round(p.givenAway ?? 0);
  stat.peak = Math.round(Math.max(stat.peak, p.peakMoney ?? 0));
  stat.shops = normShops(st).length;
  stat.pacts = pactList(st).length;
  stat.age = st.player.startAge + Math.floor(st.player.ageDays / 360);
  return stat;
}

// ---------- 统计 ----------
export function summarize({ strategy, runs }) {
  const ok = runs.filter(r => r.reached === 'taozhu');
  const days = ok.map(r => r.days).sort((a, b) => a - b);
  const q = (p) => (days.length ? days[Math.min(days.length - 1, Math.floor(days.length * p))] : null);
  return {
    strategy, n: runs.length,
    rate: ok.length / runs.length,
    died: runs.filter(r => r.reached === 'died').length,
    timeout: runs.filter(r => r.reached === 'timeout').length,
    median: q(0.5), p10: q(0.1), p90: q(0.9),
    medianYears: q(0.5) == null ? null : q(0.5) / 360,
    avgTrips: runs.reduce((a, r) => a + r.trips, 0) / runs.length,
    avgShops: runs.reduce((a, r) => a + r.shops, 0) / runs.length,
    avgPacts: runs.reduce((a, r) => a + r.pacts, 0) / runs.length,
    avgMoney: runs.reduce((a, r) => a + r.money, 0) / runs.length,
  };
}

export function runSuite({ samples = 60, strategies = Object.keys(STRATEGIES), quiet = false } = {}) {
  const rows = [];
  for (const strategy of strategies) {
    const runs = [];
    for (let i = 0; i < samples; i++) {
      const seed = (i + 1) * 7919 + strategy.length * 137;
      try {
        runs.push(simulate({ strategy, seed }));
      } catch (e) {
        if (process.env.RACE_DEBUG) console.error('ERR', strategy, i, e.message);
        runs.push({ reached: 'error', days: 0, trips: 0, shops: 0, pacts: 0, money: 0, error: e.message });
      }
    }
    rows.push(summarize({ strategy, runs }));
    if (!quiet) process.stderr.write('.');
  }
  if (!quiet) process.stderr.write('\n');
  return rows;
}

// 合格标准
export const CRITERIA = {
  medianYearsMin: 18,
  medianYearsMax: 26,
  p10YearsMin: 10,
  rateMin: 0.7,
  strategyRatioMax: 1.5,
};

export function judge(rows) {
  const out = [];
  const push = (n, okv, d) => out.push({ name: n, ok: okv, detail: d });

  const medians = rows.filter(r => r.medianYears != null).map(r => r.medianYears);
  if (medians.length) {
    const avg = medians.reduce((a, b) => a + b, 0) / medians.length;
    push('陶朱公中位耗时', avg >= CRITERIA.medianYearsMin && avg <= CRITERIA.medianYearsMax, `${avg.toFixed(1)} 年`);
    push('最快路线中位耗时', Math.min(...medians) >= CRITERIA.p10YearsMin, `${Math.min(...medians).toFixed(1)} 年`);
  }
  const rates = rows.map(r => r.rate);
  if (rates.length) {
    const worst = Math.min(...rates);
    push('各策略通关率下限', worst >= CRITERIA.rateMin, `${(worst * 100).toFixed(0)}%`);
  }
  if (medians.length >= 2) {
    const ratio = Math.max(...medians) / Math.min(...medians);
    push('策略间耗时比', ratio <= CRITERIA.strategyRatioMax, `${ratio.toFixed(2)} ≤ ${CRITERIA.strategyRatioMax}`);
  }
  return out;
}

function fmtYears(d) { return d == null ? '—' : `${(d / 360).toFixed(1)}年`; }

export function report(rows) {
  const lines = ['| 策略 | 通关率 | 中位 | P10 | P90 | 跑商次数 | 商号 | 商盟 | 终局金 |',
    '|---|---:|---:|---:|---:|---:|---:|---:|---:|'];
  for (const r of rows) {
    lines.push(`| ${STRATEGIES[r.strategy]} | ${(r.rate * 100).toFixed(0)}% | ${fmtYears(r.median)} | ${fmtYears(r.p10)} | ${fmtYears(r.p90)} | ${r.avgTrips.toFixed(0)} | ${r.avgShops.toFixed(1)} | ${r.avgPacts.toFixed(1)} | ${Math.round(r.avgMoney)} |`);
  }
  return lines.join('\n');
}

export function reportJudgement(vs) {
  const lines = ['| 检查项 | 结果 | 实测 |', '|---|---|---|'];
  for (const v of vs) lines.push(`| ${v.name} | ${v.ok ? '通过' : '未通过'} | ${v.detail} |`);
  return lines.join('\n');
}

const isMain = (process.argv[1] ?? '').includes('merchant-race.mjs');
if (isMain) {
  const quick = process.argv.includes('--quick');
  const json = process.argv.includes('--json');
  const samples = quick ? 8 : 60;
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
