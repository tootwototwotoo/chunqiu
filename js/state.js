// 游戏状态：创建、存档、常用读写
import { PROFESSIONS, RANKS, MERCHANT_TIERS, SCHOLAR_TIERS, DIPLO_TIERS, SKILL_MAX, ERAS } from './data/defs.js';
import { CITIES, CITY_MAP, STATES, ROADS } from './data/world.js';
import { NPCS, npcAlive, NPC_MAP } from './data/npcs.js';
import { GOODS, demandOf, LOCAL_SPECIALTY } from './data/goods.js';
import { TIMELINE } from './data/events.js';
import { hashSeed, ri, rnd, yearLabel, monthLabel } from './util.js';

export const SAVE_KEY = 'chunqiu_lieguozhi_save_v1';
export const START_YEAR = -722;

export function newGame({ name, gender = '男', profession = 'youxia', seed = Date.now(), era = 'early' }) {
  const prof = PROFESSIONS[profession];
  const eraDef = ERAS.find(e => e.id === era) ?? ERAS[0];
  const startCity = profession === 'shangren' ? 'tao' : profession === 'xuezhe' ? 'qufu' : 'luoyi';
  const st = {
    version: 1,
    rng: hashSeed(String(seed)) || 12345,
    seed,
    time: { year: eraDef.year, month: 1, day: 1 },
    era: eraDef.id,
    player: {
      name: name || '无名',
      gender,
      profession,
      cityId: startCity,
      homeCity: startCity,
      stateId: null,
      money: prof.start.money,
      fame: prof.start.fame,
      stamina: 100, staminaMax: 100,
      health: 100,
      ageDays: 0, startAge: 18,
      stats: { ...prof.start.stats },
      skills: { jianshu: 0, sheshu: 0, bingfa: 0, biancai: 0, quanmou: 0, shanggu: 0, suanshu: 0, xuewen: 0, ...prof.start.skills },
      skillExp: { jianshu: 0, sheshu: 0, bingfa: 0, biancai: 0, quanmou: 0, shanggu: 0, suanshu: 0, xuewen: 0 },
      merit: 0, rank: 0,
      cards: [], relations: {},
      caravan: profession === 'shangren' ? 24 : 8,
      shops: [], hired: 0,
      disciples: 0, works: [], doctrine: null,
      alliances: 0, missions: 0,
      inventory: {},
      flags: {},
      alive: true, retire: false,
    },
    world: {
      owner: Object.fromEntries(CITIES.map(c => [c.id, c.state])),
      power: { ...Object.fromEntries(Object.values(STATES).map(s => [s.id, s.power])), ...(eraDef.power ?? {}) },
      prices: {},
      hegemon: '',
      alliances: [],
      wars: [],
    },
    npc: buildNpcs(eraDef.year),
    quests: { active: [], done: [], board: null, boardDay: -99 },
    events: { fired: TIMELINE.filter(t => t.year < eraDef.year).map(t => t.id), news: [] },
    log: [],
    stats: { travelDays: 0, duels: 0, duelWins: 0, debates: 0, debateWins: 0, trades: 0, profit: 0, quests: 0, trained: 0 },
    flags: {},
  };
  initPrices(st);
  addLog(st, `${eraDef.name}·${yearLabel(eraDef.year)}，${name || '无名'}立身于${CITY_MAP[startCity].name}。`, 'big');
  return st;
}

function buildNpcs(year) {
  const out = {};
  for (const n of NPCS) {
    out[n.id] = { id: n.id, city: n.city, alive: npcAlive(n, year), affinity: 0, met: false, gifts: 0 };
  }
  return out;
}

// ---------- 随机数（状态内） ----------
export const R = {
  next: (st) => rnd(st),
  int: (st, a, b) => ri(st, a, b),
  chance: (st, p) => rnd(st) < p,
  pick: (st, arr) => arr[Math.floor(rnd(st) * arr.length)],
};

// ---------- 查询 ----------
export const player = (st) => st.player;
export const city = (st) => CITY_MAP[st.player.cityId];
export const cityOf = (id) => CITY_MAP[id];
export const npcDef = (id) => NPC_MAP[id];
export const isMerchant = (st) => st.player.profession === 'shangren';
export const isWarrior = (st) => st.player.profession === 'youxia';
export const isDiplomat = (st) => st.player.profession === 'shuike';
export const isScholar = (st) => st.player.profession === 'xuezhe';
export const profName = (st) => PROFESSIONS[st.player.profession].name;
export const rankName = (st) => RANKS[st.player.rank]?.name ?? '布衣';
export const age = (st) => st.player.startAge + Math.floor(st.player.ageDays / 360);

export function careerTitle(st) {
  const p = st.player;
  if (p.profession === 'youxia' || p.profession === 'shuike') {
    return p.stateId ? `${STATES[p.stateId].name}之${rankName(st)}` : '布衣';
  }
  if (p.profession === 'shangren') {
    let t = MERCHANT_TIERS[0];
    for (const x of MERCHANT_TIERS) if (p.money >= x.need) t = x;
    return t.name;
  }
  if (p.profession === 'xuezhe') {
    let t = SCHOLAR_TIERS[0];
    for (const x of SCHOLAR_TIERS) if (p.disciples >= x.need) t = x;
    return t.name;
  }
  return '';
}

export function fullTitle(st) {
  const p = st.player;
  if (p.profession === 'shangren') return `${PROFESSIONS.shangren.name}·${careerTitle(st)}`;
  if (p.profession === 'xuezhe') return `${p.doctrine ? p.doctrine : '学者'}·${careerTitle(st)}`;
  if (p.profession === 'shuike') return p.stateId ? `${STATES[p.stateId].name}国${rankName(st)}` : '游士';
  return p.stateId ? `${STATES[p.stateId].name}国${rankName(st)}` : '布衣游侠';
}

export function skillLevel(st, k) { return st.player.skills[k] ?? 0; }
export function skillExpNeed(st, k) { return 30 + (st.player.skills[k] ?? 0) * 22; }
export function skillTotal(st) {
  return Object.values(st.player.skills).reduce((a, b) => a + b, 0);
}
export function rel(st, id) {
  return st.player.relations[id] || (st.player.relations[id] = { aff: 0, met: false, gifts: 0 });
}
export function npcsHere(st) {
  return Object.values(st.npc)
    .filter(n => n.alive && n.city === st.player.cityId)
    .map(n => ({ ...n, def: NPC_MAP[n.id] }))
    .filter(n => n.def && npcAlive(n.def, st.time.year));
}
export function aliveNpcs(st) {
  return Object.values(st.npc).filter(n => n.alive && NPC_MAP[n.id] && npcAlive(NPC_MAP[n.id], st.time.year));
}

// ---------- 变更 ----------
export function addLog(st, text, kind = '') {
  st.log.unshift({ d: `${yearLabel(st.time.year)}${monthLabel(st.time.month)}`, text, kind });
  if (st.log.length > 180) st.log.length = 180;
}

export function addMoney(st, v, silent = false) {
  st.player.money = Math.max(0, st.player.money + v);
  if (v > 0 && !silent) addLog(st, `得金 ${v}。`, 'gain');
  if (v < 0 && !silent) addLog(st, `花费 ${-v} 金。`);
}
export function addFame(st, v, silent = false) {
  st.player.fame = Math.max(0, st.player.fame + v);
  if (v !== 0 && !silent) addLog(st, `名声${v > 0 ? '+' : ''}${v}（${st.player.fame}）。`, v > 0 ? 'gain' : '');
}
export function addMerit(st, v, silent = false) {
  st.player.merit = Math.max(0, st.player.merit + v);
  if (v !== 0 && !silent) addLog(st, `功勋${v > 0 ? '+' : ''}${v}。`, 'gain');
}
export function addStat(st, k, v) {
  const p = st.player;
  p.stats[k] = Math.max(1, Math.min(100, (p.stats[k] ?? 0) + v));
}
export function addSkillExp(st, k, v) {
  const p = st.player;
  if ((p.skills[k] ?? 0) >= SKILL_MAX) return { leveled: false, lv: SKILL_MAX };
  p.skillExp[k] = (p.skillExp[k] ?? 0) + v;
  let leveled = false;
  while ((p.skills[k] ?? 0) < SKILL_MAX && p.skillExp[k] >= skillExpNeed(st, k)) {
    p.skillExp[k] -= skillExpNeed(st, k);
    p.skills[k] += 1;
    leveled = true;
  }
  return { leveled, lv: p.skills[k] };
}
export function addRel(st, npcId, v) {
  const r = rel(st, npcId);
  r.aff = Math.max(0, Math.min(100, r.aff + v));
  return r;
}
export function meetNpc(st, npcId) {
  const r = rel(st, npcId);
  r.met = true;
  if (!st.player.cards.includes(npcId)) {
    st.player.cards.push(npcId);
    addLog(st, `识得${NPC_MAP[npcId].name}，录于名鉴。`, 'gain');
  }
  return r;
}
export function addStamina(st, v) {
  const p = st.player;
  p.stamina = Math.max(0, Math.min(p.staminaMax, p.stamina + v));
}
export function addHealth(st, v) {
  const p = st.player;
  p.health = Math.max(0, Math.min(100, p.health + v));
}
export function addGoods(st, goodId, qty) {
  const inv = st.player.inventory;
  inv[goodId] = Math.max(0, (inv[goodId] ?? 0) + qty);
  if (inv[goodId] === 0) delete inv[goodId];
}
export function goodsCount(st) {
  return Object.entries(st.player.inventory).reduce((a, [g, q]) => a + q * (GOODS[g]?.bulk ?? 1), 0);
}
export function caravanFree(st) {
  return Math.max(0, st.player.caravan - goodsCount(st));
}
export function merchantTier(st) {
  let t = MERCHANT_TIERS[0];
  for (const x of MERCHANT_TIERS) if (st.player.money >= x.need) t = x;
  return t;
}
export function diploTier(st) {
  let t = DIPLO_TIERS[0];
  for (const x of DIPLO_TIERS) if (st.player.missions >= x.need) t = x;
  return t;
}

// ---------- 价格初始化 ----------
export function initPrices(st) {
  for (const c of CITIES) st.world.prices[c.id] = priceSet(st, c.id);
}
export function priceSet(st, cityId) {
  const out = {};
  for (const g of Object.keys(GOODS)) out[g] = basePriceOf(st, cityId, g);
  return out;
}
export function basePriceOf(st, cityId, goodId) {
  const g = GOODS[goodId];
  let p = g.base * demandOf(cityId, goodId);
  if (LOCAL_SPECIALTY[cityId] === goodId) p *= 0.72;
  const power = st.world.power[st.world.owner[cityId]] ?? 30;
  p *= 1 + (power - 40) / 400;
  return Math.max(3, Math.round(p));
}

// ---------- 存档 ----------
function store() {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage;
  } catch { return null; }
}
export function saveGame(st) {
  try {
    const ls = store();
    if (!ls) throw new Error('localStorage unavailable');
    ls.setItem(SAVE_KEY, JSON.stringify(st));
    return true;
  } catch (e) { console.error(e); return false; }
}
export function migrateState(st) {
  if (!st || !st.world) return st;
  st.world.owner ||= {};
  st.world.prices ||= {};
  st.world.power ||= {};
  for (const c of CITIES) {
    if (!st.world.owner[c.id]) st.world.owner[c.id] = c.state;
    if (!st.world.prices[c.id]) st.world.prices[c.id] = priceSet(st, c.id);
  }
  for (const s of Object.values(STATES)) {
    if (st.world.power[s.id] == null) st.world.power[s.id] = s.power;
  }
  st.npc ||= {};
  const year = st.time?.year ?? START_YEAR;
  for (const n of NPCS) {
    if (!st.npc[n.id]) st.npc[n.id] = { id: n.id, city: n.city, alive: npcAlive(n, year), affinity: 0, met: false, gifts: 0 };
  }
  st.quests ||= { active: [], done: [], board: null, boardDay: -99, offers: [] };
  return st;
}

export function loadGame() {
  try {
    const raw = store()?.getItem(SAVE_KEY);
    if (!raw) return null;
    const st = JSON.parse(raw);
    if (!st || !st.player || !st.time) return null;
    return migrateState(st);
  } catch (e) { console.error(e); return null; }
}
export function hasSave() {
  try { return !!store()?.getItem(SAVE_KEY); } catch { return false; }
}
export function deleteSave() {
  try { store()?.removeItem(SAVE_KEY); } catch { /* ignore */ }
}
