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
const { newGame } = await import('../js/state.js');
const { debateModal } = await import('../js/ui/debate.js');
const { DEBATE_BY_ID } = await import('../js/data/debates/index.js');

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const wait = (ms = 30) => new Promise(r => setTimeout(r, ms));
let fails = 0;
const ok = (c, m, x = '') => { console.log(`${c ? '✓' : '✗'} ${m}${x ? ' — ' + x : ''}`); if (!c) fails++; };

const st = newGame({ name: '辩士', profession: 'shuike', seed: 9 });
st.player.skills.suanshu = 10;
st.player.stats.zhi = 100;
st.player.stamina = 100;
app.startGame(st);
let ended = null;
debateModal(app, st, { name: '县令', title: '县宰', bias: 'li' }, {
  scenario: DEBATE_BY_ID.relief,
  onEnd: (r) => { ended = r; },
});
await wait(60);

ok($$('.debate-opt').length === 3, '每轮三个选项');
ok($('.modal').textContent.includes('认同度 50'), '初始认同度 50');
ok($('.modal').textContent.includes('第 1 / 3 轮'), '显示轮次');
ok(!!$('.debate-opt.match'), '合心性的思路有标记');
ok(!!$('[data-acquire]'), '未掌握时可查访证据');
ok($('.debate-speech').textContent.length > 4, '显示对方顾虑');

// 查访取得证据
$('[data-acquire]').click();
await wait(50);
ok(st.player.evidence.includes('relief_ev'), '查访后证据入库');
ok(!!$('[data-evidence]'), '掌握后可出示证据');

// 出示相关证据
$('[data-evidence]').click();
await wait(40);
ok($('.modal').textContent.includes('认同度 60'), '证据 +10');

// 选切中且合心性的一项
$('.debate-opt.match').click();
await wait(40);
ok($('.modal').textContent.includes('认同度 80'), '切中+合心性 → 80');
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
