// 小游戏：决斗
import { MOVES, startDuel, duelAct, settleDuel, makeWanderer } from '../systems/combat.js';
import { onClick } from './common.js';
import { esc } from '../util.js';

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
