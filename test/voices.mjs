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
    ok(v.debates.length >= 3, `${id} 场景数 ≥3`, String(v.debates.length));
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

// ---------------- 专属场景与通用题库不冲突 ----------------
{
  const generalIds = new Set(DEBATES.map(d => d.id));
  const clash = Object.values(VOICES).flatMap(v => v.debates)
    .filter(d => generalIds.has(d.id)).map(d => d.id);
  ok(clash.length === 0, '专属场景 id 不与通用题库冲突', clash.join(','));
}

console.log(fails ? `\n失败 ${fails} 项 ✗` : '\n人物专属题库通过 ✓');
process.exit(fails ? 1 : 0);
