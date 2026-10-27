// 献宝多件、册命请封、合成国君廷对
// 这三处此前只有系统层测试，界面入口从未点过。
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
const { audienceRuler, audienceHeart, startAudience } = await import('../js/systems/audience.js');
const { canPetition, peerageSummary } = await import('../js/systems/peerage.js');
const { TRIAL_BY_ID } = await import('../js/data/trials.js');
const { NPC_MAP } = await import('../js/data/npcs.js');
const { STATES } = await import('../js/data/world.js');

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const wait = (ms = 30) => new Promise((r) => setTimeout(r, ms));
const modalText = () => $('.modal-body')?.textContent ?? '';
const closeModal = async () => {
  for (let i = 0; i < 10 && $('.modal'); i++) {
    const btn = $('.modal-foot .btn') || $('.modal-close');
    if (!btn) break;
    btn.click();
    await wait(50);
  }
};
const boot = async (st) => { app.startGame(st); await wait(80); app.nav('city'); await wait(50); };

let fails = 0;
const ok = (c, m, x = '') => { console.log(`${c ? '✓' : '✗'} ${m}${x ? ' — ' + x : ''}`); if (!c) fails++; };

// ---------------- 献宝：多件珍宝逐件进献 ----------------
{
  const st = state.newGame({ name: '宝', profession: 'shangren', seed: 11 });
  const p = st.player;
  p.stateId = 'qi';
  p.cityId = 'linzi';
  p.money = 100000;
  // 三件不同珍宝，各 2 个
  p.inventory = { yu: 2, mingzhu: 2, shan: 2 };
  await boot(st);

  const offerBtn = $$('[data-act]').find(b => b.dataset.act === 'offer');
  ok(!!offerBtn, '朝中有献宝入口');
  if (offerBtn) {
    offerBtn.click();
    await wait(70);
    const rows = $$('[data-offer]');
    ok(rows.length >= 3, '列出多件珍宝', String(rows.length));

    // 逐件进献，每次都应留在弹窗内（因为还有存货）
    const m0 = p.merit;
    const f0 = p.fame;
    let done = 0;
    for (let i = 0; i < 3; i++) {
      const btn = $$('[data-offer]')[0];
      if (!btn) break;
      btn.click();
      await wait(120);
      done++;
      if (!$('.modal')) break;
    }
    ok(done >= 3, '可连续进献三件', String(done));
    ok(p.merit > m0, '献宝累加功勋', `${m0} → ${p.merit}`);
    ok(p.fame > f0, '献宝累加名声', `${f0} → ${p.fame}`);
    ok((p.inventory.yu ?? 0) < 2 || (p.inventory.mingzhu ?? 0) < 2 || (p.inventory.shan ?? 0) < 2,
      '珍宝确有消耗');
    await closeModal();
  }
}

// ---------------- 献宝：玄璧的抉择提示 ----------------
{
  const st = state.newGame({ name: '璧', profession: 'youxia', seed: 12 });
  const p = st.player;
  p.stateId = 'qi';
  p.cityId = 'linzi';
  p.inventory = { bi: 1 };
  await boot(st);
  const offerBtn = $$('[data-act]').find(b => b.dataset.act === 'offer');
  if (offerBtn) {
    offerBtn.click();
    await wait(70);
    ok(modalText().includes('玄璧'), '弹窗提示玄璧另有册命之用', modalText().slice(0, 60));
    // 只献玄璧：应因无存货而关闭弹窗并结算
    const bi = $$('[data-offer]')[0];
    if (bi) {
      bi.click();
      await wait(150);
      ok((p.inventory.bi ?? 0) === 0, '玄璧已献出');
    }
    await closeModal();
  } else {
    ok(false, '应能献宝');
  }
}

// ---------------- 册命请封 ----------------
{
  const st = state.newGame({ name: '封', profession: 'youxia', seed: 21 });
  const p = st.player;
  p.stateId = 'qi';
  p.rank = 7;
  p.merit = 9000;
  p.fame = 300;
  p.money = 10000;
  p.homeCity = 'luoyi';
  p.cityId = 'luoyi';
  p.peerage = null;
  // 构造「试炼已成」状态
  const v = TRIAL_BY_ID.hunt_bandit;
  p.peerageTrial = {
    rank: v.rank, variantId: v.id, targetCity: 'luoyi',
    status: 'done', availableDay: 0, startedDay: 0, exp: null, performance: 80,
  };
  await boot(st);

  const chk = canPetition(st);
  ok(chk.ok, '条件齐备可请封', chk.msg ?? '');
  const btn = $$('[data-act]').find(b => b.dataset.act === 'trial_petition');
  ok(!!btn, '洛邑有「请封于周」动作');
  if (btn) {
    btn.click();
    await wait(70);
    ok(modalText().includes('成算'), '请封弹窗显示成算');
    ok(/评价/.test(modalText()), '显示试炼评价');
    const doBtn = $$('.modal-foot .btn').find(b => b.textContent.includes('请封'));
    ok(!!doBtn, '有请封按钮');
    if (doBtn) {
      const before = peerageSummary(st).fails;
      const money0 = p.money;
      doBtn.click();
      await wait(150);
      // 成功或失败都会消耗贽礼
      ok(p.money !== money0 || p.peerage !== null, '请封产生结果',
        `金 ${money0} → ${p.money}，爵 ${p.peerage ? '已封' : '未封'}`);
      ok(peerageSummary(st).fails >= before, '未准次数记录正确');
      await closeModal();
    }
  }
  ok(errors.length === 0, '请封无运行时错误', errors[0]?.slice(0, 100) ?? '');
}

// ---------------- 请封五次的保底 ----------------
{
  const st = state.newGame({ name: '保', profession: 'youxia', seed: 22 });
  const p = st.player;
  p.stateId = 'qi'; p.rank = 7; p.merit = 9000; p.fame = 300; p.money = 100000;
  p.homeCity = 'luoyi'; p.cityId = 'luoyi'; p.peerage = null;
  p.peerageFails = 5;
  p.peerageTrial = {
    rank: 0, variantId: 'hunt_bandit', targetCity: 'luoyi',
    status: 'done', availableDay: 0, startedDay: 0, exp: null, performance: 60,
  };
  const s = peerageSummary(st);
  ok(s.guarantee === true, '五次未准后标记必得', String(s.guarantee));
  const res = (await import('../js/systems/peerage.js')).petition(st);
  ok(res.ok && res.success, '保底请封必成', res.msg ?? '');
  ok(st.player.peerage !== null, '已受封爵位');
}

// ---------------- 合成国君的廷对 ----------------
{
  // 找出没有真国君的国家
  const st = state.newGame({ name: '朝', profession: 'youxia', era: 'early', seed: 31 });
  const noRuler = [];
  for (const sid of Object.keys(STATES)) {
    const r = audienceRuler(st, sid);
    const real = r && NPC_MAP[r.id]?.role === 'ruler';
    if (!real) noRuler.push({ sid, r });
  }
  ok(noRuler.length > 0, '存在缺真国君的国家', noRuler.map(x => x.sid).join(','));

  for (const { sid, r } of noRuler.slice(0, 4)) {
    ok(!!r, `${sid} 有可用国君对象`);
    ok(!!r?.name, `${sid} 国君有名号`, r?.name);
    ok(!!r?.bias, `${sid} 国君有心性`, r?.bias);
    const heart = audienceHeart(st, sid);
    ok(!!heart, `${sid} 心性可取`, heart);
  }

  // 合成国君也能走完整廷对
  const target = noRuler[0];
  if (target) {
    const p = st.player;
    p.fame = 200;
    p.money = 5000;
    p.cityId = 'luoyi';
    for (let i = 0; i < 4; i++) st.quests.done.push({ id: `q${i}`, title: `差事${i}`, status: 'done', reward: {} });
    const a = startAudience(st, target.sid);
    ok(a.ok !== false, '合成国君可开始廷对', a.msg ?? '');
    ok(!!a.rulerName, '廷对有国君名', a.rulerName);
    ok(a.questions?.length === 3, '三道题目', String(a.questions?.length));
  }
}

// ---------------- 小国廷对的界面流程 ----------------
{
  const st = state.newGame({ name: '廷', profession: 'youxia', era: 'early', seed: 32 });
  const p = st.player;
  p.fame = 200; p.money = 5000; p.stamina = 100;
  for (let i = 0; i < 4; i++) st.quests.done.push({ id: `q${i}`, title: `差事${i}`, status: 'done', reward: {} });
  // 洛邑是朝堂城，且周室无真国君，正好验证合成国君路径
  p.cityId = 'luoyi';
  await boot(st);
  const officeBtn = $$('[data-act]').find(b => b.dataset.act === 'office');
  ok(!!officeBtn, '洛邑有谒见国君');
  if (officeBtn && !officeBtn.disabled) {
    officeBtn.click();
    await wait(80);
    ok(!!$('.modal'), '廷对弹窗打开');
    // 走完三问
    for (let i = 0; i < 6 && $('.debate-opts'); i++) {
      const opt = $$('.debate-opt')[0];
      if (!opt) break;
      opt.click();
      await wait(60);
    }
    ok(!!$('.modal'), '廷对结束后有结算');
    ok(!/undefined/.test(modalText()), '廷对结算无 undefined', modalText().slice(0, 80));
    await closeModal();
  }
  ok(errors.length === 0, '廷对无运行时错误', errors[0]?.slice(0, 100) ?? '');
}

ok(errors.length === 0, '全程无运行时错误' + (errors.length ? ': ' + errors[0].slice(0, 120) : ''));

console.log(fails === 0 ? '\n献宝·请封·廷对界面全部通过 ✓' : `\n献宝·请封·廷对界面失败 ${fails} 项 ✗`);
if (errors.length) console.log('errors:', errors.slice(0, 3));
process.exit(fails ? 1 : 0);
