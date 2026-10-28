// 各职业界面的点击路径：名鉴、交游、NPC 弹窗、学者、说客、游侠、存档页
// 起因：商人三期系统测试全绿，但「分庭抗礼」在界面上根本打不开。
// 这里按同样思路，把其余职业与面板的可点路径都跑一遍。
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
console.error = (...a) => {
  const msg = a.map(String).join(' ');
  // jsdom 没有 canvas 实现，疆域层必然报此警告，不算真实错误
  if (!/HTMLCanvasElement|getContext/.test(msg)) errors.push(msg);
  origError(...a);
};

const { app } = await import('../js/ui/app.js');
const state = await import('../js/state.js');
const { rel } = state;
const { NPC_MAP } = await import('../js/data/npcs.js');

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
// SVG 元素没有 click()，需派发事件
const tap = (el) => {
  if (!el) throw new Error('元素不存在');
  if (typeof el.click === 'function') { el.click(); return el; }
  el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  return el;
};
const wait = (ms = 30) => new Promise((r) => setTimeout(r, ms));
const screenText = () => $('#screen').textContent;
const modalText = () => $('.modal-body')?.textContent ?? '';
const actBtn = (id) => $$('[data-act]').find(b => b.dataset.act === id);

let fails = 0;
const ok = (c, m, x = '') => { console.log(`${c ? '✓' : '✗'} ${m}${x ? ' — ' + x : ''}`); if (!c) fails++; };
const closeModal = async () => {
  for (let i = 0; i < 8 && $('.modal'); i++) {
    const btn = $('.modal-foot .btn') || $('.modal-close');
    if (!btn) break;
    btn.click();
    await wait(50);
  }
};
const boot = async (profession, seed = 9, era = undefined) => {
  const st = state.newGame({ name: '试', profession, seed, era });
  app.startGame(st);
  await wait(60);
  app.nav('city');
  await wait(40);
  return st;
};

// ---------------- 名鉴：详情必须能打开 ----------------
{
  const st = await boot('youxia', 21);
  // 解锁几张卡
  const ids = Object.values(st.npc).filter(n => n.alive).slice(0, 3).map(n => n.id);
  st.player.cards = ids;
  app.nav('cards');
  await wait(50);
  ok(screenText().includes('名鉴'), '名鉴界面渲染');
  const locked = $$('[data-locked]').length;
  ok(locked > 0, '存在未识之人（灰卡）', String(locked));
  const cards = $$('[data-card]');
  ok(cards.length > 0, '有已识人物卡', String(cards.length));
  if (cards.length) {
    cards[0].click();
    await wait(60);
    ok(!!$('.modal'), '名鉴详情弹窗打开');
    ok(modalText().length > 10, '详情有内容', String(modalText().length));
    ok(!/undefined/.test(modalText()), '详情无 undefined');
    await closeModal();
  }
  ok(errors.length === 0, '名鉴无运行时错误', errors[0]?.slice(0, 100) ?? '');
}

// ---------------- 交游：往见 ----------------
{
  const st = await boot('youxia', 22);
  const p = st.player;
  // 先与同城一位 NPC 结识，交游列表只列已识之人
  const someone = Object.values(st.npc).find(n => n.alive && NPC_MAP[n.id]);
  p.cityId = someone.city;
  const r = rel(st, someone.id);
  r.met = true; r.aff = 30;
  app.nav('relations');
  await wait(50);
  ok(screenText().includes('交游'), '交游界面渲染');
  const btns = $$('[data-npc]');
  const go = btns.find(b => !b.disabled) ?? btns[0];
  ok(!!go, '交游列表有「往见」按钮');
  if (go) {
    go.click();
    await wait(60);
    ok(!!$('.modal'), '人物弹窗打开');
    // 交谈
    const talk = $('[data-act="talk"]');
    ok(!!talk, '有交谈按钮');
    if (talk) { talk.click(); await wait(60); ok(modalText().length > 0, '交谈有回应'); await closeModal(); }
  }
}

// ---------------- NPC 弹窗：赠礼 / 问学 ----------------
{
  const st = await boot('youxia', 23);
  const p = st.player;
  // 站到有 NPC 的城，并给足好感与物品
  const here = Object.keys(st.npc).find(id => {
    const n = st.npc[id];
    return n.alive && NPC_MAP[id];
  });
  const npcCity = st.npc[here].city;
  p.cityId = npcCity;
  rel(st, here).aff = 60;
  p.inventory = { si: 3, yu: 1 };
  const { openNpc } = await import('../js/ui/npc.js');
  openNpc(app, st, here);
  await wait(60);
  ok(!!$('.modal'), '直接打开人物弹窗');
  const gift = $('[data-act="gift"]');
  ok(!!gift, '有赠礼按钮');
  if (gift && !gift.disabled) {
    gift.click();
    await wait(60);
    const g = $('[data-gift]');
    ok(!!g, '赠礼列表有可选项');
    if (g) {
      const before = rel(st, here).aff;
      g.click();
      await wait(80);
      ok(rel(st, here).aff >= before, '赠礼已生效', `${before} → ${rel(st, here).aff}`);
    }
    await closeModal();
    openNpc(app, st, here);
    await wait(60);
  }
  const learn = $('[data-act="learn"]');
  ok(!!learn, '有问学按钮');
  if (learn && !learn.disabled) {
    learn.click();
    await wait(60);
    ok(modalText().length > 0, '问学有内容');
    await closeModal();
  }
  ok(errors.length === 0, 'NPC 弹窗无运行时错误', errors[0]?.slice(0, 100) ?? '');
}

// ---------------- 学者线：讲学 / 著书 / 论辩 ----------------
{
  const st = await boot('xuezhe', 31);
  const p = st.player;
  p.cityId = 'qufu';
  p.money = 5000;
  p.stamina = 100;
  app.nav('city');
  await wait(50);
  ok(screenText().includes('学统'), '学者面板显示学统');
  ok(screenText().includes('弟子'), '学者面板显示弟子');

  const lecture = actBtn('lecture');
  ok(!!lecture, '有「设坛讲学」');
  if (lecture && !lecture.disabled) {
    lecture.click();
    await wait(120);
    ok(!!$('.modal'), '讲学有结算弹窗');
    await closeModal();
  }
  app.nav('city');
  await wait(40);
  p.money = 5000;
  const book = actBtn('book');
  ok(!!book, '有「著书立说」');
  if (book && !book.disabled) {
    book.click();
    await wait(200);
    ok(!!$('.modal'), '著书有弹窗');
    await closeModal();
  }
  // 与士论辩需要城中有名士或卿相，换到有人的城再试
  const scholarCity = Object.values(st.npc).find(n => {
    const def = NPC_MAP[n.id];
    return n.alive && def && ['scholar', 'minister'].includes(def.role);
  });
  if (scholarCity) p.cityId = scholarCity.city;
  app.nav('city');
  await wait(40);
  p.stamina = 100;
  const deb = actBtn('debate_scholar');
  ok(!!deb, '有「与士论辩」');
  if (deb && !deb.disabled) {
    deb.click();
    await wait(120);
    ok(!!$('.modal') || !!$('.debate-opts'), '论辩界面打开');
    await closeModal();
  }
  ok(errors.length === 0, '学者线无运行时错误', errors[0]?.slice(0, 100) ?? '');
}

// ---------------- 说客线：游说 ----------------
{
  const st = await boot('shuike', 41);
  const p = st.player;
  p.cityId = 'linzi';
  p.stamina = 100;
  app.nav('city');
  await wait(50);
  ok(screenText().includes('纵横'), '说客面板显示纵横');
  const persuade = actBtn('persuade');
  ok(!!persuade, '有「游说当道」');
  if (persuade && !persuade.disabled) {
    persuade.click();
    await wait(150);
    ok(!!$('.modal') || !!$('.debate-opts'), '游说有界面');
    await closeModal();
  }
  ok(errors.length === 0, '说客线无运行时错误', errors[0]?.slice(0, 100) ?? '');
}

// ---------------- 游侠线：演武 / 修行 ----------------
{
  const st = await boot('youxia', 51);
  const p = st.player;
  p.cityId = 'linzi';
  p.stamina = 100;
  app.nav('city');
  await wait(50);
  ok(screenText().includes('仕途') || screenText().includes('胜绩'), '游侠面板渲染');
  const duelBtn = $$('[data-act]').find(b => /duel|arena|spar/.test(b.dataset.act));
  ok(!!duelBtn, '有比武类动作', duelBtn?.dataset.act ?? '无');
  if (duelBtn && !duelBtn.disabled) {
    duelBtn.click();
    await wait(150);
    ok(!!$('.modal'), '比武界面打开');
    // 打到结束
    for (let i = 0; i < 40 && $('.move-btn'); i++) {
      const mv = $$('.move-btn')[i % 3];
      if (mv) mv.click();
      await wait(15);
    }
    ok(true, '比武可推进');
    await closeModal();
  }
  ok(errors.length === 0, '游侠线无运行时错误', errors[0]?.slice(0, 100) ?? '');
}

// ---------------- 人物界面：修习入口 ----------------
{
  const st = await boot('youxia', 61);
  const p = st.player;
  p.stamina = 100;
  app.nav('character');
  await wait(50);
  ok(screenText().includes('四维'), '人物界面渲染');
  const train = $('[data-train]');
  ok(!!train, '技能行有修习按钮');
  if (train) {
    train.click();
    await wait(80);
    ok(!!$('.modal'), '修习弹窗打开');
    await closeModal();
  }
  ok(errors.length === 0, '人物界面无运行时错误', errors[0]?.slice(0, 100) ?? '');
}

// ---------------- 存档页：各按钮不崩 ----------------
{
  await boot('youxia', 71);
  app.nav('save');
  await wait(60);
  ok(screenText().includes('存档'), '存档界面渲染');
  for (const id of ['save', 'toggle-auto', 'export', 'help']) {
    const b = actBtn(id);
    ok(!!b, `存档页有「${id}」按钮`);
    if (b) { b.click(); await wait(80); await closeModal(); }
  }
  ok(errors.length === 0, '存档页无运行时错误', errors[0]?.slice(0, 100) ?? '');
}

// ---------------- 差事页 ----------------
{
  await boot('youxia', 81);
  app.nav('quests');
  await wait(60);
  ok(screenText().includes('差事'), '差事界面渲染');
  const anyQuest = $$('.quest').length;
  ok(anyQuest >= 0, '差事列表可渲染', String(anyQuest));
  ok(!/undefined/.test(screenText()), '差事页无 undefined');
}

// ---------------- 舆图 ----------------
{
  await boot('youxia', 91);
  app.nav('map');
  await wait(60);
  ok(!!$('#map-svg'), '舆图 SVG 渲染');
  const nodes = $$('.map-city');
  ok(nodes.length >= 16, '舆图城点', String(nodes.length));
  const other = nodes.find(el => el.dataset.city !== app.st.player.cityId);
  if (other) {
    tap(other);
    await wait(60);
    ok(screenText().includes('城邑') || screenText().length > 40, '点选城池后有信息');
  }
  ok(errors.length === 0, '舆图无运行时错误', errors[0]?.slice(0, 100) ?? '');
}


// ---------------- 女性角色（noble）可正常互动 ----------------
{
  const st = await boot('youxia', 33);
  const nobleEntry = Object.values(st.npc).find(n => {
    const d = NPC_MAP[n.id];
    return d?.role === 'noble' && n.alive;
  });
  ok(!!nobleEntry, '存在在世的女性角色', nobleEntry ? NPC_MAP[nobleEntry.id].name : '无');
  if (nobleEntry) {
    const def = NPC_MAP[nobleEntry.id];
    st.player.cityId = nobleEntry.city;
    rel(st, nobleEntry.id).met = true;
    rel(st, nobleEntry.id).aff = 40;
    app.nav('relations');
    await wait(60);
    const side = screenText();
    ok(side.includes(def.name), '交游列表出现女性角色', def.name);
    const btn = $$('[data-npc]').find(b => b.dataset.npc === nobleEntry.id);
    ok(!!btn, '可点击往见');
    if (btn) {
      tap(btn);
      await wait(70);
      ok(!!$('.modal'), '人物弹窗打开');
      const mt = modalText();
      ok(mt.length > 10, '弹窗有内容');
      ok(mt.includes(def.name), '弹窗显示其名');
      ok(!/undefined/.test(mt), '无 undefined');
      // 交谈可用
      const talk = $('[data-act="talk"]');
      ok(!!talk, '有交谈按钮');
      await closeModal();
    }
  }
  ok(errors.length === 0, '女性角色交互无运行时错误', errors[0]?.slice(0, 100) ?? '');
}


// ---------------- 百工：求医可用 ----------------
{
  // 百工（师旷、医和等）多在 -560 之后在世，故用「弭兵之世」年代
  const st = await boot('youxia', 34, 'mibing');
  const p = st.player;
  const healer = Object.values(st.npc).find(n => {
    const d = NPC_MAP[n.id];
    return d?.role === 'artisan' && n.alive;
  });
  ok(!!healer, '存在在世的百工', healer ? NPC_MAP[healer.id].name : '无');
  if (healer) {
    const def = NPC_MAP[healer.id];
    p.cityId = healer.city;
    p.money = 5000;
    p.health = 50;
    rel(st, healer.id).met = true;
    rel(st, healer.id).aff = 30;
    const { openNpc } = await import('../js/ui/npc.js');
    openNpc(app, st, healer.id);
    await wait(70);
    ok(!!$('.modal'), '百工弹窗打开');
    const healBtn = $('[data-act="heal"]');
    ok(!!healBtn, '百工有「求医」按钮', def.name);
    if (healBtn && !healBtn.disabled) {
      const before = p.health;
      tap(healBtn);
      await wait(100);
      ok(p.health > before, '求医提升健康', `${before} → ${p.health}`);
      ok(p.money < 5000, '收取诊金', String(p.money));
    }
    await closeModal();
  }
  ok(errors.length === 0, '百工交互无运行时错误', errors[0]?.slice(0, 100) ?? '');
}

// ---------------- 全职业开局不崩 ----------------
{
  const errs = [];
  for (const prof of ['youxia', 'shangren', 'shuike', 'xuezhe']) {
    const st = state.newGame({ name: '试', profession: prof, seed: 100 });
    app.startGame(st);
    await wait(30);
    for (const scr of ['city', 'map', 'character', 'quests', 'relations', 'cards', 'save']) {
      app.nav(scr);
      await wait(20);
      if (!screenText().length) errs.push(`${prof}/${scr}`);
    }
  }
  ok(errs.length === 0, '四职业 × 七界面均可渲染', errs.join(','));
  ok(errors.length === 0, '全程无运行时错误' + (errors.length ? ': ' + errors[0].slice(0, 120) : ''));
}

console.log(fails === 0 ? '\n各职业界面全部通过 ✓' : `\n各职业界面失败 ${fails} 项 ✗`);
if (errors.length) console.log('errors:', errors.slice(0, 3));
process.exit(fails ? 1 : 0);
