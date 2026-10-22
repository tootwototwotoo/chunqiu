// 模拟真实入口：载入 index.html 后执行 main.js
import { JSDOM } from 'jsdom';
import fs from 'node:fs';
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const dom = new JSDOM(html, { url: 'http://localhost:5173/', pretendToBeVisual: true });
const { window } = dom;
for (const k of ['window','document','localStorage','HTMLElement','Element','MouseEvent','Node','Event','getComputedStyle','requestAnimationFrame','cancelAnimationFrame']) {
  if (k === 'window') globalThis.window = window;
  else if (k in window) globalThis[k] = window[k];
}
Object.defineProperty(globalThis, 'navigator', { value: window.navigator, configurable: true });
globalThis.requestAnimationFrame = (fn) => window.setTimeout(() => fn(Date.now()), 16);
globalThis.cancelAnimationFrame = (id) => window.clearTimeout(id);
const errs = [];
window.addEventListener('error', e => errs.push(e.message || String(e.error)));
process.on('unhandledRejection', e => errs.push('rejection: ' + e.message));
await import('../js/main.js');
await new Promise(r => setTimeout(r, 60));
console.log('body class:', document.body.className);
console.log('screen children:', document.querySelector('#screen').children.length);
console.log('screen text:', JSON.stringify(document.querySelector('#screen').textContent.slice(0, 60)));
console.log('hud text:', JSON.stringify(document.querySelector('#hud').textContent.trim().slice(0, 60)));
console.log('errors:', errs);
