// 地图标记：差事目标、商号/市籍、标记开关下拉
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
globalThis.HTMLElement = window.HTMLElement;
globalThis.Element = window.Element;
globalThis.MouseEvent = window.MouseEvent;
globalThis.SVGElement = window.SVGElement;

const errors = [];
window.addEventListener('error', (e) => errors.push(String(e.error?.stack || e.message)));
const origError = console.error;
console.error = (...a) => {
  const msg = a.map(String).join(' ');
  if (!/HTMLCanvasElement|getContext/.test(msg)) errors.push(msg);
  origError(...a);
};

const { app } = await import('../js/ui/app.js');
const state = await import('../js/state.js');
const mapMod = await import('../js/ui/map.js');
const { questMarks, shopMarks } = mapMod;
const { refreshBoard, acceptQuest } = await import('../js/systems/quests.js');
const { CITY_MAP, CITIES } = await import('../js/data/world.js');
const { openShop, getPermit } = await import('../js/systems/merchant.js');

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const wait = (ms = 40) => new Promise((r) => setTimeout(r, ms));
const tap = (el) => {
  if (!el) throw new Error('元素不存在');
  if (typeof el.click === 'function') { el.click(); return el; }
  el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  return el;
};
const boot = async (st) => { app.startGame(st); await wait(80); app.nav('map'); await wait(80); };

let fails = 0;
const ok = (c, m, x = '') => { console.log(`${c ? '✓' : '✗'} ${m}${x ? ' — ' + x : ''}`); if (!c) fails++; };

// ---------------- 开关默认值 ----------------
{
  const st = state.newGame({ name: '图', profession: 'youxia', seed: 1 });
  state.migrateState(st);
  const m = st.flags.mapMarks;
  ok(!!m, 'flags.mapMarks 存在');
  ok(m.quest && m.shop && m.haul && m.event && m.war && m.territory && m.stateLabel && m.road, '八项默认全开', JSON.stringify(m));
}

// ---------------- 差事标记：数据层 ----------------
{
  const st = state.newGame({ name: '差', profession: 'youxia', seed: 11 });
  const p = st.player;
  p.cityId = 'linzi';
  p.fame = 60;
  ok(questMarks(st).size === 0, '无差事时无标记');

  // 接一件出行差事
  let q = null;
  for (let i = 0; i < 40 && !q; i++) q = refreshBoard(st, true).find(o => o.mode === 'travel');
  ok(!!q, '找到出行差事', q?.kind ?? '');
  if (q) {
    acceptQuest(st, q.id);
    const marks = questMarks(st);
    ok(marks.size === 1, '差事标记生成', String(marks.size));
    const m = marks.get(q.targetCity);
    ok(!!m, '标记落在目标城', q.targetCity);
    ok(m.left != null, '带剩余日数', String(m.left));
  }
}

// ---------------- 差事标记：界面渲染 ----------------
{
  const st = state.newGame({ name: '旗', profession: 'youxia', seed: 12 });
  const p = st.player;
  p.cityId = 'linzi';
  p.fame = 60;
  let q = null;
  for (let i = 0; i < 40 && !q; i++) q = refreshBoard(st, true).find(o => o.mode === 'travel');
  if (q) acceptQuest(st, q.id);
  await boot(st);
  ok(!!$('#map-svg'), '舆图渲染');
  const flags = $$('.map-quest-flag');
  ok(flags.length === 1, '地图上出现一个差事旗', String(flags.length));
  // 只显示一个旗，不显示数量角标
  ok(!$('.map-quest-flag .count') && !/\d+/.test(flags[0]?.querySelector('polygon')?.textContent ?? ''), '不显示数量角标');
  // 标题提示
  const title = flags[0]?.querySelector('title')?.textContent ?? '';
  ok(/余 \d+ 日|差事/.test(title), '旗有悬停提示', title);

  // 图例出现
  ok($('.map-legend').textContent.includes('差事目标'), '图例显示差事目标');
}

// ---------------- 紧急态：与当前城标记区分 ----------------
{
  const st = state.newGame({ name: '急', profession: 'youxia', seed: 13 });
  const p = st.player;
  p.cityId = 'linzi';
  p.fame = 60;
  let q = null;
  for (let i = 0; i < 40 && !q; i++) q = refreshBoard(st, true).find(o => o.mode === 'travel');
  if (q) {
    acceptQuest(st, q.id);
    const active = st.quests.active.find(x => x.id === q.id);
    // 把限期改成 2 日后
    active.exp = (st.time.year + 722) * 360 + (st.time.month - 1) * 30 + st.time.day + 2;
    await boot(st);
    const flag = $('.map-quest-flag');
    ok(!!flag, '紧急态旗子存在');
    ok(flag?.classList.contains('urgent'), '标记为紧急态', flag?.className ?? '');
    ok(!!flag?.querySelector('animateTransform'), '紧急态带摆动动画');
    // 与当前城的呼吸圆环区分：城点那边是 animate（半径），旗是 animateTransform（旋转）
    const hereRing = $('.here-ring');
    ok(!!hereRing, '当前城有呼吸圆环');
    ok(hereRing?.querySelector('animate') && !hereRing?.querySelector('animateTransform'),
      '当前城用半径动画，与差事的旋转动画不同');
  }
}

// ---------------- 商号/市籍标记 ----------------
{
  // 非商人：无标记
  const st = state.newGame({ name: '侠', profession: 'youxia', seed: 21 });
  st.player.cityId = 'linzi';
  ok(shopMarks(st).size === 0, '非商人无商号标记');
  await boot(st);
  ok($$('.map-shop-mark').length === 0, '非商人不渲染商号图形');

  // 商人：逐级验证
  const sm = state.newGame({ name: '商', profession: 'shangren', seed: 22 });
  const p = sm.player;
  p.cityId = 'linzi';
  p.money = 100000;
  p.fame = 60;
  p.peakMoney = 100000;
  state.migrateState(sm);
  ok(shopMarks(sm).size === 0, '商人未领籍时无标记');

  // 领籍未开店 → 空心圆环
  const gp = getPermit(sm, 'linzi');
  ok(gp.ok, '领得市籍', gp.msg ?? '');
  const m1 = shopMarks(sm).get('linzi');
  ok(m1?.kind === 'permit', '已领籍显示为 permit', m1?.kind ?? '无');

  await boot(sm);
  ok($$('.map-shop-mark.permit').length >= 1, '渲染市籍圆环');

  // 开店 → 方块
  app.nav('city');
  await wait(40);
  p.money = 100000;
  const os = openShop(sm, 'linzi');
  ok(os.ok, '开设商号', os.msg ?? '');
  const m2 = shopMarks(sm).get('linzi');
  ok(m2?.kind === 'shop', '开店后为 shop', m2?.kind ?? '无');
  ok(m2?.level === 1, '等级 1', String(m2?.level));

  app.nav('map');
  await wait(80);
  ok($$('.map-shop-mark.shop1').length >= 1, '渲染小肆方块');
  const rect = $('.map-shop-mark.shop1 rect');
  ok(rect?.getAttribute('width') === '7', '小肆边长 7', rect?.getAttribute('width'));
}

// ---------------- 商号等级影响尺寸 ----------------
{
  const st = state.newGame({ name: '商', profession: 'shangren', seed: 23 });
  const p = st.player;
  p.cityId = 'linzi';
  p.money = 200000;
  p.peakMoney = 200000;
  p.fame = 80;
  state.migrateState(st);
  getPermit(st, 'linzi');
  openShop(st, 'linzi');
  app.startGame(st);
  await wait(60);

  const sizes = [];
  for (const lv of [1, 2, 3]) {
    const shop = st.player.shops[0];
    shop.level = lv;
    app.nav('map');
    await wait(70);
    const r = $(`.map-shop-mark.shop${lv} rect`);
    sizes.push(Number(r?.getAttribute('width') ?? 0));
  }
  ok(sizes[0] === 7 && sizes[1] === 9 && sizes[2] === 11, '等级 1/2/3 对应 7/9/11', sizes.join('/'));
}

// ---------------- 转职后不再显示 ----------------
{
  const st = state.newGame({ name: '转', profession: 'shangren', seed: 24 });
  const p = st.player;
  p.cityId = 'linzi';
  p.money = 200000;
  p.peakMoney = 200000;
  p.fame = 80;
  state.migrateState(st);
  getPermit(st, 'linzi');
  openShop(st, 'linzi');
  ok(shopMarks(st).size >= 1, '转职前有标记');
  // 模拟转职
  p.profession = 'shuike';
  ok(shopMarks(st).size === 0, '转职后不再生成标记');
  await boot(st);
  ok($$('.map-shop-mark').length === 0, '转职后不渲染图形');
}

// ---------------- 下拉菜单 ----------------
{
  const st = state.newGame({ name: '菜', profession: 'shangren', seed: 31 });
  const p = st.player;
  p.cityId = 'linzi';
  p.money = 100000;
  p.fame = 60;
  state.migrateState(st);
  getPermit(st, 'linzi');
  openShop(st, 'linzi');
  await boot(st);

  const btn = $('[data-act="marks"]');
  ok(!!btn, '有标记按钮');
  const menu = $('#map-mark-menu');
  ok(!!menu && menu.hidden, '菜单默认收起');
  tap(btn);
  await wait(60);
  ok(!$('#map-mark-menu').hidden, '点击后展开');

  const items = $$('[data-mark]');
  ok(items.length === 8, '八个开关项', String(items.length));
  const labels = items.map(i => i.textContent.trim()).join(',');
  ok(/差事目标/.test(labels) && /商号与市籍/.test(labels) && /在途货运/.test(labels)
    && /时事要地/.test(labels) && /交战之国/.test(labels) && /本国疆域/.test(labels)
    && /国名水印/.test(labels) && /道路/.test(labels), '八项名称正确', labels);

  // 关闭商号
  ok($$('.map-shop-mark').length >= 1, '关闭前有商号图形');
  tap($('[data-mark="shop"]'));
  await wait(80);
  ok((app.st.flags.mapMarks.shop ?? true) === false, '开关写入 flags', String(app.st.flags.mapMarks.shop));
  ok($$('.map-shop-mark').length === 0, '关闭后商号图形消失');

  // 再打开
  tap($('[data-mark="shop"]'));
  await wait(80);
  ok(app.st.flags.mapMarks.shop === true, '可再次打开');
  ok($$('.map-shop-mark').length >= 1, '图形恢复');
}

// ---------------- 关闭道路与国名水印 ----------------
{
  const st = state.newGame({ name: '关', profession: 'youxia', seed: 32 });
  await boot(st);
  ok($$('.map-road').length > 0, '默认有道路');
  ok($$('.map-state-label').length > 0, '默认有国名水印');

  tap($('[data-act="marks"]'));
  await wait(50);
  tap($('[data-mark="road"]'));
  await wait(80);
  ok($$('.map-road').length === 0, '关闭后道路消失');

  tap($('[data-mark="stateLabel"]'));
  await wait(80);
  ok($$('.map-state-label').length === 0, '关闭后国名水印消失');
}

// ---------------- 侧栏：差事与商号行 ----------------
{
  const st = state.newGame({ name: '侧', profession: 'shangren', seed: 41 });
  const p = st.player;
  p.cityId = 'linzi';
  p.money = 100000;
  p.fame = 60;
  state.migrateState(st);
  getPermit(st, 'linzi');
  openShop(st, 'linzi');

  // 接一件指向某城的出行差事，并选中该城
  let q = null;
  for (let i = 0; i < 40 && !q; i++) q = refreshBoard(st, true).find(o => o.mode === 'travel');
  if (q) acceptQuest(st, q.id);

  await boot(st);
  // 选中目标城
  const node = $$('.map-city').find(el => el.dataset.city === q?.targetCity);
  if (node) {
    tap(node);
    await wait(80);
    const side = $('.map-side')?.textContent ?? '';
    ok(side.includes('差事'), '侧栏显示差事行');
    ok(/余 \d+ 日/.test(side), '侧栏显示剩余日数');
  }
  // 选中自己的城
  const here = $$('.map-city').find(el => el.dataset.city === 'linzi');
  if (here) {
    tap(here);
    await wait(80);
    const side = $('.map-side')?.textContent ?? '';
    ok(side.includes('商号'), '侧栏显示商号行');
    ok(/月入/.test(side), '侧栏显示月入');
  }
}


// ---------------- 在途货运路线 ----------------
{
  const { startHaul } = await import('../js/systems/haul.js');
  const st = state.newGame({ name: '运', profession: 'shangren', seed: 51 });
  const p = st.player;
  p.cityId = 'linzi';
  p.money = 100000;
  p.vehicle = 'wain';
  p.caravan = 320;
  state.migrateState(st);
  p.money = 100000;

  ok(mapMod.haulPaths(st).length === 0, '无货单时无货运路线');

  const h = startHaul(st, 'su', 100, 'tao', 13);
  ok(h.ok, '办货成功', h.msg ?? '');
  const paths = mapMod.haulPaths(st);
  ok(paths.length === 1, '生成一条货运路线', String(paths.length));
  ok(paths[0].path.length >= 2, '路线含多个途经城', String(paths[0].path.length));
  ok(paths[0].from === 'linzi' && paths[0].to === 'tao', '起终点正确');

  await boot(st);
  const lines = $$('.map-haul line');
  ok(lines.length >= 1, '地图上画出货运线', String(lines.length));
  // 流动动画
  ok(!!$('.map-haul animate'), '货运线带流动动画');
  const anim = $('.map-haul animate');
  ok(anim?.getAttribute('attributeName') === 'stroke-dashoffset', '动画走 dashoffset（表现方向）',
    anim?.getAttribute('attributeName') ?? '');
  // 与差事路线的法线偏移
  const seg = lines[0];
  const x1 = Number(seg.getAttribute('x1')), y1 = Number(seg.getAttribute('y1'));
  const fromCity = CITY_MAP[paths[0].path[0]];
  ok(Math.hypot(x1 - fromCity.x, y1 - fromCity.y) > 1, '货运线做了法线偏移，不与道路重叠',
    `偏移 ${Math.hypot(x1 - fromCity.x, y1 - fromCity.y).toFixed(1)}px`);
  // 悬停提示
  ok(/已行 \d+ 日/.test($('.map-haul title')?.textContent ?? ''), '货运线有悬停提示');

  // 侧栏
  const node = $$('.map-city').find(el => el.dataset.city === 'tao');
  if (node) {
    tap(node);
    await wait(80);
    ok(($('.map-side')?.textContent ?? '').includes('货运'), '侧栏显示货运行');
  }

  // 开关
  tap($('[data-act="marks"]'));
  await wait(50);
  tap($('[data-mark="haul"]'));
  await wait(80);
  ok($$('.map-haul').length === 0, '关闭后货运线消失');
}

// ---------------- 时事要地 ----------------
{
  const { TIMELINE } = await import('../js/data/events.js');

  const st = state.newGame({ name: '事', profession: 'youxia', seed: 61 });
  state.migrateState(st);
  ok(mapMod.eventMarks(st).size === 0, '初始无时事标记');

  // 手动触发一个历史事件（用真实的 absDay，避免与存档起始日期错位）
  const ev = TIMELINE.find(e => e.where?.state || e.where?.city);
  const absDayOf = (t) => (t.year + 722) * 360 + (t.month - 1) * 30 + (t.day - 1);
  st.events.firedOn = { [ev.id]: absDayOf(st.time) };
  const marks = mapMod.eventMarks(st);
  ok(marks.size >= 1, '触发后有标记', String(marks.size));
  const [cid, info] = [...marks.entries()][0];
  ok(!!CITY_MAP[cid], '标记落在有效城池', cid);
  ok(info.days === 0, '当日事件 days=0', String(info.days));
  ok(info.title === ev.title, '带事件标题', info.title);

  // state 型 where 应落到该国人口最大的城
  if (ev.where?.state) {
    const candidates = CITIES.filter(c => (st.world.owner[c.id] ?? c.state) === ev.where.state);
    const biggest = candidates.reduce((a, b) => (b.pop > a.pop ? b : a));
    ok(cid === biggest.id, 'state 型事件标该国人口最大城', `${cid} vs ${biggest.id}`);
  }

  await boot(st);
  ok($$('.map-event-ring').length >= 1, '渲染时事环');
  ok(!!$('.map-event-ring animate'), '时事环有动画');
  ok($('.map-legend').textContent.includes('时事要地'), '图例显示时事要地');

  // 超过 30 日应消失
  st.events.firedOn[ev.id] -= (mapMod.EVENT_MARK_DAYS + 1);
  ok(mapMod.eventMarks(st).size === 0, `${mapMod.EVENT_MARK_DAYS} 日后标记消失`);

  // 开关
  st.events.firedOn[ev.id] += (mapMod.EVENT_MARK_DAYS + 1);
  app.nav('map');
  await wait(70);
  tap($('[data-act="marks"]'));
  await wait(50);
  tap($('[data-mark="event"]'));
  await wait(80);
  ok($$('.map-event-ring').length === 0, '关闭后时事环消失');
}


// ---------------- 战争状态（只做视觉） ----------------
{
  const { applyEffects } = await import('../js/systems/events.js');

  const st = state.newGame({ name: '战', profession: 'youxia', seed: 71 });
  state.migrateState(st);
  ok(mapMod.warStates(st).size === 0, '初始无交战');

  applyEffects(st, [{ t: 'war', a: 'jin', b: 'chu' }]);
  ok(Array.isArray(st.world.wars) && st.world.wars.length === 1, 'war 效果写入状态',
    JSON.stringify(st.world.wars));
  const ws = mapMod.warStates(st);
  ok(ws.size === 2, '双方各记一次', String(ws.size));
  ok(ws.get('jin')?.includes('chu') && ws.get('chu')?.includes('jin'), '互为交战方');

  await boot(st);
  const rings = $$('.map-war-ring');
  ok(rings.length > 0, '地图上出现交战标记', String(rings.length));
  // 只有交战国之城有标记：晋有4城，楚有3城
  const jinCities = CITIES.filter(c => (st.world.owner[c.id] ?? c.state) === 'jin');
  ok(rings.length === jinCities.length + CITIES.filter(c => (st.world.owner[c.id] ?? c.state) === 'chu').length,
    '标记数与交战国城池数一致', `${rings.length}`);

  // 非交战国无标记
  const qi = $$('.map-war-ring').length;
  const allCities = $$('.map-city').length;
  ok(qi < allCities, '并非所有城都有交战标记', `${qi}/${allCities}`);

  // 侧栏
  const jinNode = $$('.map-city').find(el => el.dataset.city === jinCities[0].id);
  if (jinNode) {
    tap(jinNode);
    await wait(80);
    ok(($('.map-side')?.textContent ?? '').includes('交战'), '侧栏显示交战国');
    ok(($('.map-side')?.textContent ?? '').includes('楚'), '侧栏列出对手国');
  }

  // 和平
  applyEffects(st, [{ t: 'peace', a: 'jin', b: 'chu' }]);
  ok(mapMod.warStates(st).size === 0, 'peace 后交战状态清除');
  app.nav('map');
  await wait(80);
  ok($$('.map-war-ring').length === 0, '和平后标记消失');

  // 开关
  applyEffects(st, [{ t: 'war', a: 'wu', b: 'yue' }]);
  app.nav('map');
  await wait(80);
  ok($$('.map-war-ring').length > 0, '再次交战后有标记');
  tap($('[data-act="marks"]'));
  await wait(50);
  tap($('[data-mark="war"]'));
  await wait(80);
  ok($$('.map-war-ring').length === 0, '关闭后交战标记消失');
}

ok(errors.length === 0, '全程无运行时错误' + (errors.length ? ': ' + errors[0].slice(0, 120) : ''));

console.log(fails === 0 ? '\n地图标记全部通过 ✓' : `\n地图标记失败 ${fails} 项 ✗`);
if (errors.length) console.log('errors:', errors.slice(0, 3));
process.exit(fails ? 1 : 0);
