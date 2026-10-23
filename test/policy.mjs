// 国策：议题、三档结果、持续与到期、改策倒扣、效果接入
import { newGame, player } from '../js/state.js';
import {
  POLICIES, ISSUES, pickIssue, canAdvise, adviseOutcome, currentPolicy,
  policyMods, tickPolicy, POLICY_DAYS, HEART_POLICY,
} from '../js/systems/policy.js';
import { priceAt, levyOf } from '../js/systems/trade.js';
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
  const r2 = adviseOutcome(st, issue2, 0, 'li');
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
  const p0 = priceAt(st, player(st).cityId, 'su');
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
