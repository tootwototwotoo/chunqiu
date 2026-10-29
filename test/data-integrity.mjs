// 数据「孤立引用」与「时间轴完整性」检查
//
// 与 field-usage / dead-code 同属一类：数据看起来齐全，但指向不存在的目标
// 或落在不合理的位置，运行时不会报错，只是永远不生效。
//
// 例如：NPC 的 city 指向不存在的城 → 该 NPC 永远不出现；
//       论辩证据的 npcId 不存在 → 该证据永远拿不到。
//
// 分三组：
//   A. 孤立引用（id 指向不存在的实体）—— 必须为 0，否则失败
//   B. 语义一致性（city 与 state 是否相符等）—— 必须为 0
//   C. 时间轴完整性（某国某年无在位国君）—— 只报告，不失败
//      （史料确实有缺载年份，audienceRuler 有合成国君兜底）

import { NPCS, NPC_MAP, rulerOf } from '../js/data/npcs.js';
import { CITIES, CITY_MAP, STATES } from '../js/data/world.js';
import { GOODS } from '../js/data/goods.js';
import { TREASURE_IDS } from '../js/data/treasures.js';
import { DEBATES } from '../js/data/debates/index.js';
import { VOICES } from '../js/data/debates/voices.js';
import { LINES } from '../js/data/debates/lines.js';
import { RUMORS } from '../js/data/rumors.js';
import { TRIAL_VARIANTS } from '../js/data/trials.js';
import { TIMELINE, RANDOM_EVENTS } from '../js/data/events.js';
import { PARLEY_QUESTIONS, VEHICLES } from '../js/data/merchant.js';
import { ERAS, SKILL_DEFS } from '../js/data/defs.js';

const SKILLS = Object.keys(SKILL_DEFS);

// ---------------------------------------------------------------- A. 孤立引用
export function orphanRefs() {
  const bad = [];
  const chk = (c, m) => { if (!c) bad.push(m); };

  for (const n of NPCS) {
    chk(!!CITY_MAP[n.city], `NPC ${n.id} 的 city=${n.city} 不存在`);
    chk(!!STATES[n.state], `NPC ${n.id} 的 state=${n.state} 不存在`);
    for (const t of n.teach ?? []) chk(SKILLS.includes(t), `NPC ${n.id} teach 含未知技艺 ${t}`);
    if (n.pref) chk(!!GOODS[n.pref] || TREASURE_IDS.includes(n.pref), `NPC ${n.id} pref=${n.pref} 不存在`);
  }

  for (const c of CITIES) {
    chk(!!STATES[c.state], `城池 ${c.id} 的 state=${c.state} 不存在`);
    if (c.good) chk(!!GOODS[c.good] || TREASURE_IDS.includes(c.good), `城池 ${c.id} good=${c.good} 不存在`);
  }

  for (const d of DEBATES) {
    const s = d.evidence?.source;
    if (s?.type === 'investigate') {
      chk(SKILLS.includes(s.skill), `论辩 ${d.id} 查访技艺非法：${s.skill}`);
      chk(!!CITY_MAP[s.city], `论辩 ${d.id} 查访城 ${s.city} 不存在`);
    }
    if (s?.type === 'npc') chk(!!NPC_MAP[s.npcId], `论辩 ${d.id} 证据人物 ${s.npcId} 不存在`);
    if (s?.type === 'market') chk(!!CITY_MAP[s.city], `论辩 ${d.id} 书肆城 ${s.city} 不存在`);
    if (d.followup?.targetCity) chk(!!CITY_MAP[d.followup.targetCity], `论辩 ${d.id} 后续城不存在`);
    if (d.followup?.checkSkill) chk(SKILLS.includes(d.followup.checkSkill), `论辩 ${d.id} 后续技艺非法`);
  }

  for (const [id, v] of Object.entries(VOICES)) {
    chk(!!NPC_MAP[id], `VOICES.${id} 非真实 NPC`);
    for (const d of v.debates) {
      if (d.followup?.targetCity) chk(!!CITY_MAP[d.followup.targetCity], `${d.id} 目标城不存在`);
    }
  }
  for (const id of Object.keys(LINES)) chk(!!NPC_MAP[id], `LINES.${id} 非真实 NPC`);

  for (const [cid, list] of Object.entries(RUMORS)) {
    chk(!!CITY_MAP[cid], `RUMORS 城 ${cid} 不存在`);
    for (const r of list) chk(SKILLS.includes(r.skill), `传闻 ${r.id} 技艺非法 ${r.skill}`);
  }
  for (const v of TRIAL_VARIANTS) {
    if (v.targetCity) chk(!!CITY_MAP[v.targetCity], `试炼 ${v.id} 城 ${v.targetCity} 不存在`);
  }

  const scan = (ev, tag) => {
    const all = [...(ev.effects ?? [])];
    for (const c of ev.choices ?? []) all.push(...(c.effects ?? []), ...(c.success ?? []), ...(c.fail ?? []));
    for (const e of all) {
      if (e.s && !STATES[e.s]) bad.push(`${tag}/${ev.id} 效果指向未知国 ${e.s}`);
      if (e.city && !CITY_MAP[e.city]) bad.push(`${tag}/${ev.id} 效果指向未知城 ${e.city}`);
      if (e.good && !GOODS[e.good] && !TREASURE_IDS.includes(e.good)) bad.push(`${tag}/${ev.id} 效果指向未知货 ${e.good}`);
      if (e.card && !NPC_MAP[e.card]) bad.push(`${tag}/${ev.id} 效果指向未知人物 ${e.card}`);
    }
  };
  for (const e of TIMELINE) scan(e, 'timeline');
  for (const e of RANDOM_EVENTS) scan(e, 'random');

  for (const [k, v] of Object.entries(VEHICLES)) chk(typeof v?.capacity === 'number', `VEHICLES.${k} 缺 capacity`);
  const TOPICS = ['price', 'grain', 'passage'];
  for (const q of PARLEY_QUESTIONS) chk(TOPICS.includes(q.topic), `交涉题 ${q.id} topic 非法 ${q.topic}`);

  return bad;
}

// ---------------------------------------------------------------- B. 语义一致性
export function semanticIssues() {
  const bad = [];
  const chk = (c, m) => { if (!c) bad.push(m); };

  for (const n of NPCS) {
    const c = CITY_MAP[n.city];
    if (c && n.state) chk(c.state === n.state, `NPC ${n.name} city=${c.id}(${c.state}) 与 state=${n.state} 不符`);
  }
  for (const n of NPCS.filter(x => x.role === 'ruler' && x.reign)) {
    const c = CITY_MAP[n.city];
    if (c) chk(c.tags?.includes('court'), `国君 ${n.name} 所在 ${c.name} 非朝堂城`);
  }
  for (const s of Object.keys(STATES)) {
    chk(CITIES.some(c => c.state === s), `${STATES[s].name} 无城池`);
    chk(CITIES.some(c => c.state === s && c.tags?.includes('court')), `${STATES[s].name} 无朝堂城`);
  }
  for (const n of NPCS) {
    if (n.birth != null && n.death != null) {
      chk(n.birth < n.death, `${n.name} 生卒颠倒 ${n.birth}/${n.death}`);
      chk(n.death - n.birth <= 120, `${n.name} 寿命 ${n.death - n.birth} 年异常`);
    }
    if (n.reign) chk(n.reign[0] <= n.reign[1], `${n.name} 在位区间颠倒 ${n.reign}`);
  }
  return bad;
}

// ---------------------------------------------------------------- C. 时间轴空档（只报告）
export function timelineGaps(from = -722, to = -450, step = 1) {
  const gaps = [];
  for (let y = from; y <= to; y += step) {
    const none = Object.keys(STATES).filter(s => !rulerOf(s, y));
    if (none.length) gaps.push({ year: y, states: none });
  }
  return gaps;
}

// ---------------------------------------------------------------- 自检
if (process.argv[1]?.endsWith('data-integrity.mjs')) {
  const a = orphanRefs();
  const b = semanticIssues();
  const gaps = timelineGaps();
  const eras = ERAS.map(e => ({ era: e.id, year: e.year, none: Object.keys(STATES).filter(s => !rulerOf(s, e.year)) }))
    .filter(x => x.none.length);

  for (const m of a) console.log(`✗ 孤立引用：${m}`);
  for (const m of b) console.log(`✗ 语义：${m}`);

  console.log(`\n孤立引用 ${a.length} 项，语义 ${b.length} 项`);

  if (eras.length) {
    console.log('\n[提示] 各年代开局无史载国君之国（由合成国君兜底）：');
    for (const x of eras) console.log(`  ${x.era}(${x.year}): ${x.none.join(',')}`);
  }
  if (gaps.length) {
    const years = gaps.map(g => g.year);
    const counts = {};
    for (const g of gaps) for (const s of g.states) counts[s] = (counts[s] || 0) + 1;
    console.log(`\n[提示] 时间轴空档：${gaps.length} 年中有国无君（${years[0]}~${years.at(-1)}）`);
    console.log('  按国统计：', Object.entries(counts).sort((x, y) => y[1] - x[1]).map(([s, n]) => `${s}:${n}年`).join(' '));
  }

  const fail = a.length + b.length;
  console.log(fail ? `\n失败 ${fail} 项 ✗` : '\n孤立引用与语义一致性通过 ✓');
  process.exit(fail ? 1 : 0);
}
