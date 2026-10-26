// 朝议：当前议题三选一，决定国策
import { POLICIES, canAdvise, pickIssue, adviseOutcome, currentPolicy, policySummary, keepPolicy, HEART_POLICY } from '../systems/policy.js';
import { audienceHeart, audienceRuler } from '../systems/audience.js';
import { addMerit } from '../state.js';
import { biasName } from '../systems/debate.js';
import { onClick } from './common.js';
import { esc } from '../util.js';

const GRADE_TEXT = { great: '大用', small: '小用', fail: '不用' };

export function councilModal(app, st, stateId, opts = {}) {
  const chk = canAdvise(st);
  const heart = audienceHeart(st, stateId);
  const ruler = audienceRuler(st, stateId);
  if (!chk.ok) {
    app.modal({ title: '朝议', narrow: true, body: `<p>${chk.msg}</p>`, foot: [{ label: '知道了', close: true }] });
    return null;
  }
  const cur = currentPolicy(st);
  const issue = pickIssue(st);
  const h = app.modal({
    title: '朝议',
    sub: `${ruler?.name ?? '国君'} · 心性：${biasName(heart)}`,
    wide: true,
    closable: false,
    body: '',
    foot: [{ label: '退下', close: true }],
  });

  const render = () => {
    const sum = policySummary(st);
    h.setBody(`
      <div class="debate-speech">${esc(issue.q)}</div>
      ${cur ? `<div class="footnote" style="color:#9c2b26">当前国策「${cur.policy.name}」尚有 ${cur.left} 日；改策将作废旧策并倒扣功勋。</div>` : ''}
      <div class="debate-opts">
        ${issue.options.map((o, i) => `
          <button class="debate-opt" data-opt="${i}">
            <span class="opt-text">${esc(o.text)}</span>
            <small style="display:block;color:#6d6052;font-size:11.5px;margin-top:4px">${POLICIES[o.policy].name} · ${esc(POLICIES[o.policy].effect)}</small>
          </button>`).join('')}
      </div>
      ${cur ? `<div class="btn-row" style="margin:6px 0"><button class="btn sm" data-keep>维持「${cur.policy.name}」，不加功勋亦不扣</button></div>` : ''}
      <div class="footnote">合心性：${POLICIES[HEART_POLICY[heart]].name}。判定受智略、政略、权谋、国势影响。</div>
      <div class="footnote">现行：${sum.cur ? `${sum.cur.policy.name}（余 ${sum.cur.left} 日）` : '无'}　${sum.text}</div>`);
    bind();
  };

  const bind = () => {
    onClick(h.bodyEl, '[data-keep]', () => {
      const r = keepPolicy(st);
      if (!r.ok) { app.toast(r.msg, 'war'); return; }
      h.setBody(`
        <div class="mg-result" style="color:#4d6f56;font-size:20px">仍行旧策</div>
        <p style="line-height:1.9">你未另陈新议，只将旧策得失条陈一番。国君以为然，命依旧行之。</p>
        <div class="footnote">「${r.policy.name}」顺延，余 ${r.left} 日。功勋无增无减。</div>`);
      h.setFoot([{ label: '退下', cls: 'btn primary', onClick: () => {
        h.close();
        if (opts.onEnd) opts.onEnd(r);
        else app.after({});
        app.refreshHud();
      } }]);
      app.refreshHud();
    });
    onClick(h.bodyEl, '[data-opt]', (el) => {
      const res = adviseOutcome(st, issue, Number(el.dataset.opt), heart);
      h.setBody(`
        <div class="mg-result" style="color:${res.grade === 'fail' ? '#9c2b26' : '#4d6f56'};font-size:20px">${GRADE_TEXT[res.grade]}</div>
        <p style="line-height:1.9">${esc(res.option.reply)}</p>
        <div class="footnote">判定 ${Math.round(res.roll)}　国策「${res.policy.name}」${res.days ? `生效 ${res.days} 日` : '未获采纳'}　功勋 ${res.merit ? `+${res.merit}` : '无'}</div>
        <div class="footnote">${esc(res.policy.effect)}</div>`);
      h.setFoot([{ label: '退下', cls: 'btn primary', onClick: () => {
        h.close();
        if (opts.onEnd) opts.onEnd(res);
        else app.after({});
        app.refreshHud();
      } }]);
      app.refreshHud();
    });
  };

  render();
  return h;
}
