// 差事：官府委托、行商契约、游说使命、讲学之请
import { CITY_MAP, CITIES, STATES, cityState } from '../data/world.js';
import { GOODS } from '../data/goods.js';
import { NPC_MAP } from '../data/npcs.js';
import { R, player, addMoney, addFame, addMerit, addRel, addLog, addGoods, skillLevel,
  npcsHere, rel, R as Rand } from '../state.js';
import { absDay } from './calendar.js';
import { priceAt } from './trade.js';
import { ri, clamp } from '../util.js';

let seq = 0;
const nid = () => `q${Date.now().toString(36)}${(seq++).toString(36)}`;

function giverOf(st, city) {
  const here = npcsHere(st);
  if (here.length && R.chance(st, 0.75)) {
    const n = R.pick(st, here);
    return { npcId: n.id, name: n.def.name, title: n.def.title };
  }
  const owner = cityState(st, city.id);
  const names = {
    zhou: '王城司徒', qi: '齐之司徒', jin: '晋之司马', qin: '秦之庶长', chu: '楚之司马',
    lu: '鲁之司徒', song: '宋之司城', wei: '卫之大夫', zheng: '郑之当国', yan: '燕之大夫',
    wu: '吴之行人', yue: '越之大夫', chen: '陈之司徒', cai: '蔡之司马', cao: '曹之大夫',
  };
  return { npcId: null, name: names[owner] ?? '乡邑长者', title: STATES[owner].name + '国' };
}

function randomOtherCity(st, from) {
  const pool = CITIES.filter(c => c.id !== from);
  return R.pick(st, pool);
}

const TEMPLATES = {
  escort(st, city) {
    const target = randomOtherCity(st, city.id);
    const days = 8 + Math.round(Math.abs(CITY_MAP[city.id].x - target.x) / 40) + R.int(st, 0, 5);
    const g = giverOf(st, city);
    return {
      kind: 'escort', mode: 'travel', title: `护送行旅至${target.name}`,
      desc: `${g.name}托你护送一队行旅前往${target.name}，务必于限期之内抵达。`,
      giverName: g.name, npcId: g.npcId, originCity: city.id, targetCity: target.id,
      days, exp: absDay(st.time) + days,
      reward: { money: 40 + days * 5 + player(st).fame * 2, fame: 3, merit: 8, rel: g.npcId ? 6 : 0 },
      difficulty: 1,
    };
  },
  supply(st, city) {
    const target = randomOtherCity(st, city.id);
    const goodId = R.pick(st, Object.keys(GOODS));
    const qty = 3 + R.int(st, 0, 4);
    const p = priceAt(st, target.id, goodId);
    const g = giverOf(st, city);
    return {
      kind: 'supply', mode: 'travel', title: `运${GOODS[goodId].name} ${qty}${GOODS[goodId].unit}至${target.name}`,
      desc: `${target.name}缺${GOODS[goodId].name}，若有商人能运${qty}${GOODS[goodId].unit}至彼处，官府加倍偿付。须自备货物。`,
      giverName: g.name, npcId: g.npcId, originCity: city.id, targetCity: target.id,
      goodId, qty, days: 14, exp: absDay(st.time) + 14,
      reward: { money: Math.round(p * qty * 1.45), fame: 3, merit: 6, rel: g.npcId ? 5 : 0 },
      difficulty: 1,
    };
  },
  duel(st, city) {
    const g = giverOf(st, city);
    const tier = 1 + Math.floor(player(st).fame / 25);
    const enemy = {
      name: R.pick(st, ['地方恶少', '横行剑客', '山中贼首', '亡命之徒']),
      wu: 40 + tier * 7 + R.int(st, 0, 8), skill: clamp(2 + tier, 1, 8),
    };
    return {
      kind: 'duel', mode: 'combat', title: `除去${city.name}恶徒`,
      desc: `${g.name}言：城中有一${enemy.name}，横行市肆，官府不能制。若能除此人，当有重谢。`,
      giverName: g.name, npcId: g.npcId, originCity: city.id,
      days: 20, exp: absDay(st.time) + 20, enemy,
      reward: { money: 60 + tier * 30, fame: 4 + tier, merit: 12 + tier * 4, rel: g.npcId ? 8 : 0 },
      difficulty: tier,
    };
  },
  persuade(st, city) {
    const here = npcsHere(st).filter(n => n.def.role !== 'ruler');
    const target = here.length ? R.pick(st, here).def : null;
    const other = R.pick(st, Object.keys(STATES).filter(s => s !== cityState(st, city.id) && s !== 'zhou'));
    const g = giverOf(st, city);
    return {
      kind: 'persuade', mode: 'debate', title: target ? `说${target.name}结好${STATES[other].name}` : `出使${STATES[other].name}`,
      desc: `${g.name}欲与${STATES[other].name}国通好，请你前往游说。`,
      giverName: g.name, npcId: g.npcId, originCity: city.id,
      npcId2: target?.id ?? null, targetState: other,
      days: 15, exp: absDay(st.time) + 15,
      difficulty: 38 + Math.round(player(st).fame * 0.2),
      reward: { money: 70, fame: 5, merit: 10, rel: g.npcId ? 6 : 0 },
    };
  },
  lecture(st, city) {
    const g = giverOf(st, city);
    return {
      kind: 'lecture', mode: 'check', title: `设讲席于${city.name}`,
      desc: `${g.name}请你在${city.name}设讲，士人子弟皆来听讲。`,
      giverName: g.name, npcId: g.npcId, originCity: city.id,
      days: 10, exp: absDay(st.time) + 10,
      checkSkill: 'xuewen', dc: 34 + player(st).fame * 0.25,
      reward: { money: 30 + player(st).disciples * 3, fame: 5, merit: 6, rel: g.npcId ? 5 : 0 },
      difficulty: 1,
    };
  },
  patrol(st, city) {
    const g = giverOf(st, city);
    return {
      kind: 'patrol', mode: 'check', title: `巡守${city.name}郊野`,
      desc: `${g.name}命你率卒巡守郊野，缉捕盗贼，安抚乡里。`,
      giverName: g.name, npcId: g.npcId, originCity: city.id,
      days: 12, exp: absDay(st.time) + 12,
      checkSkill: 'bingfa', dc: 32 + player(st).fame * 0.2,
      reward: { money: 40, fame: 2, merit: 16, rel: g.npcId ? 6 : 0 },
      difficulty: 1,
    };
  },
};

const KIND_BY_PROF = {
  youxia: ['duel', 'escort', 'patrol', 'duel'],
  shangren: ['supply', 'supply', 'escort', 'supply'],
  shuike: ['persuade', 'escort', 'persuade', 'escort'],
  xuezhe: ['lecture', 'lecture', 'persuade', 'escort'],
};

export function refreshBoard(st, force = false) {
  const now = absDay(st.time);
  const cid = player(st).cityId;
  if (!force && st.quests.board === cid && now - st.quests.boardDay < 10) return st.quests.offers;
  const city = CITY_MAP[cid];
  const prof = player(st).profession;
  const kinds = KIND_BY_PROF[prof] ?? ['escort', 'duel'];
  const offers = [];
  const seen = new Set();
  let guard = 0;
  while (offers.length < 4 && guard++ < 40) {
    const kind = R.pick(st, kinds);
    const q = TEMPLATES[kind](st, city);
    const key = `${q.kind}-${q.targetCity ?? ''}-${q.goodId ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    q.id = nid();
    q.status = 'board';
    q.cityId = cid;
    offers.push(q);
  }
  if (offers.length < 2) {
    const q = TEMPLATES.escort(st, city);
    q.id = nid(); q.status = 'board'; q.cityId = cid;
    offers.push(q);
  }
  st.quests.board = cid;
  st.quests.boardDay = now;
  st.quests.offers = offers;
  return offers;
}

export function acceptQuest(st, id) {
  const board = st.quests.offers ?? [];
  const idx = board.findIndex(q => q.id === id);
  if (idx < 0) return { ok: false, msg: '此差事已不在。' };
  const q = board[idx];
  if (player(st).stamina < 10) return { ok: false, msg: '体力不济，先歇息罢。' };
  board.splice(idx, 1);
  q.status = 'active';
  st.quests.active.push(q);
  addLog(st, `领受差事「${q.title}」。`);
  if (q.mode === 'combat') return { ok: true, instant: 'combat', quest: q };
  if (q.mode === 'debate') return { ok: true, instant: 'debate', quest: q };
  if (q.mode === 'check') return { ok: true, instant: 'check', quest: q };
  return { ok: true, quest: q, msg: `已领「${q.title}」，须于${q.days}日内完成。` };
}

export function checkArrivalQuests(st, cityId) {
  const done = [];
  const remain = [];
  for (const q of st.quests.active) {
    if (q.status !== 'active') continue;
    if (q.mode === 'travel' && q.targetCity === cityId) {
      if (q.kind === 'supply') {
        const have = player(st).inventory[q.goodId] ?? 0;
        if (have < q.qty) { remain.push(q); continue; }
        addGoods(st, q.goodId, -q.qty);
      }
      completeQuest(st, q, true);
      done.push(q);
    } else remain.push(q);
  }
  st.quests.active = remain;
  return done;
}

export function completeQuest(st, q, success = true) {
  q.status = success ? 'done' : 'failed';
  st.quests.done.unshift(q);
  if (st.quests.done.length > 60) st.quests.done.length = 60;
  st.stats.quests++;
  if (!success) {
    addFame(st, -1, true);
    addLog(st, `差事「${q.title}」未成。`);
    return { ok: false };
  }
  const rw = q.reward ?? {};
  if (rw.money) addMoney(st, rw.money, true);
  if (rw.fame) addFame(st, rw.fame, true);
  if (rw.merit && player(st).stateId) addMerit(st, rw.merit, true);
  if (rw.rel && q.npcId) addRel(st, q.npcId, rw.rel);
  if (q.kind === 'persuade') st.player.missions += 1;
  if (q.kind === 'lecture') st.player.disciples += 1;
  addLog(st, `差事「${q.title}」成。得金${rw.money ?? 0}，名声+${rw.fame ?? 0}。`, 'gain');
  return { ok: true, reward: rw };
}

export function expireQuests(st) {
  const now = absDay(st.time);
  const failed = [];
  st.quests.active = st.quests.active.filter(q => {
    if (q.mode === 'travel' && q.exp != null && now > q.exp) {
      q.status = 'failed'; failed.push(q);
      st.quests.done.unshift(q);
      addFame(st, -2, true);
      return false;
    }
    return true;
  });
  if (st.quests.done.length > 60) st.quests.done.length = 60;
  return failed;
}

export function resolveCheck(st, q) {
  const lv = skillLevel(st, q.checkSkill);
  const p = player(st);
  const stat = q.checkSkill === 'xuewen' ? p.stats.zhi : p.stats.wu;
  const roll = lv * 5 + stat * 0.4 + R.int(st, 0, 22);
  const ok = roll >= (q.dc ?? 40);
  if (ok) completeQuest(st, q, true);
  else completeQuest(st, q, false);
  return { ok, roll };
}

export function questRewardText(q) {
  const rw = q.reward ?? {};
  const parts = [];
  if (rw.money) parts.push(`金${rw.money}`);
  if (rw.fame) parts.push(`名声+${rw.fame}`);
  if (rw.merit) parts.push(`功勋+${rw.merit}`);
  return parts.join('、') || '薄礼';
}
