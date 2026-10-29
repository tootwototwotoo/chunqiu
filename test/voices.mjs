// 人物专属题库（voices）：占比、可重复、熟练加成、消耗
import { newGame } from '../js/state.js';
import { VOICES } from '../js/data/debates/voices.js';
import {
  pickDebateScenario, startDebate, settleDebate, voiceOf, voiceScenarios,
  VOICE_RATIO, DEBATE_COST, FAMILIAR_CAP,
} from '../js/systems/debate.js';
import { DEBATES } from '../js/data/debates/index.js';
import { NPC_MAP } from '../js/data/npcs.js';

let fails = 0;
const ok = (c, m, x = '') => { console.log(`${c ? '✓' : '✗'} ${m}${x ? ' — ' + x : ''}`); if (!c) fails++; };
const newSt = () => {
  const st = newGame({ name: 'x', profession: 'youxia', seed: 9, era: 'mibing' });
  st.flags.noAutosave = true;
  return st;
};

// ---------------- 数据完整性 ----------------
{
  const entries = Object.entries(VOICES);
  ok(entries.length >= 2, '专属题库已建', entries.map(([k]) => k).join(','));
  for (const [id, v] of entries) {
    ok(!!NPC_MAP[id], `${id} 对应真实 NPC`, NPC_MAP[id]?.name ?? '不存在');
    // 引语充足的做满 3 场，引语较少的做 2 场
    ok(v.debates.length >= 2, `${id} 场景数 ≥2`, String(v.debates.length));
    ok(!!v.theme && !!v.intro, `${id} 有主题与开场白`);
    for (const d of v.debates) {
      ok(d.concerns.length === 3, `${d.id} 恰 3 回合`);
      ok(d.concerns.every(c => c.options.length === 3), `${d.id} 每回合 3 选项`);
      ok(d.concerns.every(c => c.options.every(o => o.tag && o.level && o.text && o.reply)),
        `${d.id} 选项字段完整`);
      ok(!!d.outcomes?.success && !!d.outcomes?.fail, `${d.id} 有结局文案`);
      ok(!!d.effects?.success, `${d.id} 有效果`);
      // 心性四值合法
      const good = ['li', 'yi', 'ming', 'shi'];
      ok(good.includes(d.heart), `${d.id} 心性合法`, d.heart);
      ok(d.concerns.every(c => c.options.every(o => good.includes(o.tag))), `${d.id} 选项心性合法`);
    }
  }
}

// ---------------- 抽取占比 ----------------
{
  const st = newSt();
  const N = 3000;
  let hit = 0;
  const seen = new Set();
  for (let i = 0; i < N; i++) {
    const d = pickDebateScenario(st, { npcId: 'kong_zi' });
    if (d.id.startsWith('v_kongzi')) { hit++; seen.add(d.id); }
  }
  const ratio = hit / N;
  ok(Math.abs(ratio - VOICE_RATIO) < 0.05, '专属占比接近设定值',
    `${(ratio * 100).toFixed(1)}% vs ${(VOICE_RATIO * 100)}%`);
  ok(seen.size === VOICES.kong_zi.debates.length, '所有专属场景都会被抽到', String(seen.size));
}

// ---------------- 无专属题库者仍用通用 ----------------
{
  const st = newSt();
  ok(voiceOf('ji_liang') === null || voiceOf('ji_liang') === undefined, '未建库者无专属');
  const ids = new Set();
  for (let i = 0; i < 300; i++) ids.add(pickDebateScenario(st, { npcId: 'ji_liang' }).id);
  ok([...ids].every(id => !id.startsWith('v_')), '未建库者只抽通用题库');
  ok(ids.size > 1, '通用题库有多个场景', String(ids.size));
}

// ---------------- 可无限重复 ----------------
{
  const st = newSt();
  const npc = { id: 'kong_zi', name: '孔子', bias: 'yi' };
  const sc = VOICES.kong_zi.debates[0];
  let n = 0;
  for (let i = 0; i < 6; i++) {
    st.player.stamina = 100;
    const d = startDebate(st, npc, { scenario: sc });
    if (d.ok === false) break;
    settleDebate(st, d, 'kong_zi');
    n++;
  }
  ok(n === 6, '同一场景可反复辩（不消耗）', `${n} 次`);
  ok(voiceScenarios('kong_zi', { exclude: sc.id }).length === VOICES.kong_zi.debates.length - 1,
    '同局排除已抽场景');
}

// ---------------- 体力消耗与门槛 ----------------
{
  const st = newSt();
  const npc = { id: 'kong_zi', name: '孔子', bias: 'yi' };
  const sc = VOICES.kong_zi.debates[0];
  st.player.stamina = 100;
  startDebate(st, npc, { scenario: sc });
  ok(st.player.stamina === 100 - DEBATE_COST.stamina, '论辩消耗体力',
    `100 → ${st.player.stamina}`);

  st.player.stamina = DEBATE_COST.stamina - 1;
  const r = startDebate(st, npc, { scenario: sc });
  ok(r.ok === false, '体力不足拒绝开始', r.msg ?? '');
  ok(st.player.stamina === DEBATE_COST.stamina - 1, '拒绝时不扣体力');
}

// ---------------- 熟练加成 ----------------
{
  const st = newSt();
  const npc = { id: 'kong_zi', name: '孔子', bias: 'yi' };
  const sc = VOICES.kong_zi.debates[0];
  const seen = [];
  for (let i = 0; i < 5; i++) {
    st.player.stamina = 100;
    const d = startDebate(st, npc, { scenario: sc });
    seen.push(d.agreement);
    settleDebate(st, d, 'kong_zi');
  }
  ok(seen[0] === 50, '首辩起始认同 50', String(seen[0]));
  ok(seen[1] === 55 && seen[2] === 60, '再辩递增 +5', seen.join(','));
  ok(seen[4] === 50 + FAMILIAR_CAP, `熟练封顶 +${FAMILIAR_CAP}`, String(seen[4]));
  ok(seen[3] === seen[4], '封顶后不再加');
}

// ---------------- 专属场景的证据链路必须走通 ----------------
{
  const { EVIDENCE_BY_ID } = await import('../js/data/debates/index.js');
  const { investigateHere } = await import('../js/systems/evidence.js');
  const { useEvidence } = await import('../js/systems/debate.js');
  const { addEvidence } = await import('../js/state.js');

  const withEv = Object.entries(VOICES).flatMap(([id, v]) =>
    v.debates.filter(d => d.evidence).map(d => ({ id, d })));
  ok(withEv.length > 0, '存在带证据的专属场景', String(withEv.length));

  // 1) 场景有 topic
  const noTopic = withEv.filter(({ d }) => !d.topic);
  ok(noTopic.length === 0, '专属场景都有 topic', noTopic.map(x => x.d.id).join(','));

  // 2) evidence 有 id / topic / source
  const badEv = withEv.filter(({ d }) =>
    !d.evidence.id || !d.evidence.topic || !d.evidence.source?.type || !d.evidence.homeCity);
  ok(badEv.length === 0, '专属证据字段完整（id/topic/source/homeCity）',
    badEv.map(x => x.d.id).join(','));

  // 3) 证据已并入全局查找表
  const unindexed = withEv.filter(({ d }) => !EVIDENCE_BY_ID[d.evidence.id]);
  ok(unindexed.length === 0, '专属证据已并入 EVIDENCE_BY_ID',
    unindexed.map(x => x.d.id).join(','));

  // 4) evidence.topic 与场景 topic 一致（否则出示必被拒）
  const mismatch = withEv.filter(({ d }) => d.evidence.topic !== d.topic);
  ok(mismatch.length === 0, '证据 topic 与场景 topic 一致',
    mismatch.map(x => `${x.d.id}:${x.d.evidence.topic}≠${x.d.topic}`).join(','));

  // 5) 该证据可在人物所在城查访到
  const unreachable = [];
  for (const { id, d } of withEv) {
    const st2 = newSt();
    st2.player.cityId = d.evidence.homeCity;
    if (!investigateHere(st2, d.evidence.homeCity).some(ev => ev.id === d.evidence.id)) {
      unreachable.push(`${id}/${d.id}`);
    }
  }
  ok(unreachable.length === 0, '专属证据可在对应城池查访到',
    unreachable.slice(0, 3).join(','));

  // 6) 端到端：拿到 → 出示 → 认同度上升
  {
    const st3 = newSt();
    const { id, d } = withEv.find(x => x.id === 'kong_zi') ?? withEv[0];
    addEvidence(st3, d.evidence.id);
    st3.player.stamina = 100;
    const deb = startDebate(st3, { id, name: NPC_MAP[id].name, bias: NPC_MAP[id].bias }, { scenario: d });
    const before = deb.agreement;
    const r = useEvidence(st3, deb, d.evidence.id);
    ok(r.ok, '专属证据可出示', r.msg ?? '');
    ok(deb.agreement > before, '出示后认同度上升', `${before} → ${deb.agreement}`);
    ok(deb.evidenceUsed, '出示后标记已用');
  }

  // 7) 通用证据在专属场景中按 topic 判定（不匹配则拒）
  {
    const st4 = newSt();
    const { d } = withEv[0];
    const other = Object.values(EVIDENCE_BY_ID).find(ev => ev.topic && ev.topic !== d.topic);
    if (other) {
      addEvidence(st4, other.id);
      st4.player.stamina = 100;
      const deb = startDebate(st4, { id: 'kong_zi', name: '孔子', bias: 'yi' }, { scenario: d });
      const r = useEvidence(st4, deb, other.id);
      ok(!r.ok, 'topic 不符的通用证据被拒', r.msg ?? '');
    } else {
      ok(true, 'topic 不符的通用证据被拒（无可用样本，跳过）');
    }
  }
}

// ---------------- 选项必须洗牌（否则数据里 hit 恒在第一位） ----------------
{
  // 数据侧断言：最优项不能总在第一位
  const counts = { first: 0, total: 0 };
  for (const v of Object.values(VOICES)) for (const d of v.debates) {
    for (const c of d.concerns) {
      counts.total++;
      if (c.options[0].level === 'hit') counts.first++;
    }
  }
  ok(counts.first / counts.total > 0.9, '数据里最优项几乎都写在第一位（证明洗牌的必要性）',
    `${counts.first}/${counts.total}`);

  // 运行时断言：多次开局，最优项不应总是落在同一位置
  {
    const pos = [0, 0, 0];
    let n = 0;
    for (let seed = 1; seed <= 30; seed++) {
      const st = newGame({ name: 'x', profession: 'youxia', seed, era: 'mibing' });
      st.flags.noAutosave = true; st.player.stamina = 100;
      const d = startDebate(st, { id: 'kong_zi', name: '孔子', bias: 'yi' },
        { scenario: VOICES.kong_zi.debates[0] });
      const i = d.scenario.concerns[0].options.findIndex(o => o.level === 'hit');
      pos[i]++;
      n++;
    }
    const maxShare = Math.max(...pos) / n;
    ok(maxShare < 0.6, '洗牌后最优项不固定在首位',
      `首位/次位/末位 = ${pos.join('/')}（最高占比 ${(maxShare*100).toFixed(0)}%）`);
  }

  // 译文随选项移动，不串位
  {
    const st = newGame({ name: 'x', profession: 'youxia', seed: 9, era: 'mibing' });
    st.flags.noAutosave = true; st.player.stamina = 100;
    const d = startDebate(st, { id: 'kong_zi', name: '孔子', bias: 'yi' },
      { scenario: VOICES.kong_zi.debates[0] });
    const c0 = d.scenario.concerns[0];
    const moved = c0.options.every(o => !o.textVern || o.textVern.length > 4);
    ok(moved, '白话译文随选项一起洗牌');
    // 三个选项的译文集合应与数据一致（只是顺序变了）
    const { VERN } = await import('../js/data/debates/vern1.js');
    const want = VERN.kong_zi.v_kongzi_ren.opts[0];
    const got = c0.options.map(o => o.textVern);
    ok(want.every(w => got.includes(w)), '译文与原文仍一一对应（只换位置不换内容）');
  }
}

// ---------------- 专属场景与通用题库不冲突 ----------------
{
  const generalIds = new Set(DEBATES.map(d => d.id));
  const clash = Object.values(VOICES).flatMap(v => v.debates)
    .filter(d => generalIds.has(d.id)).map(d => d.id);
  ok(clash.length === 0, '专属场景 id 不与通用题库冲突', clash.join(','));
}

console.log(fails ? `\n失败 ${fails} 项 ✗` : '\n人物专属题库通过 ✓');
process.exit(fails ? 1 : 0);
