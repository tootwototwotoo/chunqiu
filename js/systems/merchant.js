// 商人系统：阶次判定、商号、伙计、散财、转职
import {
  MERCHANT_RANKS, SHOP_LEVELS, SHOP_MAX_LEVEL, HIRE, GIVEAWAYS, BUY_OFFICE, TOP_RANK,
  PERMIT, PERMIT_ROLES, PERMIT_ROLE_NAMES, cityScale, GIVEAWAY_LIMIT,
} from '../data/merchant.js';
import { STATES, CITY_MAP } from '../data/world.js';
import { player, addLog, addMoney, addFame, rel, npcsHere, R } from '../state.js';
import { pactShopMultiplier } from './pact.js';
import { clamp, absDay } from '../util.js';

const isMerchant = (st) => player(st).profession === 'shangren';

// ---------- 商号 ----------
// 旧存档 shops 为 string[]；新结构为 { city, level, hired }[]
// 就地规范化：必须复用同一个对象，否则调用方拿到的引用会失效。
// 仅在必要时（旧存档的字符串形式、字段缺失、非法值）才替换元素。
export function normShops(st) {
  const p = player(st);
  if (!Array.isArray(p.shops)) p.shops = [];
  const out = [];
  const seen = new Set();
  for (const raw of p.shops) {
    const city = typeof raw === 'string' ? raw : raw?.city;
    if (!CITY_MAP[city] || seen.has(city)) continue;
    seen.add(city);
    if (typeof raw === 'string') {
      out.push({ city, level: 1, hired: 0, bonus: 0 });
      continue;
    }
    // 需要修正时新建一个，其余情况保留原对象
    const level = clamp(Math.round(raw.level ?? 1), 1, SHOP_MAX_LEVEL);
    const hired = Math.max(0, Math.round(raw.hired ?? 0));
    const bonus = Math.max(0, Math.round(raw.bonus ?? 0));
    if (level === raw.level && hired === raw.hired && bonus === raw.bonus) out.push(raw);
    else out.push({ city, level, hired, bonus });
  }
  // 只有结构真的变了才替换数组，避免无谓的引用失效
  if (out.length !== p.shops.length || out.some((s, i) => s !== p.shops[i])) p.shops = out;
  return p.shops;
}

export function shopAt(st, cityId) {
  return normShops(st).find(s => s.city === cityId) ?? null;
}

export function shopCount(st) {
  return normShops(st).length;
}

export function shopIncomeOf(shop, st = null) {
  const base = shopIncomeBaseAt(shop.city, shop.level);
  const hiredPer = Math.round(HIRE.income * (shop?.scale ?? 1));
  const raw = base + shop.hired * hiredPer + (shop.bonus ?? 0);
  // 盟国商号另有加成
  const mult = st ? pactShopMultiplier(st, shop.city) : 1;
  return Math.round(raw * mult);
}

export function totalShopIncome(st) {
  return normShops(st).reduce((a, s) => a + shopIncomeOf(s, st), 0);
}

export function totalWages(st) {
  return normShops(st).reduce((a, s) => a + s.hired * HIRE.wage, 0);
}

// 某城开号成本与月入：按人口浮动
export function shopCostAt(cityId, level = 1) {
  const city = CITY_MAP[cityId];
  const base = SHOP_LEVELS[level]?.cost ?? SHOP_LEVELS[1].cost;
  return Math.max(200, Math.round(base * cityScale(city)));
}

export function shopIncomeBaseAt(cityId, level = 1) {
  const city = CITY_MAP[cityId];
  const base = SHOP_LEVELS[level]?.income ?? SHOP_LEVELS[1].income;
  return Math.max(30, Math.round(base * cityScale(city)));
}

// 某城的市租（许可费）
export function permitFeeAt(st, cityId) {
  return Math.round(shopCostAt(cityId, 1) * PERMIT.feeRate);
}

// 当前城可授予市籍的人物：按角色优先，交情高者在前
export function permitCandidates(st) {
  const here = npcsHere(st);
  return here
    .filter(n => PERMIT_ROLES.includes(n.effectiveRole ?? n.def.role))
    .map(n => {
      const r = rel(st, n.id);
      const effRole = n.effectiveRole ?? n.def.role;
      const rank = PERMIT_ROLES.indexOf(effRole);
      return { id: n.id, def: n.def, aff: r.aff, role: effRole, order: rank };
    })
    .sort((a, b) => a.order - b.order || b.aff - a.aff);
}

// 是否已获本地许可
export function hasPermit(st, cityId) {
  const p = player(st);
  return Array.isArray(p.permits) && p.permits.some(x => x.city === cityId);
}

export function permitOf(st, cityId) {
  return (player(st).permits ?? []).find(x => x.city === cityId) ?? null;
}

// 取得许可的条件检查
export function canGetPermit(st, cityId = player(st).cityId) {
  const p = player(st);
  if (!isMerchant(st)) return { ok: false, msg: '唯商贾须领市籍。' };
  if (!CITY_MAP[cityId]?.tags.includes('market')) return { ok: false, msg: '此处非市邑，无籍可领。' };
  if (hasPermit(st, cityId)) return { ok: false, msg: '本城已有你的市籍。' };
  const rank = rankIndexOf(st);
  if (rank < PERMIT.minRank) return { ok: false, msg: `须至${MERCHANT_RANKS[PERMIT.minRank].name}方可请领市籍。` };
  if (p.fame < PERMIT.minFame) return { ok: false, msg: `名声不足（${p.fame}/${PERMIT.minFame}）。` };

  const cands = permitCandidates(st);
  if (!cands.length) {
    // 城中无可托之人：可径赴市亭告官立籍，费用更高
    const officialFee = Math.round(permitFeeAt(st, cityId) * PERMIT.officialRate);
    if (p.money < officialFee) return { ok: false, msg: `本城无有司可托，须赴市亭立籍，纳${officialFee}金。` };
    return { ok: true, mode: 'official', candidates: [], fee: officialFee, cityId };
  }

  const friendly = cands.filter(c => c.aff >= PERMIT.minAff);
  const fee = permitFeeAt(st, cityId);
  if (p.money < fee) return { ok: false, msg: `市租需${fee}金。` };

  if (friendly.length) {
    return { ok: true, mode: 'affinity', candidates: friendly, fee, cityId };
  }
  // 无交情时：可凭名声再试，另纳贽礼
  if (p.fame >= PERMIT.trialFame && p.money >= fee + PERMIT.trialFee) {
    return { ok: true, mode: 'trial', candidates: cands, fee: fee + PERMIT.trialFee, cityId };
  }
  const best = cands[0];
  return {
    ok: false,
    msg: `须与城中${PERMIT_ROLE_NAMES[best.role]}有交情（${PERMIT.minAff} 以上）方可通融；`
      + `或名声达${PERMIT.trialFame}并另纳贽礼${PERMIT.trialFee}金，凭名望说动有司。`,
    candidates: cands,
  };
}

// 请领市籍：交情路线必定成功；名望路线需要判定
export function getPermit(st, cityId = player(st).cityId) {
  const chk = canGetPermit(st, cityId);
  if (!chk.ok) return chk;
  const p = player(st);
  const npc = chk.candidates[0] ?? null;
  addMoney(st, -chk.fee, true);

  let granted = true;
  if (chk.mode === 'trial') {
    // 名声越高越易说动：线性加权 fame*0.9 + 美*0.25 + 政*0.2 + 0~25 随机，门槛 34
    // （名声 10 时约三成，60 时近乎必成）
    const roll = p.fame * 0.9 + p.stats.mei * 0.25 + p.stats.zheng * 0.2 + R.int(st, 0, 25);
    granted = roll >= 34;
  }

  if (!granted) {
    addLog(st, `求市籍于${npc.def.name}，未蒙允许。`, 'war');
    return {
      ok: false, spent: chk.fee, mode: chk.mode,
      msg: `${npc.def.name}沉吟良久：「名录有限，君且待来日。」贽礼已纳，未得许可。`,
    };
  }

  p.permits = Array.isArray(p.permits) ? p.permits : [];
  p.permits.push({ city: cityId, by: npc?.id ?? null, day: absDay(st.time), fee: chk.fee });
  p.givenAway = (p.givenAway ?? 0) + chk.fee; // 市租亦入官，计入散财
  addFame(st, 2);
  if (npc) {
    addLog(st, `得${npc.def.name}许可，入${CITY_MAP[cityId].name}市籍。`, 'big');
    return {
      ok: true, by: npc.def.name, fee: chk.fee, mode: chk.mode, cityId,
      msg: `${npc.def.name}取其牒，书君名于市籍：「可于此处列肆矣。」纳市租${chk.fee}金。`,
    };
  }
  addLog(st, `赴${CITY_MAP[cityId].name}市亭告官立籍。`, 'big');
  return {
    ok: true, by: null, fee: chk.fee, mode: 'official', cityId,
    msg: `本城无有司可托，径赴市亭纳${chk.fee}金，书名著籍。`,
  };
}

export function canOpenShop(st, cityId) {
  if (!isMerchant(st)) return { ok: false, msg: '唯商贾可设肆。' };
  if (!CITY_MAP[cityId]?.tags.includes('market')) return { ok: false, msg: '此处非市邑，不可设肆。' };
  if (shopAt(st, cityId)) return { ok: false, msg: '本城已有你的商号。' };
  if (!hasPermit(st, cityId)) return { ok: false, msg: '尚未领得本地市籍。', needPermit: true };
  const cost = shopCostAt(cityId, 1);
  if (player(st).money < cost) return { ok: false, msg: `设肆需金${cost}。` };
  return { ok: true, cost };
}

export function openShop(st, cityId) {
  const chk = canOpenShop(st, cityId);
  if (!chk.ok) return chk;
  addMoney(st, -chk.cost, true);
  normShops(st).push({ city: cityId, level: 1, hired: 0, bonus: 0 });
  addFame(st, 3);
  addLog(st, `于${CITY_MAP[cityId].name}开设商号（小肆）。`, 'big');
  return {
    ok: true, city: cityId, level: 1, cost: chk.cost,
    msg: `于${CITY_MAP[cityId].name}开设小肆，每月进项${shopIncomeBaseAt(cityId, 1)}金。`,
  };
}

export function upgradeCostOf(shop) {
  const next = SHOP_LEVELS[shop.level + 1];
  if (!next) return null;
  return shopCostAt(shop.city, next.level) - shopCostAt(shop.city, shop.level);
}

export function canUpgradeShop(st, cityId) {
  if (!isMerchant(st)) return { ok: false, msg: '唯商贾可经营商号。' };
  const shop = shopAt(st, cityId);
  if (!shop) return { ok: false, msg: '本城并无你的商号。' };
  if (shop.level >= SHOP_MAX_LEVEL) return { ok: false, msg: '已是总号，无可再升。' };
  const cost = upgradeCostOf(shop);
  if (player(st).money < cost) return { ok: false, msg: `升号需金${cost}。` };
  return { ok: true, cost, shop, next: SHOP_LEVELS[shop.level + 1] };
}

export function upgradeShop(st, cityId) {
  const chk = canUpgradeShop(st, cityId);
  if (!chk.ok) return chk;
  addMoney(st, -chk.cost, true);
  chk.shop.level += 1;
  addFame(st, 3);
  addLog(st, `${CITY_MAP[cityId].name}商号升为${chk.next.name}。`, 'big');
  return { ok: true, level: chk.shop.level, msg: `${CITY_MAP[cityId].name}商号升为${chk.next.name}，每月进项${shopIncomeOf(chk.shop)}金。` };
}

// ---------- 伙计 ----------
export function canHire(st, cityId) {
  if (!isMerchant(st)) return { ok: false, msg: '唯商贾可雇伙计。' };
  const shop = shopAt(st, cityId);
  if (!shop) return { ok: false, msg: '本城并无你的商号。' };
  const max = (SHOP_LEVELS[shop.level] ?? SHOP_LEVELS[1]).hiredMax;
  if (shop.hired >= max) return { ok: false, msg: `${SHOP_LEVELS[shop.level].name}最多雇${max}名伙计。` };
  if (player(st).money < HIRE.cost) return { ok: false, msg: `雇工需金${HIRE.cost}。` };
  return { ok: true, shop, cost: HIRE.cost, max };
}

export function hireClerk(st, cityId) {
  const chk = canHire(st, cityId);
  if (!chk.ok) return chk;
  addMoney(st, -chk.cost, true);
  chk.shop.hired += 1;
  addLog(st, `${CITY_MAP[cityId].name}商号雇伙计一名。`);
  return {
    ok: true, hired: chk.shop.hired,
    msg: `雇伙计一名，月支${HIRE.wage}金，商号月入 +${HIRE.income}金。`,
  };
}

// ---------- 散财 ----------
export function canGive(st, kind, cityId = player(st).cityId) {
  if (!isMerchant(st)) return { ok: false, msg: '唯商贾可行此义举。' };
  const def = GIVEAWAYS[kind];
  if (!def) return { ok: false, msg: '并无此举。' };
  if (player(st).money < def.cost) return { ok: false, msg: `此举需金${def.cost}。` };
  if (kind === 'road' && !shopAt(st, cityId)) return { ok: false, msg: '须先在本地设有商号。' };
  const f = player(st).flags ?? {};
  const now = absDay(st.time);
  const last = f.lastGiveKind?.[kind];
  if (last != null && now - last < GIVEAWAY_LIMIT.cooldownDays) {
    return { ok: false, msg: `同类义举方毕，${GIVEAWAY_LIMIT.cooldownDays - (now - last)} 日后可行。` };
  }
  const key = `${cityId}:${st.time.year}`;
  const used = f.giveCityYear?.[key] ?? 0;
  if (used >= GIVEAWAY_LIMIT.perCityPerYear) {
    return { ok: false, msg: `今年已在此处行过义举，来年再议。` };
  }
  return { ok: true, def, cityId };
}

export function giveAway(st, kind, cityId = player(st).cityId) {
  const chk = canGive(st, kind, cityId);
  if (!chk.ok) return chk;
  const p = player(st);
  const def = chk.def;
  const stateId = st.world.owner[cityId];
  addMoney(st, -def.cost, true);
  p.givenAway = (p.givenAway ?? 0) + def.cost;
  // 记录冷却与年度额度
  p.flags = p.flags ?? {};
  p.flags.lastGiveKind = p.flags.lastGiveKind ?? {};
  p.flags.lastGiveKind[kind] = absDay(st.time);
  p.flags.giveCityYear = p.flags.giveCityYear ?? {};
  const yk = `${cityId}:${st.time.year}`;
  p.flags.giveCityYear[yk] = (p.flags.giveCityYear[yk] ?? 0) + 1;

  const notes = [];
  if (def.fame) { addFame(st, def.fame, true); notes.push(`名声+${def.fame}`); }
  if (def.power && stateId) {
    st.world.power[stateId] = clamp((st.world.power[stateId] ?? 30) + def.power, 5, 100);
    notes.push(`${STATES[stateId].name}国势+${def.power}`);
  }
  if (def.fameWithPact && hasPact(st, stateId)) { addFame(st, def.fameWithPact, true); notes.push(`名声+${def.fameWithPact}`); }
  if (def.shopBonus) {
    const shop = shopAt(st, cityId);
    if (shop) { shop.bonus = (shop.bonus ?? 0) + def.shopBonus; notes.push(`本号月入+${def.shopBonus}`); }
  }
  addLog(st, `散财：${def.name}，${notes.join('，')}。`, 'big');
  return { ok: true, def, notes, msg: `${def.text}（${notes.join('，')}）` };
}

// ---------- 商盟（第 2 期接入系统，这里只做阶次判定所需的查询） ----------
export function pactList(st) {
  const p = player(st);
  return Array.isArray(p.pacts) ? p.pacts : [];
}

export function hasPact(st, stateId) {
  return pactList(st).some(x => x.state === stateId);
}

// ---------- 阶次 ----------
export function rankIndexOf(st) {
  const p = player(st);
  const shops = shopCount(st);
  const pacts = pactList(st).length;
  const given = p.givenAway ?? 0;
  // 商誉一旦立起来就不会因一时周转而跌回去，故按历史峰值取
  const peak = Math.max(p.money, p.peakMoney ?? 0);

  let idx = 0;
  for (const r of MERCHANT_RANKS) {
    if (r.idx === TOP_RANK) {
      // 最后一阶不看当前金钱，看「散」与「曾经有多富」
      if (given >= (r.given ?? 0) && peak >= (r.peak ?? 0)) idx = r.idx;
      continue;
    }
    if (peak < r.money) continue;
    if (r.shops && shops < r.shops) continue;
    if (r.pacts && pacts < r.pacts) continue;
    idx = r.idx;
  }
  return idx;
}

export function merchantRank(st) {
  return MERCHANT_RANKS[rankIndexOf(st)] ?? MERCHANT_RANKS[0];
}

export function nextMerchantRank(st) {
  const i = rankIndexOf(st);
  return MERCHANT_RANKS[i + 1] ?? null;
}

// 阶次要求的进度文案，供界面显示
export function rankProgress(st) {
  const p = player(st);
  const next = nextMerchantRank(st);
  if (!next) return null;
  const parts = [];
  if (next.money) parts.push(`金 ${p.money}/${next.money}`);
  if (next.shops) parts.push(`商号 ${shopCount(st)}/${next.shops}`);
  if (next.pacts) parts.push(`商盟 ${pactList(st).length}/${next.pacts}`);
  if (next.given) parts.push(`散财 ${p.givenAway ?? 0}/${next.given}`);
  if (next.peak) parts.push(`曾持金 ${Math.max(p.money, p.peakMoney ?? 0)}/${next.peak}`);
  return { next, text: parts.join('　') };
}

// ---------- 献金求仕 ----------
export function canBuyOffice(st, stateId) {
  const p = player(st);
  if (p.profession !== 'shangren') return { ok: false, msg: '此路唯商贾可走。' };
  if (rankIndexOf(st) < BUY_OFFICE.minRank) return { ok: false, msg: `须至${MERCHANT_RANKS[BUY_OFFICE.minRank].name}方可献金求仕。` };
  if (p.money < BUY_OFFICE.cost) return { ok: false, msg: `献金需${BUY_OFFICE.cost}金。` };
  if (p.fame < BUY_OFFICE.fameNeed) return { ok: false, msg: `名声不足（${p.fame}/${BUY_OFFICE.fameNeed}）。` };
  if (!STATES[stateId]) return { ok: false, msg: '并无此国。' };
  return { ok: true, cost: BUY_OFFICE.cost, stateId };
}

// 转职：商人 → 士人。旧商号变为「养廉」，仍收部分被动收入。
export function buyOffice(st, stateId, newProfession = 'shuike') {
  const chk = canBuyOffice(st, stateId);
  if (!chk.ok) return chk;
  const p = player(st);
  addMoney(st, -BUY_OFFICE.cost, true);
  p.givenAway = (p.givenAway ?? 0) + BUY_OFFICE.cost; // 献金亦为散财

  const shops = normShops(st);
  const passive = Math.round(totalShopIncome(st) * BUY_OFFICE.shopPassive);

  p.profession = newProfession;
  p.stateId = stateId;
  p.rank = BUY_OFFICE.rankGranted;
  p.merit = Math.max(p.merit, 10);
  p.staminaMax = 100;
  p.caravan = Math.max(p.caravan, 8);
  p.passiveIncome = passive;
  addFame(st, 10);
  addLog(st, `献金${BUY_OFFICE.cost}于${STATES[stateId].name}，得授上士，弃商为士。`, 'big');
  return {
    ok: true, stateId, rank: BUY_OFFICE.rankGranted, passive, shops: shops.length,
    msg: `献金求仕，${STATES[stateId].name}君纳之，授上士。旧日商号转为养廉，每月仍有${passive}金进项。`,
  };
}

// 记录历史最高金，供陶朱公判定
export function trackPeakMoney(st) {
  const p = player(st);
  if (p.profession !== 'shangren') return;
  p.peakMoney = Math.max(p.peakMoney ?? 0, p.money);
}
