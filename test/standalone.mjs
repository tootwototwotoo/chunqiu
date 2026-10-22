// 验证单文件版在 file:// 场景下可启动（localStorage 不可用也不应白屏）
import { JSDOM, VirtualConsole } from 'jsdom';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../chunqiu.html', import.meta.url), 'utf8');
const errs = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => errs.push('jsdomError: ' + e.message));
vc.on('error', (...a) => errs.push('console.error: ' + a.join(' ')));

const dom = new JSDOM(html, {
  url: 'file:///E:/Research/opencode/chunqiu/chunqiu.html',
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  virtualConsole: vc,
});

await new Promise(r => setTimeout(r, 800));
const doc = dom.window.document;
const text = doc.querySelector('#screen').textContent;
console.log('screen text:', JSON.stringify(text.replace(/\s+/g, ' ').trim().slice(0, 40)));
console.log('boot error visible:', doc.querySelector('#boot-error').style.display);
console.log('storage available:', (() => { try { dom.window.localStorage.getItem('x'); return true; } catch { return false; } })());
if (errs.length) console.log('errors:', errs.slice(0, 4));

// 点击开局，走一步
doc.querySelector('[data-act="new"]').click();
const name = doc.querySelector('#pname');
name.value = '单文件';
doc.querySelector('[data-act="start"]').click();
await new Promise(r => setTimeout(r, 200));
console.log('after start, screen has city:', doc.querySelector('#screen').textContent.includes('诸般行事'));
console.log('modal open:', !!doc.querySelector('.modal'));

const ok = text.includes('春秋') && doc.querySelector('#boot-error').style.display === 'none';
console.log(ok ? '单文件版通过 ✓' : '单文件版失败 ✗');
process.exit(ok ? 0 : 1);
