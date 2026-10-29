// 历史与随机事件
import { TIMELINE, RANDOM_EVENTS } from '../data/events.js';
import { NPC_MAP } from '../data/npcs.js';
import { GOODS } from '../data/goods.js';
import { CITIES, CITY_MAP, STATES } from '../data/world.js';
import {
  player, addMoney, addFame, addMerit, addStat, addSkillExp, addRel, addStamina, addHealth, meetNpc, addLog, skillLevel
} from '../state.js';
import { ri, clamp, weightedPick } from '../util.js';
import { statOfSkill } from '../data/defs.js';
import { absDay } from './calendar.js';

function currentWhere(st) {
  return { state: st.world.owner[st.player.cityId], city: st.player.cityId };
}

export function choiceAvailable(st, choice) {
  const req = choice.req;
  if (!req) return true;
  const p = player(st);
  const w = currentWhere(st);
  if (req.profession && p.profession !== req.profession) return false;
  if (req.state && w.state !== req.state) return false;
  if (req.city && p.cityId !== req.city) return false;
  if (req.fame && p.fame < req.fame) return false;
  if (req.money && p.money < req.money) return false;
  return true;
}

/**
 * 应用一组效果，返回 {notes:[], pendingDuel:object|null}
 */
// 支持的效果类型。全库唯一正本：applyEffects 的 switch 与测试均引用此表。
// 新增效果类型时只改这里 + switch 分支。
export const EFFECT_TYPES = [
  'money', 'fame', 'merit', 'stat', 'skill', 'skillxp', 'rel',
  'power', 'owner', 'flag', 'stamina', 'health', 'card', 'goods', 'duel', 'war', 'peace',
];

export function applyEffects(st, effects = []) {
  const out = { notes: [], pendingDuel: null };
  for (const e of effects) {
    switch (e.t) {
      case 'money':
        addMoney(st, e.v, true);
        out.notes.push(e.v >= 0 ? `得金${e.v}。` : `耗金${-e.v}。`);
        break;
      case 'fame':
        addFame(st, e.v, true);
        out.notes.push(`名声${e.v >= 0 ? '+' : ''}${e.v}。`);
        break;
      case 'merit':
        addMerit(st, e.v, true);
        out.notes.push(`功勋${e.v >= 0 ? '+' : ''}${e.v}。`);
        break;
      case 'stat':
        addStat(st, e.k, e.v);
        out.notes.push(`${e.k}属性+${e.v}。`);
        break;
      case 'skill': {
        const r = addSkillExp(st, e.k, 40 * (e.v ?? 1));
        out.notes.push(`技能精进${r.leveled ? '，晋一级' : ''}。`);
        break;
      }
      case 'skillxp': {
        const r = addSkillExp(st, e.k, e.v ?? 10);
        out.notes.push(`${e.k}技业+${e.v ?? 10}${r.leveled ? '，晋一级' : ''}。`);
        break;
      }
      case 'rel':
        addRel(st, e.id, e.v);
        meetNpc(st, e.id);
        out.notes.push(`与${NPC_MAP[e.id]?.name ?? e.id}交情+${e.v}。`);
        break;
      case 'power': {
        st.world.power[e.s] = clamp((st.world.power[e.s] ?? 30) + e.v, 3, 100);
        out.notes.push(`${STATES[e.s]?.name ?? e.s}国势${e.v >= 0 ? '+' : ''}${e.v}。`);
        break;
      }
      case 'owner':
        st.world.owner[e.c] = e.s;
        out.notes.push(`${CITY_MAP[e.c]?.name ?? e.c}归属${STATES[e.s]?.name ?? e.s}。`);
        break;
      case 'flag':
        st.flags[e.k] = e.v;
        if (st.world && e.k === 'hegemon') st.world.hegemon = e.v;
        break;
      case 'stamina':
        addStamina(st, e.v);
        out.notes.push(`体力${e.v >= 0 ? '+' : ''}${e.v}。`);
        break;
      case 'health':
        addHealth(st, e.v);
        out.notes.push(`健康${e.v >= 0 ? '+' : ''}${e.v}。`);
        break;
      case 'card':
        meetNpc(st, e.id);
        break;
      case 'goods': {
        for (const c of CITIES) {
          const set = st.world.prices[c.id];
          if (!set) continue;
          set[e.g] = Math.max(3, Math.round(set[e.g] * (1 + e.v)));
        }
        out.notes.push(`${GOODS[e.g]?.name ?? e.g}价${e.v > 0 ? '腾贵' : '回落'}。`);
        break;
      }
      case 'war': {
        // 只记录战争状态，不影响玩法；舆图据此给交战国城点加标记
        st.world.wars = Array.isArray(st.world.wars) ? st.world.wars : [];
        if (e.a && e.b && !st.world.wars.some(w => (w.a === e.a && w.b === e.b) || (w.a === e.b && w.b === e.a))) {
          st.world.wars.push({ a: e.a, b: e.b, since: absDay(st.time) });
        }
        break;
      }
      case 'peace': {
        st.world.wars = (st.world.wars ?? []).filter(w => !((w.a === e.a && w.b === e.b) || (w.a === e.b && w.b === e.a)));
        break;
      }
      case 'duel':
        out.pendingDuel = { name: '挑衅的剑客', wu: 44 + ri(st, 0, 14), skill: 2 + ri(st, 0, 3) };
        break;
      default: break;
    }
  }
  return out;
}

export function collectTimeline(st) {
  const out = [];
  for (const ev of TIMELINE) {
    if (ev.year !== st.time.year || ev.month !== st.time.month) continue;
    if (st.events.fired.includes(ev.id)) continue;
    st.events.fired.push(ev.id);
    // 记下触发日，供舆图「时事要地」显示；fired 仍用于去重
    st.events.firedOn = st.events.firedOn ?? {};
    st.events.firedOn[ev.id] = absDay(st.time);
    st.events.news.unshift({ year: ev.year, month: ev.month, title: ev.title, body: ev.body });
    if (st.events.news.length > 40) st.events.news.length = 40;
    addLog(st, `${ev.title}。`, 'war');
    out.push(queueEvent(st, 'timeline', ev));
  }
  return out;
}

export function rollRandomEvent(st) {
  const day = absDay(st.time);
  const recent = st.flags.recentRandom ?? {};
  const pool = RANDOM_EVENTS.filter(ev => {
    if (st.events.pending?.some(p => p.kind === 'random' && p.id === ev.id)) return false;
    if (recent[ev.id] != null && day - recent[ev.id] < 30) return false;
    try { return typeof ev.when === 'function' ? ev.when(st) : true; } catch { return true; }
  });
  if (!pool.length) return null;
  const picked = weightedPick(st, pool);
  recent[picked.id] = day;
  st.flags.recentRandom = recent;
  return queueEvent(st, 'random', picked);
}

// 事件 kind 注册表：新增一种事件类型只需在此登记一处。
// find(st, id) 反查事件定义；snapshot(ev) 取可序列化的定义快照。
// 快照必须是纯数据（会被 JSON.stringify 进存档）：
// 丢弃函数、DOM、循环引用等不可序列化值，避免 saveGame 抛错。
const snapshotOf = (ev) => {
  const seen = new WeakSet();
  const plain = (v, depth = 0) => {
    if (depth > 8) return undefined;
    if (v === null || typeof v !== 'object') {
      return typeof v === 'function' || typeof v === 'symbol' ? undefined : v;
    }
    if (seen.has(v)) return undefined;          // 循环引用
    seen.add(v);
    if (Array.isArray(v)) {
      return v.map(x => plain(x, depth + 1)).filter(x => x !== undefined);
    }
    // 只保留朴素对象（排除 Date/Map/DOM 等）
    const proto = Object.getPrototypeOf(v);
    if (proto !== Object.prototype && proto !== null) return undefined;
    const o = {};
    for (const k of Object.keys(v)) {
      const val = plain(v[k], depth + 1);
      if (val !== undefined) o[k] = val;
    }
    return o;
  };
  return plain(ev) ?? {};
};

export const EVENT_KINDS = {
  timeline: {
    label: '天下大势',
    find: (st, id) => TIMELINE.find(ev => ev.id === id) ?? null,
    snapshot: snapshotOf,
  },
  random: {
    label: '际遇',
    find: (st, id) => RANDOM_EVENTS.find(ev => ev.id === id) ?? null,
    snapshot: snapshotOf,
  },
  reign: {
    label: '君位更迭',
    // 更替事件按「更替」动态生成，不入静态表，故从快照还原
    find: (st, id, def) => def ?? { id },
    snapshot: snapshotOf,
  },
  arrival: {
    label: '人物流动',
    // 到达事件在触发时即已构建完整定义，从快照还原
    find: (st, id, def) => def ?? { id },
    snapshot: snapshotOf,
  },
};

export function isEventKind(kind) {
  return Object.hasOwn(EVENT_KINDS, kind);
}

// 事件类别在界面上的副标题
export function eventKindLabel(kind) {
  return EVENT_KINDS[kind]?.label ?? '际遇';
}

// 先结算天下变化，再存入可序列化的待处理选择；弹窗只负责展示。
// def 为可选的定义快照，供无法从静态表反查的类型（如 reign）使用。
export function queueEvent(st, kind, ev) {
  const effects = applyEffects(st, ev.effects);
  const reg = EVENT_KINDS[kind];
  (st.events.pending ||= []).push({
    kind, id: ev.id, effects,
    def: reg?.snapshot ? reg.snapshot(ev) : null,
  });
  return { kind, ev, effects };
}

// 反查一条待处理事件的定义：静态表查不到则退回快照
export function eventDefOf(kind, id, def) {
  const reg = EVENT_KINDS[kind];
  if (!reg) return null;
  return reg.find(null, id, def) ?? null;
}

export function pendingEvents(st) {
  return (st.events.pending ?? []).flatMap(p => {
    const reg = EVENT_KINDS[p.kind];
    if (!reg) return [];           // 未知 kind 静默跳过，不拖垮整档
    const ev = reg.find(st, p.id, p.def);
    return ev ? [{ kind: p.kind, ev, effects: p.effects }] : [];
  });
}

export function finishEvent(st, kind, id) {
  st.events.pending = (st.events.pending ?? []).filter(p => p.kind !== kind || p.id !== id);
}

export function prepareEvent(st, wrapped) {
  const ev = wrapped.ev;
  // 兼容外部直接传入的事件；新收集的事件与读档事件均已结算。
  wrapped.effects ??= applyEffects(st, ev.effects);
  return { kind: wrapped.kind, ev, effects: wrapped.effects, notes: wrapped.effects.notes };
}

// kind 必填：动态事件（reign）无法由静态表反推，缺失会导致条目无法出队
export function resolveChoice(st, ev, choice, kind) {
  if (!isEventKind(kind)) {
    throw new Error(`resolveChoice 需要合法的事件 kind（收到 ${JSON.stringify(kind)}）`);
  }
  if (!choiceAvailable(st, choice)) return { ok: false, msg: '条件不足。' };
  let effects = choice.effects ?? [];
  let success = true;
  let checkInfo = null;
  if (choice.check) {
    const c = choice.check;
    const isSkill = Object.keys(player(st).skills).includes(c.k);
    const lv = isSkill ? skillLevel(st, c.k) : 0;
    const statKey = isSkill ? statOfSkill(c.k) : c.k;
    const stat = player(st).stats[statKey] ?? 50;
    const roll = stat * 0.5 + lv * 6 + ri(st, 0, 30) + player(st).fame * 0.2;
    success = roll >= (c.dc ?? 50);
    effects = success ? (choice.success ?? []) : (choice.fail ?? []);
    checkInfo = { roll: Math.round(roll), dc: c.dc ?? 50, success };
  }
  const res = applyEffects(st, effects);
  finishEvent(st, kind, ev.id);
  const text = choice.text ?? (success ? '事成了。' : '事未成。');
  return { ok: true, success, text, notes: res.notes, pendingDuel: res.pendingDuel, checkInfo };
}
