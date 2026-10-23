// 八种修习小游戏界面：逐个打开并操作到结算
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
const { trainingModal } = await import('../js/ui/training.js');

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const click = (el) => { if (!el) throw new Error('元素不存在'); el.click(); };
const wait = (ms = 20) => new Promise(r => setTimeout(r, ms));
let fails = 0;
const ok = (c, m, x = '') => { console.log(`${c ? '✓' : '✗'} ${m}${x ? ' — ' + x : ''}`); if (!c) fails++; };

const skills = ['jianshu', 'sheshu', 'bingfa', 'biancai', 'quanmou', 'shanggu', 'suanshu', 'xuewen'];
const markers = {
  jianshu: '#mg-bar', sheshu: '.target-track', bingfa: '[data-choice]', biancai: '[data-choice]',
  quanmou: '[data-choice]', shanggu: '[data-price]', suanshu: '#math-input', xuewen: '[data-left]',
};

for (const skill of skills) {
  const st = newGame({ name: '修习', profession: 'youxia', seed: 3 });
  app.startGame(st);
  trainingModal(app, st, skill, { sub: '测试' });
  await wait(40);
  ok(!!$(markers[skill]), `${skill} 界面渲染`);

  if (skill === 'jianshu') {
    for (let i = 0; i < 3; i++) { click($('.modal-foot .btn')); await wait(25); }
  } else if (skill === 'sheshu') {
    for (let i = 0; i < 3; i++) { click($('[data-shoot]')); await wait(25); }
  } else if (['bingfa', 'biancai', 'quanmou'].includes(skill)) {
    for (let i = 0; i < 3; i++) { click($$('[data-choice]')[0]); await wait(25); }
  } else if (skill === 'shanggu') {
    for (let i = 0; i < 3; i++) { click($$('[data-price]')[0]); await wait(25); }
  } else if (skill === 'suanshu') {
    for (let i = 0; i < 3; i++) {
      const input = $('#math-input');
      input.value = '1';
      click($('[data-submit]'));
      await wait(25);
    }
  } else if (skill === 'xuewen') {
    for (let i = 0; i < 6 && $('[data-left]'); i++) {
      const lefts = $$('[data-left]').filter(b => !b.disabled);
      const rights = $$('[data-right]').filter(b => !b.disabled);
      if (!lefts.length || !rights.length) break;
      click(lefts[0]);
      await wait(8);
      click(rights[0]);
      await wait(20);
    }
  }

  ok($('.modal-body')?.textContent.includes('经验'), `${skill} 完成并结算`);
  const cont = $('.modal-foot .btn');
  if (cont) { click(cont); await wait(80); }
  for (let i = 0; i < 4 && $('.modal'); i++) {
    const b = $('.modal-foot .btn') || $('.modal-close');
    if (b) { b.click(); await wait(60); }
    else break;
  }
  ok(!$('.modal'), `${skill} 弹窗可关闭`);
}

ok(errors.length === 0, '无运行时错误', errors.slice(0, 3).join(' | '));
console.log(fails ? `\n失败 ${fails} 项 ✗` : '\n八种修习界面通过 ✓');
process.exit(fails ? 1 : 0);
