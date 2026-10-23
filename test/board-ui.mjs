// 榜文弹窗：领受出行差事后应立即从榜上消失（回归）
import { JSDOM } from 'jsdom';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const dom = new JSDOM(html, { url: 'http://localhost:5173/', pretendToBeVisual: true });
const { window } = dom;
globalThis.window = window;
globalThis.document = window.document;
globalThis.localStorage = window.localStorage;
Object.defineProperty(globalThis, 'navigator', { value: window.navigator, configurable: true });
globalThis.requestAnimationFrame = (fn) => window.setTimeout(() => fn(Date.now()), 16);
globalThis.cancelAnimationFrame = (id) => window.clearTimeout(id);
const errors = [];
window.addEventListener('error', e => errors.push(e.message));

const { app } = await import('../js/ui/app.js');
const { newGame } = await import('../js/state.js');
const { absDay } = await import('../js/systems/calendar.js');

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const wait = (ms = 40) => new Promise(r => setTimeout(r, ms));
let fails = 0;
const ok = (c, m, x = '') => { console.log(`${c ? '✓' : '✗'} ${m}${x ? ' — ' + x : ''}`); if (!c) fails++; };

const st = newGame({ name: '榜文', profession: 'youxia', seed: 3 });
app.startGame(st);
const cityId = st.player.cityId;
const mk = (id, title, target) => ({
  id, kind: 'escort', mode: 'travel', title, desc: '测试榜文', giverName: '官府',
  originCity: cityId, targetCity: target, routeDays: 3, days: 10,
  exp: absDay(st.time) + 10, reward: { money: 40, fame: 2 }, status: 'board', cityId,
});
st.quests.offers = [mk('q1', '护送行旅至新郑', 'xinzheng'), mk('q2', '护送行旅至绛', 'jiang')];
st.quests.board = cityId;
st.quests.boardDay = absDay(st.time);
st.player.stamina = 100;

app.nav('city');
$('[data-act="board"]').click();
await wait();
ok($$('.modal .quest').length === 2, '榜文展示两条差事');

$('.modal [data-accept]').click();
await wait(60);
ok($$('.modal .quest').length === 1, '领受后榜文立即少一条');
ok(!$('.modal').textContent.includes('护送行旅至新郑'), '已领受的差事立即从榜上消失');
ok(app.st.quests.active.some(q => q.id === 'q1'), '差事进入进行中');
ok(!!$('.modal [data-accept]'), '剩余差事仍可领受');

$('.modal [data-accept]').click();
await wait(60);
ok($$('.modal .quest').length === 0, '领完后榜文无条目');
ok($('.modal-body').textContent.includes('今日无榜'), '显示空榜提示');
ok(app.st.quests.active.length === 2, '两条均进入进行中');
ok(errors.length === 0, '无运行时错误', errors.slice(0, 2).join(' | '));


// 论辩妥协生成的后续差事：判定类与战斗类
st.quests.active.push(
  { id: 'f1', kind: 'followup', mode: 'check', title: '核查田亩', desc: '后续差事', checkSkill: 'quanmou', dc: 0,
    days: 10, exp: absDay(st.time) + 10, reward: { money: 20 }, status: 'active', followup: true, cityId },
  { id: 'f2', kind: 'followup', mode: 'combat', title: '查抄家丁', desc: '后续差事', enemy: { name: '家丁', wu: 40, skill: 1, hp: 50 },
    days: 10, exp: absDay(st.time) + 10, reward: { money: 20 }, status: 'active', followup: true, cityId },
);
app.nav('quests');
ok(!!$('[data-do-check]'), '判定类后续有「办理」按钮');
ok(!!$('[data-do-combat]'), '战斗类后续有「讨伐」按钮');
$('[data-do-check]').click();
await wait(60);
ok(st.quests.done.some(q => q.id === 'f1'), '判定类后续可完成');
if ($('.modal-foot .btn')) { $('.modal-foot .btn').click(); await wait(60); }
$('[data-do-combat]').click();
await wait(60);
ok(!!$('.move-grid'), '战斗类后续进入决斗');
for (let i = 0; i < 80 && $('.move-grid') && !$('.modal-foot .btn'); i++) {
  const moves = $$('.move-btn');
  if (!moves.length) break;
  moves[i % 4].click();
  await wait(10);
}
if ($('.modal-foot .btn')) { $('.modal-foot .btn').click(); await wait(60); }
ok(st.quests.done.some(q => q.id === 'f2'), '战斗类后续可完成');
console.log(fails ? `\n失败 ${fails} 项 ✗` : '\n榜文即时刷新通过 ✓');
process.exit(fails ? 1 : 0);
