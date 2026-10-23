// 时间推进、月份结算、年龄与死亡
import { START_YEAR, player, addLog, addMoney, addHealth, addStamina, initPrices, priceSet, basePriceOf,
  careerTitle, age, rankName, R, aliveNpcs, npcDef, rel, saveGame, AUTO_SAVE_KEY, AUTO_SAVE_ERROR } from '../state.js';
import { RANKS, PEERAGES } from '../data/defs.js';
import { CITIES, CITY_MAP, STATES } from '../data/world.js';
import { GOODS } from '../data/goods.js';
import { NPC_MAP, npcAlive } from '../data/npcs.js';
import { collectTimeline, rollRandomEvent } from './events.js';
import { expireQuests } from './quests.js';
import { checkPromotion } from './progression.js';
import { checkTrialExpiry } from './peerage.js';
import { tickPolicy } from './policy.js';
import { yearLabel, monthLabel, clamp, ri } from '../util.js';

export const DAYS_PER_MONTH = 30;
export const MONTHS_PER_YEAR = 12;
export const DAYS_PER_YEAR = DAYS_PER_MONTH * MONTHS_PER_YEAR;

export function absDay(t) { return (t.year - START_YEAR) * DAYS_PER_YEAR + (t.month - 1) * DAYS_PER_MONTH + (t.day - 1); }
export function dateLabel(t) { return `${yearLabel(t.year)} ${monthLabel(t.month)}`; }
export function seasonOf(t) { return ['春', '夏', '秋', '冬'][Math.floor((t.month - 1) / 3)]; }
export function dayInYear(t) { return (t.month - 1) * DAYS_PER_MONTH + t.day; }

/**
 * 推进若干天。
 * @returns {{notes:string[], events:object[], promotions:object[], died:boolean}}
 */
export function advanceDays(st, days, opts = {}) {
  const out = { notes: [], events: [], promotions: [], died: false };
  if (st.player.alive) out.events.push(...collectTimeline(st));
  for (let i = 0; i < days; i++) {
    if (!st.player.alive) break;
    stepDay(st, out, opts);
    if (opts.stopOnEvent && out.events.length) break;
  }
  if (st.player.health <= 0 && st.player.alive) {
    st.player.alive = false;
    out.died = true;
    addLog(st, '你油尽灯枯，溘然长逝。', 'war');
  }
  return out;
}

function stepDay(st, out, opts) {
  const t = st.time;
  t.day += 1;
  st.player.ageDays += 1;
  if (t.day > DAYS_PER_MONTH) {
    t.day = 1; t.month += 1;
    if (t.month > MONTHS_PER_YEAR) { t.month = 1; t.year += 1; onYear(st, out); }
    onMonth(st, out);
  }
  // 在城中缓行则体力自复；体力耗尽则伤身
  if (!opts.travel) addStamina(st, 1);
  if (st.player.stamina <= 0 && st.player.ageDays % 3 === 0) {
    addHealth(st, -1);
    if (st.player.ageDays % 30 === 0) out.notes.push('你体力透支，身体日渐虚弱。');
  }
  // 衰老
  if (age(st) >= 60 && st.player.ageDays % 90 === 0) {
    const risk = (age(st) - 58) / 900;
    if (R.chance(st, risk)) {
      st.player.alive = false;
      out.died = true;
      addLog(st, `${st.player.name}寿终正寝，享年${age(st)}。`, 'war');
    } else if (R.chance(st, 0.3)) {
      addHealth(st, -1);
    }
  }
}

function onMonth(st, out) {
  // 物价波动
  driftPrices(st);
  // 俸禄与被动收入
  monthIncome(st, out);
  // NPC 生死
  syncNpcs(st, out);
  // 差事过期
  const exp = expireQuests(st);
  for (const q of exp) out.notes.push(`差事「${q.title}」逾期未成，信誉受损。`);
  // 国策月度结算
  tickPolicy(st, out);
  // 册命试炼逾期
  const failedTrial = checkTrialExpiry(st);
  if (failedTrial) out.notes.push(`册命之试逾期，另命「${failedTrial.title}」。`);
  // 历史事件
  for (const ev of collectTimeline(st)) out.events.push(ev);
  // 随机事件
  if (R.chance(st, 0.4)) {
    const ev = rollRandomEvent(st);
    if (ev) out.events.push(ev);
  }
  // 晋升
  const promo = checkPromotion(st);
  if (promo) out.promotions.push(promo);
  // 自动存档
  if (!st.flags.noAutosave) {
    if (!saveGame(st, AUTO_SAVE_KEY) && !out.notes.includes(AUTO_SAVE_ERROR)) {
      out.notes.unshift(AUTO_SAVE_ERROR); // 确保长行动中也能看到提示，多个跨月只提示一次。
    }
  }
}

function onYear(st, out) {
  // 列国势力自然回归
  for (const s of Object.keys(STATES)) {
    const v = st.world.power[s] ?? 30;
    st.world.power[s] = clamp(Math.round(v + (32 - v) * 0.05), 5, 100);
  }
  // 时节消息
  const a = age(st);
  if (a === 20 || a === 30 || a === 40 || a === 50 || a === 60) {
    out.notes.push(`${st.player.name}年方${a}。`);
  }
}

export function driftPrices(st) {
  for (const c of CITIES) {
    const set = st.world.prices[c.id] || (st.world.prices[c.id] = priceSet(st, c.id));
    for (const g of Object.keys(GOODS)) {
      const base = basePriceOf(st, c.id, g);
      const cur = set[g] ?? base;
      const pull = (base - cur) * 0.28;
      const noise = (R.next(st) - 0.5) * base * 0.12;
      set[g] = Math.max(3, Math.round(cur + pull + noise));
    }
  }
}

function monthIncome(st, out) {
  const p = st.player;
  if (p.stateId && (p.profession === 'youxia' || p.profession === 'shuike' || p.profession === 'xuezhe')) {
    const pay = RANKS[p.rank]?.pay ?? 0;
    if (pay > 0) {
      addMoney(st, pay, true);
      out.notes.push(`领受${STATES[p.stateId].name}国俸禄 ${pay} 金。`);
    }
  }
  if (p.peerage) {
    const peer = PEERAGES[p.peerage.rank];
    if (peer) {
      addMoney(st, peer.income, true);
      out.notes.push(`食邑${CITY_MAP[p.peerage.fief]?.name ?? ''}食禄 ${peer.income} 金。`);
    }
  }
  if (p.profession === 'shangren') {
    const shopIncome = p.shops.length * 55 + p.hired * 8;
    if (shopIncome > 0) {
      addMoney(st, shopIncome, true);
      out.notes.push(`商号进项 ${shopIncome} 金。`);
    }
    const upkeep = p.hired * 6;
    if (upkeep > 0) { addMoney(st, -upkeep, true); out.notes.push(`伙计工食 ${upkeep} 金。`); }
  }
  if (p.profession === 'xuezhe' && p.disciples > 0) {
    const income = Math.round(p.disciples * 1.5);
    addMoney(st, income, true);
    out.notes.push(`弟子奉上束脩 ${income} 金。`);
  }
  // 健康缓慢恢复
  if (p.stamina > 60) addHealth(st, 1);
}

function syncNpcs(st, out) {
  for (const n of Object.values(st.npc)) {
    const def = NPC_MAP[n.id];
    if (!def) continue;
    const alive = npcAlive(def, st.time.year);
    if (!alive && n.alive) {
      n.alive = false;
      const r = rel(st, n.id);
      if (r.met) {
        out.notes.push(`${def.name}卒。`);
        addLog(st, `闻${def.name}卒，年${def.death != null ? -def.death : '不详'}。`, 'war');
      }
    } else if (alive && !n.alive) {
      n.alive = true;
    }
  }
}

// 休息：住店恢复
export function restAtInn(st, days = 3) {
  const cost = days * 8;
  if (st.player.money < cost) return { ok: false, msg: '囊中羞涩，住不起店。' };
  addMoney(st, -cost);
  const r = advanceDays(st, days, { rest: true });
  addStamina(st, days * 22);
  addHealth(st, Math.ceil(days / 2));
  addLog(st, `在客栈歇了${days}日，精神稍复。`);
  return { ok: true, notes: r.notes, events: r.events, days };
}
