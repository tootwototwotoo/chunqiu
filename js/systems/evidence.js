// 证据获取：查访 / 打听 / 购买（日常在城中完成）
import { DEBATES, EVIDENCE_BY_ID, BOOKSHOPS } from '../data/debates/index.js';
import { NPC_MAP } from '../data/npcs.js';
import { player, addEvidence, hasEvidence, addStamina, addMoney, addLog, skillLevel, rel, R } from '../state.js';

const DAY = (t) => (t.year + 722) * 360 + (t.month - 1) * 30 + t.day;


export function unowned(st, list) {
  return list.filter(e => e && !hasEvidence(st, e.id));
}

export function investigateHere(st, cityId = player(st).cityId) {
  return unowned(st, DEBATES
    .filter(d => d.evidence.source.type === 'investigate' && d.evidence.homeCity === cityId)
    .map(d => d.evidence));
}

export function marketHere(st, cityId = player(st).cityId) {
  if (!BOOKSHOPS.includes(cityId)) return [];
  return unowned(st, DEBATES
    .filter(d => d.evidence.source.type === 'market' && d.evidence.homeCity === cityId)
    .map(d => d.evidence));
}

export function npcEvidence(st, npcId) {
  return unowned(st, DEBATES
    .filter(d => d.evidence.source.type === 'npc' && d.evidence.source.npcId === npcId)
    .map(d => d.evidence));
}

export function investigateCooldown(st, cityId = player(st).cityId) {
  const until = st.flags.evidenceCooldown?.[cityId] ?? 0;
  return Math.max(0, until - DAY(st.time));
}

export function investigate(st, evidenceId) {
  const ev = EVIDENCE_BY_ID[evidenceId];
  const cityId = player(st).cityId;
  if (!ev || ev.source.type !== 'investigate') return { ok: false, msg: '此处无可查访的线索。' };
  if (ev.homeCity !== cityId) return { ok: false, msg: '此线索不在本城。' };
  if (hasEvidence(st, evidenceId)) return { ok: false, msg: '你已掌握此证据。' };
  const left = investigateCooldown(st, cityId);
  if (left > 0) return { ok: false, msg: `本城查访尚无头绪，${left} 日后再试。` };
  if (player(st).stamina < 8) return { ok: false, msg: '体力不足，无法查访。' };
  addStamina(st, -8);
  const lv = skillLevel(st, ev.source.skill);
  const roll = lv * 5 + player(st).stats.zhi * 0.25 + player(st).fame * 0.2 + R.int(st, 0, 22);
  if (roll >= (ev.source.dc ?? 44)) {
    addEvidence(st, evidenceId);
    addLog(st, `查访得证：「${ev.name}」。`, 'gain');
    return { ok: true, evidence: ev, msg: `查访有所得，掌握「${ev.name}」。` };
  }
  if (!st.flags.evidenceCooldown || typeof st.flags.evidenceCooldown !== 'object') st.flags.evidenceCooldown = {};
  st.flags.evidenceCooldown[cityId] = DAY(st.time) + 2;
  addLog(st, `查访「${ev.name}」无功而返。`);
  return { ok: false, msg: `查访无功，需 1 日后才能在本城再查。` };
}

export function askNpc(st, npcId, evidenceId) {
  const ev = EVIDENCE_BY_ID[evidenceId];
  if (!ev || ev.source.type !== 'npc' || ev.source.npcId !== npcId) return { ok: false, msg: '此人并无此消息。' };
  if (hasEvidence(st, evidenceId)) return { ok: false, msg: '你已掌握此证据。' };
  const r = rel(st, npcId);
  if (!r.met || r.aff <= 20) return { ok: false, msg: '交情尚浅，对方不肯多说。' };
  if (player(st).stamina < 6) return { ok: false, msg: '体力不足，无法细谈。' };
  addStamina(st, -6);
  addEvidence(st, evidenceId);
  addLog(st, `向${NPC_MAP[ev.source.npcId]?.name ?? '城中人物'}打听，得「${ev.name}」。`, 'gain');
  return { ok: true, evidence: ev, msg: `打听一番，掌握「${ev.name}」。` };
}

export function buyEvidence(st, evidenceId) {
  const ev = EVIDENCE_BY_ID[evidenceId];
  const cityId = player(st).cityId;
  if (!ev || ev.source.type !== 'market') return { ok: false, msg: '书肆不出售此物。' };
  if (ev.homeCity !== cityId || !BOOKSHOPS.includes(cityId)) return { ok: false, msg: '此城书肆没有此物。' };
  if (hasEvidence(st, evidenceId)) return { ok: false, msg: '你已掌握此证据。' };
  const price = ev.source.price ?? 500;
  if (player(st).money < price) return { ok: false, msg: `要价 ${price} 金，囊中不足。` };
  addMoney(st, -price, true);
  addEvidence(st, evidenceId);
  addLog(st, `花 ${price} 金购得「${ev.name}」。`, 'gain');
  return { ok: true, evidence: ev, msg: `购得「${ev.name}」。` };
}

