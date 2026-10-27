// 舆图
import { CITIES, CITY_MAP, ROADS, STATES, STATE_LABEL_POS } from '../data/world.js';
import { GOODS } from '../data/goods.js';
import { biasName } from '../systems/debate.js';
import { player, npcsHere } from '../state.js';
import { travelPlan, travelTo, shortestPath } from '../systems/travel.js';

import { onClick, stateColor, stateName, cityTag } from './common.js';
import { drawTerritory } from './territory.js';
import { esc } from '../util.js';
import { policySummary } from '../systems/policy.js';
import { normShops, shopAt, shopIncomeOf, hasPermit } from '../systems/merchant.js';

let selected = null;

// 读档 / 换角色时重置，避免沿用上一局的选中城与路线
export function resetSelection() { selected = null; }

const MARK_DEFAULTS = { quest: true, shop: true, territory: true, stateLabel: true, road: true };
const marksOf = (st) => Object.assign({}, MARK_DEFAULTS, st.flags?.mapMarks ?? {});

// 按目标城聚合在途的出行差事：只留最近的一件用于提示
export function questMarks(st) {
  const byCity = new Map();
  for (const q of st.quests?.active ?? []) {
    if (q.mode !== 'travel' || !q.targetCity) continue;
    const left = q.exp != null ? Math.max(0, q.exp - absDayOf(st)) : null;
    const cur = byCity.get(q.targetCity);
    if (!cur || (left != null && (cur.left == null || left < cur.left))) {
      byCity.set(q.targetCity, { city: q.targetCity, title: q.title, left, count: (cur?.count ?? 0) + 1 });
    } else {
      cur.count += 1;
    }
  }
  return byCity;
}

function absDayOf(st) {
  const t = st.time;
  return (t.year + 722) * 360 + (t.month - 1) * 30 + (t.day - 1);
}

// 商人：各城商号与市籍的状态
export function shopMarks(st) {
  if (st.player.profession !== 'shangren') return new Map();
  const out = new Map();
  for (const shop of normShops(st)) {
    out.set(shop.city, { kind: 'shop', level: shop.level, income: shopIncomeOf(shop, st) });
  }
  for (const p of st.player.permits ?? []) {
    if (!out.has(p.city)) out.set(p.city, { kind: 'permit' });
  }
  return out;
}

export function mount(root, st, app) {
  const cur = player(st).cityId;
  if (!selected) selected = cur;
  const plan = selected !== cur ? travelPlan(st, selected) : null;
  const path = selected !== cur ? shortestPath(cur, selected, st) : null;
  const marks = {
    ...marksOf(st),
    quests: questMarks(st),
    shops: shopMarks(st),
  };

  root.innerHTML = `
  <div class="map-wrap">
    <div class="panel map-panel">
      <div class="map-mark-bar">
        <button class="btn sm ghost" data-act="marks">⚙ 标记</button>
        <div class="map-mark-menu" id="map-mark-menu" hidden>
          ${markMenuHtml(marks)}
        </div>
      </div>
      <div class="map-svg-box">
        <canvas id="map-territory" width="940" height="660"></canvas>
        ${mapSvg(st, cur, selected, path, marks)}
      </div>
      <div class="map-legend">
        <span><i class="lg-dot" style="background:#9c2b26"></i>所在</span>
        <span><i class="lg-dot" style="background:#a67c34"></i>城邑</span>
        <span><i class="lg-dot" style="background:#7d97a6"></i>河川</span>
        <span><i class="lg-dot" style="background:#a67c34;opacity:.5"></i>本国疆域</span>
        ${marks.quest && marks.quests.size ? '<span class="lg-flag">⚑ 差事目标</span>' : ''}
        ${marks.shop && marks.shops.size ? '<span class="lg-shop">■ 商号</span><span class="lg-shop">○ 已领市籍</span>' : ''}
        <span>点击城邑以观其详</span>
      </div>
    </div>
    <div class="map-side">
      ${cityCardHtml(st, selected, plan, cur)}
      ${npcHereHtml(st, selected, cur)}
      <div class="panel" style="padding:12px 14px">
        <div class="section-title">列国势力</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 10px;font-size:12.5px">
          ${Object.values(STATES).sort((a, b) => (st.world.power[b.id] ?? 0) - (st.world.power[a.id] ?? 0)).slice(0, 8).map(s => `
            <div style="display:flex;justify-content:space-between;gap:6px">
              <span style="color:${s.color}">${s.name}</span>
              <span style="color:#6d6052">${st.world.power[s.id] ?? 0}</span>
            </div>`).join('')}
        </div>
        ${st.world.hegemon ? `<div class="footnote">当今天下，${stateName(st.world.hegemon)}国为诸侯之长。</div>` : ''}
        <div class="footnote">本国国策：${(() => { const s2 = policySummary(st); return s2.cur ? `${s2.cur.policy.name}（余 ${s2.cur.left} 日）· ${s2.text}` : '无'; })()}</div>
      </div>
    </div>
  </div>`;

  const terr = root.querySelector('#map-territory');
  if (marks.territory) drawTerritory(terr, st);
  else if (terr) terr.style.visibility = 'hidden';

  onClick(root, '.map-city', (el) => {
    selected = el.dataset.city;
    mount(root, st, app);
  });
  onClick(root, '[data-act="travel"]', () => {
    const res = travelTo(st, selected);
    if (!res.ok) { app.toast(res.msg, 'war'); return; }
    app.log(`行${res.days}日，抵${CITY_MAP[selected].name}。`);
    selected = st.player.cityId;
    app.after(res);
    app.render();
  });
  onClick(root, '[data-act="enter"]', () => { app.nav('city'); });
  onClick(root, '[data-act="center"]', () => { selected = cur; mount(root, st, app); });

  // 标记下拉菜单
  const menu = root.querySelector('#map-mark-menu');
  onClick(root, '[data-act="marks"]', (el) => {
    el.blur?.();
    if (menu) menu.hidden = !menu.hidden;
  });
  onClick(root, '[data-mark]', (el) => {
    const key = el.dataset.mark;
    const on = el.getAttribute('aria-checked') === 'true';
    st.flags.mapMarks = { ...marksOf(st), [key]: !on };
    mount(root, st, app);
    // 重绘后菜单保持展开
    const again = root.querySelector('#map-mark-menu');
    if (again) again.hidden = false;
  });
}

const MARK_LABELS = {
  quest: '差事目标',
  shop: '商号与市籍',
  territory: '本国疆域',
  stateLabel: '国名水印',
  road: '道路',
};

function markMenuHtml(marks) {
  return `<div class="map-mark-title">地图标记</div>
    ${Object.entries(MARK_LABELS).map(([k, label]) => `
      <button class="map-mark-item" data-mark="${k}" role="checkbox" aria-checked="${marks[k] ? 'true' : 'false'}">
        <span class="mk-box">${marks[k] ? '✓' : ''}</span><span>${label}</span>
      </button>`).join('')}`;
}

function mapSvg(st, cur, sel, path, marks) {
  const roadSet = new Set((path?.path ?? []).map((id, i, arr) => i ? [arr[i - 1], id].sort().join('|') : null).filter(Boolean));
  const roads = marks.road ? ROADS.map(([a, b]) => {
    const A = CITY_MAP[a], B = CITY_MAP[b];
    const active = roadSet.has([a, b].sort().join('|'));
    return `<line class="map-road" x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}" ${active ? 'style="stroke:#9c2b26;stroke-width:2.6;stroke-dasharray:none;opacity:.85"' : ''}/>`;
  }).join('') : '';

  const cities = CITIES.map(c => {
    const owner = st.world.owner[c.id];
    const isCur = c.id === cur;
    const isSel = c.id === sel;
    return `<g class="map-city" data-city="${c.id}">
      <circle class="hit" cx="${c.x}" cy="${c.y}" r="22"/>
      <circle class="dot" cx="${c.x}" cy="${c.y}" r="${isCur ? 8 : isSel ? 7 : 5.5}"
        fill="${isCur ? '#9c2b26' : stateColor(owner)}" stroke="#f7efdc" stroke-width="2"/>
      ${isSel ? `<circle cx="${c.x}" cy="${c.y}" r="13" fill="none" stroke="#a67c34" stroke-width="1.6" stroke-dasharray="3 3"/>` : ''}
      ${isCur ? `<circle class="here-ring" cx="${c.x}" cy="${c.y}" r="14" fill="none" stroke="#9c2b26" stroke-width="1.6">
        <animate attributeName="r" values="10;20;10" dur="2.4s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.9;0.15;0.9" dur="2.4s" repeatCount="indefinite"/>
      </circle>
      <circle class="here-ring2" cx="${c.x}" cy="${c.y}" r="9" fill="none" stroke="#9c2b26" stroke-width="1" opacity=".5">
        <animate attributeName="r" values="8;15;8" dur="2.4s" begin="1.2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.6;0.05;0.6" dur="2.4s" begin="1.2s" repeatCount="indefinite"/>
      </circle>` : ''}
      <text x="${c.x + 11}" y="${c.y - 8}">${c.name}</text>
    </g>`;
  }).join('');

  const stateLabels = marks.stateLabel ? (STATE_LABEL_POS ?? []).map(([id, x, y]) =>
    `<text class="map-state-label" x="${x}" y="${y}">${STATES[id]?.name ?? id}</text>`).join('') : '';

  // 差事旗与商号标记：分别受开关控制
  const questFlags = marks.quest
    ? [...marks.quests.values()].map(q => questFlagSvg(CITY_MAP[q.city], q)).join('')
    : '';
  const shopGlyphs = marks.shop
    ? [...marks.shops.entries()].map(([cid, m]) => shopGlyphSvg(CITY_MAP[cid], m)).join('')
    : '';

  return `<svg id="map-svg" viewBox="0 0 940 660" preserveAspectRatio="xMidYMid meet">
    <defs>
      <linearGradient id="riv" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#7d97a6" stop-opacity=".2"/>
        <stop offset=".5" stop-color="#7d97a6" stop-opacity=".75"/>
        <stop offset="1" stop-color="#7d97a6" stop-opacity=".2"/>
      </linearGradient>
    </defs>
    ${stateLabels}
    <path class="map-river" d="M 120 300 C 240 270, 330 250, 430 262 C 540 276, 640 250, 800 268" stroke="url(#riv)"/>
    <path class="map-river thin" d="M 180 520 C 320 560, 460 540, 600 556 C 700 566, 760 556, 830 540" stroke="url(#riv)"/>
    <path class="map-river thin" d="M 470 340 C 500 400, 500 470, 490 548" stroke="url(#riv)"/>
    ${roads}
    ${cities}
    ${shopGlyphs}
    ${questFlags}
  </svg>`;
}

function cityCardHtml(st, cityId, plan, cur) {
  const c = CITY_MAP[cityId];
  const owner = st.world.owner[cityId];
  const tags = { market: '市集', academy: '学宫', barracks: '校场', court: '朝廷' };
  return `
  <div class="panel city-card">
    <div class="city-head">
      <h3 style="margin:0">${c.name}</h3>
      ${cityTag(st, cityId)}
    </div>
    <div class="desc" style="margin:6px 0 4px">${c.desc}</div>
    <div class="city-meta">
      <div>人口 <b>${c.pop}千</b></div>
      <div>所属 <b>${stateName(owner)}</b></div>
      <div>特产 <b>${GOODS[c.good]?.name ?? '—'}</b></div>
      <div>国势 <b>${st.world.power[owner] ?? 0}</b> <small style="color:#6d6052">${(((st.world.power[owner] ?? 30) - 40) / 4).toFixed(0)}%</small></div>
      <div>国爵 <b>${STATES[owner]?.peer === '王' ? '王畿' : (STATES[owner]?.peer ?? '—')}</b></div>
    </div>
    <div class="hero-tags" style="margin-bottom:8px">
      ${(c.tags ?? []).map(t => `<span class="tag">${tags[t] ?? t}</span>`).join('')}
      ${cityId === cur ? '<span class="tag war">你在此地</span>' : ''}
    </div>
    ${cityMarkRows(st, cityId)}
    <div class="route-line">
      ${cityId === cur ? '脚下之城，可入城中行走。' : plan ? `
        路程 <em>${plan.days}</em> 日 · 路费 <em>${plan.cost}</em> 金 · 耗力 <em>${plan.stamina}</em><br>
        途经：${plan.path.map(id => CITY_MAP[id].name).join(' → ')}
      ` : '无路可通。'}
    </div>
    <div class="btn-row" style="margin-top:12px">
      ${cityId === cur ? '<button class="btn primary" data-act="enter">入城</button>'
        : `<button class="btn primary" data-act="travel" ${plan ? '' : 'disabled'}>启程前往</button>`}
      ${cityId !== cur ? '<button class="btn ghost" data-act="center">回到所在</button>' : ''}
    </div>
  </div>`;
}

function npcHereHtml(st, cityId, cur) {
  if (cityId !== cur) return '';
  const list = npcsHere(st);
  if (!list.length) return `<div class="panel"><div class="section-title">城中人物</div><div class="empty">城中并无知名之士。</div></div>`;
  return `
  <div class="panel">
    <div class="section-title">城中人物 <span class="hint">${list.length}人</span></div>
    <div class="npc-list">
      ${list.slice(0, 6).map(n => `
        <div class="npc-row" data-npc="${n.id}">
          ${`<div class="avatar">${n.def.name[0]}</div>`}
          <div class="n-main"><div class="n-name">${n.def.name}</div><div class="n-title">${n.def.title} · 心性：${biasName(n.def.bias)}</div></div>
        </div>`).join('')}
    </div>
  </div>`;
}


// 差事目标：三角旗，紧急时左右摆动（与当前城的呼吸圆环区分开）
function questFlagSvg(c, q) {
  if (!c) return '';
  const urgent = q.left != null && q.left <= 3;
  const x = c.x + 9, y = c.y - 9;
  const label = `${q.title ?? '差事'}${q.left != null ? `（余 ${q.left} 日）` : ''}`;
  const sway = urgent
    ? `<animateTransform attributeName="transform" type="rotate"
        values="-12 ${x} ${y};12 ${x} ${y};-12 ${x} ${y}" dur="1.1s" repeatCount="indefinite"/>`
    : '';
  return `<g class="map-quest-flag${urgent ? ' urgent' : ''}">
    <title>${escapeXml(label)}</title>
    <line x1="${x}" y1="${y}" x2="${x}" y2="${y + 11}" stroke="currentColor" stroke-width="1.4"/>
    <polygon points="${x},${y} ${x + 8},${y + 3} ${x},${y + 6}" fill="currentColor"/>
    ${sway}
  </g>`;
}

// 商号（实心方块，按等级放大）与市籍（空心圆环）
function shopGlyphSvg(c, m) {
  if (!c) return '';
  const x = c.x - 14, y = c.y - 14;
  if (m.kind === 'permit') {
    return `<g class="map-shop-mark permit">
      <title>${escapeXml(`${c.name} · 已领市籍`)}</title>
      <circle cx="${x}" cy="${y}" r="5" fill="none" stroke="currentColor" stroke-width="1.6" opacity=".75"/>
    </g>`;
  }
  const size = [7, 9, 11][Math.max(0, Math.min(2, (m.level ?? 1) - 1))];
  const half = size / 2;
  const stroke = m.level >= 3 ? 2 : m.level >= 2 ? 1 : 0;
  const label = `${c.name} · ${['小肆', '大铺', '总号'][Math.max(0, Math.min(2, (m.level ?? 1) - 1))]}（月入 ${m.income ?? 0}）`;
  return `<g class="map-shop-mark shop${m.level ?? 1}">
    <title>${escapeXml(label)}</title>
    <rect x="${x - half}" y="${y - half}" width="${size}" height="${size}" fill="currentColor"
      stroke="#f7efdc" stroke-width="${stroke}" rx="1"/>
  </g>`;
}

function escapeXml(s) {
  return String(s).replace(/[<>&"]/g, ch => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[ch]));
}


// 侧栏：该城的差事、商号、市籍
function cityMarkRows(st, cityId) {
  const rows = [];

  // 差事：列出全部指向此城的出行差事
  const quests = (st.quests?.active ?? []).filter(q => q.mode === 'travel' && q.targetCity === cityId);
  if (quests.length) {
    const now = absDayOf(st);
    const text = quests.map(q => {
      const left = q.exp != null ? Math.max(0, q.exp - now) : null;
      const warn = left != null && left <= 3;
      const tail = left != null ? `（<span style="color:${warn ? '#9c2b26' : '#6d6052'}">余 ${left} 日</span>）` : '';
      return `${esc(q.title)}${tail}`;
    }).join('、');
    rows.push(`<dt>差事</dt><dd>${text}</dd>`);
  }

  // 商号与市籍：仅商人
  if (st.player.profession === 'shangren') {
    const shop = shopAt(st, cityId);
    if (shop) {
      const names = ['小肆', '大铺', '总号'];
      rows.push(`<dt>商号</dt><dd>${names[Math.max(0, Math.min(2, shop.level - 1))]} · 月入 ${shopIncomeOf(shop, st)} 金 · 伙计 ${shop.hired}</dd>`);
    } else if (hasPermit(st, cityId)) {
      rows.push(`<dt>市籍</dt><dd>已领，尚未设肆</dd>`);
    }
  }

  return rows.length ? `<div class="kv city-mark-rows">${rows.join('')}</div>` : '';
}
