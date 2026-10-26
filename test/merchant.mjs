// 商人系统：阶次、商号、伙计、散财、求仕、差事预算制、存档迁移
import { newGame, player } from '../js/state.js';
import {
  MERCHANT_RANKS, SHOP_LEVELS, HIRE, GIVEAWAYS, BUY_OFFICE,
} from '../js/data/merchant.js';
import {
  shopAt, shopCount, shopIncomeOf, totalShopIncome, totalWages,
  canOpenShop, openShop, canUpgradeShop, upgradeShop, upgradeCostOf,
  canHire, hireClerk, canGive, giveAway, merchantRank,
  rankIndexOf, canBuyOffice, buyOffice, trackPeakMoney,
} from '../js/systems/merchant.js';
import { advanceDays } from '../js/systems/calendar.js';
import { computeEnding, scoreOf } from '../js/systems/progression.js';
import { migrateState } from '../js/state.js';

let fails = 0;
const ok = (c, m, x = '') => { console.log(`${c ? '✓' : '✗'} ${m}${x ? ' — ' + x : ''}`); if (!c) fails++; };

// ---------------- 阶次体系 ----------------
ok(MERCHANT_RANKS.length === 6, '六阶', MERCHANT_RANKS.map(r => r.name).join(','));
ok(MERCHANT_RANKS[4].name === '商盟之主' && MERCHANT_RANKS[5].name === '陶朱公', '四五阶名称正确');
ok(MERCHANT_RANKS[5].given > 0 && MERCHANT_RANKS[5].peak > 0, '陶朱公要求散财与峰值金钱');

{
  const st = newGame({ name: '商', profession: 'shangren', seed: 1 });
  ok(merchantRank(st).name === '贩夫', '初始为贩夫');
  ok(st.player.staminaMax === 120, '商人初始体力上限 120', String(st.player.staminaMax));

  // 行商：只看钱
  st.player.money = 1200;
  ok(merchantRank(st).name === '行商', '金 1200 升行商');

  // 坐贾：需商号
  st.player.money = 3500;
  ok(merchantRank(st).name === '行商', '无商号不升坐贾', merchantRank(st).name);
  st.player.money = 5000;
  openShop(st, st.player.cityId);
  ok(merchantRank(st).name === '坐贾', '有商号且金足升坐贾');

  // 巨商：需 3 座（设肆要花钱，故先给足）
  st.player.money = 9000;
  ok(merchantRank(st).name === '坐贾', '1 座商号不升巨商', merchantRank(st).name);
  openShop(st, 'linzi'); openShop(st, 'luoyi');
  ok(shopCount(st) === 3, '共 3 座商号', String(shopCount(st)));
  st.player.money = 9000; // 设肆耗金，补回门槛之上
  ok(merchantRank(st).name === '巨商', '3 座商号升巨商', merchantRank(st).name);

  // 商盟之主：需商盟
  st.player.money = 17000;
  ok(merchantRank(st).name === '巨商', '无商盟不升商盟之主');
  st.player.pacts = [{ state: 'qi' }];
  ok(merchantRank(st).name === '商盟之主', '有商盟升商盟之主');

  // 陶朱公：需散财 + 峰值
  st.player.money = 40000;
  trackPeakMoney(st);
  ok(rankIndexOf(st) === 4, '仅有钱不够，还差散财', merchantRank(st).name);
  st.player.givenAway = MERCHANT_RANKS[5].given;
  ok(merchantRank(st).name === '陶朱公', '散财达标升陶朱公');
  // 散尽家财仍是陶朱公
  st.player.money = 0;
  trackPeakMoney(st);
  ok(merchantRank(st).name === '陶朱公', '散尽家财仍为陶朱公（三散其财）');
}

// ---------------- 商号 ----------------
{
  const st = newGame({ name: '商', profession: 'shangren', seed: 2 });
  st.player.cityId = 'linzi';
  ok(SHOP_LEVELS[1].income === 120, '小肆月入 120');

  st.player.money = 100;
  ok(!canOpenShop(st, 'linzi').ok, '金不足不可设肆');
  st.player.money = 1000;
  const r = openShop(st, 'linzi');
  ok(r.ok, '可开设小肆', r.msg);
  ok(shopIncomeOf(shopAt(st, 'linzi')) === 120, '小肆月入 120');
  ok(player(st).money === 200, '扣除 800 金', String(player(st).money));
  ok(!canOpenShop(st, 'linzi').ok, '同城不可重复设肆');

  // 升级
  ok(upgradeCostOf(shopAt(st, 'linzi')) === 1200, '升大铺补差价 1200', String(upgradeCostOf(shopAt(st, 'linzi'))));
  st.player.money = 1200;
  ok(canUpgradeShop(st, 'linzi').ok, '可升大铺');
  upgradeShop(st, 'linzi');
  ok(shopAt(st, 'linzi').level === 2 && shopIncomeOf(shopAt(st, 'linzi')) === 320, '大铺月入 320');
  st.player.money = 3000;
  upgradeShop(st, 'linzi');
  ok(shopAt(st, 'linzi').level === 3 && shopIncomeOf(shopAt(st, 'linzi')) === 800, '总号月入 800');
  ok(!canUpgradeShop(st, 'linzi').ok, '总号不可再升');
}

// ---------------- 伙计 ----------------
{
  const st = newGame({ name: '商', profession: 'shangren', seed: 3 });
  st.player.cityId = 'linzi';
  st.player.money = 10000;
  openShop(st, 'linzi');
  const shop = shopAt(st, 'linzi');
  ok(canHire(st, 'linzi').ok, '小肆可雇伙计');
  hireClerk(st, 'linzi');
  ok(shop.hired === 1, '雇得 1 名');
  ok(shopIncomeOf(shop) === 120 + HIRE.income, '伙计加月入', String(shopIncomeOf(shop)));
  ok(totalWages(st) === HIRE.wage, '伙计月支', String(totalWages(st)));
  ok(!canHire(st, 'linzi').ok, '小肆只能雇 1 名', canHire(st, 'linzi').msg);

  // 升大铺后可再雇
  st.player.money = 2000;
  upgradeShop(st, 'linzi');
  st.player.money = 10000;
  ok(canHire(st, 'linzi').ok, '大铺可再雇');
  hireClerk(st, 'linzi');
  ok(shop.hired === 2, '共 2 名');
  ok(!canHire(st, 'linzi').ok, '大铺上限 2 名');
}

// ---------------- 月结：商号收入与工食 ----------------
{
  const st = newGame({ name: '商', profession: 'shangren', seed: 4 });
  st.player.cityId = 'linzi';
  st.player.money = 10000;
  openShop(st, 'linzi');
  hireClerk(st, 'linzi');
  const before = player(st).money;
  const income = totalShopIncome(st);
  const wages = totalWages(st);
  advanceDays(st, 31);
  const delta = player(st).money - before;
  ok(delta >= income - wages - 200, '月结有商号进项与工食', `进项${income} 工食${wages} 实际${delta}`);
}

// ---------------- 散财 ----------------
{
  const st = newGame({ name: '商', profession: 'shangren', seed: 5 });
  st.player.cityId = 'linzi';
  st.player.money = 20000;
  const fame0 = player(st).fame;

  const r = giveAway(st, 'relief', 'linzi');
  ok(r.ok, '可赈济', r.msg);
  ok(player(st).givenAway === GIVEAWAYS.relief.cost, '累記散财', String(player(st).givenAway));
  ok(player(st).fame > fame0, '名声提升');

  const before = player(st).givenAway;
  giveAway(st, 'army', 'linzi');
  ok(player(st).givenAway === before + GIVEAWAYS.army.cost, '散财累加');

  // 修路需要本地商号
  ok(!canGive(st, 'road', 'linzi').ok, '无商号不可修路');
  openShop(st, 'linzi');
  const shop = shopAt(st, 'linzi');
  const inc0 = shopIncomeOf(shop);
  giveAway(st, 'road', 'linzi');
  ok(shopIncomeOf(shop) === inc0 + GIVEAWAYS.road.shopBonus, '修路提升本号月入');

  // 钱不足
  st.player.money = 10;
  ok(!canGive(st, 'relief').ok, '金不足不可散财');
}

// ---------------- 献金求仕 ----------------
{
  const st = newGame({ name: '商', profession: 'shangren', seed: 6 });
  st.player.cityId = 'linzi';
  st.player.money = 25000;
  st.player.fame = 70;
  // 先到巨商
  st.player.money = 25000;
  openShop(st, 'linzi'); openShop(st, 'luoyi'); openShop(st, 'tao');
  ok(merchantRank(st).name === '巨商', '先至巨商', merchantRank(st).name);

  ok(canBuyOffice(st, 'qi').ok, '巨商可献金求仕', canBuyOffice(st, 'qi').msg);
  const shopsBefore = shopCount(st);
  const r = buyOffice(st, 'qi', 'shuike');
  ok(r.ok, '献金求仕成功', r.msg);
  ok(player(st).profession === 'shuike', '转为说客');
  ok(player(st).stateId === 'qi' && player(st).rank === BUY_OFFICE.rankGranted, '授上士', String(player(st).rank));
  ok(player(st).passiveIncome > 0, '旧商号转为养廉', String(player(st).passiveIncome));
  ok(shopsBefore === 3, '商号保留');

  // 转职后不可再献金
  ok(!canBuyOffice(st, 'qi').ok, '非商人不可再献金');

  // 养廉月结
  const before = player(st).money;
  advanceDays(st, 31);
  ok(player(st).money > before, '养廉每月有进项', `${before} → ${player(st).money}`);
}

// ---------------- 差事预算制 ----------------
{
  const { refreshBoard } = await import('../js/systems/quests.js');
  const st = newGame({ name: '商', profession: 'shangren', seed: 7 });
  st.player.cityId = 'linzi';
  let q = null;
  for (let i = 0; i < 40 && !q; i++) q = refreshBoard(st, true).find(o => o.kind === 'supply');
  ok(!!q, '找到运货差事');
  if (q) {
    ok(q.supplyBudget > 0, '差事带采办预算', String(q.supplyBudget));
    ok(q.reward.money > q.supplyBudget, '报酬高于预算（含酬金）', `${q.supplyBudget} < ${q.reward.money}`);
    ok(/采办金/.test(q.desc), '说明写明采办金');
  }
}

// ---------------- 结局与评分 ----------------
{
  const st = newGame({ name: '商', profession: 'shangren', seed: 8 });
  const e0 = computeEnding(st);
  ok(e0.rank === '贩夫', '结局阶次为贩夫');
  ok(/负贩于市/.test(e0.comment), '低阶有其评语', e0.comment);

  st.player.money = 40000;
  trackPeakMoney(st);
  st.player.givenAway = MERCHANT_RANKS[5].given;
  const e1 = computeEnding(st);
  ok(e1.rank === '陶朱公', '结局阶次为陶朱公', e1.rank);
  ok(/陶朱公/.test(e1.comment), '高阶评语提及陶朱公', e1.comment);
  ok(/散财/.test(e1.epilogue), 'epilogue 记录散财', e1.epilogue);

  // 评分含商人加成
  const s1 = scoreOf(st);
  const st2 = newGame({ name: '商', profession: 'shangren', seed: 8 });
  st2.player.money = 40000;
  ok(s1 > scoreOf(st2), '散财与阶次提升评分', `${scoreOf(st2)} → ${s1}`);
}

// ---------------- 存档迁移：旧 shops 数组 ----------------
{
  const st = newGame({ name: '商', profession: 'shangren', seed: 9 });
  migrateState(st);
  st.player.shops = ['linzi', 'luoyi'];
  delete st.player.givenAway;
  delete st.player.peakMoney;
  delete st.player.pacts;
  delete st.player.passiveIncome;
  const m = migrateState(st);
  ok(Array.isArray(m.player.shops) && typeof m.player.shops[0] === 'object', '旧 shops 迁移为对象');
  ok(m.player.shops[0].city === 'linzi' && m.player.shops[0].level === 1, '迁移出城市与等级', JSON.stringify(m.player.shops[0]));
  ok(m.player.givenAway === 0 && Array.isArray(m.player.pacts), '新字段补齐');
  ok(m.player.shops.every(s => s.hired >= 0 && s.bonus >= 0), '伙计与加成字段完整');
}

// ---------------- 商人仍不可入仕途 ----------------
{
  const { canTakeOffice, canSeekOffice } = await import('../js/systems/progression.js');
  const st = newGame({ name: '商', profession: 'shangren', seed: 10 });
  st.player.fame = 200;
  for (let i = 0; i < 5; i++) st.quests.done.push({ id: `q${i}`, status: 'done', reward: {} });
  ok(!canTakeOffice(st).ok, '商人不可入仕途');
  ok(!canSeekOffice(st).ok, '商人 canSeekOffice 拒绝');
}

console.log(fails ? `\n失败 ${fails} 项 ✗` : '\n商人系统通过 ✓');
process.exit(fails ? 1 : 0);
