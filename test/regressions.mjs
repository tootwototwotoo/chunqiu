import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';
import { newGame, migrateState, saveGame, loadGame } from '../js/state.js';
import { advanceDays } from '../js/systems/calendar.js';
import { travelTo } from '../js/systems/travel.js';
import { computeEnding } from '../js/systems/progression.js';

const dom = new JSDOM(fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8'), {
  url: 'http://localhost/', pretendToBeVisual: true,
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.localStorage = dom.window.localStorage;
const { app } = await import('../js/ui/app.js');
const { duelModal } = await import('../js/ui/minigames.js');
const wait = () => new Promise(resolve => setTimeout(resolve, 100));

test('月初自动档恢复未处理的历史选择，基础效果只应用一次', async () => {
  const st = newGame({ name: '史官', seed: 1 });
  st.time = { year: -722, month: 4, day: 30 };
  const before = st.world.power.zheng;
  advanceDays(st, 1);
  const restored = JSON.parse(localStorage.getItem('chunqiu_lieguozhi_auto'));
  assert.equal(restored.world.power.zheng, before + 4, '存档应包含郑伯克段的国势效果');
  app.startGame(restored);
  await wait();
  assert.equal(document.querySelector('.modal h3')?.textContent, '郑伯克段于鄢');
  assert.equal(app.st.world.power.zheng, before + 4, '展示弹窗不可重复应用效果');
  // 弹窗尚未作答时再次读档，仍能继续同一事件。
  saveGame(app.st);
  app.startGame(loadGame());
  await wait();
  assert.equal(document.querySelector('.modal h3')?.textContent, '郑伯克段于鄢');
  document.querySelectorAll('.choice-btn')[1].click();
  saveGame(app.st); // 已作答、尚未关闭结果弹窗
  app.startGame(loadGame());
  await wait();
  assert.notEqual(document.querySelector('.modal h3')?.textContent, '郑伯克段于鄢');
  assert.equal(app.st.world.power.zheng, before + 4);
});

test('桓公开局正月事件立即展示且不会在后续月份重发', async () => {
  const st = newGame({ name: '齐人', era: 'huan', seed: 2 });
  app.startGame(st);
  await wait();
  assert.equal(document.querySelector('.modal h3')?.textContent, '齐桓公即位');
  document.querySelectorAll('.choice-btn')[1].click();
  app.closeModal();
  assert.equal(advanceDays(st, 360).events.filter(w => w.ev.id === 'qi_huan_li').length, 0);
});

test('切换角色后不残留旧弹窗或事件队列', async () => {
  const st = newGame({ name: '旧人', seed: 1 });
  st.time = { year: -722, month: 4, day: 30 };
  app.startGame(st);
  app.after(advanceDays(st, 1));
  assert.ok(document.querySelector('.modal'));
  app.startGame(newGame({ name: '新人', seed: 3 }));
  await wait();
  assert.equal(document.querySelector('.modal'), null);
  assert.equal(app.queue.length, 0);
});

test('姓名、学派、著述和纪事在页面与决斗中均作为文本展示', () => {
  const text = '<img src=x data-injected="yes">';
  const st = newGame({ name: text, profession: 'xuezhe', seed: 1 });
  st.player.doctrine = text;
  st.player.works.push({ title: text, year: -722 });
  st.log.push({ d: text, text, kind: '"><img data-injected="yes">' });
  localStorage.setItem('chunqiu_lieguozhi_auto', JSON.stringify(st));
  app.startGame(st);
  for (const screen of ['city', 'character', 'save']) {
    app.nav(screen);
    assert.equal(document.querySelector('[data-injected]'), null, screen);
  }
  assert.ok(document.querySelector('#log-list').textContent.includes(text));
  duelModal(app, st, { name: '剑客', wu: 40, skill: 1 });
  document.querySelector('[data-move="zhan"]').click();
  assert.equal(document.querySelector('[data-injected]'), null, '决斗姓名与战报');
  app.closeModal(false);
  app.showEnding();
  assert.equal(document.querySelector('[data-injected]'), null, '结局');
});

test('损坏存档在替换当前游戏前被拒绝', () => {
  const current = newGame({ name: '保留进度', seed: 1 });
  app.startGame(current);
  for (const damage of [
    st => { st.world = null; },
    st => { st.player.profession = 'unknown'; },
    st => { st.player.cityId = 'unknown'; },
    st => { st.time.month = 13; },
    st => { st.player.money = '100'; },
    st => { st.player.skills = []; },
    st => { st.log = {}; },
    st => { st.player.works = [null]; },
    st => { st.player.inventory = { unknown: 2 }; },
  ]) {
    const broken = newGame({ name: '坏档', seed: 1 });
    damage(broken);
    assert.throws(() => app.startGame(broken));
    assert.equal(app.st, current);
    app.render();
  }
  app.nav('save');
  document.querySelector('#save-area').value = '{"player":{},"time":{}}';
  document.querySelector('[data-act="import"]').click();
  assert.equal(app.st, current, '导入失败保留原游戏');
});

test('导入的差事文字与放弃确认作为文本显示', () => {
  const text = '<img src=x data-injected="yes">';
  const st = newGame({ name: '受托人', seed: 1 });
  st.quests.active.push({ id: 'q1', title: text, desc: text, giverName: text, mode: 'travel', status: 'active', targetCity: 'tao' });
  app.startGame(st);
  app.nav('quests');
  assert.equal(document.querySelector('[data-injected]'), null);
  document.querySelector('[data-abandon]').click();
  assert.equal(document.querySelector('[data-injected]'), null);
  assert.ok(document.querySelector('.modal-body').textContent.includes(text));
  app.closeModal(false);
});

test('无效的霸主与差事引用在读档时被拒绝', () => {
  const current = newGame({ name: '保留进度', seed: 1 });
  app.startGame(current);
  const damages = [
    st => { st.world.hegemon = '<img src=x data-injected=yes>'; },
    st => { st.quests.active = [{ id: 'q1', title: '坏差事', mode: 'travel', status: 'active', targetCity: 'unknown' }]; },
    st => { st.quests.active = [{ id: 'q1', title: '坏差事', mode: 'combat', status: 'active', enemy: null }]; },
    st => { st.quests.active = [{ id: 'q1', title: '坏差事', mode: 'debate', status: 'active', targetState: 'unknown' }]; },
    st => { st.quests.active = [{ id: 'q1', title: '坏差事', mode: 'check', status: 'active', checkSkill: 'unknown' }]; },
  ];
  for (const [index, damage] of damages.entries()) {
    const broken = newGame({ name: '坏档', seed: 1 });
    damage(broken);
    assert.throws(() => app.startGame(broken), `坏档 ${index}`);
    assert.equal(app.st === current, true);
  }
});

test('旧档缺少可补齐字段时仍能读档并打开全部界面', () => {
  const st = newGame({ name: '旧档', seed: 1 });
  delete st.events;
  delete st.stats;
  delete st.flags;
  delete st.player.skillExp;
  delete st.player.works;
  delete st.quests;
  migrateState(st);
  app.startGame(st);
  for (const screen of ['city', 'character', 'quests', 'relations', 'cards', 'save']) {
    assert.doesNotThrow(() => app.nav(screen));
  }
});

test('遍历记录所有到访城市，重复到访不增加并随存档保留', () => {
  const st = newGame({ name: '行者', seed: 1 });
  st.player.money = 10000;
  for (const city of ['tao', 'qufu', 'linzi', 'tao']) {
    st.player.stamina = 100;
    assert.ok(travelTo(st, city).ok);
  }
  saveGame(st);
  const restored = loadGame();
  assert.equal(computeEnding(restored).stats.find(([key]) => key === '遍历')[1], '4城');
  delete restored.player.visitedCities;
  migrateState(restored);
  assert.equal(computeEnding(restored).stats.find(([key]) => key === '遍历')[1], '2城');
});

test.after(async () => { app.showTitle(); await wait(); dom.window.close(); });
