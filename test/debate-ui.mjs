// 论辩界面：开局即显示心性与对症/相悖标记
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
const { debateModal } = await import('../js/ui/minigames.js');

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const wait = (ms = 30) => new Promise(r => setTimeout(r, ms));
let fails = 0;
const ok = (c, m, x = '') => { console.log(`${c ? '✓' : '✗'} ${m}${x ? ' — ' + x : ''}`); if (!c) fails++; };

const st = newGame({ name: '辩士', profession: 'shuike', seed: 5 });
app.startGame(st);
debateModal(app, st, { name: '管仲', title: '齐相', bias: 'shi', stats: { zhi: 90 } }, { topic: '国事', difficulty: 60 });
await wait(50);

const text = $('.modal')?.textContent ?? '';
ok(text.includes('心性：慕强'), '开局显示对方心性');
ok(!!$('.debate-opt.match'), '对症话术有标记', $('.debate-opt.match')?.textContent.trim());
ok(!!$('.debate-opt.opp'), '相悖话术有标记');
ok(text.includes('对症') && text.includes('相悖'), '按钮文案标注对症/相悖');

$('.debate-opt.match').click();
await wait(40);
const log = $('.combat-log')?.textContent ?? '';
ok(log.includes('【对症】'), '出招日志标注对症');
ok(/说服[+-]\d+/.test(log), '日志显示说服增减');
ok(errors.length === 0, '无运行时错误', errors.slice(0, 2).join(' | '));

console.log(fails ? `\n失败 ${fails} 项 ✗` : '\n论辩信息可见性通过 ✓');
process.exit(fails ? 1 : 0);
