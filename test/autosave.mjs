import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';
import { newGame, saveGame, loadGame, SAVE_KEY } from '../js/state.js';
import { advanceDays } from '../js/systems/calendar.js';

const AUTO_KEY = 'chunqiu_lieguozhi_auto';
const dom = new JSDOM(fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8'), {
  url: 'http://localhost/', pretendToBeVisual: true,
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.localStorage = dom.window.localStorage;
const { app } = await import('../js/ui/app.js');
const wait = () => new Promise(resolve => setTimeout(resolve, 60));

test.beforeEach(() => {
  globalThis.localStorage = dom.window.localStorage;
  localStorage.clear();
  document.querySelector('#toast-root').innerHTML = '';
  app.showTitle();
});

test('仅有自动档时标题提供继续入口并正确读档', () => {
  const st = newGame({ name: '自动档', seed: 1 });
  advanceDays(st, 30);
  app.showTitle();
  const btn = document.querySelector('[data-act="continue"]');
  assert.ok(btn);
  btn.click();
  assert.equal(app.st.player.name, '自动档');
  assert.deepEqual(app.st.time, { year: -722, month: 2, day: 1 });
});

test('继续读取最后写入的存档，同毫秒重开更早年代也不选旧档', () => {
  const originalNow = Date.now;
  Date.now = () => 1800000000000;
  try {
    const manual = newGame({ name: '手动旧档', era: 'wuyue', seed: 1 });
    assert.ok(saveGame(manual));
    const auto = newGame({ name: '自动新档', seed: 1 });
    advanceDays(auto, 30);
    app.showTitle();
    document.querySelector('[data-act="continue"]').click();
    assert.equal(app.st.player.name, '自动新档');
    assert.equal(loadGame().player.name, '手动旧档', '普通读档仍读取手动槽');
    manual.player.name = '手动最新档';
    assert.ok(saveGame(manual));
    app.showTitle();
    document.querySelector('[data-act="continue"]').click();
    assert.equal(app.st.player.name, '手动最新档');
  } finally { Date.now = originalNow; }
});

test('损坏的最新档不妨碍继续读取另一有效档；全损坏时不显示继续', () => {
  saveGame(newGame({ name: '有效手动档', seed: 1 }));
  localStorage.setItem(AUTO_KEY, JSON.stringify({ savedAt: 9999999999999, player: {}, time: {} }));
  app.showTitle();
  document.querySelector('[data-act="continue"]').click();
  assert.equal(app.st.player.name, '有效手动档');
  localStorage.setItem(SAVE_KEY, '{broken');
  app.showTitle();
  assert.equal(document.querySelector('[data-act="continue"]'), null);
});

test('没有保存时间的旧档按游戏年月日选取较新进度', () => {
  const manual = newGame({ name: '旧手动', seed: 1 });
  const auto = newGame({ name: '旧自动', seed: 1 });
  auto.time.day = 2;
  localStorage.setItem(SAVE_KEY, JSON.stringify(manual));
  localStorage.setItem(AUTO_KEY, JSON.stringify(auto));
  app.showTitle();
  document.querySelector('[data-act="continue"]').click();
  assert.equal(app.st.player.name, '旧自动');
});

test('自动存档信息显示完整游戏年月日', () => {
  const st = newGame({ name: '看日期', seed: 1 });
  advanceDays(st, 30);
  app.startGame(st);
  app.nav('save');
  const info = [...document.querySelectorAll('.desc')].find(el => el.textContent.includes('最近：'));
  assert.ok(info?.textContent.includes('前722年 二月 1日'));
});

test('存储写入失败时跨月行动与手动保存均给出提示，游戏仍可继续', () => {
  const st = newGame({ name: '存档失败', seed: 1 });
  app.startGame(st);
  globalThis.localStorage = { getItem: () => null, setItem: () => { throw new Error('quota exceeded'); } };
  app.after(advanceDays(st, 30));
  assert.match(document.querySelector('#toast-root').textContent, /自动存档失败/);
  assert.match(document.querySelector('#log-list').textContent, /自动存档失败/);
  document.querySelector('#toast-root').innerHTML = '';
  app.save();
  assert.match(document.querySelector('#toast-root').textContent, /存档失败/);
  assert.deepEqual(st.time, { year: -722, month: 2, day: 1 });
});

test('浏览器禁止访问存储时也提示自动保存失败', () => {
  const st = newGame({ name: '禁用存储', seed: 1 });
  app.startGame(st);
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('denied'); } });
  try {
    app.after(advanceDays(st, 30));
    assert.match(document.querySelector('#toast-root').textContent, /自动存档失败/);
  } finally {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, writable: true, value: dom.window.localStorage });
  }
});

for (const profession of ['youxia', 'shuike']) {
  test(`${profession}献策跨月时也显示自动存档失败提示`, () => {
    const st = newGame({ name: '献策者', profession, seed: 1 });
    st.time.day = 30;
    st.player.stateId = 'zhou';
    st.player.rank = 1;
    app.startGame(st);
    globalThis.localStorage = { getItem: () => null, setItem: () => { throw new Error('quota'); } };
    document.querySelector('[data-act="advise"]').click();
    assert.match(document.querySelector('#toast-root').textContent, /自动存档失败/);
    assert.match(document.querySelector('#log-list').textContent, /自动存档失败/);
  });
}

test('演武结算跨月时也显示自动存档失败提示', () => {
  const st = newGame({ name: '演武者', seed: 1 });
  st.time.day = 30;
  st.player.stats.wu = 100;
  st.player.skills.jianshu = 10;
  app.startGame(st);
  globalThis.localStorage = { getItem: () => null, setItem: () => { throw new Error('quota'); } };
  document.querySelector('[data-act="spar"]').click();
  for (let i = 0; i < 80 && !document.querySelector('.modal-foot .btn'); i++) {
    document.querySelector('[data-move="zhan"]').click();
  }
  assert.ok(document.querySelector('.modal-foot .btn'), '演武已结算');
  document.querySelector('.modal-foot .btn').click();
  assert.match(document.querySelector('#toast-root').textContent, /自动存档失败/);
});

test('异常保存时间不能让成功保存的档案变得不可读取', () => {
  const st = newGame({ name: '极端时间', seed: 1 });
  st.savedAt = Number.MAX_SAFE_INTEGER;
  const raw = JSON.stringify(st);
  localStorage.setItem(SAVE_KEY, raw);
  assert.ok(loadGame());
  const saved = saveGame(st);
  assert.ok(loadGame(), '保存后原档仍然可读');
  if (!saved) assert.equal(localStorage.getItem(SAVE_KEY), raw, '失败不可覆盖原档');
});

test.after(async () => { app.showTitle(); await wait(); dom.window.close(); });
