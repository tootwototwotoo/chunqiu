// 八种技艺的修习界面：每种技艺一套不同的小游戏
import { SKILL_DEFS } from '../data/defs.js';
import { skillLevel, addSkillExp, addStamina, R } from '../state.js';
import { advanceDays } from '../systems/calendar.js';
import { policyMods } from '../systems/policy.js';
import {
  startSkillGame, recordHit, answerChoice, answerPrice, answerMath, matchPair,
  finalizeSkillGame, trainingExp, skillGameSummary, FORM_LIST, FORM_INFO, ARG_OPTIONS, BIAS_NAMES,
} from '../systems/skillGames.js';
import { onClick } from './common.js';
import { esc } from '../util.js';

const QUALITY_LABEL = { perfect: '精妙', good: '尚可', miss: '生疏' };
const QUALITY_CLASS = { perfect: '#9c2b26', good: '#4d6f56', miss: '#6d6052' };

export function trainingModal(app, st, skillKey, opts = {}) {
  const g = startSkillGame(st, skillKey);
  const name = SKILL_DEFS[skillKey]?.name ?? skillKey;
  const ctx = {
    app, st, g, skillKey, name, opts, lv: skillLevel(st, skillKey),
    finished: false, raf: 0, keyHandler: null, pos: 0, shown: 0,
    marker: null, targetEl: null, selectedLeft: null, last: 0,
  };
  const h = app.modal({
    title: `修习 · ${name}`,
    sub: opts.sub ?? '三回为度，心手相应',
    wide: ['match', 'formation'].includes(g.kind),
    closable: false,
    body: '',
    // 兜底：弹窗被顶替或强制关闭时也要停掉 RAF 与键盘监听
    onClose: () => { if (!ctx.finished) cleanup(ctx); },
  });
  ctx.h = h;
  ctx.finish = () => finishTraining(ctx);
  ctx.draw = () => draw(ctx);
  setup(ctx);
  ctx.draw();
  return h;
}

function newZone(g, st) {
  const pw = [10, 8, 6][Math.min(2, g.round - 1)] ?? 6;
  // 用存档内种子，保证同一存档回放一致
  return { center: 30 + R.next(st) * 40, width: pw };
}

function setup(ctx) {
  const { g, st } = ctx;
  if (g.kind === 'timing') {
    g.zone = newZone(g, st);
    ctx.pos = 0; ctx.last = performance.now();
    ctx.keyHandler = (e) => { if (e.code === 'Space') { e.preventDefault(); stopTiming(ctx); } };
    document.addEventListener('keydown', ctx.keyHandler);
    const tick = (now) => {
      if (ctx.finished) return;
      const dt = Math.min(0.05, (now - ctx.last) / 1000); ctx.last = now;
      ctx.pos = (ctx.pos + (52 + ctx.lv * 6) * dt) % 200;
      ctx.shown = ctx.pos > 100 ? 200 - ctx.pos : ctx.pos;
      if (ctx.marker) ctx.marker.style.left = ctx.shown.toFixed(2) + '%';
      ctx.raf = requestAnimationFrame(tick);
    };
    ctx.raf = requestAnimationFrame(tick);
  } else if (g.kind === 'target') {
    g.speed = 46 + ctx.lv * 5;
    ctx.pos = 8; ctx.dir = 1; ctx.last = performance.now();
    ctx.keyHandler = (e) => { if (e.code === 'Space') { e.preventDefault(); shoot(ctx); } };
    document.addEventListener('keydown', ctx.keyHandler);
    const tick = (now) => {
      if (ctx.finished) return;
      const dt = Math.min(0.05, (now - ctx.last) / 1000); ctx.last = now;
      ctx.pos += ctx.dir * g.speed * dt;
      if (ctx.pos > 92) { ctx.pos = 92; ctx.dir = -1; }
      if (ctx.pos < 8) { ctx.pos = 8; ctx.dir = 1; }
      if (ctx.targetEl) ctx.targetEl.style.left = ctx.pos.toFixed(2) + '%';
      ctx.raf = requestAnimationFrame(tick);
    };
    ctx.raf = requestAnimationFrame(tick);
  }
}

function cleanup(ctx) {
  if (ctx.raf) cancelAnimationFrame(ctx.raf);
  ctx.raf = 0;
  if (ctx.keyHandler) document.removeEventListener('keydown', ctx.keyHandler);
  ctx.keyHandler = null;
}

function draw(ctx) {
  const { g } = ctx;
  if (g.done) return;
  if (g.kind === 'timing') ctx.h.setBody(renderTiming(ctx));
  else if (g.kind === 'target') ctx.h.setBody(renderTarget(ctx));
  else if (g.kind === 'formation') ctx.h.setBody(renderFormation(ctx));
  else if (g.kind === 'rhetoric') ctx.h.setBody(renderRhetoric(ctx));
  else if (g.kind === 'deduction') ctx.h.setBody(renderDeduction(ctx));
  else if (g.kind === 'price') ctx.h.setBody(renderPrice(ctx));
  else if (g.kind === 'math') ctx.h.setBody(renderMath(ctx));
  else if (g.kind === 'match') ctx.h.setBody(renderMatch(ctx));
  if (g.kind === 'timing') {
    ctx.marker = ctx.h.bodyEl.querySelector('#mg-marker');
    if (ctx.marker) ctx.marker.style.left = ctx.shown.toFixed(2) + '%';
    ctx.h.setFoot([{ label: '止', cls: 'btn primary', onClick: () => stopTiming(ctx) }]);
  } else if (g.kind === 'target') {
    ctx.targetEl = ctx.h.bodyEl.querySelector('#target-dot');
    ctx.h.setFoot([]);
  } else {
    ctx.h.setFoot([]);
  }
  bind(ctx);
}

function bind(ctx) {
  const { g, st, h } = ctx;
  const b = h.bodyEl;
  if (g.kind === 'target') onClick(b, '[data-shoot]', () => shoot(ctx));
  if (['formation', 'rhetoric', 'deduction'].includes(g.kind)) {
    onClick(b, '[data-choice]', (el) => {
      answerChoice(st, g, g.kind === 'deduction' ? Number(el.dataset.choice) : el.dataset.choice);
      g.done ? finishTraining(ctx) : draw(ctx);
    });
  }
  if (g.kind === 'price') {
    onClick(b, '[data-price]', (el) => {
      answerPrice(st, g, Number(el.dataset.price));
      g.done ? finishTraining(ctx) : draw(ctx);
    });
  }
  if (g.kind === 'math') {
    const submit = () => {
      const input = h.bodyEl.querySelector('#math-input');
      if (!input || input.value === '') return;
      answerMath(st, g, Number(input.value));
      g.done ? finishTraining(ctx) : draw(ctx);
    };
    onClick(b, '[data-submit]', submit);
    const input = h.bodyEl.querySelector('#math-input');
    if (input) input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
  }
  if (g.kind === 'match') {
    onClick(b, '[data-left]', (el) => { ctx.selectedLeft = Number(el.dataset.left); draw(ctx); });
    onClick(b, '[data-right]', (el) => {
      if (ctx.selectedLeft == null) return;
      const res = matchPair(st, g, ctx.selectedLeft, Number(el.dataset.right));
      ctx.selectedLeft = null;
      if (res.done || g.done) finishTraining(ctx);
      else draw(ctx);
    });
  }
}

function stopTiming(ctx) {
  const { g, st } = ctx;
  if (g.done || ctx.finished) return;
  const d = Math.abs(ctx.shown - g.zone.center);
  const quality = d <= g.zone.width / 2 ? 'perfect' : d <= g.zone.width ? 'good' : 'miss';
  recordHit(st, g, quality);
  if (g.done) { finishTraining(ctx); return; }
  g.zone = newZone(g, st);
  draw(ctx);
}

function shoot(ctx) {
  const { g, st } = ctx;
  if (g.done || ctx.finished) return;
  const d = Math.abs(ctx.pos - 50);
  const quality = d <= 4 ? 'perfect' : d <= 12 ? 'good' : 'miss';
  recordHit(st, g, quality);
  if (g.done) { finishTraining(ctx); return; }
  g.speed += 9;
  draw(ctx);
}

function finishTraining(ctx) {
  if (ctx.finished) return;
  ctx.finished = true;
  cleanup(ctx);
  const { st, g, lv, name } = ctx;
  finalizeSkillGame(st, g);
  const bonus = ctx.opts.bonus ? 2 : 0;
  let exp = trainingExp(lv, g.quality, bonus);
  if (ctx.skillKey === 'biancai' && policyMods(st).biancaiExp > 1) exp = Math.round(exp * policyMods(st).biancaiExp);
  const lucky = g.quality === 'perfect' && R.chance(st, 0.25);
  const total = exp + (lucky ? 4 : 0);
  const res0 = advanceDays(st, 1, {});
  addStamina(st, -8);
  const leveled = addSkillExp(st, ctx.skillKey, total);
  const lvlNow = skillLevel(st, ctx.skillKey);
  const q = g.quality;

  ctx.h.setBody(`
    <div class="mg-stage">
      <div class="mg-result" style="color:${QUALITY_CLASS[q]};font-size:20px">${QUALITY_LABEL[q]}</div>
      <div class="mg-hint">${esc(skillGameSummary(g))}</div>
      <div class="footnote" style="text-align:center;font-size:13px">
        ${name} 经验 +${total}${lucky ? '（忽有心得 +4）' : ''}${leveled.leveled ? ' · 晋一级！' : ''}
      </div>
    </div>`);
  ctx.h.setFoot([{ label: '继续', cls: 'btn primary', onClick: () => {
    ctx.h.close();
    if (leveled.leveled) {
      ctx.app.toast(`${name}晋至${lvlNow}级`, 'gain');
      ctx.app.log(`${name}精进，已至${lvlNow}级。`, 'gain');
    }
    ctx.app.after({ notes: res0.notes, events: res0.events, promotions: res0.promotions, died: res0.died });
  } }]);
  ctx.app.refreshHud();
}

function renderTiming(ctx) {
  const { g } = ctx;
  const z = g.zone;
  return `
    <div class="mg-stage">
      <div class="mg-hint">第 ${g.round} / 3 回：光标落入<strong>朱色区间</strong>时按「止」或 <kbd>空格</kbd></div>
      <div class="mg-bar-wrap" id="mg-bar">
        <div class="mg-zone good" style="left:${(z.center - z.width).toFixed(1)}%;width:${(z.width * 2).toFixed(1)}%"></div>
        <div class="mg-zone perfect" style="left:${(z.center - z.width / 2).toFixed(1)}%;width:${z.width.toFixed(1)}%"></div>
        <div class="mg-marker" id="mg-marker"></div>
      </div>
      <div class="mg-hint">三连斩：越靠中心越好</div>
      <div class="mg-result">${hitDots(g)}</div>
    </div>`;
}

function renderTarget(ctx) {
  const { g } = ctx;
  return `
    <div class="mg-hint">第 ${g.round} / 3 箭：点击「放箭」或按 <kbd>空格</kbd>，瞄准移动靶心</div>
    <div class="target-track" id="target-track">
      <div class="target-center"></div>
      <div class="target-dot" id="target-dot"></div>
    </div>
    <div class="btn-row" style="justify-content:center;margin-top:14px">
      <button class="btn primary" data-shoot>放箭</button>
    </div>
    <div class="mg-result">${hitDots(g)}</div>`;
}

function hitDots(g) {
  return `本回成绩：${g.hits.map(h => h === 'perfect' ? '●' : h === 'good' ? '◐' : '○').join(' ') || '—'}`;
}

function renderFormation(ctx) {
  const { g } = ctx;
  const q = g.questions[g.round - 1];
  return `
    <div class="mg-hint">第 ${g.round} / 3 问 · 阵法相克</div>
    <p style="font-size:16px;text-align:center;line-height:2">
      敌以「<b>${FORM_INFO[q.enemy].name}</b>」临于${q.terrain}，何以应之？</p>
    <div class="move-grid" style="grid-template-columns:repeat(3,1fr)">
      ${FORM_LIST.map(f => `<button class="move-btn" data-choice="${f.id}"><b>${f.name}</b><small>克${FORM_INFO[f.beats].name}</small></button>`).join('')}
    </div>
    <div class="mg-result">${hitDots(g)}</div>`;
}

function renderRhetoric(ctx) {
  const { g } = ctx;
  const q = g.questions[g.round - 1];
  return `
    <div class="mg-hint">第 ${g.round} / 3 问 · 察言观色</div>
    <p style="font-size:16px;text-align:center;line-height:2">对方<b>${BIAS_NAMES[q.bias]}</b>，当以何辞动之？</p>
    <div class="debate-opts">
      ${ARG_OPTIONS.map(o => `<button class="debate-opt" data-choice="${o.id}"><b>${o.name}</b><small>${o.hint}</small></button>`).join('')}
    </div>
    <div class="mg-result">${hitDots(g)}</div>`;
}

function renderDeduction(ctx) {
  const { g } = ctx;
  const q = g.questions[g.round - 1];
  return `
    <div class="mg-hint">第 ${g.round} / 3 问 · 识破通敌</div>
    <div class="rite-clues">
      <div>· ${q.clue1}</div>
      <div>· ${q.clue2}</div>
      <div style="color:#6d6052">三人之中，只有一人通敌。</div>
    </div>
    <div class="move-grid" style="grid-template-columns:repeat(3,1fr)">
      ${q.names.map((n, i) => `<button class="move-btn" data-choice="${i}"><b>${n}</b><small>指认此人</small></button>`).join('')}
    </div>
    <div class="mg-result">${hitDots(g)}</div>`;
}

function renderPrice(ctx) {
  const { g } = ctx;
  const q = g.questions[g.round - 1];
  return `
    <div class="mg-hint">第 ${g.round} / 3 问 · 市价估算</div>
    <p style="font-size:15px;text-align:center;line-height:2">
      牙人言：<b>${q.good.name}</b>一${q.good.unit}约值 <b>${q.hint}</b> 金。今市价几何？</p>
    <div class="choices">
      ${q.options.map((v, i) => `<button class="choice-btn" data-price="${i}">${v} 金</button>`).join('')}
    </div>
    <div class="mg-result">${hitDots(g)}</div>`;
}

function renderMath(ctx) {
  const { g } = ctx;
  const q = g.questions[g.round - 1];
  return `
    <div class="mg-hint">第 ${g.round} / 3 问 · 心算</div>
    <p style="font-size:26px;text-align:center;letter-spacing:2px;margin:14px 0">
      ${q.a} ${q.op} ${q.b} = ?</p>
    <div class="field" style="justify-content:center">
      <input id="math-input" type="number" inputmode="numeric" style="max-width:180px;text-align:center;font-size:20px" autofocus>
      <button class="btn primary" data-submit>对</button>
    </div>
    <div class="mg-result">${hitDots(g)}</div>`;
}

function renderMatch(ctx) {
  const { g } = ctx;
  const matchedLeft = new Set(g.matched.map(i => g.pairs[i].l));
  const matchedRight = new Set(g.matched.map(i => g.pairs[i].r));
  return `
    <div class="mg-hint">典籍与作者配对 · 误 ${g.wrong} 次</div>
    <div class="match-grid">
      <div>
        ${g.leftOrder.map((l, i) => `<button class="match-btn ${matchedLeft.has(l) ? 'done' : ''} ${ctx.selectedLeft === i ? 'sel' : ''}"
          data-left="${i}" ${matchedLeft.has(l) ? 'disabled' : ''}>${esc(l)}</button>`).join('')}
      </div>
      <div>
        ${g.rightOrder.map((r, i) => `<button class="match-btn ${matchedRight.has(r) ? 'done' : ''}"
          data-right="${i}" ${matchedRight.has(r) ? 'disabled' : ''}>${esc(r)}</button>`).join('')}
      </div>
    </div>
    <div class="mg-result">已配对 ${g.matched.length} / 4</div>`;
}
