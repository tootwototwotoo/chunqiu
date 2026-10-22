// 小游戏：修习、决斗、辩论
import { MOVES, startDuel, duelAct, settleDuel, makeWanderer } from '../systems/combat.js';
import { ARGS, startDebate, debateChoose, settleDebate, biasName } from '../systems/debate.js';
import { addSkillExp, addStamina, addHealth, player, skillLevel, addFame, addMoney, addLog, R } from '../state.js';
import { advanceDays } from '../systems/calendar.js';
import { onClick } from './common.js';
import { clamp, esc } from '../util.js';

// ---------------- 修习 ----------------
export function trainingModal(app, st, skillKey, opts = {}) {
  const lv = skillLevel(st, skillKey);
  const name = { jianshu: '剑术', sheshu: '射术', bingfa: '兵法', biancai: '辩才', quanmou: '权谋', shanggu: '商贾', suanshu: '算术', xuewen: '学问' }[skillKey] ?? skillKey;
  const speed = 46 + lv * 9 + (opts.bonus ?? 0);
  let pos = 0, running = true, raf = 0;
  const h = app.modal({
    title: `修习 · ${name}`,
    sub: opts.sub ?? '心手合一，一击而中',
    narrow: true,
    closable: false,
    body: `
      <div class="mg-stage">
        <div class="mg-hint">待光标落入<strong>朱色区间</strong>时按「止」，或在区间内按 <kbd>空格</kbd>。</div>
        <div class="mg-bar-wrap" id="mg-bar">
          <div class="mg-zone good" style="left:30%;width:40%"></div>
          <div class="mg-zone perfect" style="left:45%;width:10%"></div>
          <div class="mg-marker" id="mg-marker" style="left:0%"></div>
        </div>
        <div class="mg-ticks"><span>生疏</span><span>尚可</span><span>精妙</span><span>尚可</span><span>生疏</span></div>
        <div class="mg-result" id="mg-result">　</div>
      </div>`,
    foot: [{ label: '止', cls: 'btn primary', onClick: () => stop() }],
  });
  const marker = h.bodyEl.querySelector('#mg-marker');
  const zoneEl = h.bodyEl.querySelector('#mg-bar');
  const resultEl = h.bodyEl.querySelector('#mg-result');

  const keyHandler = (e) => {
    if (e.code === 'Space') { e.preventDefault(); stop(); }
  };
  document.addEventListener('keydown', keyHandler);

  let last = performance.now();
  const tick = (now) => {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    pos = (pos + speed * dt) % 200;
    const shown = pos > 100 ? 200 - pos : pos;
    marker.style.left = shown.toFixed(2) + '%';
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  function stop() {
    if (!running) return;
    running = false;
    cancelAnimationFrame(raf);
    document.removeEventListener('keydown', keyHandler);
    const shown = pos > 100 ? 200 - pos : pos;
    let quality = 'miss', exp = 3, label = '生疏';
    if (Math.abs(shown - 50) <= 5) { quality = 'perfect'; exp = 22; label = '精妙'; }
    else if (shown >= 28 && shown <= 72) { quality = 'good'; exp = 12; label = '尚可'; }
    exp += lv * 1;

    const res0 = advanceDays(st, 1, {});
    addStamina(st, -8);
    const leveled = addSkillExp(st, skillKey, exp);
    const lvlNow = skillLevel(st, skillKey);
    if (quality === 'perfect' && R.chance(st, 0.25)) {
      addSkillExp(st, skillKey, 8);
      app.toast('忽有心得，技业大进', 'gain');
    }
    resultEl.innerHTML = `<b style="color:${quality === 'perfect' ? '#9c2b26' : quality === 'good' ? '#4d6f56' : '#6d6052'}">${label}</b>` +
      `<div style="font-size:12px;color:#6d6052;margin-top:4px">${name} +${exp} 经验${leveled.leveled ? ' · 晋一级！' : ''}</div>`;
    zoneEl.style.opacity = .45;
    h.setFoot([{ label: '继续', cls: 'btn primary', onClick: () => {
      h.close();
      if (leveled.leveled) {
        app.toast(`${name}晋至${lvlNow}级`, 'gain');
        app.log(`${name}精进，已至${lvlNow}级。`, 'gain');
      }
      app.after({ notes: res0.notes, events: res0.events, promotions: res0.promotions, died: res0.died });
    } }]);
    app.refreshHud();
  }
  return h;
}

// ---------------- 决斗 ----------------
export function duelModal(app, st, enemy, opts = {}) {
  const d = startDuel(st, enemy, opts);
  const h = app.modal({
    title: `决斗 · ${enemy.name}`,
    sub: opts.sub ?? '三招之内，见个高下',
    wide: true,
    closable: false,
    body: renderDuelBody(st, d),
    foot: [],
  });
  bindDuel(h);
  return h;

  function bindDuel(handle) {
    onClick(handle.bodyEl, '.move-btn', (el) => {
      if (d.over) return;
      const move = el.dataset.move;
      duelAct(st, d, move);
      handle.setBody(renderDuelBody(st, d));
      // 打字机式日志滚动
      const logEl = handle.bodyEl.querySelector('.combat-log');
      if (logEl) logEl.scrollTop = logEl.scrollHeight;
      if (d.over) finish(handle);
      else bindDuel(handle);
    });
  }

  function finish(handle) {
    const res = settleDuel(st, d, enemy.id ?? null, opts.settleOpts ?? {});
    handle.setBody(renderDuelBody(st, d) + `
      <div class="mg-result" style="margin-top:10px;color:${d.won ? '#4d6f56' : '#9c2b26'}">
        ${d.won ? '胜' : '负'}
        <div style="font-size:12.5px;color:#6d6052;margin-top:4px">
          ${d.won ? '名声+3' : '健康受损，体力耗损'}
        </div>
      </div>`);
    handle.setFoot([{ label: '继续', cls: 'btn primary', onClick: () => {
      handle.close();
      if (opts.onEnd) opts.onEnd(d.won, d);
      else app.after({ notes: [d.won ? '你胜了这一场。' : '你负了伤，颓然而退。'] });
    } }]);
    app.refreshHud();
  }
}

const disableSpecial = (v) => v ? 'disabled' : '';

function renderDuelBody(st, d) {
  const p = d.p, e = d.e;
  const moveHints = { zhan: '克突', tu: '克崩', beng: '克斩', guard: '回气', special: '耗气4' };
  const disabledSpecial = p.qi < MOVES.special.qi;
  return `
    <div class="combat-hp">
      <div class="side">
        <div><b>${esc(p.name)}</b> <span style="color:#6d6052;font-size:12px">体力 ${p.hp}/${p.maxHp}</span></div>
        <div class="hpbar"><i style="width:${(p.hp / p.maxHp) * 100}%"></i></div>
        <div style="font-size:11.5px;color:#6d6052;margin-top:3px">气势 ${'●'.repeat(p.qi)}${'○'.repeat(Math.max(0, p.maxQi - p.qi))}</div>
      </div>
      <div style="flex:0 0 auto;font-size:11px;color:#6d6052">第 ${d.round} 合</div>
      <div class="side right">
        <div><b>${esc(e.name)}</b> <span style="color:#6d6052;font-size:12px">体力 ${e.hp}/${e.maxHp}</span></div>
        <div class="hpbar"><i style="width:${(e.hp / e.maxHp) * 100}%;background:linear-gradient(90deg,#b4674f,#8a3b2e)"></i></div>
        <div style="font-size:11.5px;color:#6d6052;margin-top:3px">气势 ${'●'.repeat(e.qi)}${'○'.repeat(Math.max(0, e.maxQi - e.qi))}</div>
      </div>
    </div>
    <div class="combat-arena">
      <div class="fighter p" id="fp">侠</div>
      <div style="font-size:12px;color:#6d6052">⚔</div>
      <div class="fighter e" id="fe">敌</div>
    </div>
    <div class="move-grid">
      <button class="move-btn" data-move="zhan"><b>斩</b><small>克突</small></button>
      <button class="move-btn" data-move="tu"><b>突</b><small>克崩</small></button>
      <button class="move-btn" data-move="beng"><b>崩</b><small>克斩</small></button>
      <button class="move-btn" data-move="guard"><b>守</b><small>回气减伤</small></button>
      <button class="move-btn ${disabledSpecial ? 'dim' : ''}" data-move="special" ${disableSpecial(disabledSpecial)}><b>绝招</b><small>${disabledSpecial ? '气势不足' : '耗气四'}</small></button>
    </div>
    <div class="combat-log">
      ${d.log.slice(-14).map(l => `<p class="${l.includes('弃剑') || l.includes('倒地') ? 'hit' : ''}">${esc(l)}</p>`).join('')}
    </div>`;
}

// ---------------- 辩论 ----------------
export function debateModal(app, st, npc, opts = {}) {
  const d = startDebate(st, npc, opts);
  let revealed = false;
  const h = app.modal({
    title: `游说 · ${npc.name}`,
    sub: opts.sub ?? `论${opts.topic ?? '国事'}`,
    wide: true,
    closable: false,
    body: renderDebateBody(st, d, revealed),
    foot: [],
  });
  bind(h);

  function bind(handle) {
    onClick(handle.bodyEl, '.debate-opt', (el) => {
      if (d.over) return;
      debateChoose(st, d, el.dataset.key);
      revealed = true;
      handle.setBody(renderDebateBody(st, d, revealed));
      if (d.over) finish(handle);
      else bind(handle);
    });
  }

  function finish(handle) {
    const res = settleDebate(st, d, npc.id ?? null, opts.settleOpts ?? {});
    handle.setBody(renderDebateBody(st, d, true) + `
      <div class="mg-result" style="margin-top:10px;color:${d.won ? '#4d6f56' : '#9c2b26'}">
        ${d.won ? '说成' : '未成'}
      </div>`);
    handle.setFoot([{ label: '继续', cls: 'btn primary', onClick: () => {
      handle.close();
      if (opts.onEnd) opts.onEnd(d.won, d);
      else app.after({ notes: [d.won ? '对方被你说动了。' : '对方不为所动。'] });
    } }]);
    app.refreshHud();
  }
}

function renderDebateBody(st, d, revealed) {
  const skill = skillLevel(st, 'biancai');
  const meters = `
    <div style="font-size:12.5px;color:#6d6052;display:flex;justify-content:space-between">
      <span>${esc(d.targetName)}${d.targetTitle ? `（${esc(d.targetTitle)}）` : ''}</span>
      <span>第 ${d.round} / ${d.maxRounds} 轮</span>
    </div>
    <div class="debate-meter"><i style="width:${d.meter}%"></i></div>
    <div style="font-size:11.5px;color:#6d6052;text-align:right">说服 ${Math.round(d.meter)}%</div>`;
  const biasLine = revealed
    ? `<div style="font-size:12.5px;color:#9c2b26;margin:8px 0 4px">观其神色：<b>${biasName(d.bias)}</b>${skill >= 4 ? ' · 可对症下药' : ''}</div>`
    : `<div style="font-size:12.5px;color:#6d6052;margin:8px 0 4px">尚未摸清对方心性。辩才愈高，愈易察言观色。</div>`;
  const opts = Object.entries(ARGS).map(([k, a]) =>
    `<button class="debate-opt" data-key="${k}"><b>${a.name}</b><small>${a.hint}</small></button>`).join('');
  return `
    ${meters}
    ${biasLine}
    <div class="debate-opts">${opts}</div>
    <div class="combat-log" style="margin-top:10px">
      ${d.log.slice(-12).map(l => `<p>${esc(l)}</p>`).join('')}
    </div>`;
}
