// 市集买卖
import { GOODS } from '../data/goods.js';
import { CITIES, CITY_MAP } from '../data/world.js';
import { player, basePriceOf, caravanFree, goodsCount, R } from '../state.js';
import { buy, sell, priceAt, levyOf, bestMarkets, inventoryRows } from '../systems/trade.js';
import { onClick, cityName } from './common.js';
import { esc } from '../util.js';

export function marketModal(app, st) {
  let tab = 'buy';
  const h = app.modal({
    title: '市集',
    sub: `${CITY_MAP[player(st).cityId].name} · 日中为市`,
    wide: true,
    body: '',
    foot: [{ label: '离开', close: true }],
  });

  function render(extra = '') {
    const p = player(st);
    const inv = p.inventory;
    const tabs = [['buy', '买入'], ['sell', '卖出'], ['info', '行情']];
    const rows = Object.keys(GOODS).map(g => {
      const good = GOODS[g];
      const price = priceAt(st, p.cityId, g);
      const base = basePriceOf(st, p.cityId, g);
      const diff = price - base;
      const cls = diff > 0 ? 'price-up' : 'price-down';
      const have = inv[g] ?? 0;
      return `<tr>
        <td><b>${good.name}</b> <small style="color:#6d6052">每${good.unit}·载${good.bulk}</small></td>
        <td class="num ${cls}">${price}</td>
        <td class="num" style="color:#6d6052">${have}</td>
        <td style="text-align:right;white-space:nowrap">
          ${tab === 'buy' ? `<button class="btn sm" data-op="buy" data-g="${g}" data-q="1">买1</button>
            <button class="btn sm" data-op="buy" data-g="${g}" data-q="5">买5</button>` : ''}
          ${tab === 'sell' ? `<button class="btn sm" data-op="sell" data-g="${g}" data-q="1" ${have <= 0 ? 'disabled' : ''}>卖1</button>
            <button class="btn sm" data-op="sell" data-g="${g}" data-q="${have}" ${have <= 0 ? 'disabled' : ''}>全卖</button>` : ''}
        </td>
      </tr>`;
    }).join('');

    let body = `
      <div class="btn-row" style="margin-bottom:10px">
        ${tabs.map(([k, n]) => `<button class="btn sm ${tab === k ? 'primary' : ''}" data-tab="${k}">${n}</button>`).join('')}
        <span style="margin-left:auto;font-size:12.5px;color:#6d6052">金 ${p.money} · 行囊 ${goodsCount(st)}/${p.caravan}（余 ${caravanFree(st)}）</span>
      </div>`;
    if (tab === 'info') {
      const sk = p.skills.shanggu ?? 0;
      body += `<div class="footnote">商贾之能：可见 ${Math.min(5, 1 + Math.floor(sk / 2))} 处行情。牙钱 ${(100 - levyOf(st) * 100).toFixed(1)}%。</div>`;
      const cards = Object.keys(GOODS).map(g => {
        const mk = bestMarkets(st, g, 4);
        const cur = priceAt(st, p.cityId, g);
        return `<div class="panel" style="padding:10px 12px;margin-bottom:8px">
          <div style="display:flex;justify-content:space-between;align-items:baseline">
            <b>${GOODS[g].name}</b><span style="font-size:12px;color:#6d6052">本地 ${cur}</span>
          </div>
          <div style="font-size:12px;color:#4d6f56;margin-top:4px">
            ${mk.slice(0, Math.max(1, Math.min(5, 1 + Math.floor(sk / 2)))).map(m => `${m.city.name} ${m.price}`).join(' · ')}
          </div>
        </div>`;
      }).join('');
      body += cards;
    } else {
      body += `<table class="table"><thead><tr><th>货物</th><th class="num">单价</th><th class="num">存有</th><th style="text-align:right">交易</th></tr></thead><tbody>${rows}</tbody></table>`;
      body += `<div class="footnote">买入抬价，卖出压价。涨跌以色示：<span class="price-up">朱为贵</span>，<span class="price-down">青为贱</span>。</div>`;
    }
    if (extra) body += `<div class="footnote" style="color:#4d6f56;font-size:13px">${extra}</div>`;
    h.setBody(body);

    onClick(h.bodyEl, '[data-tab]', (el) => { tab = el.dataset.tab; render(); });
    onClick(h.bodyEl, '[data-op]', (el) => {
      const g = el.dataset.g, q = Number(el.dataset.q);
      const res = el.dataset.op === 'buy' ? buy(st, g, q) : sell(st, g, q);
      if (!res.ok) { app.toast(res.msg, 'war'); return; }
      const msg = el.dataset.op === 'buy'
        ? `买入${GOODS[g].name}${q}${GOODS[g].unit}，付${res.cost}金。`
        : `卖出${GOODS[g].name}${q}${GOODS[g].unit}，得${res.gain}金。`;
      app.toast(msg, 'gain');
      app.log(msg, 'gain');
      app.refreshHud();
      render(msg);
    });
  }
  render();
  return h;
}
