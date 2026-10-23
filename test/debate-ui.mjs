// 三回合论辩界面：认同度、证据、三选一与结局
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
const { newGame, addEvidence } = await import('../js/state.js');
const { debateModal } = await import('../js/ui/debate.js');
const { DEBATE_BY_ID } = await import('../js/data/debates/index.js');

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const wait = (ms = 30) => new Promise(r => setTimeout(r, ms));
let fails = 0;
const ok = (c, m, x = '') => { console.log(`${c ? '✓' : '✗'} ${m}${x ? ' — ' + x : ''}`); if (!c) fails++; };

const st = newGame({ name: '辩士', profession: 'shuike', seed: 9 });
app.startGame(st);
addEvidence(st, 'relief_ev');
let ended = null;
debateModal(app, st, { name: '县令', title: '县宰', bias: 'li' }, {
  scenario: DEBATE_BY_ID.relief,
  onEnd: (r) => { ended = r; },
});
await wait(60);

ok($$('.debate-opt').length === 3, '每轮三个选项');
ok($('.modal').textContent.includes('认同度 50'), '初始认同度 50');
ok($('.modal').textContent.includes('第 1 / 3 轮'), '显示轮次');
ok(!!$('.debate-opt .opt-text'), '选项只显示台词');
ok(!$('.debate-opt.match'), '选项不再标合心性');
ok(!/讲利害|讲道义|引先例|陈形势|合其心性/.test($('.debate-opts').textContent), '选项不显示思路提示');
ok(!!$('[data-evidence]'), '掌握后可出示证据');
ok($('.debate-speech').textContent.length > 4, '显示对方顾虑');

// 出示相关证据
$('[data-evidence]').click();
await wait(40);
ok($('.modal').textContent.includes('认同度 60'), '证据 +10');

// 选切中且合心性的一项
$$('.debate-opt')[0].click();
await wait(40);
ok($('.modal').textContent.includes('认同度 80'), '切中选项 → 80');
ok($('.modal').textContent.includes('第 2 / 3 轮'), '进入第二轮');
ok(!$('[data-evidence]'), '本局证据已用，不再显示');

// 完成剩余两轮
while ($$('.debate-opt').length) {
  $$('.debate-opt')[0].click();
  await wait(40);
}
ok($('.modal').textContent.includes('说服成功'), '三轮后显示结局');
ok(!!$('.modal-foot .btn'), '有继续按钮');
$('.modal-foot .btn').click();
await wait(60);
ok(ended && ended.result === 'success', 'onEnd 返回成功结局', ended?.result);
ok(!$('.modal'), '弹窗关闭');
ok(errors.length === 0, '无运行时错误', errors.slice(0, 2).join(' | '));

console.log(fails ? `\n失败 ${fails} 项 ✗` : '\n三回合论辩界面通过 ✓');
process.exit(fails ? 1 : 0);
