// 名鉴（人物卡）
import { NPCS, NPC_MAP, npcAlive } from '../data/npcs.js';
import { STATES, CITY_MAP } from '../data/world.js';
import { player, rel } from '../state.js';
import { onClick, stateColor, relTierName, statLine } from './common.js';
import { openNpc } from './npc.js';
import { esc, diffTier } from '../util.js';

export function mount(root, st, app) {
  const p = player(st);
  const owned = NPCS.filter(n => p.cards.includes(n.id));
  const missing = NPCS.filter(n => !p.cards.includes(n.id));
  root.innerHTML = `
  <div class="panel">
    <h2>名鉴 <span class="sub">已录 ${owned.length} / ${NPCS.length} 人</span></h2>
    <div class="divider"></div>
    <div class="card-grid">
      ${NPCS.map(n => {
        const has = p.cards.includes(n.id);
        const alive = npcAlive(n, st.time.year);
        if (!has) return `<div class="npc-card locked" data-locked="1">
          ${''}<div class="avatar">？</div>
          <div class="c-name">未识</div>
          <div class="c-title">${alive ? '尚在人间' : '已归道山'}</div>
        </div>`;
        return `<div class="npc-card" data-card="${n.id}">
          <span class="c-state" style="background:${stateColor(n.state)}">${STATES[n.state].name}</span>
          <div class="avatar" style="background:linear-gradient(160deg,${stateColor(n.state)},#2a2118)">${n.name[0]}</div>
          <div class="c-name">${n.name}</div>
          <div class="c-title">${n.title}</div>
          <div style="font-size:11px;color:#6d6052">武${n.stats.wu} 智${n.stats.zhi} 政${n.stats.zheng} 魅${n.stats.mei}</div>
        </div>`;
      }).join('')}
    </div>
    <div class="footnote">于城中拜见、途中相遇、或闻其名，皆可录入名鉴。灰者为未识之人。</div>
  </div>`;
  onClick(root, '[data-card]', (el) => showCard(app, st, el.dataset.card));
}

function showCard(app, st, id) {
  const n = NPC_MAP[id];
  const r = rel(st, id);
  const alive = npcAlive(n, st.time.year);
  app.modal({
    title: n.name, sub: `${n.title} · ${STATES[n.state].name}国 · ${CITY_MAP[n.city].name}`,
    wide: true,
    body: `<div class="dialog-line">
        <div class="avatar" style="background:linear-gradient(160deg,${stateColor(n.state)},#2a2118)">${n.name[0]}</div>
        <div class="dl-body"><div class="dl-name">${n.birth ? `前${-n.birth}年` : '生年不详'} — ${n.death ? `前${-n.death}年` : '卒年不详'}${alive ? '' : ' · 已卒'}</div>
        <div class="dl-text">「${n.quote}」</div></div>
      </div>
      <div class="desc">${n.desc}</div>
      <div class="stat-grid">
        ${statLine('武艺', n.stats.wu)}${statLine('智略', n.stats.zhi)}
        ${statLine('政略', n.stats.zheng)}${statLine('魅力', n.stats.mei)}
      </div>
      <div class="footnote" style="margin-top:10px">所擅：${(n.teach ?? []).map(k => k).join('、') || '—'} · 心性：${{ li: '好利', yi: '重义', ming: '好名', shi: '尚势' }[n.bias]} · 交情：${relTierName(r.aff)}</div>`,
    foot: [{ label: '关闭', close: true }],
  });
}
