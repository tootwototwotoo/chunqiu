// 国君世系与继位事件
import { newGame, player, rel } from '../js/state.js';
import { NPCS, RULERS, npcAlive, rulerOf } from '../js/data/npcs.js';
import { STATES } from '../js/data/world.js';
import {
  rulerAt, reignChanges, makeReignEvent, isNotable,
  applyReignEffect, collectReignChanges,
} from '../js/systems/reign.js';

let fails = 0;
const ok = (c, m, x = '') => { console.log(`${c ? '✓' : '✗'} ${m}${x ? ' — ' + x : ''}`); if (!c) fails++; };

// ---------------- 数据完整性 ----------------
{
  ok(RULERS.length >= 60, '国君数量充足', String(RULERS.length));
  ok(NPCS.length >= 100, 'NPC 总数', String(NPCS.length));

  // 每位国君都有 reign，且在位期合法
  const bad = RULERS.filter(r => {
    const [a, b] = r.reign ?? [];
    return !Array.isArray(r.reign) || a == null || b == null || b < a;
  });
  ok(bad.length === 0, '国君均有合法 reign', bad.map(r => r.id).join(','));

  // 姓名唯一
  const names = new Map();
  for (const n of NPCS) names.set(n.name, (names.get(n.name) ?? 0) + 1);
  ok([...names].every(([, c]) => c === 1), 'NPC 姓名唯一');

  // 同一国同一年的在位国君至多一位
  const clash = [];
  for (const st of Object.keys(STATES)) {
    const list = RULERS.filter(r => r.state === st);
    for (let y = -722; y <= -473; y++) {
      const alive = list.filter(r => npcAlive(r, y));
      if (alive.length > 1) { clash.push(`${st}@${y}:${alive.map(x => x.name).join('/')}`); break; }
    }
  }
  ok(clash.length === 0, '同国同年不出现两位国君', clash.slice(0, 3).join(','));
}

// ---------------- 在世判定 ----------------
{
  const qiHuan = RULERS.find(r => r.id === 'qi_huan');
  ok(npcAlive(qiHuan, -680), '齐桓公 -680 在位');
  ok(!npcAlive(qiHuan, -640), '齐桓公 -640 已不在位');
  ok(rulerOf('qi', -680)?.name === '齐桓公', 'rulerOf 按年返回正确国君');
  ok(rulerOf('qi', -650)?.name === '齐桓公', '-650 年为齐桓公', rulerOf('qi', -650)?.name ?? '无');
  ok(rulerOf('qi', -640)?.name === '齐孝公', '-640 年为齐孝公', rulerOf('qi', -640)?.name ?? '无');
}

// ---------------- 世系更替检测 ----------------
{
  const st = newGame({ name: '君', profession: 'youxia', era: 'huan', seed: 1 });
  // -685 年齐桓公即位
  st.time.year = -685; st.time.month = 1; st.time.day = 1;
  const changes = reignChanges(st);
  const qiChange = changes.find(c => c.state === 'qi');
  ok(!!qiChange, '检测到齐国更替', changes.map(c => c.state).join(','));
  if (qiChange) {
    ok(qiChange.from.id === 'qi_xiang' && qiChange.to.id === 'qi_huan', '更替方向正确',
      `${qiChange.from.name} → ${qiChange.to.name}`);
  }
}

// ---------------- 事件生成 ----------------
{
  const st = newGame({ name: '君', profession: 'youxia', era: 'huan', seed: 2 });
  st.time.year = -685; st.time.month = 1; st.time.day = 1;
  const changes = reignChanges(st);
  const c = changes.find(x => x.state === 'qi');
  const ev = makeReignEvent(st, c);
  ok(!!ev.id && !!ev.title && !!ev.body, '事件字段完整');
  ok(ev.title.includes('薨') && ev.title.includes('即位'), '标题含薨与即位', ev.title);
  ok(!ev.title.startsWith('齐齐'), '标题不重复国名', ev.title);
  ok(ev.body.includes('在位'), '正文含在位年数');
  ok(ev.choices.length >= 2, '有可选分支', String(ev.choices.length));
  ok(ev.choices.every(o => o.label && o.text), '每个分支都有文案');
}

// ---------------- 弹窗筛选 ----------------
{
  const st = newGame({ name: '君', profession: 'youxia', era: 'huan', seed: 3 });
  st.time.year = -685; st.time.month = 1; st.time.day = 1;
  // 玩家未仕，齐为最强 → 应弹窗
  const strongest = Object.entries(st.world.power).sort((a, b) => b[1] - a[1])[0][0];
  ok(isNotable(st, strongest), '最强之国值得弹窗', strongest);
  ok(!isNotable(st, 'ju') || player(st).stateId === 'ju', '小国不弹窗');

  // 玩家所仕之国即使弱小也弹窗
  st.player.stateId = 'ju';
  ok(isNotable(st, 'ju'), '所仕之国必弹窗');
}

// ---------------- 世界影响 ----------------
{
  const st = newGame({ name: '君', profession: 'youxia', era: 'huan', seed: 4 });
  st.time.year = -685; st.time.month = 1; st.time.day = 1;
  const c = reignChanges(st).find(x => x.state === 'qi');
  const before = st.world.power.qi;
  const notes = applyReignEffect(st, c);
  ok(st.world.power.qi !== before, '国势有变化', `${before} → ${st.world.power.qi}`);
  ok(st.world.power.qi < before + 5, '整体偏跌（薨 -8、即位 +3）', String(st.world.power.qi));
  ok(notes.length >= 1, '返回提示文本', String(notes.length));
  ok(notes.some(n => /新君/.test(n)), '提示涉及新君');
}

// ---------------- 新君交情规则 ----------------
{
  // 未相识：保持未识
  const st = newGame({ name: '君', profession: 'youxia', era: 'huan', seed: 5 });
  st.time.year = -685; st.time.month = 1; st.time.day = 1;
  const c = reignChanges(st).find(x => x.state === 'qi');
  applyReignEffect(st, c);
  const r = st.player.relations?.[c.to.id];
  ok(!r || !r.met || r.aff === 0, '未识新君则不建立交情',
    JSON.stringify(r ?? null));

  // 已相识：交情保留
  const st2 = newGame({ name: '君', profession: 'youxia', era: 'huan', seed: 6 });
  st2.time.year = -685; st2.time.month = 1; st2.time.day = 1;
  const c2 = reignChanges(st2).find(x => x.state === 'qi');
  const rr = rel(st2, c2.to.id);
  rr.met = true; rr.aff = 60;
  const notes2 = applyReignEffect(st2, c2);
  ok(rel(st2, c2.to.id).aff === 60, '旧识新君交情保留', String(rel(st2, c2.to.id).aff));
  ok(notes2.some(n => /旧识/.test(n)), '提示说明是旧识');
}

// ---------------- 年度去重 ----------------
{
  const st = newGame({ name: '君', profession: 'youxia', era: 'huan', seed: 7 });
  st.time.year = -685; st.time.month = 1; st.time.day = 1;
  const a = collectReignChanges(st, []);
  const b = collectReignChanges(st, []);
  ok(a.events.length >= 1, '首次返回事件', String(a.events.length));
  ok(b.events.length === 0, '同年不重复处理', String(b.events.length));
  // 事件走 queueEvent，结构统一
  ok(a.events.every(e => e.kind === 'reign' && e.ev && e.effects && typeof e.effects === 'object'), '事件结构与既有事件一致');
}

// ---------------- 长时段：世系不会断档太多 ----------------
{
  const st = newGame({ name: '久', profession: 'youxia', era: 'early', seed: 8 });
  let hasRuler = 0, noRuler = 0;
  for (let y = -722; y <= -473; y += 5) {
    st.time.year = y;
    for (const sid of ['qi', 'jin', 'chu', 'qin', 'lu', 'song']) {
      if (rulerAt(sid, y)) hasRuler++;
      else noRuler++;
    }
  }
  const ratio = hasRuler / (hasRuler + noRuler);
  ok(ratio >= 0.85, '六大国国君在位覆盖率 ≥85%', `${(ratio * 100).toFixed(1)}%`);
}

console.log(fails ? `\n失败 ${fails} 项 ✗` : '\n国君世系通过 ✓');
process.exit(fails ? 1 : 0);
