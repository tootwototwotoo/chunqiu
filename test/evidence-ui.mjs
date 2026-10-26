// 证据获取的界面入口：城中查访、人物打听、市集书肆
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
const { newGame, hasEvidence } = await import('../js/state.js');

const $ = (s) => document.querySelector(s);
const click = (sel) => { const el = typeof sel === 'string' ? $(sel) : sel; if (!el) throw new Error('元素不存在'); el.click(); };
const wait = (ms = 40) => new Promise(r => setTimeout(r, ms));
let fails = 0;
const ok = (c, m, x = '') => { console.log(`${c ? '✓' : '✗'} ${m}${x ? ' — ' + x : ''}`); if (!c) fails++; };

const st = newGame({ name: '证据', profession: 'youxia', seed: 11 });
st.player.skills.suanshu = 10;
st.player.stats.zhi = 100;
st.player.stamina = 100;
st.player.money = 1000;
st.player.cityId = 'tao';
app.startGame(st);
app.nav('city');
ok(!!$('[data-act="investigate"]'), '城中有「查访线索」');
click('[data-act="investigate"]');
await wait();
ok(!!$('[data-inv]'), '查访列表出现');
click('[data-inv]');
await wait(80);
ok(st.player.evidence.length > 0, '查访获得证据');
if ($('.modal-foot .btn')) { click($('.modal-foot .btn')); await wait(60); }

// 人物打听
st.player.cityId = 'linzi';
st.player.relations['guan_zhong'] = { aff: 30, met: true, gifts: 0 };
st.player.stamina = 100;
app.nav('city');
click('.npc-row[data-npc="guan_zhong"]');
await wait();
ok(!!$('[data-act="ask"]'), '人物面板有「打听消息」');
click('[data-act="ask"]');
await wait(80);
ok(hasEvidence(st, 'flood_ev'), '打听获得证据');
if ($('.modal-foot .btn')) { click($('.modal-foot .btn')); await wait(60); }

// 市集书肆
st.player.cityId = 'luoyi';
app.nav('city');
click('[data-act="market"]');
await wait();
ok(!!$('[data-tab="book"]'), '大城书肆有页签');
click('[data-tab="book"]');
await wait(30);
ok(!!$('[data-buy-ev]'), '书肆有可购证据');
click($('[data-buy-ev]'));
await wait(60);
ok(st.player.evidence.length > 0, '购买获得证据');

ok(errors.length === 0, '无运行时错误', errors.slice(0, 2).join(' | '));
console.log(fails ? `\n失败 ${fails} 项 ✗` : '\n证据获取界面通过 ✓');
process.exit(fails ? 1 : 0);
