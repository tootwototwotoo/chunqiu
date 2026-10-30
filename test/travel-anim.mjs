// 玩家出行动画：逐段快进、插值、跳过、抵达收尾
import fs from 'node:fs';
import { JSDOM } from 'jsdom';
import { newGame } from '../js/state.js';
import { CITY_MAP } from '../js/data/world.js';
import { travelLegs, travelPlan } from '../js/systems/travel.js';
import { playTravel, travelProgressPos } from '../js/ui/travelAnim.js';

const dom = new JSDOM(fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8'),
  { url: 'http://localhost:5173/', pretendToBeVisual: true,
    beforeParse(w) { w.HTMLCanvasElement.prototype.getContext = () => null; } });
globalThis.window = dom.window; globalThis.document = dom.window.document;
globalThis.localStorage = dom.window.localStorage;

const { app } = await import('../js/ui/app.js');

let fails = 0;
const ok = (c, m, x = '') => { console.log(`${c ? '✓' : '✗'} ${m}${x ? ' — ' + x : ''}`); if (!c) fails++; };

const newSt = () => {
  const st = newGame({ name: 'x', profession: 'youxia', seed: 3, era: 'jinchu' });
  st.flags.noAutosave = true;
  st.player.money = 5000;
  st.player.stamina = 100;
  app.startGame(st);
  return st;
};

// ---------------- 分段计划 ----------------
{
  const st = newSt();
  const legs = travelLegs(st, 'linzi');
  ok(!!legs, '可算出分段行程');
  ok(legs.legs.length >= 1, '至少一段', String(legs.legs.length));
  ok(legs.legs.reduce((a, l) => a + l.days, 0) === legs.days, '各段天数之和 = 全程天数',
    `${legs.legs.reduce((a, l) => a + l.days, 0)} / ${legs.days}`);
  // 每段两端相邻且可达
  const bad = legs.legs.filter(l => !CITY_MAP[l.from] || !CITY_MAP[l.to] || l.days < 1);
  ok(bad.length === 0, '每段两端有效且天数 ≥1');
  // 相邻城应为直连（路程 = 该段最短天数）
  ok(legs.legs.every(l => travelPlan(st, l.to) !== null), '各段终点均可达');
}

// ---------------- 播放与跳过 ----------------
{
  const st = newSt();
  const plan = travelPlan(st, 'linzi');
  const money0 = st.player.money;
  let done = null;
  const ctrl = playTravel(app, st, 'linzi', r => { done = r; });
  app.travelState = ctrl;
  ok(!!ctrl, '控制器创建');
  ok(st.player.money === money0 - plan.cost, '起程即扣盘缠', `${money0} → ${st.player.money}`);

  // 插值位置在两点之间
  ctrl.t = 0.5;
  const pos = travelProgressPos(ctrl);
  const a = CITY_MAP[ctrl.from], b = CITY_MAP[ctrl.to];
  ok(pos && pos.x > Math.min(a.x, b.x) - 1 && pos.x < Math.max(a.x, b.x) + 1,
    '插值位置落在两城之间', pos ? `(${pos.x.toFixed(0)},${pos.y.toFixed(0)})` : 'null');

  ctrl.skip();
  ok(ctrl.finished, '跳过可立即完成');
  ok(st.player.cityId === 'linzi', '抵达目标城', st.player.cityId);
  ok(done && done.ok, '回调收到结果');
  ok(done.walked.length === plan.path.length - 1, '记录了走过的每一段', done.walked.join('→'));
  ok(st.player.visitedCities.includes('linzi'), '足迹记录目标城');
  ok(st.stats.travelDays >= plan.days, '累计行程天数', String(st.stats.travelDays));
}

// ---------------- 盘缠不足 ----------------
{
  const st = newSt();
  st.player.money = 0;
  let called = false;
  const ctrl = playTravel(app, st, 'linzi', () => { called = true; });
  ok(ctrl === null, '盘缠不足时不起播');
  ok(!called, '不起播则不回调');
  ok(st.player.cityId !== 'linzi', '未抵达');
}

// ---------------- 同城不出行 ----------------
{
  const st = newSt();
  const ctrl = playTravel(app, st, st.player.cityId, () => {});
  ok(ctrl === null, '已在本地时不起播');
}

dom.window.close();
console.log(fails ? `\n失败 ${fails} 项 ✗` : '\n出行动画通过 ✓');
process.exit(fails ? 1 : 0);
