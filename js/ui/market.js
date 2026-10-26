// 市集买卖
import { GOODS, PLAIN_GOODS } from '../data/goods.js';
import { treasuresInCity } from '../data/treasures.js';
import { CITY_MAP } from '../data/world.js';
import { player, basePriceOf, caravanFree, goodsCount } from '../state.js';
import { buy, sell, priceAt, levyOf, bestMarkets, treasureList, buyTreasure } from '../systems/trade.js';
import { onClick } from './common.js';
import { esc } from '../util.js';
import { BOOKSHOPS, TOPIC_NAMES } from '../data/debates/index.js';
import { marketHere, buyEvidence } from '../systems/evidence.js';
import { minTradeQty, isInstantTrade, startHaul, vehicleOf, vehicleCapacity } from '../systems/haul.js';

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
    if (treasuresInCity(p.cityId).length) tabs.push(['gem', '珍宝']);
    if (BOOKSHOPS.includes(p.cityId)) tabs.push(['book', '书肆']);
    const merchantBulk = p.profession === 'shangren' && !isInstantTrade(st);
    if (merchantBulk) tabs.push(['cargo', '货运']);
    const rows = PLAIN_GOODS.map(g => {
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

    const minQty = player(st).profession === 'shangren' ? minTradeQty(st) : 1;
    const instant = player(st).profession === 'shangren' ? isInstantTrade(st) : true;
    let body = `
      ${player(st).profession === 'shangren'
        ? `<div class="footnote">${instant
          ? `当前为即时交割，单笔最少 ${minQty}。`
          : `大宗交易：单笔至少 ${minQty}，须装运后在途运抵——请用「货运」页办理。`}</div>`
        : ''}
      <div class="btn-row" style="margin-bottom:10px">
        ${tabs.map(([k, n]) => `<button class="btn sm ${tab === k ? 'primary' : ''}" data-tab="${k}">${n}</button>`).join('')}
        <span style="margin-left:auto;font-size:12.5px;color:#6d6052">金 ${p.money} · 行囊 ${goodsCount(st)}/${p.caravan}（余 ${caravanFree(st)}）</span>
      </div>`;
    if (tab === 'cargo') {
      const v = vehicleOf(st);
      const cap = vehicleCapacity(st);
      const minQ = minTradeQty(st);
      body += `<div class="footnote">现用${v.name}：载重 ${cap}，装运 ${v.load || '—'}/日。
        大宗采买须先装运，再运抵目的城方可入库。单笔至少 ${minQ}。</div>
        <table class="table"><thead><tr><th>货物</th><th class="num">单价</th><th class="num">上限</th><th style="text-align:right">办货</th></tr></thead><tbody>
        ${PLAIN_GOODS.map(g => {
          const unit = Math.round(priceAt(st, p.cityId, g) * 1);
          const bulk1 = GOODS[g].bulk ?? 1;
          const maxByCap = Math.floor(cap / bulk1);
          const maxByMoney = Math.floor(p.money / Math.max(1, unit));
          const maxQ = Math.min(maxByCap, maxByMoney);
          return `<tr>
            <td><b>${GOODS[g].name}</b> <small style="color:#6d6052">载${bulk1}</small></td>
            <td class="num">${unit}</td>
            <td class="num">${maxQ}</td>
            <td style="text-align:right">
              ${[minQ, minQ * 2].filter(q => q <= maxQ).map(q =>
                `<button class="btn sm" data-haul="${g}" data-q="${q}" data-u="${unit}">办${q}</button>`).join('') || '<span class="footnote">量不足</span>'}
            </td>
          </tr>`;
        }).join('')}
        </tbody></table>
        <div class="footnote">办货后须亲自运往目的地；路程愈远，遇劫风险愈高。</div>`;
    } else if (tab === 'gem') {
      const list = treasureList(st, p.cityId);
      body += `<div class="footnote">珍宝一城仅藏一件，购后须待补货，且此后同类珍宝天下皆涨。六种珍宝俱为厚重之礼，亦可用于献宝。</div>`;
      body += list.map(g => {
        const d = g.def;
        return `<div class="panel" style="padding:12px 14px;margin-bottom:8px">
          <div style="display:flex;justify-content:space-between;align-items:baseline">
            <b style="font-size:17px">${d.name}</b>
            <span style="color:${g.available ? '#9c2b26' : '#6d6052'};font-size:18px">${g.price} 金</span>
          </div>
          <div class="footnote">${esc(d.text)}</div>
          <div class="footnote">${g.available
            ? `本城尚有一${d.unit}，可购。购后同类涨至 ${Math.round(g.price * d.step)} 金。`
            : `本城已售罄，${g.left} 日后才会再有。`}</div>
          <div class="btn-row" style="margin-top:8px">
            <button class="btn primary" data-buy-gem="${g.id}" ${g.available && p.money >= g.price ? '' : 'disabled'}>购${d.name}</button>
            <span style="font-size:12.5px;color:#6d6052;align-self:center">持有 ${p.inventory[g.id] ?? 0}</span>
          </div>
        </div>`;
      }).join('');
    } else if (tab === 'book') {
      const evs = marketHere(st, p.cityId);
      body += `<div class="footnote">书肆出售账册、书信与旧档，价高而一劳永逸：买下后可在此后论辩中按主题反复使用，不会消耗。</div>`;
      body += evs.length ? `<table class="table"><thead><tr><th>名称</th><th>主题</th><th class="num">价格</th><th style="text-align:right">购买</th></tr></thead><tbody>
        ${evs.map(e => `<tr><td><b>${esc(e.name)}</b><div class="footnote" style="margin:0">${esc(e.text)}</div></td>
          <td>${TOPIC_NAMES[e.topic] ?? e.topic}</td><td class="num">${e.source.price} 金</td>
          <td style="text-align:right"><button class="btn sm primary" data-buy-ev="${e.id}" ${p.money < e.source.price ? 'disabled' : ''}>购买</button></td></tr>`).join('')}
      </tbody></table>` : '<div class="empty">本城书肆暂无可购的证物。</div>';
    } else if (tab === 'info') {
      const sk = p.skills.shanggu ?? 0;
      body += `<div class="footnote">商贾之能：可见 ${Math.min(5, 1 + Math.floor(sk / 2))} 处行情。牙钱 ${(100 - levyOf(st) * 100).toFixed(1)}%。</div>`;
      const cards = PLAIN_GOODS.map(g => {
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
    onClick(h.bodyEl, '[data-haul]', (el) => {
      const g = el.dataset.haul, q = Number(el.dataset.q), unit = Number(el.dataset.u);
      // 目的地：该货价最高且水路可行的城
      let best = null;
      for (const c of Object.values(CITY_MAP)) {
        if (c.id === p.cityId) continue;
        const pr = priceAt(st, c.id, g);
        if (!best || pr > best.pr) best = { c, pr };
      }
      if (!best) { app.toast('无处可运。', 'war'); return; }
      const r = startHaul(st, g, q, best.c.id, unit);
      if (!r.ok) { app.toast(r.msg, 'war'); return; }
      app.log(r.msg, 'gain');
      app.refreshHud();
      render(r.msg);
    });
    onClick(h.bodyEl, '[data-buy-gem]', (el) => {
      const r = buyTreasure(st, el.dataset.buyGem, p.cityId);
      if (!r.ok) { app.toast(r.msg, 'war'); return; }
      app.toast(r.msg, 'gain');
      app.log(r.msg, 'gain');
      app.refreshHud();
      render(r.msg);
    });
    onClick(h.bodyEl, '[data-buy-ev]', (el) => {
      const r = buyEvidence(st, el.dataset.buyEv);
      if (!r.ok) { app.toast(r.msg, 'war'); return; }
      app.toast(r.msg, 'gain');
      app.log(r.msg, 'gain');
      app.refreshHud();
      render(r.msg);
    });
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
