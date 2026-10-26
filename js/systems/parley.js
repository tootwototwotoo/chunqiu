// 分庭抗礼：商人以商贾之身见君，谈利不谈政
// 复用廷对的「认同度」框架，但换题库、换效果、换门槛。
import { PARLEY, PARLEY_QUESTIONS, PARLEY_THRESHOLD, PARLEY_TOPICS, MERCHANT_RANKS } from '../data/merchant.js';
import { STATES, CITY_MAP } from '../data/world.js';
import { player, addLog, addFame, addMoney, skillLevel } from '../state.js';
import { rankIndexOf } from './merchant.js';
import { absDay, clamp, shuffle } from '../util.js';

const isMerchant = (st) => player(st).profession === 'shangren';
const BASE = { hit: 15, reason: 7, evade: -5 };

export function parleyCooldownLeft(st, stateId) {
  const last = st.flags?.lastParley?.[stateId];
  if (last == null) return 0;
  return Math.max(0, PARLEY.cooldownDays - (absDay(st.time) - last));
}

export function canParley(st, stateId) {
  const p = player(st);
  if (!isMerchant(st)) return { ok: false, msg: '唯商贾可行分庭抗礼。' };
  if (rankIndexOf(st) < PARLEY.minRank) {
    return { ok: false, msg: `须至${MERCHANT_RANKS[PARLEY.minRank].name}方可与诸侯分庭抗礼。` };
  }
  if (p.fame < PARLEY.minFame) return { ok: false, msg: `名声不足（${p.fame}/${PARLEY.minFame}）。` };
  if (p.money < PARLEY.minMoney) return { ok: false, msg: `家资不足（${p.money}/${PARLEY.minMoney}），诸侯不以为重。` };
  if (!STATES[stateId]) return { ok: false, msg: '并无此国。' };
  const city = CITY_MAP[p.cityId];
  if (!city || st.world.owner[city.id] !== stateId || !city.tags.includes('court')) {
    return { ok: false, msg: `须至${STATES[stateId].name}国朝堂。` };
  }
  const cd = parleyCooldownLeft(st, stateId);
  if (cd > 0) return { ok: false, msg: `${STATES[stateId].name}君尚在气头上，${cd}日后可再请见。` };
  return { ok: true };
}

// 开始一场交涉；topic 决定成功后的效果
export function startParley(st, stateId, topic = 'price') {
  const chk = canParley(st, stateId);
  if (!chk.ok) return chk;
  const p = player(st);
  const heard = st.world.owner[st.player.cityId];
  const pool = shuffle(st, PARLEY_QUESTIONS.filter(q => q.topic === topic || q.topic === 'price'));
  const picked = pool.slice(0, 3).map(q => ({ ...q, options: shuffle(st, q.options) }));
  // 起始认同：名声与辩才，另加与国君的交情
  const aff = p.relations?.[`ruler_${stateId}`]?.aff ?? 0;
  const start = clamp(
    45 + Math.floor(p.fame / 25) + Math.floor(skillLevel(st, 'biancai') / 2) + Math.floor(aff / 20),
    45, 65,
  );
  return {
    ok: true,
    stateId, topic, heard,
    heart: st.world.owner ? 'li' : 'li',
    questions: picked, round: 1, maxRounds: 3,
    agreement: start, start, history: [], log: [],
    over: false, success: false,
  };
}

export function currentParleyQuestion(pl) {
  return pl.questions[pl.round - 1] ?? null;
}

export function parleyAnswer(st, pl, index) {
  if (pl.over) return pl;
  const q = currentParleyQuestion(pl);
  const opt = q?.options?.[index];
  if (!opt) return pl;
  const base = BASE[opt.level] ?? 0;
  const delta = base;
  pl.agreement = clamp(pl.agreement + delta, 0, 100);
  pl.history.push({ round: pl.round, text: opt.text, level: opt.level, base, delta, agreement: pl.agreement });
  pl.log.push({ who: 'you', text: opt.text });
  pl.log.push({ who: 'ruler', text: opt.reply });
  pl.round++;
  if (pl.round > pl.maxRounds) {
    pl.over = true;
    pl.success = pl.agreement >= PARLEY_THRESHOLD;
  }
  return pl;
}

// 结算：成功按议题给效果
export function settleParley(st, pl) {
  if (!pl.over) return { ok: false, msg: '交涉未完。' };
  const p = player(st);
  st.flags.lastParley = st.flags.lastParley ?? {};
  st.flags.lastParley[pl.stateId] = absDay(st.time);

  if (!pl.success) {
    addFame(st, -PARLEY.failFame, true);
    addLog(st, `与${STATES[pl.stateId].name}君议而未合，名声-${PARLEY.failFame}。`, 'war');
    return {
      ok: true, success: false, agreement: pl.agreement,
      msg: `${STATES[pl.stateId].name}君摆手：「此事再议。」`,
      notes: [`议而未合，名声-${PARLEY.failFame}。`],
    };
  }

  const cfg = PARLEY.perTopic[pl.topic] ?? PARLEY.perTopic.price;
  p.merchantLevyBonus = p.merchantLevyBonus ?? {};
  const notes = [];
  if (cfg.levy) {
    const key = pl.stateId;
    p.merchantLevyBonus[key] = (p.merchantLevyBonus[key] ?? 0) + cfg.levy;
    const pct = Math.round((p.merchantLevyBonus[key]) * 100);
    notes.push(`${STATES[pl.stateId].name}市税减，牙钱共 +${pct}%`);
  }
  if (cfg.grainValue) {
    // 借粮：折成现金入库（以粮作价）
    addMoney(st, cfg.grainValue, true);
    notes.push(`得粮秣折 ${cfg.grainValue} 金`);
  }
  if (cfg.fame) {
    addFame(st, cfg.fame, true);
    notes.push(`名声${cfg.fame > 0 ? '+' : ''}${cfg.fame}`);
  }
  addLog(st, `与${STATES[pl.stateId].name}君分庭抗礼，成（认同 ${pl.agreement}）。${notes.join('，')}。`, 'big');
  return {
    ok: true, success: true, agreement: pl.agreement, topic: pl.topic,
    msg: `${STATES[pl.stateId].name}君抚掌：「君虽商贾，识见过人。」`,
    notes,
  };
}

// 交涉带来的牙钱加成（按国）
export function parleyLevyBonus(st, cityId) {
  const stateId = st.world.owner[cityId];
  return player(st).merchantLevyBonus?.[stateId] ?? 0;
}

export function parleyTopics() {
  return Object.values(PARLEY_TOPICS);
}
