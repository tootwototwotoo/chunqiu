// 差事限期必须覆盖真实路程
import { newGame, player } from '../js/state.js';
import { refreshBoard, acceptQuest } from '../js/systems/quests.js';
import { CITIES } from '../js/data/world.js';
import { shortestPath } from '../js/systems/pathfind.js';
import { absDay } from '../js/systems/calendar.js';

let fails = 0, checked = 0, maxRoute = 0;
const ok = (c, m, x = '') => { if (!c) { console.log(`✗ ${m}${x ? ' — ' + x : ''}`); fails++; } };

const seasons = [1, 4, 7, 10];
for (const city of CITIES) {
  for (const month of seasons) {
    const st = newGame({ name: '行程', profession: 'youxia', seed: city.id.length * 31 + month });
    st.player.cityId = city.id;
    st.time.month = month;
    const offers = refreshBoard(st, true);
    for (const q of offers) {
      if (q.mode !== 'travel' || !q.targetCity) continue;
      checked++;
      const route = shortestPath(city.id, q.targetCity, st)?.days;
      maxRoute = Math.max(maxRoute, route);
      ok(q.routeDays === route, `路程记录一致 ${city.id}->${q.targetCity}`, `${q.routeDays} vs ${route}`);
      ok(q.days >= route + 1, `限期覆盖路程 ${city.id}->${q.targetCity}`, `限期${q.days} 路程${route}`);
      ok(q.reward.money >= Math.round(route * 2.2 * 0.8), `酬金不低于路费 ${city.id}->${q.targetCity}`, `酬金${q.reward.money} 路程${route}`);
      const acc = acceptQuest(st, q.id);
      ok(acc.ok, `可领受 ${q.title}`, acc.msg || '');
      if (acc.ok) {
        const left = q.exp - absDay(st.time);
        ok(left === q.days, '限期自领受日起算', `余${left} 限期${q.days}`);
        ok(left >= route + 1, '领受后限期仍覆盖路程', `余${left} 路程${route}`);
      }
      break; // 每城每季验一件
    }
  }
}

// 旧存档中的不可能差事应被拒绝
const st = newGame({ name: '旧', profession: 'youxia', seed: 5 });
st.player.cityId = 'kuaiji';
const bad = { id: 'bad1', kind: 'escort', mode: 'travel', title: '不可能差事', status: 'board', originCity: 'kuaiji', targetCity: 'yong', days: 22, exp: absDay(st.time) + 22, reward: { money: 100 } };
st.quests.offers = [bad];
st.quests.board = 'kuaiji'; st.quests.boardDay = absDay(st.time);
const acc = acceptQuest(st, 'bad1');
ok(!acc.ok, '限期不足的旧差事被拒绝', acc.msg || '');

console.log(`检查 ${checked} 件出行差事，最长单程 ${maxRoute} 日`);
console.log(fails ? `失败 ${fails} 项 ✗` : '出行差事限期全部合理 ✓');
process.exit(fails ? 1 : 0);
