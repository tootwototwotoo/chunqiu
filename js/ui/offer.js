// 献宝：把珍宝献给本国国君
import { offerableTreasures, offerTreasure } from '../systems/treasures.js';
import { advanceDays } from '../systems/calendar.js';
import { onClick } from './common.js';
import { esc } from '../util.js';

export function offerModal(app, st) {
  const list = offerableTreasures(st);
  const h = app.modal({
    title: '献宝于朝',
    sub: '以珍宝为贽，示臣子之诚',
    wide: true,
    body: '',
    foot: [{ label: '退下', close: true }],
  });

  const render = (extra = '') => {
    h.setBody(`
      <div class="footnote">献宝不与献策同冷却，可随时进献。玄璧另有册命之用，留或献，君自择之。</div>
      <table class="table">
        <thead><tr><th>珍宝</th><th class="num">持有</th><th class="num">功勋</th><th class="num">名声</th><th style="text-align:right">进献</th></tr></thead>
        <tbody>
          ${list.map(o => `<tr>
            <td><b>${o.def.name}</b><div class="footnote" style="margin:0">${esc(o.def.text)}</div></td>
            <td class="num">${o.have}</td>
            <td class="num" style="color:#4d6f56">+${o.merit}</td>
            <td class="num" style="color:#4d6f56">+${o.fame}</td>
            <td style="text-align:right"><button class="btn sm primary" data-offer="${o.id}">进献</button></td>
          </tr>`).join('')}
        </tbody>
      </table>
      ${extra ? `<div class="footnote" style="color:#4d6f56;font-size:13px">${esc(extra)}</div>` : ''}`);
    onClick(h.bodyEl, '[data-offer]', (el) => {
      const r = offerTreasure(st, el.dataset.offer);
      if (!r.ok) { app.toast(r.msg, 'war'); return; }
      app.toast(r.msg, 'gain');
      app.log(r.msg, 'big');
      app.refreshHud();
      const adv = advanceDays(st, 1);
      if (!offerableTreasures(st).length) {
        h.close();
        app.after({ notes: [r.msg, ...adv.notes], events: adv.events, died: adv.died });
        return;
      }
      const fresh = offerableTreasures(st);
      list.length = 0;
      list.push(...fresh);
      render(r.msg);
    });
  };
  render();
  return h;
}
