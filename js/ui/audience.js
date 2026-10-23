// 三回合廷对界面
import { startAudience, audienceAnswer, currentQuestion } from '../systems/audience.js';
import { biasName } from '../systems/debate.js';
import { onClick } from './common.js';
import { esc } from '../util.js';

export function audienceModal(app, st, stateId, opts = {}) {
  const a = startAudience(st, stateId);
  const h = app.modal({
    title: `廷对 · ${a.rulerName}`,
    sub: `${opts.sub ?? '国君问政'} · 心性：${biasName(a.heart)}`,
    wide: true,
    closable: false,
    body: '',
  });

  const render = () => {
    h.setBody(bodyHtml(a));
    bind();
  };
  const bind = () => {
    onClick(h.bodyEl, '[data-ans]', (el) => {
      if (a.over) return;
      audienceAnswer(st, a, Number(el.dataset.ans));
      if (a.over) finish();
      else render();
    });
  };
  const finish = () => {
    h.setBody(outcomeHtml(a));
    h.setFoot([{ label: '退下', cls: 'btn primary', onClick: () => {
      h.close();
      if (opts.onEnd) opts.onEnd({ success: a.success, agreement: a.agreement, audience: a });
      else app.after({});
      app.refreshHud();
    } }]);
    app.refreshHud();
  };
  render();
  return h;
}

function bar(a) {
  return `<div class="debate-meter" style="position:relative">
    <div class="bar"><i style="width:${a.agreement}%"></i></div>
    <span class="debate-mark" style="left:70%"></span><span class="debate-mark-label" style="left:70%">70</span>
  </div>`;
}

function bodyHtml(a) {
  const q = currentQuestion(a);
  return `
    <div style="display:flex;justify-content:space-between;font-size:12.5px;color:#6d6052">
      <span>第 ${Math.min(a.round, 3)} / 3 问</span>
      <span>国君认同 <b style="color:#3a2a1c">${Math.round(a.agreement)}</b> / 100</span>
    </div>
    ${bar(a)}
    <div class="debate-speech">${esc(q.q)}</div>
    <div class="debate-opts">
      ${q.options.map((o, i) => `<button class="debate-opt" data-ans="${i}"><span class="opt-text">${esc(o.text)}</span></button>`).join('')}
    </div>
    <div class="combat-log">${a.log.slice(-8).map(l => `<p>${esc(l)}</p>`).join('')}</div>`;
}

function outcomeHtml(a) {
  const rows = a.history.map(x => `<tr><td>${x.round}</td><td class="num">${x.base >= 0 ? '+' : ''}${x.base}</td><td class="num">${x.heartMod >= 0 ? '+' : ''}${x.heartMod}</td><td class="num"><b>${x.agreement}</b></td></tr>`).join('');
  return `
    <div class="mg-result" style="color:${a.success ? '#4d6f56' : '#9c2b26'};font-size:22px">${a.success ? '廷对称旨' : '廷对失旨'}</div>
    <div class="mg-hint">最终认同 ${a.agreement}</div>
    <p style="line-height:1.9">${a.success ? `${a.rulerName}道：「先生之言，可采。」` : `${a.rulerName}挥手：「先生且退。」`}</p>
    <table class="table"><thead><tr><th>问</th><th class="num">切中</th><th class="num">心性</th><th class="num">认同</th></tr></thead><tbody>${rows}</tbody></table>`;
}
