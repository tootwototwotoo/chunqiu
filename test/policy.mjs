// 国策：议题、三档结果、持续与到期、改策倒扣、效果接入
import { newGame } from '../js/state.js';
import {
  POLICIES, ISSUES, canAdvise, adviseOutcome, currentPolicy, policyMods, tickPolicy, keepPolicy
} from '../js/systems/policy.js';
import { levyOf } from '../js/systems/trade.js';
import { CITY_MAP } from '../js/data/world.js';
import { joinCampaign } from '../js/systems/progression.js';
import { advanceDays } from '../js/systems/calendar.js';

let fails = 0;
const ok = (c, m, x = '') => { console.log(`${c ? '✓' : '✗'} ${m}${x ? ' — ' + x : ''}`); if (!c) fails++; };

ok(Object.keys(POLICIES).length === 5, '五个国策', Object.keys(POLICIES).join(','));
ok(ISSUES.length >= 5, '议题不少于五个', String(ISSUES.length));
for (const i of ISSUES) {
  ok(i.options.length === 3, `${i.name} 三选一`);
  ok(i.options.every(o => POLICIES[o.policy]), `${i.name} 国策合法`);
  ok(i.options.filter(o => o.fit).length === 1, `${i.name} 恰有一策契合`);
}

// 出仕才能献策
{
  const st = newGame({ name: '士', profession: 'youxia', seed: 1 });
  ok(!canAdvise(st).ok, '未出仕不能献策');
}

// 大用 → 90 天；小用 → 60 天
function force(grade) {
  const st = newGame({ name: '士', profession: 'youxia', seed: 3 });
  st.player.stateId = 'qi';
  st.player.stats.zhi = grade === 'great' ? 100 : 20;
  st.player.stats.zheng = grade === 'great' ? 100 : 20;
  st.player.skills.quanmou = grade === 'great' ? 10 : 0;
  st.world.power.qi = grade === 'great' ? 90 : 10;
  const issue = ISSUES.find(i => i.id === 'grain_high');
  const opt = issue.options.findIndex(o => o.fit);
  const r = adviseOutcome(st, issue, opt, 'li');
  return { st, r };
}
{
  const { st, r } = force('great');
  st.player.merit = 30;
  ok(r.grade === 'great', '大用', r.grade);
  ok(r.days === 90, '大用持续 90 天', String(r.days));
  ok(r.merit === 8, '大用功勋 +8', String(r.merit));
  ok(!!currentPolicy(st), '国策已生效');

  // 改策倒扣，且大于大用收益
  const before = st.player.merit;
  const issue2 = ISSUES.find(i => i.id === 'treasury_low');
  adviseOutcome(st, issue2, 0, 'li');
  ok(st.player.merit < before, '改策倒扣功勋', `${before} → ${st.player.merit}`);
  ok(before - st.player.merit > 8, '改策净扣大于大用收益', String(before - st.player.merit));
}

// 到期
{
  const { st } = force('great');
  ok(!!currentPolicy(st), '到期前有国策');
  advanceDays(st, 91);
  ok(!currentPolicy(st), '90 天后国策到期');
}

// 效果接入
{
  const { st } = force('great'); // 重农
  st.world.policy = { id: 'farm', untilDay: 99999, grade: 'great', startedDay: 0 };
  const mod = policyMods(st);
  ok(mod.grainPrice < 0 && mod.famineHalve, '重农降低粮价并减半饥荒');

  st.world.policy = { id: 'trade', untilDay: 99999, grade: 'great', startedDay: 0 };
  const lv1 = levyOf(st);
  st.world.policy = null;
  const lv0 = levyOf(st);
  ok(lv1 > lv0, '通商提高卖出牙钱（税后所得）', `${lv0} → ${lv1}`);

  st.world.policy = { id: 'army', untilDay: 99999, grade: 'great', startedDay: 0 };
  const out = { notes: [] };
  const power = st.world.power.qi;
  tickPolicy(st, out);
  ok(st.world.power.qi === power + 1, '修武每月国势 +1');

  st.world.policy = { id: 'school', untilDay: 99999, grade: 'great', startedDay: 0 };
  const merit = st.player.merit;
  tickPolicy(st, { notes: [] });
  ok(st.player.merit === merit + 2, '兴学每月功勋 +2');
}


// 维持旧策：不罚功勋、顺延期限
{
  const st = newGame({ name: '守', profession: 'youxia', seed: 13 });
  st.player.stateId = 'qi'; st.player.cityId = 'linzi';
  st.player.merit = 50;
  const issue = ISSUES.find(i => i.id === 'grain_high');
  const fit = issue.options.findIndex(o => o.fit);
  adviseOutcome(st, issue, fit, 'li');
  const before = st.player.merit;
  const r = keepPolicy(st);
  ok(r.ok, '有国策时可维持旧策');
  ok(st.player.merit === before, '维持旧策不扣功勋', `${before} → ${st.player.merit}`);
  ok(currentPolicy(st).id === 'farm', '国策保持不变');
  ok(r.left >= 30, '维持后期限顺延', String(r.left));
}

// 续行同一国策不罚
{
  const st = newGame({ name: '续', profession: 'youxia', seed: 14 });
  st.player.stateId = 'qi'; st.player.cityId = 'linzi';
  st.player.merit = 100;
  const issue = ISSUES.find(i => i.id === 'grain_high');
  const fit = issue.options.findIndex(o => o.fit);
  adviseOutcome(st, issue, fit, 'li');
  const m0 = st.player.merit;
  const r2 = adviseOutcome(st, issue, fit, 'li');
  ok(r2.penalty === 0, '续行同策不罚', String(r2.penalty));
  ok(r2.continued === true, '标记为续行');
  ok(st.player.merit >= m0, '续行不亏功勋', `${m0} → ${st.player.merit}`);
}

// 改策仍照罚
{
  const st = newGame({ name: '改', profession: 'youxia', seed: 15 });
  st.player.stateId = 'qi'; st.player.cityId = 'linzi';
  st.player.merit = 200;
  const is1 = ISSUES.find(i => i.id === 'grain_high');
  adviseOutcome(st, is1, is1.options.findIndex(o => o.fit), 'li'); // farm
  const is2 = ISSUES.find(i => i.id === 'treasury_low');
  const before = st.player.merit;
  const r3 = adviseOutcome(st, is2, 0, 'li'); // trade
  ok(r3.penalty === 12, '改策倒扣 12', String(r3.penalty));
  ok(before - st.player.merit >= 8, '改策净亏大于大用收益', String(before - st.player.merit));
}

// 位置校验：须在本国朝堂
{
  const st = newGame({ name: '士', profession: 'youxia', seed: 5 });
  st.player.stateId = 'jin';
  st.player.cityId = 'jiang';
  ok(canAdvise(st).ok, '本国朝堂可献策');

  st.player.cityId = 'ying';
  const r = canAdvise(st);
  ok(!r.ok && r.msg.includes('归国'), '他国朝堂不可献策', r.msg);

  const other = Object.keys(st.world.owner).find(id => st.world.owner[id] === 'jin' && id !== 'jiang' && !CITY_MAP[id].tags.includes('court'));
  if (other) {
    st.player.cityId = other;
    const r2 = canAdvise(st);
    ok(!r2.ok && r2.msg.includes('朝堂'), '本国非朝堂不可献策', r2.msg);
  }

  const bar = Object.keys(st.world.owner).find(id => st.world.owner[id] === 'jin' && CITY_MAP[id].tags.includes('barracks'));
  st.player.cityId = bar;
  ok(joinCampaign(st).ok, '本国兵营可出征');
  st.player.cityId = 'ying';
  ok(!joinCampaign(st).ok, '他国兵营不可出征');
}

console.log(fails ? `\n失败 ${fails} 项 ✗` : '\n国策系统通过 ✓');
process.exit(fails ? 1 : 0);
