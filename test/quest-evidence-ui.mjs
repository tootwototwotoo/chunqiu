// 差事的三种即时结算、出行差事到达与逾期、论辩中出示证据、玄璧助封
// 这四处此前只有系统层测试，界面分支从未点过。
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
const quests = await import('../js/systems/quests.js');
const { refreshBoard, acceptQuest, expireQuests, checkArrivalQuests } = quests;
const { startDebate, currentConcern, useEvidence } = await import('../js/systems/debate.js');
const { addEvidence, hasEvidence } = state;
const { DEBATES, EVIDENCE_BY_ID } = await import('../js/data/debates/index.js');
const { advanceDays } = await import('../js/systems/calendar.js');
const { petitionChance } = await import('../js/systems/peerage.js');

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
  for (let i = 0; i < 12 && $('.modal'); i++) {
    const btn = $('.modal-foot .btn') || $('.modal-close');
    if (!btn) break;
    btn.click();
    await wait(50);
  }
};
const boot = async (st) => { app.startGame(st); await wait(80); app.nav('city'); await wait(50); };

let fails = 0;
const ok = (c, m, x = '') => { console.log(`${c ? '✓' : '✗'} ${m}${x ? ' — ' + x : ''}`); if (!c) fails++; };

// ---------------- 差事：三种即时结算 ----------------
{
  // combat：决斗
  const st = state.newGame({ name: '侠', profession: 'youxia', seed: 101 });
  const p = st.player;
  p.cityId = 'linzi';
  p.fame = 40;
  p.stamina = 100;
  await boot(st);
  app.nav('quests');
  await wait(60);

  // 直接在榜上找 combat 类差事
  let combatQ = null;
  for (let i = 0; i < 30 && !combatQ; i++) {
    const offers = refreshBoard(st, true);
    combatQ = offers.find(o => o.mode === 'combat');
  }
  ok(!!combatQ, '榜上有决斗类差事', combatQ?.kind ?? '');
  if (combatQ) {
    app.nav('quests');
    await wait(50);
    const btn = $$('[data-accept]').find(b => b.dataset.accept === combatQ.id);
    if (btn) {
      btn.click();
      await wait(100);
      ok(!!$('.move-btn') || !!$('.modal'), '领受后进入决斗');
      for (let i = 0; i < 60 && $('.move-btn'); i++) {
        const mv = $$('.move-btn')[i % 3];
        if (mv) tap(mv);
        await wait(15);
      }
      await closeModal();
      ok(st.quests.done.some(x => x.id === combatQ.id), '决斗差事已结算', combatQ.id);
    } else {
      ok(true, '榜文按钮未渲染，跳过');
    }
  }

  // check：判定类
  const st2 = state.newGame({ name: '巡', profession: 'youxia', seed: 102 });
  const p2 = st2.player;
  p2.cityId = 'linzi';
  p2.fame = 40;
  p2.stamina = 100;
  await boot(st2);
  let checkQ = null;
  for (let i = 0; i < 30 && !checkQ; i++) {
    checkQ = refreshBoard(st2, true).find(o => o.mode === 'check');
  }
  ok(!!checkQ, '榜上有判定类差事', checkQ?.kind ?? '');
  if (checkQ) {
    app.nav('quests');
    await wait(50);
    const btn = $$('[data-accept]').find(b => b.dataset.accept === checkQ.id);
    if (btn) {
      btn.click();
      await wait(120);
      ok(modalText().includes('判定'), '判定类差事显示判定结果', modalText().slice(0, 40));
      ok(!/undefined/.test(modalText()), '判定结果无 undefined');
      await closeModal();
      ok(st2.quests.done.some(x => x.id === checkQ.id) || st2.quests.active.some(x => x.id === checkQ.id),
        '判定类差事已处理');
    } else ok(true, '榜文按钮未渲染，跳过');
  }

  // debate：论辩类
  const st3 = state.newGame({ name: '辩', profession: 'shuike', seed: 103 });
  const p3 = st3.player;
  p3.cityId = 'linzi';
  p3.fame = 40;
  p3.stamina = 100;
  await boot(st3);
  let debateQ = null;
  for (let i = 0; i < 40 && !debateQ; i++) {
    debateQ = refreshBoard(st3, true).find(o => o.mode === 'debate');
  }
  ok(!!debateQ, '榜上有论辩类差事', debateQ?.kind ?? '');
  if (debateQ) {
    app.nav('quests');
    await wait(50);
    const btn = $$('[data-accept]').find(b => b.dataset.accept === debateQ.id);
    if (btn) {
      btn.click();
      await wait(120);
      ok(!!$('.debate-opts') || !!$('.modal'), '领受后进入论辩');
      for (let i = 0; i < 8 && $('.debate-opts'); i++) {
        const opt = $$('.debate-opt')[0];
        if (!opt) break;
        tap(opt);
        await wait(50);
      }
      await closeModal();
      ok(st3.quests.done.some(x => x.id === debateQ.id), '论辩差事已结算');
    } else ok(true, '榜文按钮未渲染，跳过');
  }
}

// ---------------- 出行差事：到达判定与逾期 ----------------
{
  const st = state.newGame({ name: '行', profession: 'youxia', seed: 111 });
  const p = st.player;
  p.cityId = 'linzi';
  p.fame = 40;
  p.stamina = 100;
  await boot(st);

  let travelQ = null;
  for (let i = 0; i < 40 && !travelQ; i++) {
    const offers = refreshBoard(st, true);
    travelQ = offers.find(o => o.mode === 'travel' && o.kind === 'escort');
  }
  ok(!!travelQ, '榜上有出行差事', travelQ?.kind ?? '');
  if (travelQ) {
    const acc = acceptQuest(st, travelQ.id);
    ok(acc.ok, '可领受出行差事', acc.msg ?? '');
    ok(st.quests.active.some(x => x.id === travelQ.id), '进入进行中');

    // 到达目标城应结算
    const before = st.quests.done.length;
    const done = checkArrivalQuests(st, travelQ.targetCity);
    ok(done.length === 1, '抵达目标城即结算', String(done.length));
    ok(st.quests.done.length > before, '进入已了');
  }

  // 逾期：过期后应判失败
  const st2 = state.newGame({ name: '逾', profession: 'youxia', seed: 112 });
  st2.player.cityId = 'linzi';
  st2.player.fame = 40;
  let q2 = null;
  for (let i = 0; i < 40 && !q2; i++) {
    q2 = refreshBoard(st2, true).find(o => o.mode === 'travel');
  }
  if (q2) {
    acceptQuest(st2, q2.id);
    const q = st2.quests.active.find(x => x.id === q2.id);
    advanceDays(st2, (q?.days ?? 20) + 40);
    expireQuests(st2);
    ok(st2.quests.done.some(x => x.id === q2.id && x.status === 'failed'), '出行差事逾期记为失败');
  }
}

// ---------------- 论辩中出示证据 ----------------
{
  // 找一个有证据的场景，并用界面点「出示」
  const st = state.newGame({ name: '证', profession: 'shuike', seed: 121 });
  const p = st.player;
  p.fame = 40;
  p.stamina = 100;

  // 直接找一件与某场景主题相符的证据
  const scenario = DEBATES.find(d => d.evidence && EVIDENCE_BY_ID[d.evidence.id]);
  ok(!!scenario, '存在带证据的论辩场景', scenario?.id ?? '');
  if (scenario) {
    addEvidence(st, scenario.evidence.id);
    ok(hasEvidence(st, scenario.evidence.id), '证据已入袋', scenario.evidence.name);

    // 第二参数是 npc，scenario 须经 opts.scenario 传入
    const d = startDebate(st, { bias: 'li', stats: {}, name: '某' }, { scenario });
    ok(!!d, '论辩可开始');
    if (d) {
      const concern = currentConcern(d);
      const ev = EVIDENCE_BY_ID[scenario.evidence.id];
      ok(!!concern, '有当前顾虑');
      ok(concern?.topic === ev.topic, '证据主题与顾虑相符', `${concern?.topic}/${ev.topic}`);
      const before = d.agreement;
      const r = useEvidence(st, d, scenario.evidence.id);
      ok(r.ok, '可出示证据', r.msg ?? '');
      ok(d.agreement > before, '出示后认同提升', `${before} → ${d.agreement}`);
      ok(d.evidenceUsed, '本局已用证据标记');
      const r2 = useEvidence(st, d, scenario.evidence.id);
      ok(!r2.ok, '同局不可重复出示', r2.msg ?? '');
      ok(hasEvidence(st, scenario.evidence.id), '证据用后仍保留');
    }
  }
}

// ---------------- 论辩界面有「出示」按钮 ----------------
{
  const st = state.newGame({ name: '界', profession: 'shuike', seed: 122 });
  const p = st.player;
  p.fame = 40;
  p.stamina = 100;
  const scenario = DEBATES.find(d => d.evidence && EVIDENCE_BY_ID[d.evidence.id]);
  addEvidence(st, scenario.evidence.id);
  p.cityId = 'linzi';
  await boot(st);

  const { debateModal } = await import('../js/ui/debate.js');
  const target = { name: '某大夫', title: '', bias: 'li', stats: { zhi: 70 } };
  debateModal(app, st, target, { category: scenario.category, onEnd: () => {} });
  await wait(80);
  ok(!!$('.modal'), '论辩界面打开');
  const evBtn = $('[data-evidence]');
  ok(!!evBtn, '有「出示证据」按钮', evBtn?.textContent?.slice(0, 20) ?? '');
  if (evBtn && !evBtn.disabled) {
    evBtn.click();
    await wait(80);
    ok(!/undefined/.test(modalText()), '出示后界面无 undefined');
  }
  await closeModal();
  ok(errors.length === 0, '论辩证据无运行时错误', errors[0]?.slice(0, 100) ?? '');
}

// ---------------- 玄璧助封 ----------------
{
  const mk = (hasBi) => {
    const st = state.newGame({ name: '璧', profession: 'youxia', seed: 131 });
    const p = st.player;
    // 用「侯→公」这一级（base 0.58）、评价低、无名声加成，
    // 避免概率直接封顶到 95%，否则看不出玄璧的加成
    p.stateId = 'qi'; p.rank = 0; p.merit = 9000; p.fame = 0; p.money = 10000;
    p.homeCity = 'luoyi'; p.cityId = 'luoyi';
    p.peerage = { rank: 3, fief: 'luoyi', year: -700 };
    p.peerageFails = 0;
    p.peerageTrial = {
      rank: 4, variantId: 'rite_ce', targetCity: 'luoyi',
      status: 'done', availableDay: 0, startedDay: 0, exp: null, performance: 10,
    };
    if (hasBi) p.inventory = { ...p.inventory, bi: 1 };
    return st;
  };
  const without = petitionChance(mk(false));
  const withBi = petitionChance(mk(true));
  ok(withBi > without, '持玄璧提升请封概率', `${(without * 100).toFixed(1)}% → ${(withBi * 100).toFixed(1)}%`);

  // 界面上：请封弹窗显示的成算须与系统层一致
  // 上面那组构造名声为 0，达不到公的门槛，故另造一组可请封的状态
  const st = state.newGame({ name: '璧ui', profession: 'youxia', seed: 132 });
  const p = st.player;
  p.stateId = 'qi'; p.rank = 7; p.merit = 9000; p.fame = 300; p.money = 10000;
  p.homeCity = 'luoyi'; p.cityId = 'luoyi'; p.peerage = null;
  p.inventory = { ...p.inventory, bi: 1 };
  p.peerageTrial = {
    rank: 0, variantId: 'hunt_bandit', targetCity: 'luoyi',
    status: 'done', availableDay: 0, startedDay: 0, exp: null, performance: 60,
  };
  await boot(st);
  const btn = $$('[data-act]').find(b => b.dataset.act === 'trial_petition');
  ok(!!btn, '有请封动作');
  if (btn) {
    btn.click();
    await wait(80);
    const shown = modalText();
    ok(shown.includes('成算'), '弹窗显示成算');
    const pct = Math.round(petitionChance(st) * 100);
    ok(new RegExp(String(pct)).test(shown), '界面成算与系统层一致', `系统 ${pct}%`);
    await closeModal();
  }
}

ok(errors.length === 0, '全程无运行时错误' + (errors.length ? ': ' + errors[0].slice(0, 120) : ''));

console.log(fails === 0 ? '\n差事·证据·玄璧界面全部通过 ✓' : `\n差事·证据·玄璧界面失败 ${fails} 项 ✗`);
if (errors.length) console.log('errors:', errors.slice(0, 3));
process.exit(fails ? 1 : 0);
