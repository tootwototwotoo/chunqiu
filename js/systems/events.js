// 历史与随机事件
import { TIMELINE, RANDOM_EVENTS } from '../data/events.js';
import { NPC_MAP } from '../data/npcs.js';
import { GOODS } from '../data/goods.js';
import { CITIES, CITY_MAP, STATES } from '../data/world.js';
import {
  player, addMoney, addFame, addMerit, addStat, addSkillExp, addRel, addStamina, addHealth, meetNpc, addLog, skillLevel
} from '../state.js';
import { ri, clamp, weightedPick } from '../util.js';
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

// 先结算天下变化，再存入可序列化的待处理选择；弹窗只负责展示。
function queueEvent(st, kind, ev) {
  const effects = applyEffects(st, ev.effects);
  (st.events.pending ||= []).push({ kind, id: ev.id, effects });
  return { kind, ev, effects };
}

export function pendingEvents(st) {
  return (st.events.pending ?? []).flatMap(p => {
    const defs = p.kind === 'timeline' ? TIMELINE : RANDOM_EVENTS;
    const ev = defs.find(ev => ev.id === p.id);
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

export function resolveChoice(st, ev, choice) {
  if (!choiceAvailable(st, choice)) return { ok: false, msg: '条件不足。' };
  let effects = choice.effects ?? [];
  let success = true;
  let checkInfo = null;
  if (choice.check) {
    const c = choice.check;
    const isSkill = Object.keys(player(st).skills).includes(c.k);
    const lv = isSkill ? skillLevel(st, c.k) : 0;
    const stat = isSkill ? (['jianshu', 'sheshu', 'bingfa'].includes(c.k) ? player(st).stats.wu : ['xuewen', 'biancai', 'quanmou'].includes(c.k) ? player(st).stats.zhi : player(st).stats.zheng) : player(st).stats[c.k] ?? 50;
    const roll = stat * 0.5 + lv * 6 + ri(st, 0, 30) + player(st).fame * 0.2;
    success = roll >= (c.dc ?? 50);
    effects = success ? (choice.success ?? []) : (choice.fail ?? []);
    checkInfo = { roll: Math.round(roll), dc: c.dc ?? 50, success };
  }
  const res = applyEffects(st, effects);
  const kind = TIMELINE.includes(ev) ? 'timeline' : 'random';
  finishEvent(st, kind, ev.id);
  const text = choice.text ?? (success ? '事成了。' : '事未成。');
  return { ok: true, success, text, notes: res.notes, pendingDuel: res.pendingDuel, checkInfo };
}
