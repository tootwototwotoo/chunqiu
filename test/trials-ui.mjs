// 五套册命试炼界面冒烟：在 jsdom 中逐个打开并操作到结算
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
const { openTrialGame } = await import('../js/ui/trials.js');
const { TRIAL_BY_ID } = await import('../js/data/trials.js');

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const click = (el) => { if (!el) throw new Error('元素不存在'); el.click(); };
const wait = (ms = 20) => new Promise(r => setTimeout(r, ms));
let fails = 0;
const ok = (c, m, x = '') => { console.log(`${c ? '✓' : '✗'} ${m}${x ? ' — ' + x : ''}`); if (!c) fails++; };

const cases = [
  ['hunt_bandit', '.trial-grid', () => $$('.trial-cell').find(b => !b.disabled)],
  ['neg_lu', '.debate-opts', () => $('[data-card]')],
  ['gov_famine', '[data-pol]', () => $('[data-pol]')],
  ['war_relief', '[data-form]', () => $('[data-form]')],
];

for (const [id, marker, pick] of cases) {
  const st = newGame({ name: '试炼', profession: 'youxia', seed: 7 });
  st.player.cityId = 'luoyi';
  st.player.stateId = 'qi';
  st.player.merit = 900; st.player.fame = 60; st.player.money = 1000;
  app.startGame(st);
  const variant = TRIAL_BY_ID[id];
  const target = variant.targetCity ?? 'luoyi';
  st.player.cityId = target;
  st.player.peerageTrial = { rank: variant.rank, variantId: id, targetCity: target, status: 'active', availableDay: 0, startedDay: 0, exp: null, performance: null };
  app.nav('city');
  openTrialGame(app, st);
  await wait(30);
  ok(!!$(marker), `${id} 界面渲染`);
  for (let i = 0; i < 60 && $(marker) && !$('.modal-foot .btn'); i++) {
    const el = pick();
    if (!el) break;
    click(el);
    await wait(10);
  }
  ok(!!$('.modal-foot .btn'), `${id} 可结算`);
  if ($('.modal-foot .btn')) { click($('.modal-foot .btn')); await wait(60); }
  if ($('.modal-foot .btn')) { click($('.modal-foot .btn')); await wait(40); }
  ok(st.player.peerageTrial.status !== 'active', `${id} 结算写回状态`);
}

// 定礼需要拼次序
{
  const st = newGame({ name: '定礼', profession: 'youxia', seed: 8 });
  st.player.cityId = 'luoyi';
  st.player.stateId = 'qi';
  st.player.merit = 900; st.player.fame = 60; st.player.money = 1000;
  app.startGame(st);
  st.player.peerageTrial = { rank: 4, variantId: 'rite_jiao', targetCity: 'luoyi', status: 'active', availableDay: 0, startedDay: 0, exp: null, performance: null };
  app.nav('city');
  openTrialGame(app, st);
  await wait(30);
  ok(!!$('.rite-clues'), '定礼界面渲染');
  // 任意排三次，触发结算
  for (let attempt = 0; attempt < 3 && !$('.modal-foot .btn'); attempt++) {
    while ($('[data-rite]')) { click($('[data-rite]')); await wait(5); }
    click($('[data-submit]'));
    await wait(15);
  }
  ok(!!$('.modal-foot .btn'), '定礼可结算');
  if ($('.modal-foot .btn')) { click($('.modal-foot .btn')); await wait(60); }
  if ($('.modal-foot .btn')) { click($('.modal-foot .btn')); await wait(40); }
  ok(st.player.peerageTrial.status !== 'active', '定礼结算写回状态');
}

ok(errors.length === 0, '无运行时错误', errors.slice(0, 3).join(' | '));
console.log(fails ? `\n失败 ${fails} 项 ✗` : '\n五套试炼界面通过 ✓');
process.exit(fails ? 1 : 0);
