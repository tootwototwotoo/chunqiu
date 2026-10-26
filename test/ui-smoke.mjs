// UI 冒烟测试：用 jsdom 载入真实 DOM，走一遍主要界面与弹窗
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

const errors = [];
window.addEventListener('error', (e) => errors.push(e.message));
process.on('unhandledRejection', (e) => errors.push('unhandled: ' + e.message));

const { app } = await import('../js/ui/app.js');
const { player, loadGame } = await import('../js/state.js');

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const click = (s) => {
  const el = typeof s === 'string' ? $(s) : s;
  if (!el) throw new Error('元素不存在: ' + s);
  el.click();
  return el;
};
const wait = (ms = 20) => new Promise(r => setTimeout(r, ms));
const screenText = () => $('#screen').textContent;
let fails = 0;
const ok = (cond, msg) => { if (!cond) { console.log('  ✗ ' + msg); fails++; } };

app.showTitle();
await wait();
ok(screenText().includes('春秋'), '标题画面');
ok(!!$('[data-act="new"]'), '有开局按钮');

// 开局
click('[data-act="new"]');
ok(!!$('#pname'), '角色创建表单');
$('#pname').value = '姜小白';
$('#pseed').value = '20261022';
click('[data-prof="shuike"]');
click('[data-gender="女"]');
click('[data-act="start"]');
await wait();
ok(player(app.st).name === '姜小白', '姓名写入');
ok(app.st.player.profession === 'shuike', '身份写入');
ok(!!$('.modal'), '开场弹窗');
click('.modal-foot .btn');
await wait();

// 自动存档（行动后写入，界面可切换开关）
const { AUTO_KEY } = await import('../js/state.js');
ok(app.autosaveNow(), '行动后可立即自动存档');
ok(!!localStorage.getItem(AUTO_KEY), '自动存档键已写入');
app.nav('save');
ok(screenText().includes('自动存档：开'), '存档页显示自动存档开关');

// 交游显示（回归：曾把 relations 的值当条目、人名渲染为 undefined）
app.st.player.relations['guan_zhong'] = { aff: 40, met: true, gifts: 0 };
app.st.player.relations['ji_liang'] = { aff: 22, met: true, gifts: 0 };
app.nav('character');
ok(screenText().includes('管仲'), '人物界面交游显示人名');
ok(screenText().includes('季梁'), '人物界面显示多人');
ok(!screenText().includes('undefined'), '交游区无 undefined');

// 仕途面板与出仕
ok(screenText().includes('仕途'), '人物界面有仕途面板');
const { seekOffice, officeChance } = await import('../js/systems/progression.js');
ok(officeChance(app.st) > 0.5, '初始求仕成算大于五成');
app.st.player.fame = 60;
for (let k = 0; k < 3; k++) app.st.quests.done.push({ id: `d${k}`, title: `差事${k}`, status: 'done', reward: {} });
app.st.player.stats.zheng = 90;
app.st.player.stats.mei = 90;
app.st.player.skills.biancai = 6;
let officeRes = null;
for (let i = 0; i < 20 && !(officeRes && officeRes.ok); i++) {
  delete app.st.flags.lastOffice;
  officeRes = seekOffice(app.st, 'qi');
}
ok(!!officeRes && officeRes.ok, '可以出仕', officeRes && officeRes.msg);
app.nav('character');
ok(screenText().includes('官阶'), '出仕后人物界面显示官阶');
ok(screenText().includes('月俸'), '仕途面板显示月俸');
ok(screenText().includes('爵位'), '人物界面单列爵位');
ok(screenText().includes('五等爵'), '人物界面列出五等爵');

// 五等爵显示
app.st.player.peerage = { rank: 0, fief: 'luoyi', year: app.st.time.year };
app.st.player.evidence.push('relief_ev');
app.nav('character');
ok(screenText().includes('男爵'), '人物界面显示五等爵');
ok(screenText().includes('食邑'), '显示食邑月入');
ok(screenText().includes('册命'), '显示册命试炼栏');
ok(screenText().includes('邻县余粮清册'), '人物界面单列证据');

// 册命试炼界面（围捕）
app.st.player.cityId = 'luoyi';
app.st.player.stateId = 'qi';
app.st.player.merit = 900;
app.st.player.fame = 60;
app.st.player.money = 1000;
app.st.player.peerage = null;
app.st.player.peerageTrial = { rank: 0, variantId: 'hunt_bandit', targetCity: 'luoyi', status: 'active', availableDay: 0, startedDay: 0, exp: null, performance: null };
app.nav('city');
ok(!!$('[data-act="trial_start"]'), '城中有「开始册命之试」');
click('[data-act="trial_start"]');
await wait(40);
ok(!!$('.trial-grid'), '围捕小游戏渲染');
for (let i = 0; i < 40 && $('.trial-grid') && !$('.modal-foot .btn'); i++) {
  const cells = $$('.trial-cell').filter(b => !b.disabled);
  if (!cells.length) break;
  cells[0].click();
  await wait(15);
}
ok(!!$('.modal-foot .btn'), '试炼可结算');
click('.modal-foot .btn');
await wait(80);
ok(!!$('.modal'), '复命弹窗');
click('.modal-foot .btn');
await wait(80);
ok(app.st.player.peerageTrial.status === 'done', '试炼结果写入存档');

// 各界面：通过点击顶栏按钮切换（回归：曾漏绑导航事件）
for (const [key] of [['city', '诸般行事'], ['map', '城邑'], ['character', '四维'], ['quests', '差事'], ['relations', '交游'], ['cards', '名鉴'], ['save', '存档']]) {
  const btn = document.querySelector(`#hud-nav [data-screen="${key}"]`);
  ok(!!btn, `存在导航按钮 ${key}`);
  btn.click();
  ok(document.querySelector('#hud-nav button.active')?.dataset.screen === key, `导航高亮 ${key}`);
  if (key === 'map') ok(!!document.querySelector('#map-svg'), '舆图 SVG 渲染');
  else ok(screenText().length > 20, `界面 ${key} 有内容`);
  if (key === 'city') ok(!screenText().includes('美玉'), '市价一览不列玉');
}
click('#hud-nav [data-screen="city"]');

// 市集
click('[data-act="market"]');
ok(!!$('.modal'), '市集弹窗');
ok($('.modal-body').textContent.includes('粟'), '市集列有货物');
ok(!$('.modal-body').textContent.includes('美玉'), '市集买卖不含玉');
click('.modal-foot .btn');
await wait();

// 珍宝页（临淄有美玉、明珠、珊瑚树）
app.st.player.cityId = 'linzi';
app.st.player.money = 100000;
app.nav('city');
click('[data-act="market"]');
await wait();
const gemTab = $$('[data-tab]').find(b => b.textContent.includes('珍宝'));
ok(!!gemTab, '市集有「珍宝」页');
if (gemTab) {
  gemTab.click();
  await wait();
  ok($('.modal-body').textContent.includes('美玉'), '珍宝页列美玉');
  ok($('.modal-body').textContent.includes('明珠'), '珍宝页列明珠');
  ok($('.modal-body').textContent.includes('珊瑚树'), '珍宝页列珊瑚树');
  const buyGem = $$('[data-buy-gem]')[1]; // 明珠
  ok(!!buyGem, '珍宝可购');
  if (buyGem) { buyGem.click(); await wait(60); }
  ok((app.st.player.inventory.mingzhu ?? 0) > 0, '购入珍宝入行囊');
}
click('.modal-foot .btn');
await wait();

// 献宝：本国朝堂 + 持有珍宝
{
  const { addGoods } = await import('../js/state.js');
  addGoods(app.st, 'mingzhu', 1);
  app.st.player.stateId = 'qi';
  app.st.player.cityId = 'linzi';
  app.nav('city');
  await wait();
  const offerBtn = $$('[data-act]').find(b => b.dataset.act === 'offer');
  ok(!!offerBtn, '本国朝堂且有宝时出现「献宝于朝」');
  if (offerBtn) {
    offerBtn.click();
    await wait(40);
    ok($('.modal-body').textContent.includes('明珠'), '献宝弹窗列出明珠');
    const doOffer = $('[data-offer]');
    ok(!!doOffer, '献宝可点');
    const before = app.st.player.inventory.mingzhu ?? 0;
    if (doOffer) { doOffer.click(); await wait(60); }
    ok((app.st.player.inventory.mingzhu ?? 0) === before - 1, '献宝消耗一件珍宝', `${before} → ${app.st.player.inventory.mingzhu ?? 0}`);
  }
  while ($('.modal')) { const b = $('.modal-foot .btn'); if (b) b.click(); await wait(60); }
  app.nav('city');
}

// 修习小游戏
click('[data-act="train"]');
const skillBtns = $$('.choice-btn');
ok(skillBtns.length === 8, '修习可选八艺');
skillBtns[0].click();
await wait(40);
ok(!!$('#mg-bar'), '修习小游戏开始');
for (let i = 0; i < 3; i++) { click('.modal-foot .btn'); await wait(25); } // 三连斩
ok($('.modal-body').textContent.includes('经验'), '修习结算');
click('.modal-foot .btn'); // 继续
await wait(30);

// 差事
app.nav('quests');
ok($$('.quest').length > 0, '榜文有差事');

// 移至城市，领受一个立即执行的差事
app.nav('city');
click('[data-act="board"]');
await wait();
const offers = $$('[data-accept]');
ok(offers.length > 0, '可得榜文委托');
offers[0].click();
await wait(50);
// 可能是决斗/辩论/判定/旅行四类
const combatOpen = !!$('.move-grid');
const debateOpen = !!$('.debate-opts');
if (combatOpen) {
  for (let i = 0; i < 60 && $('.move-grid'); i++) {
    const moves = $$('.move-btn');
    if (!moves.length) break;
    click(moves[i % 4]);
    await wait(5);
    if ($('.modal-foot .btn')) break;
  }
  const cont = $('.modal-foot .btn');
  if (cont) { cont.click(); await wait(30); }
}
if (debateOpen) {
  for (let i = 0; i < 12 && $('.debate-opts'); i++) {
    const opts = $$('.debate-opt');
    if (!opts.length) break;
    opts[i % 4].click();
    await wait(5);
    if ($('.modal-foot .btn')) break;
  }
  const cont = $('.modal-foot .btn');
  if (cont) { cont.click(); await wait(30); }
}
if ($('.modal')) { const b = $('.modal-foot .btn') || $('.modal-close'); if (b) { b.click(); await wait(30); } }

// 升级技能并观察
ok(app.st.player.skills.biancai >= 3, '初始技艺等级');

// 舆图与旅行
app.nav('map');
const cityNodes = $$('.map-city');
ok(cityNodes.length >= 16, '舆图城邑');
const other = cityNodes.find(el => el.dataset.city !== app.st.player.cityId);
other.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
await wait();
const travelBtn = $('[data-act="travel"]');
ok(!!travelBtn, '有启程按钮');
if (travelBtn && !travelBtn.disabled) {
  const before = app.st.player.cityId;
  travelBtn.click();
  await wait(60);
  ok(app.st.player.cityId !== before, '旅行后换了城市');
  // 关闭可能出现的月度事件
  for (let i = 0; i < 6 && $('.modal'); i++) {
    const b = $('.modal-foot .btn') || $('.modal-close');
    if (b) { b.click(); await wait(30); }
    const choice = $('.choice-btn');
    if (choice) { choice.click(); await wait(20); }
  }
}

// 交游：拜访同城人物
app.nav('relations');
const visit = $$('[data-npc]').find(b => !b.disabled);
if (visit) {
  visit.click();
  await wait(20);
  ok(!!$('.modal'), '人物弹窗');
  click('[data-act="talk"]');
  await wait(20);
  ok($('.modal-body').textContent.includes('交情'), '交谈反馈');
  click('.modal-close');
  await wait(20);
}

// 存读档
app.nav('save');
click('[data-act="save"]');
await wait();
const raw = localStorage.getItem('chunqiu_lieguozhi_save_v1');
ok(!!raw, '存档写入 localStorage');
const loaded = loadGame();
ok(loaded && loaded.player.name === app.st.player.name, '读档内容一致');

// 直接推进时间，检查事件弹窗不会崩
app.nav('city');
const { advanceDays } = await import('../js/systems/calendar.js');
const res = advanceDays(app.st, 500, {});
if (res.events.length) {
  app.after(res);
  ok(!!$('.modal'), '时间推进后展示事件弹窗');
  // 手动走事件队列
  // 每步只做一个动作：选项 > 结算按钮 > 决斗/辩论出招 > 关闭
  for (let i = 0; i < 500 && ($('.modal') || app.queue.length); i++) {
    if ($('.choice-btn')) { $('.choice-btn').click(); await wait(15); continue; }
    const foot = $('.modal-foot .btn');
    if (foot) { foot.click(); await wait(45); continue; }
    if ($('.move-grid')) {
      const moves = $$('.move-btn');
      if (moves.length) { click(moves[i % 4]); await wait(10); continue; }
    }
    if ($('.debate-opts')) {
      const opts = $$('.debate-opt');
      if (opts.length) { click(opts[i % opts.length]); await wait(10); continue; }
    }
    const x = $('.modal-close');
    if (x) { x.click(); await wait(45); continue; }
    await wait(30);
  }
  if (app.screen === 'ending') ok(true, '寿终后进入结局');
  else ok(!$('.modal') && app.queue.length === 0, '事件弹窗全部结算');
}
ok(app.st.log.length > 3, '纪事有记录');
ok(errors.length === 0, '无运行时错误: ' + errors.slice(0, 3).join(' | '));

console.log(fails === 0 ? '\nUI 全部通过 ✓' : `\nUI 失败 ${fails} 项 ✗`);
if (errors.length) console.log('errors:', errors.slice(0, 5));
process.exit(fails ? 1 : 0);
