// 六种珍宝：价格阶梯、稀缺、涨价、献宝、玄璧助封、集齐称号
import { newGame, player, addGoods } from '../js/state.js';
import { TREASURES, TREASURE_IDS, treasuresInCity } from '../js/data/treasures.js';
import { treasureStatus, treasureList, buyTreasure, treasuresOwnedKinds } from '../js/systems/trade.js';
import { offerTreasure, offerableTreasures, treasureHonor, offeredAllKinds, biPetitionBonus } from '../js/systems/treasures.js';
import { acceptTrial, finishTrial, petitionChance, canPetition } from '../js/systems/peerage.js';
import { advanceDays } from '../js/systems/calendar.js';
import { computeEnding } from '../js/systems/progression.js';
import { evaluateGame } from '../js/systems/trialGames.js';

let fails = 0;
const ok = (c, m, x = '') => { console.log(`${c ? '✓' : '✗'} ${m}${x ? ' — ' + x : ''}`); if (!c) fails++; };

// 配置
ok(TREASURE_IDS.length === 6, '六种珍宝', TREASURE_IDS.join(','));
for (let i = 1; i < TREASURE_IDS.length; i++) {
  const a = TREASURES[TREASURE_IDS[i - 1]], b = TREASURES[TREASURE_IDS[i]];
  ok(b.base > a.base, `${b.name}贵于${a.name}`, `${a.base} < ${b.base}`);
}
ok(TREASURES.yu.base === 500, '美玉基价 500');
ok(TREASURES.bi.cities.length === 1, '玄璧仅洛邑一处');
// 越贵越罕见：城数不增、补货不短
for (let i = 1; i < TREASURE_IDS.length; i++) {
  const a = TREASURES[TREASURE_IDS[i - 1]], b = TREASURES[TREASURE_IDS[i]];
  ok(b.cities.length <= a.cities.length, `${b.name}不比${a.name}常见`, `${b.cities.length} <= ${a.cities.length}`);
  ok(b.restock >= a.restock, `${b.name}补货不短于${a.name}`, `${b.restock} >= ${a.restock}`);
  ok(b.step >= a.step, `${b.name}涨幅不小于${a.name}`, `${b.step} >= ${a.step}`);
}

// 购宝：一城一件、涨价、补货
{
  const st = newGame({ name: '宝', profession: 'shangren', seed: 7 });
  st.player.money = 1000000;
  const city = TREASURES.bi.cities[0];
  st.player.cityId = city;
  const s0 = treasureStatus(st, 'bi', city);
  ok(s0.available && s0.price === 3600, '玄璧初始 3600', String(s0.price));
  const b = buyTreasure(st, 'bi', city);
  ok(b.ok, '可购玄璧', b.msg);
  ok(player(st).inventory.bi === 1, '获得玄璧');
  ok(st.world.treasures.bi.price > 3600, '购后涨价', String(st.world.treasures.bi.price));
  ok(!treasureStatus(st, 'bi', city).available, '本城售罄');
  advanceDays(st, 91);
  ok(treasureStatus(st, 'bi', city).available, '九十日后补货');

  // 一城可有多宝（如临淄有玉与明珠）
  st.player.cityId = 'linzi';
  const list = treasureList(st, 'linzi');
  ok(list.length >= 2, '临淄有多种珍宝', list.map(x => x.def.name).join('、'));
  ok(treasureList(st, 'handan').length === 0, '邯郸无珍宝');
}

// 献宝
{
  const st = newGame({ name: '献', profession: 'youxia', seed: 8 });
  st.player.stateId = 'qi';
  st.player.cityId = 'linzi';
  ok(offerableTreasures(st).length === 0, '无宝可献');
  addGoods(st, 'xiang', 2);
  const list = offerableTreasures(st);
  ok(list.length === 1 && list[0].have === 2, '象牙可献两件');
  const merit0 = st.player.merit, fame0 = st.player.fame;
  const r = offerTreasure(st, 'xiang');
  ok(r.ok, '献宝成功', r.msg);
  ok(st.player.inventory.xiang === 1, '消耗一件');
  ok(st.player.merit > merit0 && st.player.fame > fame0, '得功勋与名声', `功勋+${st.player.merit - merit0} 名声+${st.player.fame - fame0}`);
  const r2 = offerTreasure(st, 'yu');
  ok(!r2.ok, '囊中无玉不可献');
}

// 玄璧助册命
{
  const st = newGame({ name: '璧', profession: 'youxia', seed: 9 });
  st.player.stateId = 'qi'; st.player.cityId = 'luoyi';
  st.player.merit = 9999; st.player.fame = 200;
  const chk = acceptTrial(st);
  ok(chk.ok, '可领册命之试');
  const before = petitionChance(st);
  addGoods(st, 'bi', 1);
  ok(biPetitionBonus(st) > 0, '持玄璧有请封加成');
  const after = petitionChance(st);
  ok(after > before, '玄璧提升请封概率', `${(before * 100).toFixed(1)}% → ${(after * 100).toFixed(1)}%`);
}

// 集齐称号与结局
{
  const st = newGame({ name: '藏', profession: 'shangren', seed: 10 });
  ok(treasureHonor(st) === null, '初始无珍宝称号');
  addGoods(st, 'yu', 1);
  addGoods(st, 'zhu', 1);
  ok(treasureHonor(st)?.name === '小有珍玩', '两宝得「小有珍玩」');
  addGoods(st, 'shan', 1); addGoods(st, 'xijiao', 1);
  ok(treasureHonor(st)?.name === '多宝之家', '四宝得「多宝之家」');
  for (const id of TREASURE_IDS) addGoods(st, id, 1);
  ok(treasureHonor(st)?.name === '富可敌国', '六宝得「富可敌国」');
  ok(treasureHonor(st).bonus >= 200, '称号给出评分加成', String(treasureHonor(st).bonus));
  ok(treasuresOwnedKinds(st) === 6, '持有六种');
  const end = computeEnding(st);
  ok(end.comment.includes('六宝俱备'), '结局写入称号', end.comment);
  ok(end.stats.some(([k, v]) => k === '珍宝' && v === '6/6'), '结局列出珍宝 6/6');
}

// 六种全献
{
  const st = newGame({ name: '诚', profession: 'youxia', seed: 11 });
  st.player.stateId = 'qi'; st.player.cityId = 'linzi';
  for (const id of TREASURE_IDS) { addGoods(st, id, 1); offerTreasure(st, id); }
  ok(offeredAllKinds(st), '六种俱曾进献');
  ok(computeEnding(st).epilogue.includes('六种珍宝'), '结局记载六献');
}

console.log(fails ? `\n失败 ${fails} 项 ✗` : '\n珍宝系统通过 ✓');
process.exit(fails ? 1 : 0);
