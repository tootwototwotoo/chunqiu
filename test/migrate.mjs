// 旧存档兼容：新城补齐物价/归属/NPC，且读档路径自动迁移
const mem = new Map();
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k),
};

const { newGame, migrateState, loadGame, SAVE_KEY } = await import('../js/state.js');
const { buy, sell, priceAt } = await import('../js/systems/trade.js');

let fails = 0; const ok = (c, m, x = '') => { console.log(`${c ? '✓' : '✗'} ${m}${x ? ' — ' + x : ''}`); if (!c) fails++; };

const st = newGame({ name: '旧档', profession: 'shangren', seed: 2 });
for (const id of ['ju', 'zhu', 'sui', 'xu', 'shen', 'qi2']) {
  delete st.world.prices[id];
  delete st.world.owner[id];
}
delete st.npc.ji_liang;
delete st.npc.liu_xiahui;
st.world.power.ju = undefined;

migrateState(st);
ok(!!st.world.prices.ju, '补齐新城物价');
ok(st.world.owner.ju === 'ju', '补齐新城归属');
ok(st.world.power.ju != null, '补齐新国国势');
ok(!!st.npc.ji_liang && !!st.npc.liu_xiahui, '补齐新增人物');

st.player.cityId = 'ju';
const b = buy(st, 'su', 2);
ok(b.ok, '新城买入', b.msg || '');
const s = sell(st, 'su', 1);
ok(s.ok, '新城卖出', s.msg || '');
ok(priceAt(st, 'ju', 'su') > 0, '新城物价有效');

localStorage.setItem(SAVE_KEY, JSON.stringify(st));
const loaded = loadGame();
ok(!!loaded && !!loaded.world.prices.ju, '读档自动迁移');

console.log(fails ? `\n失败 ${fails} 项 ✗` : '\n旧存档迁移通过 ✓');
process.exit(fails ? 1 : 0);
