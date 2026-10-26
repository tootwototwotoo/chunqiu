// 分庭抗礼界面：复用廷对的认同度表现，换题目与结算
import { startParley, parleyAnswer, currentParleyQuestion, settleParley, parleyTopics } from '../systems/parley.js';
import { PARLEY_THRESHOLD } from '../data/merchant.js';
import { STATES } from '../data/world.js';
import { onClick } from './common.js';
import { advanceDays } from '../systems/calendar.js';
import { esc } from '../util.js';

export function parleyTopicModal(app, st, stateId, opts = {}) {
  const h = app.modal({
    title: '分庭抗礼',
    sub: `${STATES[stateId].name} · 以商贾之身见君`,
    body: `<p style="line-height:1.9">你不求仕，只与国君议利。
      认同达 ${PARLEY_THRESHOLD} 方为成议。</p>
      <div class="choices">
        ${parleyTopics().map(t => `<button class="choice-btn" data-topic="${t.id}">${t.name}
          <small>${t.desc} · 成则：${t.success}</small></button>`).join('')}
      </div>`,
    foot: [{ label: '作罢', close: true }],
  });
  onClick(h.bodyEl, '[data-topic]', (el) => {
    h.close();
    openParley(app, st, stateId, el.dataset.topic, opts);
  });
  return h;
}

export function openParley(app, st, stateId, topic, opts = {}) {
  const pl = startParley(st, stateId, topic);
  if (!pl.ok) {
    app.modal({ title: '分庭抗礼', narrow: true, body: `<p>${pl.msg}</p>`, foot: [{ label: '知道了', close: true }] });
    return null;
  }
  const h = app.modal({
    title: '分庭抗礼',
    sub: `${STATES[stateId].name}君 · ${parleyTopics().find(t => t.id === topic)?.name ?? ''}`,
    wide: true,
    closable: false,
    body: '',
  });

  const render = () => {
    h.setBody(bodyHtml(pl));
    onClick(h.bodyEl, '[data-ans]', (el) => {
      if (pl.over) return;
      parleyAnswer(st, pl, Number(el.dataset.ans));
      if (pl.over) finish();
      else render();
    });
  };

  const finish = () => {
    const res = settleParley(st, pl);
    const adv = advanceDays(st, 1);
    h.setBody(outcomeHtml(pl, res));
    h.setFoot([{ label: '退出', cls: 'btn primary', onClick: () => {
      h.close();
      if (opts.onEnd) opts.onEnd(res);
      app.after({ notes: [...(res.notes ?? []), ...adv.notes], events: adv.events, died: adv.died });
      app.refreshHud();
    } }]);
    app.refreshHud();
  };
  render();
  return h;
}

function bar(pl) {
  return `<div class="debate-meter" style="position:relative">
    <div class="bar"><i style="width:${pl.agreement}%"></i></div>
    <span class="debate-mark" style="left:70%"></span>
    <span class="debate-mark-label" style="left:70%">${PARLEY_THRESHOLD}</span>
  </div>`;
}

function bodyHtml(pl) {
  const q = currentParleyQuestion(pl);
  return `
    <div style="display:flex;justify-content:space-between;font-size:12.5px;color:#6d6052">
      <span>第 ${Math.min(pl.round, 3)} / 3 议</span>
      <span>国君认同 <b style="color:#3a2a1c">${Math.round(pl.agreement)}</b> / 100</span>
    </div>
    ${bar(pl)}
    <div class="debate-speech">${esc(q.q)}</div>
    <div class="debate-opts">
      ${q.options.map((o, i) => `<button class="debate-opt" data-ans="${i}"><span class="opt-text">${esc(o.text)}</span></button>`).join('')}
    </div>`;
}

function outcomeHtml(pl, res) {
  return `
    <div class="mg-result" style="color:${res.success ? '#4d6f56' : '#9c2b26'};font-size:20px">
      ${res.success ? '成议' : '未合'}
    </div>
    <p style="line-height:1.9">${esc(res.msg)}</p>
    <div class="footnote">认同 ${Math.round(pl.agreement)} / 100（需 ${PARLEY_THRESHOLD}）</div>
    ${res.notes?.length ? `<div class="footnote" style="color:#4d6f56">${res.notes.map(esc).join('　')}</div>` : ''}`;
}
