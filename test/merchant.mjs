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
  canGetPermit, getPermit, hasPermit, permitFeeAt, permitCandidates, shopCostAt, shopIncomeBaseAt,
} from '../js/systems/merchant.js';
import { advanceDays } from '../js/systems/calendar.js';
import { computeEnding, scoreOf } from '../js/systems/progression.js';
import { migrateState } from '../js/state.js';

let fails = 0;
const ok = (c, m, x = '') => { console.log(`${c ? '✓' : '✗'} ${m}${x ? ' — ' + x : ''}`); if (!c) fails++; };

// 测试便利：直接把某城市籍写入状态（等价于已领得许可）
const grantPermit = (st, cityId) => {
  st.player.permits = Array.isArray(st.player.permits) ? st.player.permits : [];
  if (!st.player.permits.some(x => x.city === cityId)) {
    st.player.permits.push({ city: cityId, by: 'test', day: 0, fee: 0 });
  }
};

// ---------------- 阶次体系 ----------------
ok(MERCHANT_RANKS.length === 6, '六阶', MERCHANT_RANKS.map(r => r.name).join(','));
ok(MERCHANT_RANKS[4].name === '商盟之主' && MERCHANT_RANKS[5].name === '陶朱公', '四五阶名称正确');
ok(MERCHANT_RANKS[5].given > 0 && MERCHANT_RANKS[5].peak > 0, '陶朱公要求散财与峰值金钱');

{
  const st = newGame({ name: '商', profession: 'shangren', seed: 1 });
  ok(merchantRank(st).name === '贩夫', '初始为贩夫');
  ok(st.player.staminaMax === 120, '商人初始体力上限 120', String(st.player.staminaMax));

  const R = MERCHANT_RANKS;
  const setMoney = (v) => { st.player.money = v; if (v > (st.player.peakMoney ?? 0)) st.player.peakMoney = v; };

  // 行商：只看钱
  setMoney(R[1].money);
  ok(merchantRank(st).name === '行商', `金 ${R[1].money} 升行商`, merchantRank(st).name);

  // 坐贾：需商号
  setMoney(R[2].money);
  ok(merchantRank(st).name === '行商', '无商号不升坐贾', merchantRank(st).name);
  grantPermit(st, st.player.cityId);
  openShop(st, st.player.cityId);
  ok(shopCount(st) >= R[2].shops, '商号达坐贾要求', String(shopCount(st)));
  setMoney(R[2].money);
  ok(merchantRank(st).name === '坐贾', '有商号且金足升坐贾', merchantRank(st).name);

  // 巨商：需更多商号
  setMoney(R[3].money);
  ok(merchantRank(st).name === '坐贾', '商号不足不升巨商', merchantRank(st).name);
  for (const cid of ['linzi', 'luoyi', 'tao', 'ying']) {
    if (shopCount(st) >= R[3].shops) break;
    if (shopAt(st, cid)) continue;
    grantPermit(st, cid);
    openShop(st, cid);
  }
  ok(shopCount(st) >= R[3].shops, `共 ${R[3].shops} 座商号`, String(shopCount(st)));
  setMoney(R[3].money);
  ok(merchantRank(st).name === '巨商', '商号足则升巨商', merchantRank(st).name);

  // 商盟之主：需商盟
  setMoney(R[4].money);
  ok(merchantRank(st).name === '巨商', '无商盟不升商盟之主', merchantRank(st).name);
  st.player.pacts = [{ state: 'qi' }];
  ok(merchantRank(st).name === '商盟之主', '有商盟升商盟之主');

  // 陶朱公：需散财 + 峰值
  setMoney(R[5].peak * 0.5);
  ok(rankIndexOf(st) === 4, '仅有钱不够，还差散财', merchantRank(st).name);
  st.player.givenAway = R[5].given;
  ok(merchantRank(st).name === '商盟之主', '钱不够峰值也不升陶朱公', merchantRank(st).name);
  setMoney(R[5].peak);
  ok(merchantRank(st).name === '陶朱公', '散财达标且曾持巨资升陶朱公', merchantRank(st).name);
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
  st.player.money = 3000;
  ok(!canOpenShop(st, 'linzi').ok, '无市籍不可设肆', canOpenShop(st, 'linzi').msg);
  grantPermit(st, 'linzi');
  const r = openShop(st, 'linzi');
  ok(r.ok, '可开设小肆', r.msg);
  ok(shopIncomeOf(shopAt(st, 'linzi')) === shopIncomeBaseAt('linzi', 1), '小肆月入按城浮动');
  ok(player(st).money === 3000 - shopCostAt('linzi', 1), '扣除按城浮动的设肆费',
    `${player(st).money} = 3000 - ${shopCostAt('linzi', 1)}`);
  ok(!canOpenShop(st, 'linzi').ok, '同城不可重复设肆');

  // 升级
  const upCost = upgradeCostOf(shopAt(st, 'linzi'));
  ok(upCost === shopCostAt('linzi', 2) - shopCostAt('linzi', 1), '升级差价按城浮动', String(upCost));
  st.player.money = upCost;
  ok(canUpgradeShop(st, 'linzi').ok, '可升大铺');
  upgradeShop(st, 'linzi');
  ok(shopAt(st, 'linzi').level === 2 && shopIncomeOf(shopAt(st, 'linzi')) === shopIncomeBaseAt('linzi', 2), '大铺月入按城浮动');
  st.player.money = shopCostAt('linzi', 3);
  upgradeShop(st, 'linzi');
  ok(shopAt(st, 'linzi').level === 3 && shopIncomeOf(shopAt(st, 'linzi')) === shopIncomeBaseAt('linzi', 3), '总号月入按城浮动');
  ok(!canUpgradeShop(st, 'linzi').ok, '总号不可再升');
}

// ---------------- 伙计 ----------------
{
  const st = newGame({ name: '商', profession: 'shangren', seed: 3 });
  st.player.cityId = 'linzi';
  st.player.money = 10000;
  st.player.permits = [{ city: 'linzi', by: 'test', day: 0, fee: 0 }];
  openShop(st, 'linzi');
  const shop = shopAt(st, 'linzi');
  ok(canHire(st, 'linzi').ok, '小肆可雇伙计');
  hireClerk(st, 'linzi');
  ok(shop.hired === 1, '雇得 1 名');
  ok(shopIncomeOf(shop) > shopIncomeBaseAt('linzi', 1), '伙计加月入', String(shopIncomeOf(shop)));
  ok(totalWages(st) === HIRE.wage, '伙计月支', String(totalWages(st)));
  ok(!canHire(st, 'linzi').ok, '小肆只能雇 1 名', canHire(st, 'linzi').msg);

  // 升大铺后可再雇（升级差价按城浮动）
  st.player.money = upgradeCostOf(shopAt(st, 'linzi'));
  ok(upgradeShop(st, 'linzi').ok, '升为大批（为雇工测试）');
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
  st.player.permits = [{ city: 'linzi', by: 'test', day: 0, fee: 0 }];
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

  // 同类义举有冷却：立刻再来应被拒
  ok(!canGive(st, 'relief', 'linzi').ok, '同类散财有冷却', canGive(st, 'relief', 'linzi').msg);
  // 不同类可行
  const before = player(st).givenAway;
  const ra = giveAway(st, 'army', 'linzi');
  ok(ra.ok && player(st).givenAway === before + GIVEAWAYS.army.cost, '散财累加');
  // 同城同年只能一次
  advanceDays(st, 200);
  ok(!canGive(st, 'relief', 'linzi').ok, '同城同年仅可一次散财', canGive(st, 'relief', 'linzi').msg);
  advanceDays(st, 400);
  ok(canGive(st, 'relief', 'linzi').ok, '跨年且过冷却可再散财');

  // 修路需要本地商号
  ok(!canGive(st, 'road', 'linzi').ok || !!shopAt(st, 'linzi'), '无商号不可修路');
  if (!shopAt(st, 'linzi')) {
    st.player.permits = [{ city: 'linzi', by: 'test', day: 0, fee: 0 }];
    openShop(st, 'linzi');
  }
  const shop = shopAt(st, 'linzi');
  const inc0 = shopIncomeOf(shop, st);
  st.player.money = 20000;
  const rr = giveAway(st, 'road', 'linzi');
  ok(rr.ok, '可修路', rr.msg ?? '');
  ok(shopIncomeOf(shop, st) === inc0 + GIVEAWAYS.road.shopBonus, '修路提升本号月入');

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
  st.player.permits = ['linzi', 'luoyi', 'tao'].map(c => ({ city: c, by: 'test', day: 0, fee: 0 }));
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

  st.player.money = MERCHANT_RANKS[5].peak;
  trackPeakMoney(st);
  st.player.givenAway = MERCHANT_RANKS[5].given;
  st.player.pacts = [{ state: 'qi', day: 0, fee: 0, arrears: 0 }];
  const { openShop: os2, shopAt: sa2 } = await import('../js/systems/merchant.js');
  for (const cid of ['linzi', 'luoyi', 'tao', 'ying']) {
    if (!st.player.permits.some(x => x.city === cid)) st.player.permits.push({ city: cid, by: null, day: 0, fee: 0 });
    if (!sa2(st, cid)) os2(st, cid);
    st.player.money = MERCHANT_RANKS[5].peak;
    trackPeakMoney(st);
  }
  const e1 = computeEnding(st);
  ok(e1.rank === '陶朱公', '结局阶次为陶朱公', e1.rank);
  ok(/陶朱公/.test(e1.comment), '高阶评语提及陶朱公', e1.comment);
  ok(/散财/.test(e1.epilogue), 'epilogue 记录散财', e1.epilogue);

  // 评分含商人加成
  const s1 = scoreOf(st);
  const st2 = newGame({ name: '商', profession: 'shangren', seed: 8 });
  st2.player.money = MERCHANT_RANKS[5].peak;
  trackPeakMoney(st2);
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


// ---------------- 市籍许可 ----------------
{

  const { PERMIT, PERMIT_ROLES } = await import('../js/data/merchant.js');

  const st = newGame({ name: '商', profession: 'shangren', seed: 20 });
  st.player.cityId = 'linzi';
  st.player.money = 20000;
  st.player.fame = 5;

  // 阶次不足
  ok(!canGetPermit(st, 'linzi').ok, '贩夫不可请领市籍', canGetPermit(st, 'linzi').msg);

  st.player.money = MERCHANT_RANKS[1].money;
  st.player.peakMoney = MERCHANT_RANKS[1].money;
  ok(merchantRank(st).name === '行商', '先至行商', merchantRank(st).name);
  ok(!canGetPermit(st, 'linzi').ok, '名声不足不可请领', canGetPermit(st, 'linzi').msg);

  st.player.fame = 20;
  // 城中可选人物
  const cands = permitCandidates(st);
  ok(cands.length > 0, '城中有可授籍之人', cands.map(c => c.def.name).join(','));
  ok(cands.every(c => PERMIT_ROLES.includes(c.role)), '候选人均为可授籍角色');
  ok(cands[0].order <= (cands[cands.length - 1]?.order ?? 0), '候选人按角色优先排序');

  // 名声已达标但无交情：应可走名望路线
  st.player.money = 20000;
  const low = canGetPermit(st, 'linzi');
  ok(low.ok && low.mode === 'trial', '无交情可凭名望请领', low.mode ?? low.msg);
  // 名声跌到门槛以下则不可
  st.player.fame = PERMIT.minFame - 1;
  const noFame = canGetPermit(st, 'linzi');
  ok(!noFame.ok, '名声不足则不可请领', noFame.msg);
  st.player.fame = 20;

  // 交情路线
  const { rel } = await import('../js/state.js');
  rel(st, cands[0].id).aff = PERMIT.minAff;
  const byAff = canGetPermit(st, 'linzi');
  ok(byAff.ok && byAff.mode === 'affinity', '交情达标可请领', byAff.mode);
  ok(byAff.fee === permitFeeAt(st, 'linzi'), '市租按城浮动', String(byAff.fee));

  const money0 = player(st).money;
  const r = getPermit(st, 'linzi');
  ok(r.ok, '交情路线必定得籍', r.msg);
  ok(player(st).money === money0 - byAff.fee, '扣除市租');
  ok(hasPermit(st, 'linzi'), '已获市籍');
  ok(player(st).givenAway >= byAff.fee, '市租计入散财', String(player(st).givenAway));
  ok(!canGetPermit(st, 'linzi').ok, '同城不可重复请领');
  ok(canOpenShop(st, 'linzi').ok, '得籍后可设肆');

  // 名望路线（无交情，名声够）
  const st2 = newGame({ name: '商', profession: 'shangren', seed: 21 });
  st2.player.cityId = 'linzi';
  st2.player.money = 20000;
  st2.player.fame = PERMIT.trialFame;
  const t2 = canGetPermit(st2, 'linzi');
  ok(t2.ok && t2.mode === 'trial', '名声够可走名望路线', t2.mode);
  ok(t2.fee === permitFeeAt(st2, 'linzi') + PERMIT.trialFee, '名望路线含贽礼', String(t2.fee));

  // 名望路线可能失败：统计若干次
  let anyFail = false;
  for (let i = 0; i < 40 && !anyFail; i++) {
    const s3 = newGame({ name: '商', profession: 'shangren', seed: 100 + i });
    s3.player.cityId = 'linzi';
    s3.player.money = 20000;
    s3.player.fame = PERMIT.trialFame;
    const rr = getPermit(s3, 'linzi');
    if (!rr.ok) anyFail = true;
  }
  ok(anyFail, '名望路线存在失败可能');


  // 无人可授籍的城：可赴市亭告官立籍（费用更高）
  {
    // 找一座「有市邑、但城中无可授籍之人」的城（国君扩到近百位后，陶城已有曹共公）
    const { CITIES } = await import('../js/data/world.js');
    const s5 = newGame({ name: '商', profession: 'shangren', seed: 23, era: 'early' });
    s5.player.money = 20000;
    s5.player.fame = 30;
    const emptyCity = CITIES.find(c => {
      if (!c.tags.includes('market')) return false;
      s5.player.cityId = c.id;
      return permitCandidates(s5).length === 0;
    });
    ok(!!emptyCity, '存在无有司可托的市邑', emptyCity?.name ?? '无');
    if (emptyCity) {
      s5.player.cityId = emptyCity.id;
      const chk5 = canGetPermit(s5, emptyCity.id);
      ok(chk5.ok && chk5.mode === 'official', '可赴市亭告官立籍', chk5.mode);
      ok(chk5.fee > permitFeeAt(s5, emptyCity.id), '告官立籍费用更高', `${chk5.fee} > ${permitFeeAt(s5, emptyCity.id)}`);
      const r5 = getPermit(s5, emptyCity.id);
      ok(r5.ok && r5.by === null, '告官立籍成功且无举荐人');
      ok(hasPermit(s5, emptyCity.id), `已获${emptyCity.name}市籍`);
    }
  }

  // 主要城邑的可得籍覆盖率：有司可托者靠交情，无可托者靠告官兜底
  {
    const { CITIES } = await import('../js/data/world.js');
    const { PERMIT: P } = await import('../js/data/merchant.js');
    const s6 = newGame({ name: '商', profession: 'shangren', seed: 24 });
    let byOfficial = 0, byTrial = 0;
    const unreachable = [];
    // 只有市邑（market）才可领籍，非市邑理应拒绝
    const marketCities = CITIES.filter(c => c.tags.includes('market'));
    for (const c of marketCities) {
      s6.player.cityId = c.id;
      s6.player.money = 20000;
      s6.player.fame = P.trialFame; // 名望线之上
      const chk = canGetPermit(s6, c.id);
      if (!chk.ok) { unreachable.push(c.id); continue; }
      if (chk.mode === 'official') byOfficial++;
      if (chk.mode === 'trial') byTrial++;
    }
    ok(unreachable.length === 0, '所有市邑皆可得市籍', unreachable.join(','));
    ok(byOfficial > 0, '存在只能告官立籍的城', String(byOfficial));
    ok(byTrial > 0, '存在需凭名望的城', String(byTrial));
    // 非市邑应当拒绝
    const nonMarket = CITIES.filter(c => !c.tags.includes('market'));
    if (nonMarket.length) {
      s6.player.cityId = nonMarket[0].id;
      ok(!canGetPermit(s6, nonMarket[0].id).ok, '非市邑不可领籍', nonMarket[0].id);
    }
  }

  // 已有商号的旧存档自动视为有籍
  const st4 = newGame({ name: '商', profession: 'shangren', seed: 22 });
  migrateState(st4);
  st4.player.shops = ['linzi'];
  st4.player.permits = [];
  const m4 = migrateState(st4);
  ok(hasPermit(m4, 'linzi'), '已有商号的旧档自动补市籍');
}

// ---------------- 城池差异 ----------------
{
  const big = shopCostAt('linzi', 1);
  const small = shopCostAt('handan', 1);
  ok(big > small, '大城设肆更贵', `临淄${big} > 邯郸${small}`);
  ok(shopIncomeBaseAt('linzi', 1) > shopIncomeBaseAt('handan', 1), '大城月入更高');
  // 回本月数相近（数值平衡的关键）
  const bigMonths = big / shopIncomeBaseAt('linzi', 1);
  const smallMonths = small / shopIncomeBaseAt('handan', 1);
  ok(Math.abs(bigMonths - smallMonths) < 1, '大小城回本周期接近', `${bigMonths.toFixed(1)} vs ${smallMonths.toFixed(1)}`);
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
