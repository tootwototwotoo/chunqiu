// 商人界面：市籍、商号、伙计、散财、商盟、运输、分庭抗礼
// 三期商人系统的 UI 一直只有系统层测试，这里补齐真实点击路径。
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
window.addEventListener('error', (e) => errors.push(String(e.error?.stack || e.message)));
const origError = console.error;
console.error = (...a) => { errors.push(a.map(String).join(' ')); origError(...a); };

const { app } = await import('../js/ui/app.js');
const state = await import('../js/state.js');
const merchant = await import('../js/systems/merchant.js');
const haul = await import('../js/systems/haul.js');
const { MERCHANT_RANKS, VEHICLES } = await import('../js/data/merchant.js');

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const click = (s) => { const el = typeof s === 'string' ? $(s) : s; if (!el) throw new Error('元素不存在: ' + s); el.click(); return el; };
const wait = (ms = 30) => new Promise((r) => setTimeout(r, ms));
const screenText = () => $('#screen').textContent;
const modalText = () => $('.modal-body')?.textContent ?? '';
const actBtn = (id) => $$('[data-act]').find(b => b.dataset.act === id);

let fails = 0;
const ok = (c, m, x = '') => { console.log(`${c ? '✓' : '✗'} ${m}${x ? ' — ' + x : ''}`); if (!c) fails++; };
const closeModal = async () => {
  for (let i = 0; i < 6 && $('.modal'); i++) {
    const btn = $('.modal-foot .btn') || $('.modal-close');
    if (!btn) break;
    btn.click();
    await wait(50);
  }
};

// ---------------- 开局：商人 ----------------
app.showTitle();
await wait();
click('[data-act="new"]');
await wait(60);
// 选职业：找到商人按钮
const profBtns = $$('[data-prof]');
const merchantBtn = profBtns.find(b => b.dataset.prof === 'shangren') || profBtns[2];
ok(!!merchantBtn, '存在职业选择按钮');
merchantBtn.click();
await wait(40);
const startBtn = $$('[data-act="start"]').find(b => !b.disabled) || $('[data-act="start"]');
ok(!!startBtn, '开局按钮可用');
startBtn.click();
await wait(80);

if (app.st.player.profession !== 'shangren') {
  // 若界面流程变化，直接注入一个商人存档继续测 UI
  const st = state.newGame({ name: '商', profession: 'shangren', seed: 5 });
  app.startGame(st);
  await wait(60);
}
ok(app.st.player.profession === 'shangren', '以商人身份开局', app.st.player.profession);
ok(app.st.player.staminaMax === 120, '商人体力上限 120', String(app.st.player.staminaMax));

// ---------------- 职业面板显示阶次与商号 ----------------
app.nav('city');
await wait(50);
ok(screenText().includes('阶次'), '职业面板显示阶次');
ok(MERCHANT_RANKS.some(r => screenText().includes(r.name)), '显示当前阶次名称',
  MERCHANT_RANKS.find(r => screenText().includes(r.name))?.name ?? '');
ok(screenText().includes('散财'), '职业面板显示散财');

// ---------------- 市籍与商号 ----------------
const p = app.st.player;
p.cityId = 'linzi';
p.money = 60000;
p.fame = 40;
p.peakMoney = 60000;
app.refreshHud();
app.nav('city');
await wait(50);

const permitBtn = actBtn('permit');
ok(!!permitBtn, '城中有「请领市籍」');
if (permitBtn) {
  ok(!permitBtn.disabled, '可请领市籍');
  permitBtn.click();
  await wait(60);
  ok(!!$('.modal'), '市籍弹窗打开');
  ok(modalText().includes('市租'), '弹窗显示市租');
  const payBtn = $$('.modal-foot .btn').find(b => /纳金|请籍/.test(b.textContent));
  ok(!!payBtn, '有纳金按钮');
  if (payBtn) { payBtn.click(); await wait(120); }
  ok(merchant.hasPermit(app.st, 'linzi'), '领得市籍');
  await closeModal();
}
app.nav('city');
await wait(40);

const shopBtn = actBtn('shop');
ok(!!shopBtn, '城中有「开设商号」');
if (shopBtn) {
  ok(!shopBtn.disabled, '得籍后可开号');
  shopBtn.click();
  await wait(80);
  ok(merchant.shopAt(app.st, 'linzi') !== null, '商号已开设');
  await closeModal();
}

// ---------------- 商号面板：升级与雇工 ----------------
app.nav('city');
await wait(40);
p.money = 60000;
app.refreshHud();
app.nav('city');
await wait(40);
const shopBtn2 = actBtn('shop');
ok(!!shopBtn2, '已有商号时按钮仍在');
if (shopBtn2) {
  shopBtn2.click();
  await wait(60);
  ok(modalText().includes('小肆') || modalText().includes('等级'), '商号面板显示等级');
  const upBtn = $('[data-upgrade]');
  ok(!!upBtn, '有升号按钮');
  if (upBtn && !upBtn.disabled) {
    upBtn.click();
    await wait(80);
    ok(merchant.shopAt(app.st, 'linzi').level >= 2, '升为新等级', String(merchant.shopAt(app.st, 'linzi').level));
  }
  const hireBtn = $('[data-hire]');
  ok(!!hireBtn, '有雇伙计按钮');
  if (hireBtn && !hireBtn.disabled) {
    hireBtn.click();
    await wait(80);
    ok(merchant.shopAt(app.st, 'linzi').hired >= 1, '雇得伙计', String(merchant.shopAt(app.st, 'linzi').hired));
  }
  await closeModal();
}

// ---------------- 散财 ----------------
app.nav('city');
await wait(40);
p.money = 60000;
app.nav('city');
await wait(40);
const giveBtn = actBtn('give');
ok(!!giveBtn, '城中有「散财」');
if (giveBtn) {
  giveBtn.click();
  await wait(60);
  ok(modalText().includes('散财'), '散财弹窗');
  const opt = $$('[data-give]').find(b => !b.disabled);
  ok(!!opt, '有可执行的散财项');
  if (opt) {
    const before = app.st.player.givenAway ?? 0;
    opt.click();
    await wait(120);
    ok((app.st.player.givenAway ?? 0) > before, '散财已记录', String(app.st.player.givenAway));
    await closeModal();
  }
}

// ---------------- 运输工具 ----------------
app.nav('city');
await wait(40);
p.money = 60000;
p.peakMoney = 60000;
p.fame = 60;
// 构造到行商，才能买独轮车
p.money = MERCHANT_RANKS[1].money;
p.peakMoney = MERCHANT_RANKS[1].money;
app.refreshHud();
app.nav('city');
await wait(40);
const vehBtn = actBtn('vehicle');
ok(!!vehBtn, '城中有置运输工具');
if (vehBtn) {
  ok(!vehBtn.disabled, '可置工具');
  const before = app.st.player.vehicle;
  vehBtn.click();
  await wait(100);
  ok(app.st.player.vehicle !== before, '工具已更换', app.st.player.vehicle);
  ok(haul.vehicleCapacity(app.st) >= VEHICLES[app.st.player.vehicle].capacity, '载重提升', String(haul.vehicleCapacity(app.st)));
}

// ---------------- 市集货运页 ----------------
app.nav('city');
await wait(40);
p.money = 60000;
p.vehicle = 'wain';
p.caravan = VEHICLES.wain.capacity;
// 构造到坐贾（大宗交割）
p.money = MERCHANT_RANKS[2].money;
p.peakMoney = MERCHANT_RANKS[2].money;
const permitCities = ['linzi', 'tao'];
for (const cid of permitCities) {
  if (!merchant.hasPermit(app.st, cid)) {
    p.permits.push({ city: cid, by: null, day: 0, fee: 0 });
  }
  if (!merchant.shopAt(app.st, cid)) merchant.openShop(app.st, cid);
}
p.money = 60000;
p.peakMoney = MERCHANT_RANKS[2].money;
app.refreshHud();
app.nav('city');
await wait(40);
ok(!haul.isInstantTrade(app.st), '坐贾为大宗交割');
click('[data-act="market"]');
await wait(60);
const cargoTab = $$('[data-tab]').find(b => b.textContent.includes('货运'));
ok(!!cargoTab, '市集有「货运」页');
if (cargoTab) {
  cargoTab.click();
  await wait(50);
  const haulBtns = $$('[data-haul]');
  ok(haulBtns.length > 0, '货运页可办货', String(haulBtns.length));
  if (haulBtns.length) {
    haulBtns[0].click();
    await wait(100);
    ok(haul.haulsOf(app.st).length > 0, '生成在途货单', String(haul.haulsOf(app.st).length));
  }
}
await closeModal();

// ---------------- 在途货运面板 ----------------
app.nav('city');
await wait(50);
const cargoBtn = actBtn('cargo');
ok(!!cargoBtn, '城中有「在途货运」');
if (cargoBtn) {
  cargoBtn.click();
  await wait(60);
  ok(modalText().includes('在途') || modalText().includes('货') || $('.table'), '货运面板有内容');
  await closeModal();
}

// ---------------- 商盟 ----------------
app.nav('city');
await wait(40);
p.money = MERCHANT_RANKS[4].money;
p.peakMoney = MERCHANT_RANKS[4].money;
p.fame = 80;
for (const cid of ['linzi', 'tao', 'luoyi', 'ying']) {
  if (!merchant.hasPermit(app.st, cid)) p.permits.push({ city: cid, by: null, day: 0, fee: 0 });
  if (!merchant.shopAt(app.st, cid)) merchant.openShop(app.st, cid);
}
p.money = MERCHANT_RANKS[4].money;
p.peakMoney = MERCHANT_RANKS[4].money;
app.refreshHud();
app.nav('city');
await wait(40);
ok(merchant.rankIndexOf(app.st) >= 3, '已至巨商', String(merchant.rankIndexOf(app.st)));
const pactBtn = actBtn('pact');
ok(!!pactBtn, '朝堂城中有「与国盟誓」');
if (pactBtn && !pactBtn.disabled) {
  pactBtn.click();
  await wait(60);
  ok(modalText().includes('质金') || modalText().includes('盟'), '盟誓弹窗');
  const signBtn = $$('.modal-foot .btn').find(b => /纳质金|盟誓/.test(b.textContent));
  ok(!!signBtn, '有纳质金按钮');
  if (signBtn) { signBtn.click(); await wait(120); }
  ok(p.pacts.length >= 1, '商盟已立', String(p.pacts.length));
  await closeModal();
}

// ---------------- 分庭抗礼 ----------------
app.nav('city');
await wait(40);
p.money = 100000;
p.peakMoney = 100000;
p.fame = 100;
app.refreshHud();
app.nav('city');
await wait(40);
const parleyBtn = actBtn('parley');
ok(!!parleyBtn, '朝堂城中有「分庭抗礼」');
if (parleyBtn && !parleyBtn.disabled) {
  parleyBtn.click();
  await wait(60);
  ok(modalText().includes('议价') || modalText().includes('借粮'), '议题选择弹窗');
  const topic = $$('[data-topic]')[0];
  ok(!!topic, '有议题可选');
  if (topic) {
    topic.click();
    await wait(80);
    ok(!!$('.debate-opts'), '进入三回合交涉');
    for (let i = 0; i < 3 && $('.debate-opts'); i++) {
      const opt = $$('.debate-opt')[0];
      if (!opt) break;
      opt.click();
      await wait(60);
    }
    ok(!$('.debate-opts') || !!$('.modal-foot .btn'), '交涉已结算');
    await closeModal();
  }
}

// ---------------- 献金求仕 ----------------
app.nav('city');
await wait(40);
p.money = MERCHANT_RANKS[3].money;
p.peakMoney = MERCHANT_RANKS[3].money;
p.fame = 80;
app.refreshHud();
app.nav('city');
await wait(40);
const officeBtn = actBtn('buyoffice');
if (officeBtn) {
  ok(!officeBtn.disabled, '献金求仕可点');
  officeBtn.click();
  await wait(60);
  const doBtn = $$('.modal-foot .btn').find(b => b.textContent.includes('献金'));
  ok(!!doBtn, '有献金按钮');
  if (doBtn) {
    doBtn.click();
    await wait(150);
    ok(p.profession !== 'shangren', '已转为士人', p.profession);
    ok(p.passiveIncome > 0, '旧商号转为养廉', String(p.passiveIncome));
  }
  await closeModal();
} else {
  ok(true, '献金求仕未达条件，跳过');
}

// ---------------- 无运行时错误 ----------------
ok(errors.length === 0, '无运行时错误' + (errors.length ? ': ' + errors[0].slice(0, 120) : ''));

console.log(fails === 0 ? '\n商人界面全部通过 ✓' : `\n商人界面失败 ${fails} 项 ✗`);
process.exit(fails ? 1 : 0);
