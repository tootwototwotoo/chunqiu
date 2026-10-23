// 三回合论辩：计分、证据、结局与后续差事
import { newGame, addEvidence, hasEvidence } from '../js/state.js';
import { startDebate, debateChoose, useEvidence, settleDebate } from '../js/systems/debate.js';
import { DEBATE_BY_ID, DEBATES, validateDebates, OPPOSITE } from '../js/data/debates/index.js';

let fails = 0;
const ok = (c, m, x = '') => { console.log(`${c ? '✓' : '✗'} ${m}${x ? ' — ' + x : ''}`); if (!c) fails++; };

// 数据完整性
{
  const errors = validateDebates();
  ok(errors.length === 0, '50 个场景结构合法', errors.slice(0, 2).join('；'));
  ok(DEBATES.length >= 50, '场景数量不少于 50', String(DEBATES.length));
  const byHeart = {};
  for (const d of DEBATES) byHeart[d.heart] = (byHeart[d.heart] ?? 0) + 1;
  ok(Object.values(byHeart).every(n => n >= 8), '四心性场景分布均衡', JSON.stringify(byHeart));
}

function setup(id = 'relief', bias = 'li') {
  const st = newGame({ name: '辩士', profession: 'shuike', seed: 5 });
  st.player.skills.biancai = 5;
  const scenario = DEBATE_BY_ID[id];
  const d = startDebate(st, { name: '县令', title: '县宰', bias }, { scenario });
  return { st, d, scenario };
}
const idx = (c, level, tag) => c.options.findIndex(o => o.level === level && o.tag === tag);

// 初始
{
  const { d } = setup();
  ok(d.agreement === 50, '认同度初始 50');
  ok(d.round === 1 && d.maxRounds === 3, '共三回合');
  ok(d.heart === 'li', '心性取场景设定');
}

// 切中 + 合心性
{
  const { st, d } = setup();
  const c = d.scenario.concerns[0];
  debateChoose(st, d, idx(c, 'hit', 'li'));
  ok(d.agreement === 70, '切中(+15)且合心性(+5) → 70', String(d.agreement));
  const h = d.history[0];
  ok(h.base === 15 && h.heartMod === 5, '明细记录切中与心性');
}

// 有道理 / 回避 / 相悖
{
  const a = setup();
  debateChoose(a.st, a.d, idx(a.d.scenario.concerns[0], 'hit', 'li'));
  debateChoose(a.st, a.d, idx(a.d.scenario.concerns[1], 'reason', 'li'));
  const h = a.d.history[1];
  ok(h.base === 5 && h.heartMod === 5, '有道理但未解决 → +5（另合心性 +5）', JSON.stringify(h));
  const b = setup(); debateChoose(b.st, b.d, idx(b.d.scenario.concerns[0], 'evade', 'ming'));
  ok(b.d.agreement === 40, '回避 → -10', String(b.d.agreement));
  const c = setup(); debateChoose(c.st, c.d, idx(c.d.scenario.concerns[0], 'reason', 'yi'));
  ok(c.d.history[0].heartMod === -5, '相悖心性 → -5');
}

// 不合心性的切中
{
  const { st, d } = setup();
  debateChoose(st, d, idx(d.scenario.concerns[0], 'hit', 'li')); // 进入第二轮
  const c = d.scenario.concerns[1];
  debateChoose(st, d, idx(c, 'hit', 'shi'));
  const h = d.history[1];
  ok(h.base === 15 && h.heartMod === 0, '切中但思路不合心性 → +15', JSON.stringify(h));
}

// 证据：未掌握不能出示；主题匹配才有效；可跨场景
{
  const { st, d } = setup();
  const ev = d.scenario.evidence;
  const missing = useEvidence(st, d, ev.id);
  ok(!missing.ok && !d.evidenceUsed, '未掌握证据不能出示');
  addEvidence(st, ev.id);
  addEvidence(st, 'wall_ev');
  const wrong = useEvidence(st, d, 'wall_ev');
  ok(!wrong.ok && !d.evidenceUsed, '主题不符的证据不能出示', wrong.msg);
  const before = d.agreement;
  const right = useEvidence(st, d, ev.id);
  ok(right.ok && d.evidenceUsed, '相关证据可出示');
  ok(d.agreement === Math.min(100, before + 10), '证据 +10', String(d.agreement - before));
  const c = d.scenario.concerns[0];
  debateChoose(st, d, idx(c, 'reason', 'yi'));
  ok(d.history.at(-1).evidence === 10, '证据计入明细');
}
{
  const { st, d } = setup('relief');
  addEvidence(st, 'prices_ev');
  const r = useEvidence(st, d, 'prices_ev');
  ok(r.ok, '同主题证据可跨场景使用', r.msg);
}

// 三档结局
function toRound3(agreement, id = 'relief', bias = 'li') {
  const x = setup(id, bias);
  x.d.agreement = agreement;
  x.d.round = 3;
  return x;
}
{
  const s = toRound3(85);
  debateChoose(s.st, s.d, idx(s.d.scenario.concerns[2], 'hit', 'li'));
  ok(s.d.result === 'success', '≥70 为成功', `${s.d.agreement}/${s.d.result}`);

  const c = toRound3(45);
  debateChoose(c.st, c.d, idx(c.d.scenario.concerns[2], 'reason', 'yi'));
  ok(c.d.result === 'compromise', '40–69 为妥协', `${c.d.agreement}/${c.d.result}`);

  const f = toRound3(15);
  debateChoose(f.st, f.d, idx(f.d.scenario.concerns[2], 'evade', 'shi'));
  ok(f.d.result === 'fail', '<40 为失败', `${f.d.agreement}/${f.d.result}`);
}

// 妥协生成后续差事（有权限）
{
  const { st, d } = toRound3(45);
  debateChoose(st, d, idx(d.scenario.concerns[2], 'reason', 'yi'));
  const before = st.quests.active.length;
  const res = settleDebate(st, d, null);
  ok(res.result === 'compromise', '结算返回妥协');
  ok(!!res.followup && st.quests.active.length === before + 1, '有权限者生成后续差事');
  ok(res.followup.mode === d.scenario.followup.mode, '后续差事类型与场景一致', res.followup.mode);
}

// 无权限不生成
{
  const { st, d } = toRound3(39, 'surrender', 'yi');
  d.heart = 'yi';
  debateChoose(st, d, idx(d.scenario.concerns[2], 'reason', 'ming'));
  const before = st.quests.active.length;
  const res = settleDebate(st, d, null);
  ok(!res.followup && st.quests.active.length === before, '降将无权限，不生成差事');
}

// 后续差事类型按场景生成
function forceCompromise(id) {
  const x = setup(id);
  x.d.round = 3;
  const c = x.d.scenario.concerns[2];
  const o = c.options[0];
  const delta = ({ hit: 15, reason: 5, evade: -10 }[o.level]) + (o.tag === x.d.heart ? 5 : OPPOSITE[x.d.heart] === o.tag ? -5 : 0);
  x.d.agreement = 55 - delta;
  debateChoose(x.st, x.d, 0);
  return x;
}
{
  const check = forceCompromise('officials');
  const rc = settleDebate(check.st, check.d, null);
  ok(rc.followup?.mode === 'check' && !!rc.followup.checkSkill, '内政场景生成判定类后续', rc.followup?.mode);

  const combat = forceCompromise('clans');
  const rw = settleDebate(combat.st, combat.d, null);
  ok(rw.followup?.mode === 'combat' && !!rw.followup.enemy, '查抄豪强生成战斗类后续', rw.followup?.mode);

  const travel = forceCompromise('alliance');
  const rt = settleDebate(travel.st, travel.d, null);
  ok(rt.followup?.mode === 'travel' && !!rt.followup.targetCity, '结盟场景生成出行类后续', rt.followup?.mode);
}

// 成功结算与关系
{
  const s = toRound3(90);
  debateChoose(s.st, s.d, idx(s.d.scenario.concerns[2], 'hit', 'li'));
  s.st.player.relations['guan_zhong'] = { aff: 10, met: true, gifts: 0 };
  const res = settleDebate(s.st, s.d, 'guan_zhong');
  ok(res.result === 'success', '成功结算');
  ok(s.st.player.relations['guan_zhong'].aff > 10, '成功提升关系');
}

console.log(fails ? `\n失败 ${fails} 项 ✗` : '\n三回合论辩逻辑通过 ✓');
process.exit(fails ? 1 : 0);
