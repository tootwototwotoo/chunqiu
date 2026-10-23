// 赠礼数值、冷却、封顶、举荐；玉的稀缺与涨价
import { newGame, addEvidence } from '../js/state.js';
import { NPC_MAP } from '../js/data/npcs.js';
import { JADE } from '../js/data/goods.js';
import { giftValue, giveGift, giftCandidates, giftBlockReason } from '../js/systems/relations.js';
import { jadeStatus, buyJade } from '../js/systems/trade.js';
import { advanceDays } from '../js/systems/calendar.js';

let fails = 0;
const ok = (c, m, x = '') => { console.log(`${c ? '✓' : '✗'} ${m}${x ? ' — ' + x : ''}`); if (!c) fails++; };

// 礼物价值
const guan = NPC_MAP.guan_zhong; // 偏好玉
ok(giftValue(guan, 'yu') <= 20 && giftValue(guan, 'yu') >= 12, '玉单次赠礼不超过 20', String(giftValue(guan, 'yu')));
ok(giftValue(guan, 'ma') < giftValue(guan, 'yu'), '玉仍是最贵重的礼物');
ok(giftValue(NPC_MAP.qi_huan, 'ma') > giftValue(NPC_MAP.qi_huan, 'su'), '匹配偏好仍然更高');

// 赠礼：随机浮动、10 日冷却、75 封顶
{
  const st = newGame({ name: '礼', profession: 'shangren', seed: 3 });
  st.player.inventory.yu = 20;
  const r = giveGift(st, 'guan_zhong', 'yu');
  ok(r.ok, '第一次赠礼成功', r.msg);
  const aff1 = st.player.relations.guan_zhong.aff;
  ok(aff1 > 0 && aff1 <= 20, '单次玉礼不超过 20', String(aff1));
  const r2 = giveGift(st, 'guan_zhong', 'yu');
  ok(!r2.ok && r2.msg.includes('日后再来'), '十日内不能再赠', r2.msg);
  advanceDays(st, 11);
  while (st.player.relations.guan_zhong.aff < 75 && st.player.inventory.yu > 0) {
    const r3 = giveGift(st, 'guan_zhong', 'yu');
    if (!r3.ok) break;
    advanceDays(st, 11);
  }
  ok(st.player.relations.guan_zhong.aff <= 75, '赠礼最多到 75', String(st.player.relations.guan_zhong.aff));
  ok(!!giftBlockReason(st, 'guan_zhong'), '到 75 后不再收礼');
}

// 玉：八城、一城一块、30 日补货、价格递增
{
  const st = newGame({ name: '玉', profession: 'shangren', seed: 4 });
  st.player.money = 100000;
  ok(JADE.cities.length === 8, '全国八处玉市');
  const city = JADE.cities[0];
  st.player.cityId = city;
  const s0 = jadeStatus(st, city);
  ok(s0.available && s0.price === 500, '初始玉价 500', String(s0.price));
  const before = s0.price;
  const b1 = buyJade(st, city);
  ok(b1.ok, '可购玉', b1.msg);
  ok(st.player.inventory.yu === 1, '获得一块玉');
  ok(st.world.jade.price > before, '购后玉价上涨', `${before} → ${st.world.jade.price}`);
  const s1 = jadeStatus(st, city);
  ok(!s1.available && s1.left > 0, '本城售罄，需等待补货', String(s1.left));
  st.player.cityId = JADE.cities[1];
  const s2 = jadeStatus(st, JADE.cities[1]);
  ok(s2.available, '别的城仍有一块');
  advanceDays(st, 31);
  st.player.cityId = city;
  const s3 = jadeStatus(st, city);
  ok(s3.available, '三十日后补货');
}

console.log(fails ? `\n失败 ${fails} 项 ✗` : '\n赠礼与玉市通过 ✓');
process.exit(fails ? 1 : 0);
