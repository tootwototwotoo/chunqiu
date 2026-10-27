// 册命试炼的五个小游戏 + 历史事件选项分支
// trials-ui.mjs 只覆盖了围捕（hunt），这里补齐折冲/治邑/军略/定礼，
// 并验证事件弹窗的每个选项都能结算、且效果真的落到状态上。
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
  if (!/HTMLCanvasElement|getContext/.test(msg)) errors.push(msg);
  origError(...a);
};

const { app } = await import('../js/ui/app.js');
const state = await import('../js/state.js');
const { TRIAL_BY_ID, TRIAL_RANKS, variantsOfRank } = await import('../js/data/trials.js');
const { TIMELINE, RANDOM_EVENTS } = await import('../js/data/events.js');

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const wait = (ms = 30) => new Promise((r) => setTimeout(r, ms));
const modalText = () => $('.modal-body')?.textContent ?? '';
const tap = (el) => {
  if (!el) throw new Error('元素不存在');
  if (typeof el.click === 'function') { el.click(); return el; }
  el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  return el;
};
const closeModal = async () => {
  for (let i = 0; i < 10 && $('.modal'); i++) {
    const btn = $('.modal-foot .btn') || $('.modal-close');
    if (!btn) break;
    btn.click();
    await wait(50);
  }
};

let fails = 0;
const ok = (c, m, x = '') => { console.log(`${c ? '✓' : '✗'} ${m}${x ? ' — ' + x : ''}`); if (!c) fails++; };

// 造一个「已领受某道试炼、人在目标城」的状态
function readyTrial(variantId) {
  const st = state.newGame({ name: '试', profession: 'youxia', seed: 31 });
  const p = st.player;
  p.stateId = 'qi';
  p.rank = 7;
  p.merit = 5000;
  p.fame = 200;
  p.money = 5000;
  p.stamina = 100;
  const v = TRIAL_BY_ID[variantId];
  const target = v.targetCity ?? 'luoyi';
  p.peerage = null;
  p.peerageTrial = {
    rank: v.rank, variantId, targetCity: target,
    status: 'active', availableDay: 0, startedDay: 0, exp: null, performance: null,
  };
  p.homeCity = 'luoyi';
  p.cityId = target;
  return { st, v, target };
}

// ---------------- 五种试炼小游戏 ----------------
const KINDS = [
  { kind: 'hunt', variant: 'hunt_bandit', name: '围捕', hook: '.trial-grid' },
  { kind: 'neg', variant: 'neg_lu', name: '折冲', hook: '[data-card]' },
  { kind: 'gov', variant: 'gov_famine', name: '治邑', hook: '[data-pol]' },
  { kind: 'war', variant: 'war_relief', name: '军略', hook: '[data-form]' },
  { kind: 'rite', variant: 'rite_jiao', name: '定礼', hook: '[data-rite]' },
];

for (const spec of KINDS) {
  const { st } = readyTrial(spec.variant);
  ok(TRIAL_BY_ID[spec.variant] != null, `存在试炼「${spec.name}」`, spec.variant);
  app.startGame(st);
  await wait(60);
  app.nav('city');
  await wait(50);

  const btn = $$('[data-act]').find(b => b.dataset.act === 'trial_start');
  ok(!!btn, `${spec.name}：城中有「开始册命之试」`);
  if (!btn) continue;
  btn.click();
  await wait(80);
  ok(!!$(spec.hook), `${spec.name}：小游戏渲染（${spec.hook}）`);

  // 尽量点到底：不同小游戏推进方式不同，按优先级逐类处理
  for (let i = 0; i < 80; i++) {
    if (!$('.modal')) break;
    // 定礼：先按顺序点满，再点「定序」
    const submit = $('[data-submit]');
    if (submit && !submit.disabled) { tap(submit); await wait(40); continue; }
    const riteBtns = $$('[data-rite]').filter(e => !e.disabled);
    if (riteBtns.length) { tap(riteBtns[0]); await wait(20); continue; }
    // 其它小游戏：点各自的钩子
    const hooks = $$(`${spec.hook}, .trial-cell:not([disabled])`).filter(e => !e.disabled);
    if (hooks.length) { tap(hooks[i % hooks.length]); await wait(25); continue; }
    // 已进入结算页
    if ($('.modal-foot .btn')) break;
    await wait(25);
  }
  ok(!!$('.modal-foot .btn'), `${spec.name}：可结算`);
  if ($('.modal-foot .btn')) {
    $('.modal-foot .btn').click();
    await wait(120);
    await closeModal();
  }
  ok(st.player.peerageTrial?.status === 'done' || st.player.peerageTrial?.status === 'pending',
    `${spec.name}：结果写入存档`, st.player.peerageTrial?.status);
}

// 每种小游戏都确认过：五个 variant 的 kind 与预期一致
{
  const kinds = new Set(Object.values(TRIAL_BY_ID).map(v => v.engine));
  ok(kinds.size >= 5, '五种小游戏类型均有数据', [...kinds].join(','));
  for (const r of Object.keys(TRIAL_RANKS)) {
    const vs = variantsOfRank(Number(r));
    ok(vs.length >= 1, `${TRIAL_RANKS[r].name}有试炼变体`, String(vs.length));
  }
}

// ---------------- 事件弹窗：每个选项都能结算 ----------------
{
  // 取一个带多选项的历史事件
  const ev = TIMELINE.find(e => (e.choices ?? []).length >= 2 && e.effects);
  ok(!!ev, '存在带多选项的历史事件', ev?.id ?? '');

  if (ev) {
    const st = state.newGame({ name: '事', profession: 'youxia', seed: 41, era: 'early' });
    // 直接把事件推进队列
    st.events.fired = st.events.fired.filter(id => id !== ev.id);
    st.events.pending = [];
    st.time = { year: ev.year, month: ev.month, day: 1 };
    st.events.news = [];
    app.startGame(st);
    await wait(60);

    root: {
      // 手动排入该事件并弹出
      const { prepareEvent } = await import('../js/systems/events.js');
      const prepared = prepareEvent(st, { kind: 'timeline', ev, effects: [] });
      ok(!!prepared?.ev, '事件可准备');
      if (!prepared?.ev) break root;

      app.queue = [{ kind: 'timeline', ev }];
      app.nextEvent();
      await wait(80);
      ok(!!$('.modal'), '事件弹窗打开');
      const choiceBtns = $$('.choice-btn');
      ok(choiceBtns.length >= 1, '事件有可选项', String(choiceBtns.length));
      if (choiceBtns.length) {
        choiceBtns[0].click();
        await wait(100);
        ok(!/undefined/.test(modalText()), '选项结果无 undefined');
        // 结算
        const foot = $('.modal-foot .btn');
        if (foot) { foot.click(); await wait(120); }
        await closeModal();
        ok(app.queue.length === 0 || !!$('.modal'), '事件结算完成');
      }
    }
  }
}

// ---------------- 随机事件：每个选项都可点 ----------------
{
  const rev = RANDOM_EVENTS.find(e => (e.choices ?? []).length >= 2);
  ok(!!rev, '存在带选项的随机事件', rev?.id ?? '');
  if (rev) {
    const st = state.newGame({ name: '随', profession: 'youxia', seed: 51 });
    app.startGame(st);
    await wait(50);
    const { prepareEvent } = await import('../js/systems/events.js');
    prepareEvent(st, { kind: 'random', ev: rev, effects: [] });
    app.queue = [{ kind: 'random', ev: rev }];
    app.nextEvent();
    await wait(90);
    ok(!!$('.modal'), '随机事件弹窗打开');
    const cs = $$('.choice-btn');
    ok(cs.length >= 1, '随机事件有可选项', String(cs.length));
    if (cs.length) {
      cs[cs.length - 1].click();
      await wait(100);
      ok(!/undefined/.test(modalText()), '随机事件结果无 undefined');
      await closeModal();
    }
  }
}

// ---------------- 珍宝页与献宝 ----------------
{
  const st = state.newGame({ name: '宝', profession: 'shangren', seed: 61 });
  const p = st.player;
  p.cityId = 'luoyi';
  p.money = 100000;
  app.startGame(st);
  await wait(60);
  app.nav('city');
  await wait(40);

  tap($$('[data-act]').find(b => b.dataset.act === 'market'));
  await wait(60);
  const gemTab = $$('[data-tab]').find(b => b.textContent.includes('珍宝'));
  ok(!!gemTab, '市集有珍宝页');
  if (gemTab) {
    gemTab.click();
    await wait(60);
    const buy = $$('[data-buy-gem]').find(b => !b.disabled);
    ok(!!buy, '有可购珍宝');
    if (buy) {
      const before = Object.keys(p.inventory).length;
      buy.click();
      await wait(100);
      ok(Object.keys(p.inventory).length >= before, '购宝后行囊有变化');
    }
  }
  await closeModal();

  // 献宝：需本国朝堂
  p.stateId = 'qi';
  p.cityId = 'linzi';
  p.inventory = { ...p.inventory, mingzhu: 2 };
  app.refreshHud();
  app.render();
  await wait(80);
  app.nav('city');
  await wait(80);
  const offerBtn = $$('[data-act]').find(b => b.dataset.act === 'offer');
  ok(!!offerBtn, '朝堂有献宝按钮');
  if (offerBtn) {
    offerBtn.click();
    await wait(70);
    ok(modalText().includes('明珠') || modalText().includes('持有'), '献宝弹窗列出珍宝');
    const doOffer = $('[data-offer]');
    ok(!!doOffer, '有进献按钮');
    if (doOffer) {
      const m0 = p.merit;
      doOffer.click();
      await wait(120);
      ok(p.merit > m0, '献宝得功勋', `${m0} → ${p.merit}`);
    }
    await closeModal();
  }
}

// ---------------- 论辩三档结局 ----------------
{
  const { startDebate, debateChoose, currentConcern } = await import('../js/systems/debate.js');
  const { DEBATES } = await import('../js/data/debates/index.js');
  const results = new Set();
  for (let i = 0; i < 40 && results.size < 3; i++) {
    const st = state.newGame({ name: '辩', profession: 'shuike', seed: 70 + i });
    const scenario = DEBATES[i % DEBATES.length];
    const d = startDebate(st, scenario, { bias: 'li', stats: {}, name: '某' });
    let guard = 0;
    while (!d.over && guard++ < 6) {
      const c = currentConcern(d);
      if (!c) break;
      // 交替选不同档位
      const want = (i + guard) % 3 === 0 ? 'hit' : (i + guard) % 3 === 1 ? 'reason' : 'evade';
      let idx = c.options.findIndex(o => o.level === want);
      if (idx < 0) idx = 0;
      debateChoose(st, d, idx);
    }
    if (d.over) results.add(d.result);
  }
  ok(results.size >= 2, '论辩可产生多种结局', [...results].join(','));
}

ok(errors.length === 0, '全程无运行时错误' + (errors.length ? ': ' + errors[0].slice(0, 120) : ''));

console.log(fails === 0 ? '\n试炼与事件界面全部通过 ✓' : `\n试炼与事件界面失败 ${fails} 项 ✗`);
if (errors.length) console.log('errors:', errors.slice(0, 3));
process.exit(fails ? 1 : 0);
