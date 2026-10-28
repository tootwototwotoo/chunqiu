// 交游：交谈、赠礼、师事、切磋
import { NPC_MAP } from '../data/npcs.js';
import { GOODS } from '../data/goods.js';
import { STATES } from '../data/world.js';
import { SKILL_DEFS } from '../data/defs.js';
import {
  player, rel, meetNpc, addRel, addFame, addMoney, addGoods, addStamina, addHealth, addLog, addSkillExp, skillLevel, R
} from '../state.js';
import { ri, GIFT_TIER_NAMES, absDay } from '../util.js';


const GREET = {
  0: ['{n}抬眼看了看你，未置一词。', '{n}正在会客，只向你略一点头。', '你在阶下候了片刻，{n}才命人传见。'],
  1: ['{n}见你来了，命人看座。', '{n}放下手中的简册，与你说起近来的事。', '{n}笑道：「又是你。」'],
  2: ['{n}起身相迎，执你的手入座。', '{n}道：「多日不见，甚是想念。」', '{n}命人奉上热羹，与你谈至日暮。'],
  3: ['{n}见你至，屏退左右，与你密谈。', '{n}道：「天下事，唯君可与言。」', '{n}取出一卷密简，递与你。'],
};

export function affTier(aff) {
  if (aff >= 100) return 5;
  if (aff >= 75) return 4;
  if (aff >= 52) return 3;
  if (aff >= 32) return 2;
  if (aff >= 15) return 1;
  return 0;
}
export const affName = (aff) => GIFT_TIER_NAMES[affTier(aff)];


export function talk(st, npcId) {
  const def = NPC_MAP[npcId];
  if (!def) return null;
  meetNpc(st, npcId);
  const r = rel(st, npcId);
  const t = affTier(r.aff);
  const line = R.pick(st, GREET[Math.min(3, t)]).replaceAll('{n}', def.name);
  // 十日之内反复攀谈，交情不再增长
  st.flags.lastTalk = st.flags.lastTalk ?? {};
  const now = absDay(st.time);
  if (st.flags.lastTalk[npcId] && now - st.flags.lastTalk[npcId] < 10) {
    return { def, r, aff: 0, line, extra: '（近日已叙，话说尽了。）', offer: null, repeated: true };
  }
  st.flags.lastTalk[npcId] = now;
  let aff = 1;
  const p = player(st);
  if (R.chance(st, 0.18 + p.stats.mei / 400)) aff += 1;
  if (def.bias === 'ming' && p.fame > 40) aff += 1;
  addRel(st, npcId, aff);

  // 闲谈所得
  let extra = '';
  if (r.aff >= 32 && R.chance(st, 0.35)) {
    const pool = [
      `「${R.pick(st, Object.values(STATES)).name}国近日多事，君宜留意。」`,
      `「闻${R.pick(st, Object.values(NPC_MAP)).name}近日行踪不定，或可一见。」`,
      '「市上物价，随时而变，贱取如珠玉，贵出如粪土。」',
      '「为政不难，难在得人。」',
      '「兵者不祥之器，不得已而用之。」',
    ];
    extra = R.pick(st, pool);
    if (R.chance(st, 0.25)) addFame(st, 1);
  }
  // 高好感偶有请托
  let offer = null;
  if (r.aff >= 52 && R.chance(st, 0.18)) {
    offer = {
      money: 40 + ri(st, 0, 60),
      text: `「有一事相托：${R.pick(st, ['为我送一封书简', '代我探望一位故人', '替我留意市上行情'])}。若成，当有薄谢。」`,
    };
  }
  return { def, r, aff, line, extra, offer };
}

export function giftValue(def, goodId) {
  const g = GOODS[goodId];
  if (!g) return 0;
  const match = def.pref === goodId;
  // 价值压平：便宜货也有心意，贵重物不再一枚顶十次交往
  // 珍宝不以市价折算交情，只按珍稀程度给固定心意
  const rawBase = g.treasure ? 8 + Math.round(g.base / 260) : 3 + g.base / 25;
  const raw = Math.round(rawBase * (match ? 1.6 : 1.0));
  // 顶级珍物也换不来无限情谊：单次赠礼有上限
  return Math.min(match ? 20 : 12, raw);
}

export function giftBlockReason(st, npcId) {
  const r = rel(st, npcId);
  if (r.aff >= 75) return '情谊已深，非财货可增。';
  st.flags.lastGift ||= {};
  const day = absDay(st.time);
  const last = st.flags.lastGift[npcId];
  // 首日的 absDay 为 0，不能用真假值判断是否赠过礼
  if (last != null && day - last < 10) return `近日已受君之礼，${10 - (day - last)} 日后再来罢。`;
  return null;
}

export function giveGift(st, npcId, goodId) {
  const def = NPC_MAP[npcId];
  const inv = player(st).inventory[goodId] ?? 0;
  if (inv <= 0) return { ok: false, msg: '你并无此物。' };
  const blocked = giftBlockReason(st, npcId);
  if (blocked) return { ok: false, msg: blocked };
  addGoods(st, goodId, -1);
  meetNpc(st, npcId);
  st.flags.lastGift ||= {};
  st.flags.lastGift[npcId] = absDay(st.time);
  const base = giftValue(def, goodId);
  const cap = giftValue(def, goodId) >= 20 ? 20 : 12;
  const rolled = Math.min(cap, Math.round(base * (0.8 + R.next(st) * 0.4)));
  const v = Math.min(rolled, Math.max(0, 75 - rel(st, npcId).aff));
  if (v <= 0) return { ok: false, msg: '情谊已深，非财货可增。' };
  addRel(st, npcId, v);
  const r = rel(st, npcId);
  const match = def.pref === goodId;
  addLog(st, `赠${def.name}${GOODS[goodId].name}，好感+${v}。`, 'gain');
  return {
    ok: true, gain: v, aff: r.aff, match,
    line: match ? `${def.name}接过${GOODS[goodId].name}，眼中掠过一丝喜色。` : `${def.name}道了声谢，将${GOODS[goodId].name}交给从人。`,
  };
}

export function canTeach(st, npcId, skill) {
  const def = NPC_MAP[npcId];
  if (!def?.teach?.includes(skill)) return false;
  return (def.skills?.[skill] ?? 0) >= 3;
}

export function learnFrom(st, npcId, skill) {
  const def = NPC_MAP[npcId];
  const r = rel(st, npcId);
  if (r.aff < 25) return { ok: false, msg: `${def.name}与你尚未相熟，不便受业。` };
  const cost = 25 + (def.skills?.[skill] ?? 3) * 8;
  if (player(st).money < cost) return { ok: false, msg: `束脩需${cost}金，囊中不足。` };
  if (player(st).stamina < 12) return { ok: false, msg: '精神不济，难以就学。' };
  addMoney(st, -cost, true);
  addStamina(st, -12);
  const npcLv = def.skills?.[skill] ?? 3;
  const exp = 26 + npcLv * 7 + ri(st, 0, 12);
  const res = addSkillExp(st, skill, exp);
  addRel(st, npcId, 2);
  const name = SKILL_DEFS[skill]?.name ?? skill;
  addLog(st, `从${def.name}习${name}，技业精进。`, 'gain');
  return {
    ok: true, exp, leveled: res.leveled, lv: res.lv, npcLv,
    line: `你执弟子礼，${def.name}为你讲授${name}要旨，自晨至昏。`,
  };
}

export function npcDuelInfo(st, npcId) {
  const def = NPC_MAP[npcId];
  return {
    id: npcId, name: def.name,
    wu: def.stats.wu,
    skill: def.skills.jianshu ?? Math.round(def.stats.wu / 14),
  };
}

export function npcDebateInfo(st, npcId) {
  const def = NPC_MAP[npcId];
  return {
    id: npcId, name: def.name, title: def.title, bias: def.bias,
    stats: def.stats,
    difficulty: 34 + def.stats.zhi * 0.4,
    topic: `论${STATES[CITY_STATE(def.city)].name}国之政`,
  };
}

import { CITY_MAP } from '../data/world.js';
const CITY_STATE = (cityId) => CITY_MAP[cityId]?.state ?? 'zhou';

export function teachInfo(st, npcId) {
  const def = NPC_MAP[npcId];
  return (def.teach ?? []).map(k => ({
    key: k, name: SKILL_DEFS[k]?.name ?? k,
    npcLv: def.skills?.[k] ?? 0,
    myLv: skillLevel(st, k),
    cost: 25 + (def.skills?.[k] ?? 3) * 8,
    can: rel(st, npcId).aff >= 25,
  }));
}

export function giftCandidates(st, npcId) {
  const def = NPC_MAP[npcId];
  const blocked = giftBlockReason(st, npcId);
  return Object.keys(GOODS).map(g => ({
    id: g, name: GOODS[g].name, have: player(st).inventory[g] ?? 0,
    pref: def.pref === g,
    gain: blocked ? 0 : Math.min(giftValue(def, g), Math.max(0, 75 - rel(st, npcId).aff)),
    blocked,
  }));
}


// 求医：医者、百工可疗伤。医和、医缓为名家，效果更好。
export function healBy(st, npcId) {
  const def = NPC_MAP[npcId];
  const p = player(st);
  if (!def) return { ok: false, msg: '并无此人。' };
  const r = rel(st, npcId);
  if (r.aff < 15) return { ok: false, msg: `${def.name}与你素不相识，不肯施治。` };
  const famous = ['yi_he', 'yi_huan'].includes(npcId);
  const cost = famous ? 200 : 80;
  if (p.money < cost) return { ok: false, msg: `诊金需${cost}金，囊中不足。` };
  if (p.health >= 100 && p.stamina >= p.staminaMax) {
    return { ok: false, msg: `${def.name}诊过脉：「君无疾，不必服药。」` };
  }
  addMoney(st, -cost, true);
  const heal = famous ? 25 + ri(st, 0, 10) : 14 + ri(st, 0, 8);
  const before = p.health;
  addHealth(st, heal);
  addStamina(st, 10);
  addRel(st, npcId, 2);
  addLog(st, `请${def.name}诊治，健康${p.health - before >= 0 ? '+' : ''}${p.health - before}。`, 'gain');
  return {
    ok: true, cost, heal: p.health - before,
    msg: `${def.name}诊脉、施针、处汤药，你的气色好了些（健康 +${p.health - before}）。`,
  };
}

// 谁能看病
export const HEALERS = ['yi_he', 'yi_huan'];
export const CAN_HEAL = (npcId) => HEALERS.includes(npcId) || NPC_MAP[npcId]?.role === 'artisan';
