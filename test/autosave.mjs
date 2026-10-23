// 自动存档：写入、读取、时间戳、损坏处理
const mem = new Map();
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k),
};

const { newGame, saveAuto, loadAuto, autoSavedAt, AUTO_KEY } = await import('../js/state.js');
const { advanceDays } = await import('../js/systems/calendar.js');

let fails = 0;
const ok = (c, m, x = '') => { console.log(`${c ? '✓' : '✗'} ${m}${x ? ' — ' + x : ''}`); if (!c) fails++; };

const st = newGame({ name: '存档', profession: 'youxia', seed: 1 });
advanceDays(st, 40);
ok(saveAuto(st), '自动存档写入成功');
ok(!!localStorage.getItem(AUTO_KEY), '自动存档键存在');
ok(autoSavedAt() > 0, '记录真实时间戳');

const loaded = loadAuto();
ok(!!loaded && loaded.player.name === '存档', '自动存档可读取');
ok(loaded.world.prices && loaded.world.prices.linzi, '自动存档迁移新城数据');

// 月度结算也会写入
const before = autoSavedAt();
await new Promise(r => setTimeout(r, 5));
advanceDays(st, 31);
ok(autoSavedAt() > before, '月度结算刷新自动存档');

// 损坏数据不抛异常
localStorage.setItem(AUTO_KEY, '{broken');
ok(loadAuto() === null, '损坏存档返回 null');

console.log(fails ? `\n失败 ${fails} 项 ✗` : '\n自动存档通过 ✓');
process.exit(fails ? 1 : 0);
