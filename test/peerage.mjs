// 五等爵：册命试炼、评价、请封概率与失败循环
import { newGame } from '../js/state.js';
import { STATES, CITY_MAP } from '../js/data/world.js';
import { PEERAGES } from '../js/data/defs.js';
import { TRIAL_RANKS, TRIAL_VARIANTS, variantsOfRank } from '../js/data/trials.js';
import {
  acceptTrial, canAcceptTrial, canStartTrial, finishTrial, petition, canPetition, checkTrialExpiry, peerageSummary
} from '../js/systems/peerage.js';
import {
  startHunt, huntSearch, startNegotiation, negotiate, startGovernance, govern, startBattle, battleRound, startRites, riteSubmit, evaluateGame
} from '../js/systems/trialGames.js';

let fails = 0;
const ok = (c, m, x = '') => { console.log(`${c ? '✓' : '✗'} ${m}${x ? ' — ' + x : ''}`); if (!c) fails++; };

// 各国国爵
ok(STATES.song.peer === '公', '宋为公爵');
ok(STATES.qi.peer === '侯' && STATES.jin.peer === '侯', '齐晋为侯爵');
ok(STATES.zheng.peer === '伯' && STATES.qin.peer === '伯', '郑秦为伯爵');
ok(STATES.chu.peer === '子' && STATES.wu.peer === '子', '楚吴为子爵');
ok(STATES.xu.peer === '男', '许为男爵');

// 每级三个变体，目标城合法
for (const r of TRIAL_RANKS) {
  const vs = variantsOfRank(r.rank);
  ok(vs.length === 3, `${r.name}爵有 3 个试炼变体`, String(vs.length));
  ok(vs.every(v => !v.targetCity || CITY_MAP[v.targetCity]), `${r.name}爵试炼目标城合法`);
}
ok(TRIAL_VARIANTS.length === 15, '共 15 道试炼');

function ready(seed = 1) {
  const st = newGame({ name: '封君', profession: 'youxia', seed });
  st.player.cityId = 'luoyi';
  st.player.homeCity = 'luoyi';
  st.player.stateId = 'qi';
  st.player.rank = 7;
  st.player.merit = PEERAGES[0].merit;
  st.player.fame = PEERAGES[0].fame;
  st.player.money = 1000;
  return st;
}

// 条件门槛
const st0 = newGame({ name: '白身', profession: 'youxia', seed: 3 });
st0.player.merit = PEERAGES[0].merit; st0.player.fame = PEERAGES[0].fame; st0.player.cityId = 'luoyi';
ok(!canAcceptTrial(st0).ok, '未出仕不可领受试炼', canAcceptTrial(st0).msg);

const stLow = ready(4);
stLow.player.merit = PEERAGES[0].merit - 1;
ok(!canAcceptTrial(stLow).ok, '功勋不足不可领受', canAcceptTrial(stLow).msg);

// 领受与开始
const st = ready(5);
const acc = acceptTrial(st);
ok(acc.ok, '领受男爵试炼', acc.variant?.title);
ok(st.player.peerageTrial.status === 'active', '试炼进入进行中');
const target = acc.variant.targetCity ?? 'luoyi';
st.player.cityId = target;
ok(canStartTrial(st).ok, '抵达目标城可开始', CITY_MAP[target].name);

// 评价与完成
const doneGame = { kind: 'hunt', success: true, turns: 6, maxTurns: 9, wrong: 1 };
const fin = finishTrial(st, doneGame);
ok(fin.ok && fin.success, '试炼完成', `评价 ${fin.performance}`);
ok(st.player.peerageTrial.status === 'done', '状态记为已成');
st.player.cityId = 'luoyi';
ok(canPetition(st).ok, '回洛邑可请封', canPetition(st).msg);

// 请封失败路径：低评价 + 遍历种子
let denied = null;
for (let seed = 1; seed <= 200 && !denied; seed++) {
  const s = ready(seed);
  s.player.peerageTrial = { rank: 0, variantId: 'hunt_bandit', targetCity: 'luoyi', status: 'done', performance: 5, exp: null };
  const r = petition(s);
  if (r.ok && !r.success) denied = { s, r };
}
ok(!!denied, '可以出现请封未准');
if (denied) {
  const { s } = denied;
  ok(s.player.peerageFails === 1, '未准累计诚意', String(s.player.peerageFails));
  ok(s.player.money === 850, '贽礼退半（净耗150）', String(s.player.money));
  ok(s.player.peerageTrial.status === 'pending', '另命新试');
  ok(peerageSummary(s).cooldown === 30, '新试炼冷却 30 日', String(peerageSummary(s).cooldown));
  ok(s.player.peerageFails < 5, '尚未触发保底');
}

// 保底：五次未准后必成
const gst = ready(9);
gst.player.peerageFails = 5;
gst.player.peerageTrial = { rank: 0, variantId: 'hunt_bandit', targetCity: 'luoyi', status: 'done', performance: 5, exp: null };
const gr = petition(gst);
ok(gr.ok && gr.success, '五次未准后必得册命', gr.msg);
ok(gst.player.peerage?.rank === 0, '受封男爵');
ok(gst.player.peerageFails === 0, '诚意清零');

// 试炼失败：不加诚意，换新题、冷却 15 日
const fst = ready(10);
acceptTrial(fst);
const beforeFails = fst.player.peerageFails;
const beforeFame = fst.player.fame;
const bad = { kind: 'hunt', success: false, turns: 0, maxTurns: 9, wrong: 9 };
const fr = finishTrial(fst, bad);
ok(fr.ok && !fr.success, '试炼失败结算');
ok(fst.player.peerageTrial.status === 'pending', '失败后另命新试');
ok(fst.player.fame === beforeFame, '任务失败不扣名声');
ok((fst.player.peerageFails ?? 0) === beforeFails, '任务失败不加诚意');
ok(peerageSummary(fst).cooldown === 15, '任务失败冷却 15 日');
const pendingId = fst.player.peerageTrial.variantId;
fst.player.peerageTrial.availableDay = 0;
const reAcc = acceptTrial(fst);
ok(reAcc.ok && reAcc.variant.id === pendingId, '领受时沿用已命的新试炼', `${pendingId} → ${reAcc.variant?.id}`);

// 逾期
const est = ready(11);
acceptTrial(est);
est.player.peerageTrial.exp = -1;
const expired = checkTrialExpiry(est);
ok(!!expired, '逾期触发失败');
ok(est.player.peerageTrial.status === 'pending', '逾期后另命新试');

// 五套小游戏逻辑
const v0 = variantsOfRank(0)[0];
const hg = startHunt(st, v0);
huntSearch(st, hg, hg.target);
ok(hg.done && hg.success, '围捕小游戏可完成');
ok(evaluateGame(hg).performance >= 50, '围捕评价计算');

const v1 = variantsOfRank(1)[0];
const ng = startNegotiation(st, v1);
let guard = 0;
while (!ng.done && guard++ < 10) negotiate(st, ng, ng.bias);
ok(ng.done, '折冲小游戏可结束');
ok(ng.success, '居心性出牌可成功', `进度${ng.progress} 戒心${ng.suspicion}`);

const v2 = variantsOfRank(2)[0];
const gg = startGovernance(st, v2);
guard = 0;
while (!gg.done && guard++ < 10) govern(st, gg, 'farm');
ok(gg.done, '治邑小游戏可结束');
ok(typeof evaluateGame(gg).performance === 'number', '治邑评价计算');

const v3 = variantsOfRank(3)[0];
const wg = startBattle(st, v3);
guard = 0;
while (!wg.done && guard++ < 10) battleRound(st, wg, 'fang');
ok(wg.done, '军略小游戏可结束');
ok(wg.troops >= 0 && wg.enemyTroops >= 0, '军略伤亡合法');

const v4 = variantsOfRank(4)[0];
const rg = startRites(st, v4);
riteSubmit(st, rg, rg.trueOrder);
ok(rg.done && rg.success, '定礼小游戏可完成');
ok(evaluateGame(rg).performance >= 50, '定礼评价计算');

console.log(fails ? `\n失败 ${fails} 项 ✗` : '\n五等爵与册命试炼通过 ✓');
process.exit(fails ? 1 : 0);
