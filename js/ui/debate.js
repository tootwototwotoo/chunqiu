// 三回合论辩界面
import { startDebate, debateChoose, useEvidence, settleDebate, currentConcern, biasName } from '../systems/debate.js';
import { TAGS, EVIDENCE_BY_ID, TOPIC_NAMES } from '../data/debates/index.js';
import { onClick } from './common.js';
import { esc } from '../util.js';

const RESULT_LABEL = { success: '说服成功', compromise: '达成妥协', fail: '谈判失败' };
const RESULT_COLOR = { success: '#4d6f56', compromise: '#a67c34', fail: '#9c2b26' };

export const categoryForRole = (role) => ({
  ruler: 'court', minister: 'domestic', general: 'military',
  merchant: 'trade', scholar: 'court', retainer: 'court',
}[role] ?? 'court');

export function debateModal(app, st, npc, opts = {}) {
  const d = startDebate(st, npc, opts);
  let settled = null;
  const h = app.modal({
    title: `论辩 · ${d.opponent.name}`,
    sub: `${d.scenario.title} · 心性：${biasName(d.heart)}`,
    wide: true,
    closable: false,
    body: '',
  });

  const render = () => {
    h.setBody(bodyHtml(st, d));
    bind();
  };

  const bind = () => {
    onClick(h.bodyEl, '[data-opt]', (el) => {
      if (d.over) return;
      debateChoose(st, d, Number(el.dataset.opt));
      if (d.over) finish();
      else render();
    });
    onClick(h.bodyEl, '[data-evidence]', (el) => {
      if (d.over) return;
      const r = useEvidence(st, d, el.dataset.evidence);
      app.toast(r.msg, r.ok ? 'gain' : 'war');
      render();
    });
  };

  const finish = () => {
    if (!settled) settled = settleDebate(st, d, d.npcId, opts);
    h.setBody(outcomeHtml(d, settled));
    h.setFoot([{ label: '继续', cls: 'btn primary', onClick: () => {
      h.close();
      if (settled.result === 'success') app.toast('说服成功', 'gain');
      else if (settled.result === 'fail') app.toast('谈判失败', 'war');
      if (opts.onEnd) opts.onEnd({ ...settled, debate: d });
      else app.after({});
      app.refreshHud();
    } }]);
    app.refreshHud();
  };

  render();
  return h;
}

function barHtml(d) {
  return `<div class="debate-meter" style="position:relative">
    <div class="bar"><i style="width:${d.agreement}%"></i></div>
    <span class="debate-mark" style="left:40%"></span><span class="debate-mark-label" style="left:40%">40</span>
    <span class="debate-mark" style="left:70%"></span><span class="debate-mark-label" style="left:70%">70</span>
  </div>`;
}

function bodyHtml(st, d) {
  const concern = currentConcern(d);
  const ev = d.scenario.evidence;
  return `
    <div style="display:flex;justify-content:space-between;font-size:12.5px;color:#6d6052">
      <span>第 ${Math.min(d.round, 3)} / 3 轮</span>
      <span>认同度 <b style="color:#3a2a1c">${Math.round(d.agreement)}</b> / 100</span>
    </div>
    ${barHtml(d)}
    <div class="debate-speech">${esc(concern.q)}</div>
    <div class="debate-opts">
      ${concern.options.map((o, i) => `
        <button class="debate-opt" data-opt="${i}">
          <span class="opt-text">${esc(o.text)}</span>
        </button>`).join('')}
    </div>
    ${evidenceHtml(st, d, concern)}
    <div class="footnote" style="margin:4px 0 0">证据按主题跨场景使用；同一场论辩只能出示一次，用错顾虑不消耗。</div>
    <div class="combat-log">${d.log.slice(-8).map(l => `<p>${esc(l)}</p>`).join('')}</div>`;
}

function evidenceHtml(st, d, concern) {
  if (d.evidenceUsed) return '<div class="footnote" style="color:#4d6f56">本局已出示过证据。</div>';
  const topic = concern.topic ?? d.scenario.topic;
  const owned = st.player.evidence
    .map(id => EVIDENCE_BY_ID[id])
    .filter(e => e && e.topic === topic);
  if (!owned.length) return `<div class="footnote">尚无与「${TOPIC_NAMES[topic] ?? '此事'}」相关的证据，可先到城中查访、向人物打听或在书肆购买。</div>`;
  return `<div class="btn-row" style="margin-top:10px;align-items:center">
    ${owned.map(e => `<button class="btn sm" data-evidence="${e.id}">出示：${esc(e.name)}</button>`).join('')}
  </div>`;
}

function outcomeHtml(d, settled) {
  const rows = d.history.map(x => `
    <tr>
      <td>${x.round}</td>
      <td>${TAGS[x.tag].name}</td>
      <td class="num">${x.base >= 0 ? '+' : ''}${x.base}</td>
      <td class="num">${x.heartMod >= 0 ? '+' : ''}${x.heartMod}</td>
      <td class="num">${x.evidence ? '+' + x.evidence : '—'}</td>
      <td class="num"><b>${x.agreement}</b></td>
    </tr>`).join('');
  return `
    <div class="mg-result" style="color:${RESULT_COLOR[settled.result]};font-size:22px;margin-bottom:2px">
      ${RESULT_LABEL[settled.result]}
    </div>
    <div class="mg-hint">最终认同度 ${d.agreement}</div>
    <p style="line-height:1.9">${esc(d.scenario.outcomes[settled.result])}</p>
    <table class="table" style="margin-top:8px">
      <thead><tr><th>轮</th><th>思路</th><th class="num">切中</th><th class="num">心性</th><th class="num">证据</th><th class="num">认同</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    ${settled.followup ? `<div class="footnote" style="color:#9c2b26">新增差事：「${esc(settled.followup.title)}」——${esc(settled.followup.desc)}</div>` : ''}
    ${settled.result === 'compromise' && !settled.followup ? '<div class="footnote">对方只肯口头应承，并未形成可托付的差事。</div>' : ''}
    ${settled.effects ? `<div class="footnote">名声 ${fmt(settled.effects.fame)}　关系 ${fmt(settled.effects.rel)}${settled.effects.money ? `　金钱 ${fmt(settled.effects.money)}` : ''}${settled.effects.merit ? `　功勋 ${fmt(settled.effects.merit)}` : ''}</div>` : ''}`;
}

const fmt = (v) => (v == null ? '' : v > 0 ? `+${v}` : `${v}`);
