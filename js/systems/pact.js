// 商盟（质誓）：与一国订立契约，共担国运
// 郑国质誓：「尔无我叛，我无强贾，毋或匐夺。尔有利市宝贿，我勿与知。」
import { PACT, MERCHANT_RANKS } from '../data/merchant.js';
import { STATES, CITY_MAP } from '../data/world.js';
import { player, addLog, addMoney, addFame } from '../state.js';
import { rankIndexOf } from './merchant.js';
import { absDay } from '../util.js';

const isMerchant = (st) => player(st).profession === 'shangren';

export function pactList(st) {
  const p = player(st);
  return Array.isArray(p.pacts) ? p.pacts : (p.pacts = []);
}

export function hasPact(st, stateId) {
  return pactList(st).some(x => x.state === stateId);
}

export function pactOf(st, stateId) {
  return pactList(st).find(x => x.state === stateId) ?? null;
}

// 第 n 个商盟的质金（n 从 0 起）：基数 × 2^n
export function pactFeeFor(st, ordinal = pactList(st).length) {
  return PACT.baseFee * Math.pow(2, ordinal);
}

// 每个商盟的月缴（多盟时全部按同一倍率重算）
export function pactMonthlyEach(st) {
  const n = pactList(st).length;
  if (!n) return 0;
  return PACT.powerPayRate * Math.pow(2, n - 1);
}

export function pactMonthlyTotal(st) {
  const n = pactList(st).length;
  if (!n) return 0;
  return pactList(st).reduce((a, x) => {
    const power = st.world.power[x.state] ?? 30;
    return a + power * pactMonthlyEach(st);
  }, 0);
}

export function canSignPact(st, stateId) {
  const p = player(st);
  if (!isMerchant(st)) return { ok: false, msg: '唯商贾可订商盟。' };
  if (rankIndexOf(st) < PACT.grandMinRank) {
    return { ok: false, msg: `须至${MERCHANT_RANKS[PACT.grandMinRank].name}方可与国盟誓。` };
  }
  if (p.fame < PACT.minFame) return { ok: false, msg: `名声不足（${p.fame}/${PACT.minFame}）。` };
  if (!STATES[stateId]) return { ok: false, msg: '并无此国。' };
  if (hasPact(st, stateId)) return { ok: false, msg: `已与${STATES[stateId].name}盟誓。` };
  const fee = pactFeeFor(st);
  if (p.money < fee) return { ok: false, msg: `质金需${fee}金。` };
  const city = CITY_MAP[p.cityId];
  if (!city || st.world.owner[city.id] !== stateId) {
    return { ok: false, msg: `须至${STATES[stateId].name}国朝堂请盟。` };
  }
  if (!city.tags.includes('court')) return { ok: false, msg: '须于该国朝堂之城请盟。' };
  return { ok: true, fee, ordinal: pactList(st).length };
}

export function signPact(st, stateId) {
  const chk = canSignPact(st, stateId);
  if (!chk.ok) return chk;
  const p = player(st);
  addMoney(st, -chk.fee, true);
  p.pacts = pactList(st);
  p.pacts.push({ state: stateId, day: absDay(st.time), fee: chk.fee, arrears: 0 });
  addFame(st, 8);
  addLog(st, `与${STATES[stateId].name}盟誓，纳质金${chk.fee}金。`, 'big');
  return {
    ok: true, stateId, fee: chk.fee, ordinal: chk.ordinal,
    monthly: (st.world.power[stateId] ?? 30) * pactMonthlyEach(st),
    msg: `与${STATES[stateId].name}质誓而盟：不叛不夺，利市相共。纳质金${chk.fee}金。`,
  };
}

export function breakPact(st, stateId) {
  const pact = pactOf(st, stateId);
  if (!pact) return { ok: false, msg: '并无此盟。' };
  const p = player(st);
  p.pacts = pactList(st).filter(x => x.state !== stateId);
  addFame(st, -PACT.breakFame, true);
  addLog(st, `与${STATES[stateId].name}解盟，质金不复，名声-${PACT.breakFame}。`, 'war');
  return { ok: true, msg: `解盟而去。质金不复，${STATES[stateId].name}人颇有怨言（名声-${PACT.breakFame}）。` };
}

// 月结：结算商盟的军资与欠缴
export function tickPacts(st, out) {
  const p = player(st);
  if (!isMerchant(st) || !pactList(st).length) return;

  // 国亡则盟失效
  const alive = pactList(st).filter(x => {
    const stillOwns = Object.values(st.world.owner).includes(x.state);
    if (stillOwns) return true;
    addLog(st, `${STATES[x.state].name}已亡，商盟随之而绝。`, 'war');
    out.notes.push(`${STATES[x.state].name}已亡，商盟失效。`);
    addFame(st, -PACT.ruinFame, true);
    return false;
  });
  p.pacts = alive;
  if (!alive.length) return;

  const each = pactMonthlyEach(st);
  let total = 0;
  for (const pact of alive) {
    const power = st.world.power[pact.state] ?? 30;
    const due = power * each;
    total += due;
    if (player(st).money >= due) {
      addMoney(st, -due, true);
      pact.arrears = 0;
    } else {
      pact.arrears = (pact.arrears ?? 0) + 1;
      out.notes.push(`商盟军资不足，欠缴${pact.arrears}月。`);
      if (pact.arrears >= PACT.arrearsLimit) {
        out.notes.push(`欠缴已逾${PACT.arrearsLimit}月，${STATES[pact.state].name}与你解盟。`);
        addLog(st, `欠缴商盟军资逾${PACT.arrearsLimit}月，${STATES[pact.state].name}解盟。`, 'war');
        addFame(st, -PACT.breakFame, true);
      }
    }
  }
  p.pacts = pactList(st).filter(x => (x.arrears ?? 0) < PACT.arrearsLimit);
  if (total > 0) out.notes.push(`商盟军资 ${total} 金。`);

  // 战时额外征调
  for (const pact of p.pacts) {
    const war = (st.world.wars ?? []).some(w => w.a === pact.state || w.b === pact.state);
    if (war && !pact.warPaid) {
      if (player(st).money >= PACT.warLevy) {
        addMoney(st, -PACT.warLevy, true);
        pact.warPaid = true;
        out.notes.push(`盟国用兵，输军资 ${PACT.warLevy} 金。`);
      }
    }
  }
}

// 商盟对牙钱与商号的影响
export function pactLevyBonus(st, cityId) {
  if (!isMerchant(st)) return 0;
  const stateId = st.world.owner[cityId];
  return hasPact(st, stateId) ? PACT.levyBonus : 0;
}

export function pactShopMultiplier(st, cityId) {
  if (!isMerchant(st)) return 1;
  const stateId = st.world.owner[cityId];
  return hasPact(st, stateId) ? PACT.shopMultiplier : 1;
}

export function pactSummary(st) {
  return pactList(st).map(x => ({
    state: x.state,
    stateName: STATES[x.state]?.name ?? x.state,
    power: st.world.power[x.state] ?? 30,
    due: (st.world.power[x.state] ?? 30) * pactMonthlyEach(st),
    arrears: x.arrears ?? 0,
  }));
}
