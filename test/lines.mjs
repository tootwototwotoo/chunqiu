// 论辩开场白（B 级 LINES + A 级 voices.intro）
import { newGame } from '../js/state.js';
import { LINES } from '../js/data/debates/lines.js';
import { VOICES } from '../js/data/debates/voices.js';
import { NPC_MAP } from '../js/data/npcs.js';
import { startDebate } from '../js/systems/debate.js';

let fails = 0;
const ok = (c, m, x = '') => { console.log(`${c ? '✓' : '✗'} ${m}${x ? ' — ' + x : ''}`); if (!c) fails++; };
const newSt = () => {
  const st = newGame({ name: 'x', profession: 'youxia', seed: 3, era: 'mibing' });
  st.flags.noAutosave = true;
  return st;
};

// ---------------- 数据完整性 ----------------
{
  const ids = Object.keys(LINES);
  ok(ids.length >= 100, '开场白数量充足', String(ids.length));
  ok(ids.every(id => NPC_MAP[id]), '全部指向真实 NPC',
    ids.filter(id => !NPC_MAP[id]).join(','));
  ok(ids.every(id => !VOICES[id]), '不与专属题库重复', ids.filter(id => VOICES[id]).join(','));
  ok(ids.every(id => typeof LINES[id] === 'string' && LINES[id].length >= 4),
    '开场白非空且有一定长度');
  ok(new Set(ids.map(id => LINES[id])).size === ids.length, '开场白无重复文案');

  // A 级人物须有 intro
  const noIntro = Object.entries(VOICES).filter(([, v]) => !v.intro);
  ok(noIntro.length === 0, '专属题库人物都有 intro', noIntro.map(([k]) => k).join(','));
}

// ---------------- 运行时分三类 ----------------
{
  const st = newSt();

  // A 级：取 intro，且抽到专属场景的比例仍约 60%
  const a = startDebate(st, { id: 'kong_zi', name: '孔子', bias: 'yi' }, {});
  ok(a.line === VOICES.kong_zi.intro, 'A 级用 intro 作开场白', a.line);
  ok(a.log.some(l => l.includes(VOICES.kong_zi.intro)), 'A 级开场白进入发言记录');

  // B 级：取 LINES
  const b = startDebate(st, { id: 'bao_shuya', name: '鲍叔牙', bias: 'yi' }, {});
  ok(b.line === LINES.bao_shuya, 'B 级用 LINES 作开场白', b.line);
  ok(b.log.some(l => l.includes(LINES.bao_shuya)), 'B 级开场白进入发言记录');
  ok(!b.scenario.id.startsWith('v_'), 'B 级仍走通用题库', b.scenario.id);

  // 传不存在的开场白时 line 为 null（模拟完全无记载者）
  const c = startDebate(st, { id: '__nobody__', name: '无名氏', bias: 'yi' }, {});
  ok(c.line === null, '无记载者不设开场白', String(c.line));
}

// ---------------- 开场白不影响判定 ----------------
{
  const st = newSt();
  const mk = (id, name) => startDebate(st, { id, name, bias: 'yi' }, { scenario: undefined });
  // 同一人物、同一场景，有无开场白不应改变起始认同
  const d1 = mk('bao_shuya', '鲍叔牙');
  const d2 = mk('__nobody__', '无名氏');
  ok(d1.agreement === d2.agreement, '开场白不影响起始认同',
    `${d1.agreement} / ${d2.agreement}`);
  ok(d1.maxRounds === 3 && d2.maxRounds === 3, '回合数仍为 3');
}

// ---------------- NPC id 不得冲突 ----------------
{
  const ids = new Map();
  for (const n of Object.values(NPC_MAP)) ids.set(n.id, (ids.get(n.id) ?? 0) + 1);
  // NPC_MAP 以 id 为键，冲突时会丢人；这里从 NPCS 数组直接查
  const { NPCS } = await import('../js/data/npcs.js');
  const counts = new Map();
  for (const n of NPCS) counts.set(n.id, (counts.get(n.id) ?? 0) + 1);
  const dup = [...counts].filter(([, c]) => c > 1);
  ok(dup.length === 0, 'NPC id 不重复', dup.map(([id]) => id).join(','));
}

// ---------------- 国君开场白 ----------------
{
  const { NPCS } = await import('../js/data/npcs.js');
  const rulers = NPCS.filter(n => n.role === 'ruler' && n.quote && !n.desc?.includes('失载'));
  const covered = rulers.filter(n => LINES[n.id]);
  ok(covered.length >= 150, '有史载的国君大多有开场白',
    `${covered.length}/${rulers.length}`);

  // 合成国君（史料失载）不占开场白
  const synth = NPCS.filter(n => n.role === 'ruler' && n.desc?.includes('失载'));
  const wrong = synth.filter(n => LINES[n.id]);
  ok(wrong.length === 0, '史料失载的合成国君无开场白', wrong.map(n => n.name).join(','));
}

// ---------------- 覆盖面 ----------------
{
  const withLine = new Set([...Object.keys(LINES), ...Object.keys(VOICES)]);
  const nonRuler = Object.values(NPC_MAP).filter(n => n.role !== 'ruler');
  const covered = nonRuler.filter(n => withLine.has(n.id));
  ok(covered.length >= 150, '非国君人物的开场白覆盖', `${covered.length}/${nonRuler.length}`);
}

console.log(fails ? `\n失败 ${fails} 项 ✗` : '\n论辩开场白通过 ✓');
process.exit(fails ? 1 : 0);
