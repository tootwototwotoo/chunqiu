// 游戏状态：创建、存档、常用读写
import { PROFESSIONS, RANKS, SCHOLAR_TIERS, SKILL_MAX, ERAS, PEERAGES } from './data/defs.js';
import { CITIES, CITY_MAP, STATES } from './data/world.js';
import { NPCS, npcAlive, NPC_MAP } from './data/npcs.js';
import { GOODS, demandOf, LOCAL_SPECIALTY } from './data/goods.js';
import { TREASURES, TREASURE_IDS } from './data/treasures.js';
import { merchantRank } from './systems/merchant.js';
import { TIMELINE, RANDOM_EVENTS } from './data/events.js';
import { hashSeed, ri, rnd, yearLabel, monthLabel } from './util.js';

export const SAVE_KEY = 'chunqiu_lieguozhi_save_v1';
export const AUTO_SAVE_KEY = 'chunqiu_lieguozhi_auto';
export const AUTO_KEY = AUTO_SAVE_KEY;
export const AUTO_SAVE_ERROR = '自动存档失败：浏览器存储不可用或空间不足，请在存档页导出备份。';
import { START_YEAR } from './util.js';
export { START_YEAR };
const own = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

function makeTreasureWorld() {
  const out = {};
  for (const id of TREASURE_IDS) {
    const def = TREASURES[id];
    out[id] = {
      price: def.base, sold: 0,
      cities: Object.fromEntries(def.cities.map(c => [c, { nextDay: 0 }])),
    };
  }
  return out;
}

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
      visitedCities: [startCity],
      stateId: null,
      money: prof.start.money,
      fame: prof.start.fame,
      stamina: profession === 'shangren' ? 120 : 100,
      staminaMax: profession === 'shangren' ? 120 : 100,
      health: 100,
      ageDays: 0, startAge: 18,
      stats: { ...prof.start.stats },
      skills: { jianshu: 0, sheshu: 0, bingfa: 0, biancai: 0, quanmou: 0, shanggu: 0, suanshu: 0, xuewen: 0, ...prof.start.skills },
      skillExp: { jianshu: 0, sheshu: 0, bingfa: 0, biancai: 0, quanmou: 0, shanggu: 0, suanshu: 0, xuewen: 0 },
      merit: 0, rank: 0, peerage: null, peerageTrial: null, peerageFails: 0, peerageHistory: [], evidence: [],
      cards: [], relations: {},
      caravan: profession === 'shangren' ? 24 : 8,
      shops: [], hired: 0,
      givenAway: 0, peakMoney: prof.start.money, pacts: [], passiveIncome: 0,
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
      policy: null,
      alliances: [],
      wars: [],
      treasures: makeTreasureWorld(),
    },
    npc: buildNpcs(eraDef.year),
    quests: { active: [], done: [], board: null, boardDay: -99 },
    events: { fired: TIMELINE.filter(t => t.year < eraDef.year).map(t => t.id), news: [], pending: [] },
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
    return merchantRank(st).name;
  }
  if (p.profession === 'xuezhe') {
    let t = SCHOLAR_TIERS[0];
    for (const x of SCHOLAR_TIERS) if (p.disciples >= x.need) t = x;
    return t.name;
  }
  return '';
}

const peerSuffix = (p) => (p.peerage ? `·${PEERAGES[p.peerage.rank]?.name ?? ''}爵` : '');

export function fullTitle(st) {
  const p = st.player;
  if (p.profession === 'shangren') return `${PROFESSIONS.shangren.name}·${careerTitle(st)}`;
  if (p.profession === 'xuezhe') return `${p.doctrine ? p.doctrine : '学者'}·${careerTitle(st)}${peerSuffix(p)}`;
  if (p.profession === 'shuike') return (p.stateId ? `${STATES[p.stateId].name}国${rankName(st)}` : '游士') + peerSuffix(p);
  return (p.stateId ? `${STATES[p.stateId].name}国${rankName(st)}` : '布衣游侠') + peerSuffix(p);
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
  if (!npcId || !NPC_MAP[npcId]) return null;
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
export function hasEvidence(st, id) {
  return (st.player.evidence ?? []).includes(id);
}
export function addEvidence(st, id) {
  if (!id) return false;
  st.player.evidence ||= [];
  if (st.player.evidence.includes(id)) return false;
  st.player.evidence.push(id);
  return true;
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
  // 商人阶次受金钱、商号数、商盟数与累计散财共同决定，详见 systems/merchant.js
  return merchantRank(st);
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
// 只读出保存时间，不做整体迁移：saveGame 每次都要用它，不该为拿一个数字
// 把两份存档完整解析并跑一遍 migrateState。
function savedAtOf(ls, key) {
  try {
    const raw = ls.getItem(key);
    if (!raw) return 0;
    const v = JSON.parse(raw)?.savedAt;
    return Number.isSafeInteger(v) && v > 0 ? v : 0;
  } catch { return 0; }
}

export function saveGame(st, key = SAVE_KEY) {
  try {
    const ls = store();
    if (!ls) throw new Error('localStorage unavailable');
    // 保证同一毫秒内连续保存也有确定顺序，且重开更早年代不会误选旧档。
    const latest = Math.max(savedAtOf(ls, SAVE_KEY), savedAtOf(ls, AUTO_SAVE_KEY));
    const savedAt = Math.max(Date.now(), st.savedAt ?? 0, latest + 1);
    if (!Number.isSafeInteger(savedAt)) throw new Error('保存时间超出范围');
    ls.setItem(key, JSON.stringify({ ...st, savedAt }));
    st.savedAt = savedAt;
    return true;
  } catch { return false; }
}
// 旧版标识符改名（必须在 fill 之前调用，否则默认值会先占住新键）
function renameLegacyIds(st) {
  const inv = st.player?.inventory;
  if (inv && typeof inv === 'object' && inv.xi != null) {
    inv.xijiao = (inv.xijiao ?? 0) + inv.xi;
    delete inv.xi;
  }
  if (inv && typeof inv === 'object' && inv.zhu != null) {
    inv.mingzhu = (inv.mingzhu ?? 0) + inv.zhu;
    delete inv.zhu;
  }
  const t = st.world?.treasures;
  if (t && typeof t === 'object' && t.xi) {
    t.xijiao ||= t.xi;
    delete t.xi;
  }
  if (t && typeof t === 'object' && t.zhu) {
    t.mingzhu ||= t.zhu;
    delete t.zhu;
  }
  const col = st.world?.treasuresCollected;
  if (col && typeof col === 'object' && col.xi) {
    col.xijiao = true;
    delete col.xi;
  }
  if (col && typeof col === 'object' && col.zhu) {
    col.mingzhu = true;
    delete col.zhu;
  }
  const off = st.flags?.offeredTreasures;
  if (off && typeof off === 'object' && off.xi) {
    off.xijiao = (off.xijiao ?? 0) + off.xi;
    delete off.xi;
  }
  if (off && typeof off === 'object' && off.zhu) {
    off.mingzhu = (off.mingzhu ?? 0) + off.zhu;
    delete off.zhu;
  }
}

export function migrateState(st) {
  const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
  const ensure = (condition) => { if (!condition) throw new Error('存档格式无效'); };
  ensure(object(st) && object(st.player) && object(st.time) && object(st.world));
  const p = st.player, t = st.time;
  ensure(own(PROFESSIONS, p.profession) && own(CITY_MAP, p.cityId));
  ensure(typeof p.name === 'string' && p.name.length > 0);
  ensure(Number.isInteger(t.year) && Number.isInteger(t.month) && t.month >= 1 && t.month <= 12
    && Number.isInteger(t.day) && t.day >= 1 && t.day <= 30);
  ensure(st.version == null || st.version === 1);
  ensure(st.savedAt === undefined || (Number.isSafeInteger(st.savedAt) && st.savedAt > 0));
  const defaults = newGame({ name: p.name, profession: p.profession, seed: 1, era: st.era });
  defaults.player.visitedCities = [p.homeCity ?? defaults.player.homeCity, p.cityId];
  // 可选字段缺失时补齐；字段存在但类型损坏时拒绝，不能替换当前游戏。
  const fill = (value, fallback) => {
    for (const [key, def] of Object.entries(fallback)) {
      if (key === 'seed') continue; // 天命允许字符串或数字
      if (value[key] === undefined) value[key] = JSON.parse(JSON.stringify(def));
      else if (Array.isArray(def)) ensure(Array.isArray(value[key]));
      else if (object(def)) { ensure(object(value[key])); fill(value[key], def); }
      else if (def !== null) {
        ensure(typeof value[key] === typeof def);
        if (typeof def === 'number') ensure(Number.isFinite(value[key]));
      }
    }
  };
  defaults.world.owner = {}; defaults.world.prices = {}; defaults.world.power = {};
  defaults.npc = {};
  defaults.events.fired = TIMELINE.filter(ev => ev.year < t.year || (ev.year === t.year && ev.month < t.month)).map(ev => ev.id);
  // 旧的字段改名必须在 fill 之前做，否则默认值会先把新键填上，改名逻辑随之失效
  renameLegacyIds(st);
  fill(st, defaults);
  const numericMap = (map, ids, min = -Infinity, max = Infinity) => {
    ensure(object(map));
    for (const [key, v] of Object.entries(map)) {
      ensure((!ids || own(ids, key)) && Number.isFinite(v) && v >= min && v <= max);
    }
  };
  ensure(own(CITY_MAP, p.homeCity) && (p.stateId === null || own(STATES, p.stateId)));
  ensure(p.doctrine === null || typeof p.doctrine === 'string');
  ensure(st.world.hegemon === '' || own(STATES, st.world.hegemon));
  ensure(Number.isInteger(p.rank) && p.rank >= 0 && p.rank < RANKS.length);
  numericMap(p.skills, defaults.player.skills, 0, SKILL_MAX);
  numericMap(p.skillExp, defaults.player.skillExp, 0);
  numericMap(p.stats, defaults.player.stats, 1, 100);
  numericMap(p.inventory, GOODS, 0);
  ensure(Array.isArray(p.cards) && p.cards.every(id => typeof id === 'string' && own(NPC_MAP, id)));
  ensure(Array.isArray(p.visitedCities) && p.visitedCities.every(id => typeof id === 'string' && own(CITY_MAP, id)));
  // 商号：旧存档为城市 id 数组，新结构为对象数组
  ensure(Array.isArray(p.shops));
  for (const shop of p.shops) {
    if (typeof shop === 'string') { ensure(own(CITY_MAP, shop)); continue; }
    ensure(object(shop) && typeof shop.city === 'string' && own(CITY_MAP, shop.city));
  }
  // 旧档无法重建全部足迹，至少保留故乡与目前所在城市。
  p.visitedCities = [...new Set([...p.visitedCities, p.homeCity, p.cityId])];
  p.givenAway = Number.isFinite(p.givenAway) ? Math.max(0, p.givenAway) : 0;
  p.peakMoney = Number.isFinite(p.peakMoney) ? Math.max(0, p.peakMoney) : p.money;
  p.pacts = Array.isArray(p.pacts) ? p.pacts.filter(x => object(x) && own(STATES, x.state)) : [];
  p.passiveIncome = Number.isFinite(p.passiveIncome) ? Math.max(0, p.passiveIncome) : 0;
  p.shops = p.shops.map(shop => (typeof shop === 'string'
    ? { city: shop, level: 1, hired: 0, bonus: 0 }
    : { city: shop.city, level: Math.max(1, Math.min(3, Math.round(shop.level ?? 1))), hired: Math.max(0, Math.round(shop.hired ?? 0)), bonus: Math.max(0, Math.round(shop.bonus ?? 0)) }));
  for (const w of p.works) ensure(object(w) && typeof w.title === 'string' && Number.isInteger(w.year));
  for (const r of Object.values(p.relations)) {
    ensure(object(r)); fill(r, { aff: 0, met: false, gifts: 0 });
  }
  for (const l of st.log) ensure(object(l) && typeof l.text === 'string' && typeof l.d === 'string'
    && (l.kind == null || typeof l.kind === 'string'));
  for (const q of ['active', 'done', 'offers']) {
    st.quests[q] ??= [];
    ensure(Array.isArray(st.quests[q]));
    for (const quest of st.quests[q]) {
      ensure(object(quest) && typeof quest.id === 'string' && typeof quest.title === 'string');
      // 已了差事允许缺 mode（旧档/测试存档）；进行中与榜上必须有合法 mode
      if (q !== 'done' || quest.mode != null) {
        ensure(['travel', 'combat', 'debate', 'check', 'followup'].includes(quest.mode));
      }
      for (const key of ['targetCity', 'originCity', 'cityId']) {
        if (quest[key] != null) ensure(own(CITY_MAP, quest[key]));
      }
      for (const key of ['npcId', 'npcId2']) {
        if (quest[key] != null) ensure(own(NPC_MAP, quest[key]));
      }
      for (const key of ['days', 'exp', 'qty', 'difficulty', 'dc', 'routeDays']) {
        if (quest[key] != null) ensure(Number.isFinite(quest[key]));
      }
      if (quest.reward != null) numericMap(quest.reward);
      if (quest.mode === 'travel') ensure(own(CITY_MAP, quest.targetCity));
      if (quest.mode === 'combat') {
        ensure(object(quest.enemy) && typeof quest.enemy.name === 'string');
        for (const key of ['wu', 'skill', 'hp']) {
          if (quest.enemy[key] != null) ensure(Number.isFinite(quest.enemy[key]));
        }
      }
      if (quest.mode === 'debate') ensure(own(STATES, quest.targetState));
      if (quest.mode === 'check') ensure(own(defaults.player.skills, quest.checkSkill));
      if (quest.kind === 'supply') ensure(own(GOODS, quest.goodId) && Number.isInteger(quest.qty) && quest.qty > 0);
    }
  }
  ensure(st.events.fired.every(id => typeof id === 'string'));
  for (const entry of st.events.pending) {
    ensure(object(entry) && ['timeline', 'random'].includes(entry.kind));
    const defs = entry.kind === 'timeline' ? TIMELINE : RANDOM_EVENTS;
    ensure(defs.some(ev => ev.id === entry.id));
    ensure(object(entry.effects) && Array.isArray(entry.effects.notes)
      && entry.effects.notes.every(note => typeof note === 'string'));
  }
  st.world.owner ||= {};
  st.world.prices ||= {};
  st.world.power ||= {};
  for (const s of Object.values(STATES)) {
    if (st.world.power[s.id] == null) st.world.power[s.id] = s.power;
  }
  numericMap(st.world.power, STATES);
  for (const [id, owner] of Object.entries(st.world.owner)) {
    ensure(own(CITY_MAP, id) && own(STATES, owner));
  }
  for (const prices of Object.values(st.world.prices)) numericMap(prices, GOODS, 0);
  for (const c of CITIES) {
    if (!st.world.owner[c.id]) st.world.owner[c.id] = c.state;
    st.world.prices[c.id] = { ...priceSet(st, c.id), ...st.world.prices[c.id] };
  }
  st.npc ||= {};
  const year = st.time?.year ?? START_YEAR;
  for (const n of NPCS) {
    if (!st.npc[n.id]) st.npc[n.id] = { id: n.id, city: n.city, alive: npcAlive(n, year), affinity: 0, met: false, gifts: 0 };
    else {
      ensure(object(st.npc[n.id]) && own(CITY_MAP, st.npc[n.id].city));
      fill(st.npc[n.id], { id: n.id, city: n.city, alive: npcAlive(n, year), affinity: 0, met: false, gifts: 0 });
    }
  }
  st.quests ||= { active: [], done: [], board: null, boardDay: -99, offers: [] };
  st.player.peerage ||= null;
  if (st.player.peerage && (st.player.peerage.rank == null || st.player.peerage.rank < 0 || st.player.peerage.rank >= PEERAGES.length)) {
    st.player.peerage = null;
  }
  st.player.peerageTrial ||= null;
  st.player.peerageFails ||= 0;
  st.player.peerageHistory ||= [];
  st.player.evidence = Array.isArray(st.player.evidence) ? st.player.evidence.filter(x => typeof x === 'string') : [];
  st.flags ||= {};
  if (st.flags.evidenceCooldown && typeof st.flags.evidenceCooldown !== 'object') st.flags.evidenceCooldown = {};
  st.world.policy ||= null;
  // 珍宝：旧存档的 world.jade 迁移为 world.treasures.yu
  const legacyJade = st.world.jade;
  st.world.treasures ||= {};
  for (const id of TREASURE_IDS) {
    const def = TREASURES[id];
    const cur = st.world.treasures[id];
    st.world.treasures[id] = {
      price: cur?.price ?? (id === 'yu' && legacyJade?.price) ?? def.base,
      sold: cur?.sold ?? (id === 'yu' && legacyJade?.sold) ?? 0,
      cities: {},
    };
    const curCities = cur?.cities ?? {};
    const legacyCities = id === 'yu' ? (legacyJade?.cities ?? {}) : {};
    for (const cityId of def.cities) {
      const c = curCities[cityId] ?? legacyCities[cityId];
      st.world.treasures[id].cities[cityId] = { nextDay: c?.nextDay ?? 0 };
    }
  }
  delete st.world.jade;
  if (st.world.treasuresCollected?.xi) {
    st.world.treasuresCollected.xijiao = true;
    delete st.world.treasuresCollected.xi;
  }
  if (st.flags.offeredTreasures?.xi) {
    st.flags.offeredTreasures.xijiao = (st.flags.offeredTreasures.xijiao ?? 0) + st.flags.offeredTreasures.xi;
    delete st.flags.offeredTreasures.xi;
  }
  st.world.treasuresCollected ||= {};
  return st;
}

export function loadGame(key = SAVE_KEY) {
  try {
    const raw = store()?.getItem(key);
    if (!raw) return null;
    const st = JSON.parse(raw);
    if (!st || !st.player || !st.time) return null;
    return migrateState(st);
  } catch { return null; }
}
export function loadLatestGame() {
  const saves = [loadGame(), loadGame(AUTO_SAVE_KEY)].filter(Boolean);
  // 旧档没有实际保存时间，回退到游戏年月日；相同日期优先保留手动档。
  saves.sort((a, b) => (b.savedAt ?? 0) - (a.savedAt ?? 0)
    || b.time.year - a.time.year || b.time.month - a.time.month || b.time.day - a.time.day);
  return saves[0] ?? null;
}
export function saveAuto(st) {
  return saveGame(st, AUTO_SAVE_KEY);
}
export function loadAuto() {
  return loadGame(AUTO_SAVE_KEY);
}
export function autoSavedAt() {
  return loadAuto()?.savedAt ?? 0;
}

export function hasSave() {
  return !!loadLatestGame();
}
export function deleteSave() {
  try { store()?.removeItem(SAVE_KEY); } catch { /* ignore */ }
}
