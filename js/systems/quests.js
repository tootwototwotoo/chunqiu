// 差事：官府委托、行商契约、游说使命、讲学之请
import { CITY_MAP, CITIES, STATES, cityState } from '../data/world.js';
import { GOODS } from '../data/goods.js';
import { NPC_MAP } from '../data/npcs.js';
import { R, player, addMoney, addFame, addMerit, addRel, addLog, addGoods, skillLevel,
  npcsHere, rel, R as Rand } from '../state.js';
import { absDay } from './calendar.js';
import { shortestPath } from './pathfind.js';
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
    ju: '莒之大夫', zhu: '邾之大夫', sui: '随之大夫', xu: '许之大夫',
  };
  return { npcId: null, name: names[owner] ?? '乡邑长者', title: STATES[owner].name + '国' };
}

function randomOtherCity(st, from) {
  const pool = CITIES.filter(c => c.id !== from);
  return R.pick(st, pool);
}

// 以真实道路里程为准：从出发城到目标的单程日数
function routeFrom(st, fromCity, targetCity) {
  return shortestPath(fromCity.id, targetCity.id, st)?.days ?? 999;
}

// 差事目标：七成在同区域（路程较短）中选择，避免早期总被派到天边
function pickTarget(st, fromCity) {
  const pool = CITIES.filter(c => c.id !== fromCity.id)
    .map(c => ({ c, d: routeFrom(st, fromCity, c) }))
    .filter(x => x.d > 0)
    .sort((a, b) => a.d - b.d);
  if (!pool.length) return CITIES.find(c => c.id !== fromCity.id);
  if (R.chance(st, 0.7)) return R.pick(st, pool.slice(0, Math.max(3, Math.ceil(pool.length * 0.5)))).c;
  return R.pick(st, pool).c;
}

// 限期 = 单程路程 + 准备与缓冲；并按路程给酬金
function travelDeadline(st, fromCity, targetCity) {
  const days = routeFrom(st, fromCity, targetCity);
  return { route: days, days: days + 6 + R.int(st, 0, 3) };
}

const TEMPLATES = {
  escort(st, city) {
    const target = pickTarget(st, city);
    const plan = travelDeadline(st, city, target);
    const g = giverOf(st, city);
    return {
      kind: 'escort', mode: 'travel', title: `护送行旅至${target.name}`,
      desc: `${g.name}托你护送一队行旅前往${target.name}，路程约${plan.route}日，务必于限期之内抵达。`,
      giverName: g.name, npcId: g.npcId, originCity: city.id, targetCity: target.id,
      routeDays: plan.route, days: plan.days, exp: absDay(st.time) + plan.days,
      reward: { money: 35 + plan.route * 6 + player(st).fame * 2, fame: 3, merit: 8, rel: g.npcId ? 6 : 0 },
      difficulty: 1,
    };
  },
  supply(st, city) {
    const target = pickTarget(st, city);
    const plan = travelDeadline(st, city, target);
    const goodId = R.pick(st, Object.keys(GOODS));
    const qty = 3 + R.int(st, 0, 4);
    const p = priceAt(st, target.id, goodId);
    const g = giverOf(st, city);
    return {
      kind: 'supply', mode: 'travel', title: `运${GOODS[goodId].name} ${qty}${GOODS[goodId].unit}至${target.name}`,
      desc: `${target.name}缺${GOODS[goodId].name}，若有商人能运${qty}${GOODS[goodId].unit}至彼处，官府加倍偿付。须自备货物，路程约${plan.route}日。`,
      giverName: g.name, npcId: g.npcId, originCity: city.id, targetCity: target.id,
      goodId, qty, routeDays: plan.route, days: plan.days + 3, exp: absDay(st.time) + plan.days + 3,
      reward: { money: Math.round(p * qty * 1.45) + plan.route * 2, fame: 3, merit: 6, rel: g.npcId ? 5 : 0 },
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
      npcId2: target?.id ?? null,
      targetName: target?.name ?? null,
      targetBias: target?.bias ?? R.pick(st, ['li', 'yi', 'ming', 'shi']),
      targetState: other,
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

const canEarnMerit = (st) => ['youxia', 'shuike', 'xuezhe'].includes(player(st).profession);

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
    if (q.reward && !canEarnMerit(st)) delete q.reward.merit; // 商人无从仕途，不列功勋
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
  if (q.mode === 'travel' && q.targetCity) {
    const need = shortestPath(player(st).cityId, q.targetCity, st)?.days ?? 999;
    const allotted = q.days ?? 999;
    if (allotted < need + 1) return { ok: false, msg: `限期${allotted}日，而路程需${need}日，已然来不及。` };
    q.routeDays = need;
    // 限期自领受之日起算，避免榜文放置多日后平白扣减
    q.exp = absDay(st.time) + allotted;
  }
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
  if (!q) return { ok: false };
  // 防重复结算：只有进行中/榜上的差事才能被结算
  if (q.status !== 'active' && q.status !== 'board') return { ok: false, duplicate: true };
  q.status = success ? 'done' : 'failed';
  // 从进行中与榜文里移除，避免同一差事在「进行中」「已了」重复出现
  st.quests.active = (st.quests.active ?? []).filter(x => x.id !== q.id);
  st.quests.offers = (st.quests.offers ?? []).filter(x => x.id !== q.id);
  st.quests.done = (st.quests.done ?? []).filter(x => x.id !== q.id);
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
  // 功勋对可出仕的三途（游侠/说客/学者）始终累积，出仕后即用于晋升
  const meritGain = rw.merit && canEarnMerit(st) ? rw.merit : 0;
  if (meritGain) addMerit(st, meritGain, true);
  if (rw.rel && q.npcId) addRel(st, q.npcId, rw.rel);
  if (q.kind === 'persuade') st.player.missions += 1;
  if (q.kind === 'lecture') st.player.disciples += 1;
  const parts = [`得金${rw.money ?? 0}`, `名声+${rw.fame ?? 0}`];
  if (meritGain) parts.push(`功勋+${meritGain}`);
  addLog(st, `差事「${q.title}」成。${parts.join('，')}。`, 'gain');
  return { ok: true, reward: rw, merit: meritGain };
}

// 清理历史存档中残留的已完成差事，去重
export function sanitizeQuests(st) {
  const done = [], doneSeen = new Set();
  for (const q of st.quests.done ?? []) {
    if (!q) continue;
    // 已了列表只收已结算的差事；旧存档里状态缺失但确实在已了的，补为 done
    if (q.status !== 'done' && q.status !== 'failed') q.status = 'done';
    if (doneSeen.has(q.id)) continue;
    doneSeen.add(q.id);
    done.push(q);
  }
  const active = [], activeSeen = new Set();
  for (const q of st.quests.active ?? []) {
    if (!q || q.status !== 'active') continue;
    if (activeSeen.has(q.id) || doneSeen.has(q.id)) continue; // 同 id 已在已了，绝不重复
    activeSeen.add(q.id);
    active.push(q);
  }
  st.quests.active = active;
  st.quests.done = done.slice(0, 60);
  st.quests.offers = (st.quests.offers ?? []).filter(q => q && q.status === 'board');
  return st;
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
  const res = ok ? completeQuest(st, q, true) : completeQuest(st, q, false);
  return { ok, roll, reward: res.reward, merit: res.merit };
}

export function questRewardText(q, st = null) {
  const rw = q.reward ?? {};
  const parts = [];
  if (rw.money) parts.push(`金${rw.money}`);
  if (rw.fame) parts.push(`名声+${rw.fame}`);
  if (rw.merit && (!st || canEarnMerit(st))) parts.push(`功勋+${rw.merit}`);
  return parts.join('、') || '薄礼';
}
