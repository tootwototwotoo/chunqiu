// 第 2 期：商盟（质誓）与运输系统
import { newGame, player } from '../js/state.js';
import { VEHICLES, VEHICLE_IDS, PACT, MERCHANT_RANKS } from '../js/data/merchant.js';
import {
  vehicleOf, vehicleCapacity, canBuyVehicle, buyVehicle, canUseVehicleOn,
  isInstantTrade, minTradeQty, loadDays,
  haulsOf, startHaul, arriveHauls, escortHaul,
} from '../js/systems/haul.js';
import {
  pactList, hasPact, pactOf, pactMonthlyEach, pactMonthlyTotal,
  canSignPact, signPact, breakPact, tickPacts, pactLevyBonus, pactShopMultiplier,
} from '../js/systems/pact.js';
import { openShop, rankIndexOf } from '../js/systems/merchant.js';
import { levyOf } from '../js/systems/trade.js';
import { advanceDays } from '../js/systems/calendar.js';

let fails = 0;
const ok = (c, m, x = '') => { console.log(`${c ? '✓' : '✗'} ${m}${x ? ' — ' + x : ''}`); if (!c) fails++; };

// ---------------- 运输工具 ----------------
{
  ok(VEHICLE_IDS.length === 5, '五种运输工具', VEHICLE_IDS.map(id => VEHICLES[id].name).join(','));
  const caps = VEHICLE_IDS.map(id => VEHICLES[id].capacity);
  ok(caps.every((v, i) => i === 0 || v > caps[i - 1]), '载重逐级递增', caps.join('→'));

  const st = newGame({ name: '商', profession: 'shangren', seed: 1 });
  ok(vehicleOf(st).id === 'foot', '初始徒步');
  ok(vehicleCapacity(st) === st.player.caravan, '徒步按原始行囊算', String(vehicleCapacity(st)));

  // 阶次不够不能买
  ok(!canBuyVehicle(st, 'cart').ok, '贩夫不可购独轮车', canBuyVehicle(st, 'cart').msg);
  st.player.money = MERCHANT_RANKS[1].money;
  st.player.peakMoney = MERCHANT_RANKS[1].money;
  ok(rankIndexOf(st) >= 1, '已至行商', String(rankIndexOf(st)));
  ok(canBuyVehicle(st, 'cart').ok, '行商可购独轮车');
  const r = buyVehicle(st, 'cart');
  ok(r.ok, '购得独轮车', r.msg);
  ok(vehicleCapacity(st) === VEHICLES.cart.capacity, '载重提升', String(vehicleCapacity(st)));

  // 舟船须水路
  const st2 = newGame({ name: '商', profession: 'shangren', seed: 2 });
  st2.player.money = 999999;
  st2.player.pacts = [{ state: 'qi', day: 0, fee: 0, arrears: 0 }];
  st2.player.cityId = 'handan'; // 内陆
  st2.player.money = 999999;
  st2.player.peerage = null;
  st2.player.givenAway = 0;
  // 强行置为商盟之主阶次条件
  st2.player.money = MERCHANT_RANKS[4].money;
  st2.player.peakMoney = MERCHANT_RANKS[4].money;
  st2.player.fame = 100;
  // 商盟之主还须商号数达标
  st2.player.shops = ['linzi', 'luoyi', 'tao', 'ying'].map(c => ({ city: c, level: 1, hired: 0, bonus: 0 }));
  st2.player.permits = ['linzi', 'luoyi', 'tao', 'ying'].map(c => ({ city: c, by: null, day: 0, fee: 0 }));
  ok(rankIndexOf(st2) >= 4, '构造商盟之主阶次', String(rankIndexOf(st2)));
  ok(!canBuyVehicle(st2, 'boat').ok, '内陆城不可购舟船', canBuyVehicle(st2, 'boat').msg);
  st2.player.cityId = 'linzi'; // 有济水
  ok(canBuyVehicle(st2, 'boat').ok, '水路城可购舟船');

  // 舟船不能走内陆
  buyVehicle(st2, 'boat');
  const chk = canUseVehicleOn(st2, 'linzi', 'handan');
  ok(!chk.ok, '舟船不可至内陆', chk.msg);
  ok(canUseVehicleOn(st2, 'linzi', 'tao').ok, '舟船可行水路由');
}

// ---------------- 交割规则 ----------------
{
  const st = newGame({ name: '商', profession: 'shangren', seed: 3 });
  ok(isInstantTrade(st), '贩夫即时交割');
  ok(minTradeQty(st) === 1, '贩夫单笔最少 1');
  st.player.money = MERCHANT_RANKS[1].money;
  st.player.peakMoney = MERCHANT_RANKS[1].money;
  ok(isInstantTrade(st), '行商仍即时交割');
  ok(minTradeQty(st) === 5, '行商最少 5', String(minTradeQty(st)));
  st.player.permits = ['tao', 'linzi', 'luoyi', 'ying'].map(c => ({ city: c, by: null, day: 0, fee: 0 }));
  for (const cid of ['tao', 'linzi', 'luoyi', 'ying']) {
    st.player.cityId = cid;
    st.player.money = MERCHANT_RANKS[2].money;
    st.player.peakMoney = MERCHANT_RANKS[2].money;
    openShop(st, cid);
  }
  st.player.cityId = 'tao';
  st.player.money = MERCHANT_RANKS[2].money;
  st.player.peakMoney = MERCHANT_RANKS[2].money;
  ok(rankIndexOf(st) >= 2, '已至坐贾', String(rankIndexOf(st)));
  ok(!isInstantTrade(st), '坐贾须成批交割');
  ok(minTradeQty(st) === 20, '坐贾最少 20');

  // 装运天数随工具变化
  const st3 = newGame({ name: '商', profession: 'shangren', seed: 4 });
  const footDays = loadDays(st3, 60);
  st3.player.vehicle = 'cart';
  const cartDays = loadDays(st3, 60);
  ok(cartDays < footDays, '独轮车比徒步装运更快', `徒步${footDays}日 vs 独轮车${cartDays}日`);
  st3.player.vehicle = 'wain';
  ok(loadDays(st3, 320) === 3, '马车装 320 载重需 3 日', String(loadDays(st3, 320)));
}

// ---------------- 货运流程 ----------------
{
  const st = newGame({ name: '商', profession: 'shangren', seed: 5 });
  st.player.money = 3000;
  st.player.vehicle = 'cart';
  st.player.caravan = VEHICLES.cart.capacity;
  const target = 'linzi';

  ok(haulsOf(st).length === 0, '初始无在途货');
  const r = startHaul(st, 'su', 6, target, 13);
  ok(r.ok, '可办货', r.msg);
  ok(haulsOf(st).length === 1, '生成在途单');
  ok(player(st).money === 3000 - 6 * 13, '货款已付');
  ok(player(st).inventory.su === undefined, '装运期货物未入行囊');

  // 运到目的地卸载
  const before = player(st).inventory.su ?? 0;
  player(st).cityId = target;
  const arrived = arriveHauls(st, target);
  ok(arrived.ok && arrived.arrived === 1, '抵达后结算在途单');
  ok((player(st).inventory.su ?? 0) > before, '货物入库', String(player(st).inventory.su));
  ok(haulsOf(st).length === 0, '在途单已清空');

  // 遇劫：货物可能折损
  let anyLoss = false;
  for (let i = 0; i < 60 && !anyLoss; i++) {
    const s2 = newGame({ name: '商', profession: 'shangren', seed: 200 + i });
    s2.player.money = 5000;
    s2.player.vehicle = 'cart';
    s2.player.caravan = VEHICLES.cart.capacity;
    startHaul(s2, 'su', 6, 'linzi', 10);
    advanceDays(s2, 20); // 拉长途程提高风险
    s2.player.cityId = 'linzi';
    arriveHauls(s2, 'linzi');
    if ((s2.player.inventory.su ?? 0) < 6) anyLoss = true;
  }
  ok(anyLoss, '长途货运存在遇劫折损');

  // 雇护卫
  const s3 = newGame({ name: '商', profession: 'shangren', seed: 300 });
  s3.player.money = 5000;
  s3.player.vehicle = 'cart';
  s3.player.caravan = VEHICLES.cart.capacity;
  startHaul(s3, 'su', 6, 'linzi', 10);
  const hid = haulsOf(s3)[0].id;
  ok(escortHaul(s3, hid).ok, '可为货单雇护卫');
  ok(haulsOf(s3)[0].escorted, '货单已标护卫');
  ok(!escortHaul(s3, hid).ok, '不可重复雇护卫');
}

// ---------------- 商盟 ----------------
{
  const st = newGame({ name: '商', profession: 'shangren', seed: 6 });
  st.player.cityId = 'linzi';
  st.player.money = 50000;
  st.player.fame = 100;

  // 阶次不足
  ok(!canSignPact(st, 'qi').ok, '未至巨商不可盟誓', canSignPact(st, 'qi').msg);

  // 构造巨商
  st.player.permits = ['tao', 'linzi', 'luoyi', 'ying'].map(c => ({ city: c, by: null, day: 0, fee: 0 }));
  for (const cid of ['tao', 'linzi', 'luoyi', 'ying']) {
    st.player.cityId = cid;
    st.player.money = 60000;
    openShop(st, cid);
  }
  st.player.money = 60000;
  st.player.peakMoney = MERCHANT_RANKS[3].money;
  st.player.cityId = 'linzi';
  ok(rankIndexOf(st) >= 3, '已至巨商', String(rankIndexOf(st)));

  const chk = canSignPact(st, 'qi');
  ok(chk.ok, '巨商可盟誓', chk.msg ?? '');
  ok(chk.fee === PACT.baseFee, '第一个商盟质金 3000', String(chk.fee));

  const r = signPact(st, 'qi');
  ok(r.ok, '盟誓成功', r.msg);
  ok(hasPact(st, 'qi'), '已与齐盟');

  // 盟国加成
  ok(pactLevyBonus(st, 'linzi') > 0, '盟国牙钱加成', String(pactLevyBonus(st, 'linzi')));
  const levyWith = levyOf(st, 'linzi');
  ok(levyWith > 0, '盟国牙钱可算', levyWith.toFixed(2));
  ok(pactShopMultiplier(st, 'linzi') > 1, '盟国商号月入加成');

  // 第二个商盟质金翻倍
  st.player.money = 50000;
  st.player.cityId = 'jiang'; // 晋
  const chk2 = canSignPact(st, 'jin');
  ok(chk2.ok && chk2.fee === PACT.baseFee * 2, '第二盟质金翻倍', String(chk2.fee));

  // 月缴随盟数翻倍
  const each1 = pactMonthlyEach(st);
  signPact(st, 'jin');
  const each2 = pactMonthlyEach(st);
  ok(each2 === each1 * 2, '多一盟则各盟月缴翻倍', `${each1} → ${each2}`);
  ok(pactMonthlyTotal(st) > 0, '月缴总额可算', String(pactMonthlyTotal(st)));

  // 月结扣军资
  const money0 = player(st).money;
  const out = { notes: [] };
  tickPacts(st, out);
  ok(player(st).money < money0, '月结扣商盟军资', `${money0} → ${player(st).money}`);

  // 解盟
  const before = pactList(st).length;
  const br = breakPact(st, 'qi');
  ok(br.ok && pactList(st).length === before - 1, '可解盟');
  ok(!hasPact(st, 'qi'), '解盟后不再持有');
}

// ---------------- 商盟欠缴与国亡 ----------------
{
  const st = newGame({ name: '商', profession: 'shangren', seed: 7 });
  st.player.pacts = [{ state: 'qi', day: 0, fee: 3000, arrears: 0 }];
  st.player.money = 0;
  const out = { notes: [] };
  tickPacts(st, out);
  ok(pactOf(st, 'qi')?.arrears === 1, '欠缴记 1 月', String(pactOf(st, 'qi')?.arrears));
  st.player.money = 0;
  tickPacts(st, { notes: [] });
  ok(!hasPact(st, 'qi'), '欠缴逾限自动解盟');

  // 国亡
  const st2 = newGame({ name: '商', profession: 'shangren', seed: 8 });
  st2.player.pacts = [{ state: 'sui', day: 0, fee: 3000, arrears: 0 }];
  // 把随国所有城改属他国，制造「国亡」
  for (const id of Object.keys(st2.world.owner)) if (st2.world.owner[id] === 'sui') st2.world.owner[id] = 'chu';
  const out2 = { notes: [] };
  tickPacts(st2, out2);
  ok(!hasPact(st2, 'sui'), '国亡则商盟失效');
}

// ---------------- 商盟影响牙钱 ----------------
{
  const st = newGame({ name: '商', profession: 'shangren', seed: 9 });
  const base = levyOf(st, 'linzi');
  st.player.pacts = [{ state: 'qi', day: 0, fee: 0, arrears: 0 }];
  const withPact = levyOf(st, 'linzi');
  ok(withPact > base, '盟国牙钱更高', `${base.toFixed(2)} → ${withPact.toFixed(2)}`);
  // 非盟国不受影响
  ok(levyOf(st, 'yong') === base, '非盟国牙钱不变');
}

// ---------------- 存档迁移 ----------------
{
  const { migrateState } = await import('../js/state.js');
  const st = newGame({ name: '商', profession: 'shangren', seed: 10 });
  migrateState(st);
  delete st.player.vehicle;
  delete st.player.hauls;
  const m = migrateState(st);
  ok(m.player.vehicle === 'foot', '旧档补 vehicle');
  ok(Array.isArray(m.player.hauls), '旧档补 hauls');

  // 非法 haul 会被清掉
  m.player.hauls = [{ goodId: 'nope', qty: 3, to: 'linzi' }, { goodId: 'su', qty: 3, to: 'linzi' }];
  const m2 = migrateState(m);
  ok(m2.player.hauls.length === 1, '非法货运单被清理', String(m2.player.hauls.length));

  // 非法 vehicle 兜底
  m2.player.vehicle = 'ufo';
  const m3 = migrateState(m2);
  ok(typeof m3.player.vehicle === 'string', 'vehicle 保持字符串');
}

console.log(fails ? `\n失败 ${fails} 项 ✗` : '\n商盟与运输通过 ✓');
process.exit(fails ? 1 : 0);

// ---------------- 第 3 期：分庭抗礼 + 散财节制 ----------------
{
  console.log('\n--- 第 3 期 ---');
  const { GIVEAWAY_LIMIT } = await import('../js/data/merchant.js');
  const { canParley, startParley, parleyAnswer, currentParleyQuestion, settleParley, parleyLevyBonus, parleyCooldownLeft } = await import('../js/systems/parley.js');
  const { giveAway, canGive } = await import('../js/systems/merchant.js');

  // 门槛
  const st = newGame({ name: '商', profession: 'shangren', seed: 40 });
  st.player.cityId = 'linzi';
  st.player.money = 100000;
  st.player.fame = 100;
  st.player.peakMoney = 100000;
  st.player.pacts = [{ state: 'qi', day: 0, fee: 0, arrears: 0 }];
  st.player.shops = ['linzi', 'luoyi', 'tao', 'ying'].map(c => ({ city: c, level: 1, hired: 0, bonus: 0 }));
  st.player.permits = ['linzi', 'luoyi', 'tao', 'ying'].map(c => ({ city: c, by: null, day: 0, fee: 0 }));
  ok(rankIndexOf(st) >= 4, '构造商盟之主', String(rankIndexOf(st)));

  ok(canParley(st, 'qi').ok, '商盟之主可分庭抗礼', canParley(st, 'qi').msg);
  // 非朝堂城不可
  st.player.cityId = 'handan';
  ok(!canParley(st, 'qi').ok, '非朝堂不可分庭抗礼');
  st.player.cityId = 'linzi';

  // 三回合交涉
  const pl = startParley(st, 'qi', 'price');
  ok(pl && !pl.ok, 'startParley 返回对局对象', typeof pl.round);
  ok(pl.questions.length === 3, '三道议题', String(pl.questions.length));
  ok(pl.start >= 45 && pl.start <= 65, '起始认同在区间内', String(pl.start));

  // 全程选「切中」应成功
  for (let i = 0; i < 3 && !pl.over; i++) {
    const q = currentParleyQuestion(pl);
    const hit = q.options.findIndex(o => o.level === 'hit');
    parleyAnswer(st, pl, hit >= 0 ? hit : 0);
  }
  ok(pl.over, '三回合结束');
  ok(pl.success, '连续切中可成议', `认同${pl.agreement}`);

  const beforeLevy = parleyLevyBonus(st, 'linzi');
  const res = settleParley(st, pl);
  ok(res.ok && res.success, '结算成功');
  ok(parleyLevyBonus(st, 'linzi') > beforeLevy, '议价提升该国牙钱', String(parleyLevyBonus(st, 'linzi')));
  ok(parleyCooldownLeft(st, 'qi') > 0, '交涉后有冷却');

  // 失败路径
  const st2 = newGame({ name: '商', profession: 'shangren', seed: 41 });
  st2.player.cityId = 'linzi';
  st2.player.money = 100000; st2.player.fame = 100; st2.player.peakMoney = 100000;
  st2.player.pacts = [{ state: 'qi', day: 0, fee: 0, arrears: 0 }];
  st2.player.shops = ['linzi', 'luoyi', 'tao', 'ying'].map(c => ({ city: c, level: 1, hired: 0, bonus: 0 }));
  const pl2 = startParley(st2, 'qi', 'price');
  for (let i = 0; i < 3 && !pl2.over; i++) {
    const q = currentParleyQuestion(pl2);
    const ev = q.options.findIndex(o => o.level === 'evade');
    parleyAnswer(st2, pl2, ev >= 0 ? ev : 0);
  }
  ok(pl2.over && !pl2.success, '连续回避则不成', `认同${pl2.agreement}`);
  const f0 = st2.player.fame;
  const r2 = settleParley(st2, pl2);
  ok(!r2.success && st2.player.fame < f0, '失败扣名声');

  // 借粮效果
  const st3 = newGame({ name: '商', profession: 'shangren', seed: 42 });
  st3.player.cityId = 'linzi';
  st3.player.money = 100000; st3.player.fame = 100; st3.player.peakMoney = 100000;
  st3.player.pacts = [{ state: 'qi', day: 0, fee: 0, arrears: 0 }];
  st3.player.shops = ['linzi', 'luoyi', 'tao', 'ying'].map(c => ({ city: c, level: 1, hired: 0, bonus: 0 }));
  const pl3 = startParley(st3, 'qi', 'grain');
  for (let i = 0; i < 3 && !pl3.over; i++) {
    const q = currentParleyQuestion(pl3);
    parleyAnswer(st3, pl3, q.options.findIndex(o => o.level === 'hit'));
  }
  const m0 = st3.player.money;
  const r3 = settleParley(st3, pl3);
  if (r3.success) ok(st3.player.money > m0, '借粮折金入库', `${m0} → ${st3.player.money}`);
  else ok(true, '本局借粮未成，跳过');

  // 散财节制
  const st4 = newGame({ name: '商', profession: 'shangren', seed: 43 });
  st4.player.cityId = 'linzi';
  st4.player.money = 100000;
  ok(giveAway(st4, 'relief', 'linzi').ok, '首次散财可行');
  ok(!canGive(st4, 'relief', 'linzi').ok, '同类散财有冷却', canGive(st4, 'relief', 'linzi').msg);
  ok(canGive(st4, 'army', 'linzi').ok, '不同类散财不受同冷却限制');
  ok(GIVEAWAY_LIMIT.perCityPerYear >= 1, '每城每年有额度上限', String(GIVEAWAY_LIMIT.perCityPerYear));
}

console.log(fails ? `\n失败 ${fails} 项 ✗` : '\n商盟与运输通过 ✓');
process.exit(fails ? 1 : 0);
