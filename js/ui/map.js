// 舆图
import { CITIES, CITY_MAP, ROADS, STATES, STATE_LABEL_POS } from '../data/world.js';
import { GOODS } from '../data/goods.js';
import { player, npcsHere } from '../state.js';
import { travelPlan, travelTo, shortestPath } from '../systems/travel.js';
import { today, esc } from '../util.js';
import { onClick, stateColor, stateName, cityTag } from './common.js';

let selected = null;

export function mount(root, st, app) {
  const cur = player(st).cityId;
  if (!selected) selected = cur;
  const plan = selected !== cur ? travelPlan(st, selected) : null;
  const path = selected !== cur ? shortestPath(cur, selected, st) : null;

  root.innerHTML = `
  <div class="map-wrap">
    <div class="panel map-panel">
      <div class="map-svg-box">
        ${mapSvg(st, cur, selected, path)}
      </div>
      <div class="map-legend">
        <span><i class="lg-dot" style="background:#9c2b26"></i>所在</span>
        <span><i class="lg-dot" style="background:#a67c34"></i>城邑</span>
        <span><i class="lg-dot" style="background:#7d97a6"></i>河川</span>
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
      </div>
    </div>
  </div>`;

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
}

function mapSvg(st, cur, sel, path) {
  const roadSet = new Set((path?.path ?? []).map((id, i, arr) => i ? [arr[i - 1], id].sort().join('|') : null).filter(Boolean));
  const roads = ROADS.map(([a, b]) => {
    const A = CITY_MAP[a], B = CITY_MAP[b];
    const active = roadSet.has([a, b].sort().join('|'));
    return `<line class="map-road" x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}" ${active ? 'style="stroke:#9c2b26;stroke-width:2.6;stroke-dasharray:none;opacity:.85"' : ''}/>`;
  }).join('');

  const cities = CITIES.map(c => {
    const owner = st.world.owner[c.id];
    const isCur = c.id === cur;
    const isSel = c.id === sel;
    return `<g class="map-city" data-city="${c.id}">
      <circle class="hit" cx="${c.x}" cy="${c.y}" r="22"/>
      <circle class="dot" cx="${c.x}" cy="${c.y}" r="${isCur ? 8 : isSel ? 7 : 5.5}"
        fill="${isCur ? '#9c2b26' : stateColor(owner)}" stroke="#f7efdc" stroke-width="2"/>
      ${isSel ? `<circle cx="${c.x}" cy="${c.y}" r="13" fill="none" stroke="#a67c34" stroke-width="1.6" stroke-dasharray="3 3"/>` : ''}
      ${isCur ? `<text x="${c.x + 13}" y="${c.y + 5}" style="font-size:12px;fill:#9c2b26">◆</text>` : ''}
      <text x="${c.x + 11}" y="${c.y - 8}">${c.name}</text>
    </g>`;
  }).join('');

  const stateLabels = (STATE_LABEL_POS ?? []).map(([id, x, y]) =>
    `<text class="map-state-label" x="${x}" y="${y}">${STATES[id]?.name ?? id}</text>`).join('');

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
      <div>国势 <b>${st.world.power[owner] ?? 0}</b></div>
      <div>国爵 <b>${STATES[owner]?.peer === '王' ? '王畿' : (STATES[owner]?.peer ?? '—')}</b></div>
    </div>
    <div class="hero-tags" style="margin-bottom:8px">
      ${(c.tags ?? []).map(t => `<span class="tag">${tags[t] ?? t}</span>`).join('')}
      ${cityId === cur ? '<span class="tag war">你在此地</span>' : ''}
    </div>
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
          <div class="n-main"><div class="n-name">${n.def.name}</div><div class="n-title">${n.def.title}</div></div>
        </div>`).join('')}
    </div>
  </div>`;
}
