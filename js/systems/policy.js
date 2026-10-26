// 朝议与国策：议题生成、三选一、国策生效与到期
import { R, addLog, addMerit, addFame } from '../state.js';
import { CITY_MAP } from '../data/world.js';

export const POLICY_DAYS = 90;
export const ADVISE_COOLDOWN = 10;
export const POLICIES = {
  farm: {
    id: 'farm', name: '重农', icon: '禾',
    desc: '减赋劝农、开垦荒田，粮价渐平，饥荒损失减半。',
    effect: '粮价 -12%，饥荒损害减半，持续 90 天。',
  },
  trade: {
    id: 'trade', name: '通商', icon: '市',
    desc: '招徕商旅、轻税通市，牙钱降低，行囊更宽。',
    effect: '牙钱 -4%，商队容量 +4，物价波动减小。',
  },
  army: {
    id: 'army', name: '修武', icon: '戈',
    desc: '整军经武、以军粮为先，国势逐月上升。',
    effect: '从军判定 +8，每月国势 +1。',
  },
  people: {
    id: 'people', name: '安民', icon: '民',
    desc: '抚流民、修仓储，民心稍安，名声渐长。',
    effect: '每月名声 +1，赈灾与流民事件更易成功。',
  },
  school: {
    id: 'school', name: '兴学', icon: '学',
    desc: '设学宫、养士人，辩才与政略渐长。',
    effect: '辩才修习经验 +20%，每月功勋 +2。',
  },
};

// 议题：每个议题三个固定策，对应不同国策与契合度
export const ISSUES = [
  {
    id: 'grain_high', name: '粮价腾贵', topic: 'grain',
    check: st => true,
    weight: st => 3,
    q: '今岁粮价腾贵，民怨渐起，君将何以为政？',
    options: [
      { policy: 'farm', fit: true, text: '减赋劝农、开垦荒田，粮价自会渐平。', reply: '国君颔首：「治本之策，虽慢却稳。」' },
      { policy: 'trade', fit: false, text: '招徕商旅、平价粜粮，先压住眼前米价。', reply: '国君沉吟：「快是快，只怕豪商从中取利。」' },
      { policy: 'army', fit: false, text: '以军粮为先，弹压囤积，乱世用重典。', reply: '国君皱眉：「压得住价，压不住怨。」' },
    ],
  },
  {
    id: 'treasury_low', name: '府库不足', topic: 'trade',
    check: st => true, weight: st => 2,
    q: '府库日虚，俸禄与军饷都将不继，君将何以处之？',
    options: [
      { policy: 'trade', fit: true, text: '轻税通商，使商旅辐辏，府库自然充实。', reply: '国君点头：「商旅愿来，税自然就有了。」' },
      { policy: 'farm', fit: false, text: '劝农积谷，以粟帛代钱，先稳住根本。', reply: '国君叹道：「农是本，可远水难救近火。」' },
      { policy: 'army', fit: false, text: '裁撤冗兵、清查军需，先省出一笔。', reply: '国君皱眉：「裁兵容易，边患谁来守？」' },
    ],
  },
  {
    id: 'border_war', name: '边患未息', topic: 'army',
    check: st => true, weight: st => 2,
    q: '邻国陈兵于境，边邑数警，君将何以应之？',
    options: [
      { policy: 'army', fit: true, text: '整军经武、修缮边塞，先立于不败之地。', reply: '国君目光一振：「有备，才谈得上和战。」' },
      { policy: 'trade', fit: false, text: '以边市之利结好邻国，换他退兵。', reply: '国君沉吟：「以利换和，可以，但要有兵作后盾。」' },
      { policy: 'people', fit: false, text: '安抚边民、坚壁清野，使敌无所得。', reply: '国君叹道：「安民要紧，可敌军未必因此退。」' },
    ],
  },
  {
    id: 'weak_state', name: '国势衰微', topic: 'court',
    check: st => (st.world.power[st.player.stateId] ?? 30) < 42,
    weight: st => 4,
    q: '国势日蹙，诸侯轻我，君将何以振之？',
    options: [
      { policy: 'army', fit: true, text: '修武整军，先振国威，再图外事。', reply: '国君沉声道：「不振军威，说什么都没人听。」' },
      { policy: 'farm', fit: false, text: '宽赋安民，使国力自复。', reply: '国君叹道：「安民是根本，可诸侯不会等我们。」' },
      { policy: 'school', fit: false, text: '兴学养士，以人才图强。', reply: '国君摇头：「人才要十年，国势等不了十年。」' },
    ],
  },
  {
    id: 'talent_lack', name: '朝中乏才', topic: 'people',
    check: st => true, weight: st => 2,
    q: '朝中乏才，政事壅滞，君将何以取士？',
    options: [
      { policy: 'school', fit: true, text: '设学宫、养士人，数年之后人才自出。', reply: '国君点头：「养士是百年之计，寡人愿等。」' },
      { policy: 'people', fit: false, text: '举寒门、试以事，不问出身。', reply: '国君沉吟：「寒门可用，但也要有人教他们政事。」' },
      { policy: 'trade', fit: false, text: '以厚禄招徕他国游士。', reply: '国君反问：「厚禄招来的，肯为我们死吗？」' },
    ],
  },
  {
    id: 'famine_hit', name: '饥荒流民', topic: 'people',
    check: st => true, weight: st => 2,
    q: '灾后流民塞道，仓廪将空，君将何以处之？',
    options: [
      { policy: 'people', fit: true, text: '开仓赈济、编户授田，先安其生。', reply: '国君颔首：「先让人活下去，才谈得上其他。」' },
      { policy: 'farm', fit: false, text: '贷种劝耕，令流民自食其力。', reply: '国君叹道：「贷种是好，可他们连今天都过不去。」' },
      { policy: 'army', fit: false, text: '派兵弹压，禁止流民入城。', reply: '国君皱眉：「压得住一时，压不住一路。」' },
    ],
  },
];

export function currentPolicy(st) {
  const p = st.world.policy;
  if (!p || !p.id) return null;
  const left = p.untilDay - dayOf(st.time);
  if (left <= 0) return null;
  return { ...p, policy: POLICIES[p.id], left };
}

export function policyMods(st) {
  const cur = currentPolicy(st);
  const p = st.player;
  const out = { grainPrice: 0, famineHalve: false, levy: 0, caravan: 0, campaign: 0, fameMonthly: 0, meritMonthly: 0, biancaiExp: 1, priceDrift: 1 };
  if (!cur) return out;
  if (cur.id === 'farm') { out.grainPrice = -0.12; out.famineHalve = true; }
  if (cur.id === 'trade') { out.levy = 0.04; out.caravan = 4; out.priceDrift = 0.6; }
  if (cur.id === 'army') { out.campaign = 8; }
  if (cur.id === 'people') { out.fameMonthly = 1; }
  if (cur.id === 'school') { out.meritMonthly = 2; out.biancaiExp = 1.2; }
  return out;
}

export function issueWeight(st, issue) {
  if (issue.check && !issue.check(st)) return 0;
  return issue.weight ? issue.weight(st) : 1;
}

export function pickIssue(st) {
  const pool = [];
  for (const issue of ISSUES) {
    const w = issueWeight(st, issue);
    for (let i = 0; i < w; i++) pool.push(issue);
  }
  if (!pool.length) return ISSUES[0];
  return R.pick(st, pool);
}

export function canAdvise(st) {
  const p = st.player;
  if (!p.stateId) return { ok: false, msg: '尚未出仕。' };
  const city = CITY_MAP[p.cityId];
  if (!city || !city.tags.includes('court')) return { ok: false, msg: '献策须入本国朝堂。' };
  if (st.world.owner[p.cityId] !== p.stateId) return { ok: false, msg: '此处非本国朝堂，献策须归国入朝。' };
  const last = st.flags.lastAdvise ?? -999;
  const wait = ADVISE_COOLDOWN - (dayOf(st.time) - last);
  if (wait > 0) return { ok: false, msg: `朝议方毕，${wait} 日后可再陈。` };
  return { ok: true };
}

// 维持旧策：不要功勋，也不受改策惩罚，仅顺延 30 日
export function keepPolicy(st) {
  const cur = currentPolicy(st);
  if (!cur) return { ok: false, msg: '本无国策，无所可维持。' };
  st.flags.lastAdvise = dayOf(st.time);
  st.world.policy = { ...st.world.policy, untilDay: Math.max(cur.untilDay, dayOf(st.time) + 30) };
  addLog(st, `朝议无所改易，「${POLICIES[cur.id].name}」之策仍行。`);
  return { ok: true, kept: true, policy: POLICIES[cur.id], left: currentPolicy(st).left };
}

export function adviseOutcome(st, issue, optionIndex, heart) {
  const p = st.player;
  const opt = issue.options[optionIndex];
  const cur = currentPolicy(st);
  const same = cur && cur.id === opt.policy;
  let penalty = 0;
  if (cur && !same) {
    // 改策：剩余天数作废，倒扣功勋（大于大用收益 +8）
    penalty = 12;
    addMeritDelta(st, -penalty);
    st.world.policy = null;
    addLog(st, `中途改行「${POLICIES[opt.policy].name}」，旧策作废，功勋 -${penalty}。`, 'war');
  }
  // 续行同一国策不罚：下面按判定结果顺延期限
  const heartFit = opt.policy === HEART_POLICY[heart] ? 8 : 0;
  const roll = p.stats.zhi * 0.35 + p.stats.zheng * 0.45 + (p.skills.quanmou ?? 0) * 3
    + (opt.fit ? 10 : 0) + heartFit + (st.world.power[p.stateId] - 50) * 0.2 + R.int(st, 0, 15);
  const threshold = 40;
  let grade = 'fail';
  if (roll >= threshold + 15) grade = 'great';
  else if (roll >= threshold) grade = 'small';
  const merit = grade === 'great' ? 8 : grade === 'small' ? 4 : 0;
  const net = Math.max(0, merit - penalty);
  if (net) addMeritDelta(st, net);
  if (grade === 'fail') addFame(st, -1, true);
  const days = grade === 'great' ? 90 : grade === 'small' ? 60 : 0;
  if (days) {
    if (same) {
      // 续行：在现有期限上顺延，不覆盖进度
      st.world.policy = {
        id: opt.policy,
        untilDay: Math.max(cur.untilDay, dayOf(st.time) + days),
        grade, startedDay: cur.startedDay,
      };
      addLog(st, `续行「${POLICIES[opt.policy].name}」，期限顺延。`, 'gain');
    } else {
      st.world.policy = { id: opt.policy, untilDay: dayOf(st.time) + days, grade, startedDay: dayOf(st.time) };
    }
  }
  return { grade, roll, merit: net, penalty, days, continued: !!same, option: opt, policy: POLICIES[opt.policy] };
}

export const HEART_POLICY = { li: 'trade', yi: 'people', ming: 'school', shi: 'army' };

export function policySummary(st) {
  const cur = currentPolicy(st);
  const mods = policyMods(st);
  const out = [];
  if (mods.grainPrice) out.push(`粮价 ${Math.round(mods.grainPrice * 100)}%`);
  if (mods.levy) out.push(`牙钱 -${Math.round(mods.levy * 100)}%`);
  if (mods.caravan) out.push(`行囊 +${mods.caravan}`);
  if (mods.campaign) out.push(`从军 +${mods.campaign}`);
  if (mods.fameMonthly) out.push(`每月名声 +${mods.fameMonthly}`);
  if (mods.meritMonthly) out.push(`每月功勋 +${mods.meritMonthly}`);
  if (mods.biancaiExp > 1) out.push('辩才修习 +20%');
  if (mods.famineHalve) out.push('饥荒减半');
  return { cur, mods, text: out.join('　') || '无' };
}

export function tickPolicy(st, out) {
  const cur = currentPolicy(st);
  if (!cur) return;
  if (cur.id === 'army') {
    st.world.power[st.player.stateId] = Math.min(100, (st.world.power[st.player.stateId] ?? 30) + 1);
    out.notes.push('修武之策见效，国势 +1。');
  }
  if (cur.id === 'people') { addFame(st, 1, true); out.notes.push('安民之策见效，名声 +1。'); }
  if (cur.id === 'school') { addMeritDelta(st, 2); out.notes.push('兴学之策见效，功勋 +2。'); }
  if (cur.untilDay - dayOf(st.time) === 0) out.notes.push(`国策「${cur.policy.name}」到期。`);
}

function dayOf(t) { return (t.year + 722) * 360 + (t.month - 1) * 30 + t.day; }

const addMeritDelta = (st, v) => addMerit(st, v, true);
