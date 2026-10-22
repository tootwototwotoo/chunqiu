// 仕途与结局的定向测试
import { newGame, player } from '../js/state.js';
import { refreshBoard, acceptQuest } from '../js/systems/quests.js';
import { advanceDays } from '../js/systems/calendar.js';
import { seekOffice, advise, joinCampaign, checkPromotion, computeEnding } from '../js/systems/progression.js';
import { RANKS } from '../js/data/defs.js';

const st = newGame({ name: '管仲之徒', profession: 'youxia', era: 'huan', seed: 21 });
st.player.fame = 30;
let served = false;
for (let i = 0; i < 30 && !served; i++) {
  const r = seekOffice(st, 'qi');
  served = r.ok;
  advanceDays(st, 11);
}
console.log('出仕:', served, '爵位:', RANKS[player(st).rank].name);
st.player.merit = 1400;
const promo = checkPromotion(st);
console.log('晋升检查:', promo ? promo.rank : '无');
st.player.money = 30000; st.player.fame = 80;
st.player.merit = 1400;
const ending = computeEnding(st);
console.log('结局:', ending.rank, '/', ending.comment, '/ 评分', ending.score);
console.log(ending.rank && served ? '仕途与结局通过 ✓' : '有问题 ✗');
