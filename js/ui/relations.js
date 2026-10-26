// 交游总览
import { NPC_MAP } from '../data/npcs.js';

import { player, rel } from '../state.js';
import { openNpc } from './npc.js';
import { onClick, relTierName, cityName, stateColor } from './common.js';


export function mount(root, st, app) {
  const met = Object.values(st.npc)
    .filter(n => n.alive && rel(st, n.id).met)
    .map(n => ({ ...n, def: NPC_MAP[n.id] }))
    .filter(x => x.def)
    .sort((a, b) => rel(st, b.id).aff - rel(st, a.id).aff);

  root.innerHTML = `
  <div class="panel">
    <h2>交游 <span class="sub">相识 ${met.length} 人 · 知己 ${met.filter(n => rel(st, n.id).aff >= 52).length} 人</span></h2>
    <div class="divider"></div>
    ${met.length ? met.map(n => {
      const r = rel(st, n.id);
      const same = n.city === player(st).cityId;
      return `<div class="rel-row">
        <div class="avatar" style="background:linear-gradient(160deg,${stateColor(n.def.state)},#2a2118)">${n.def.name[0]}</div>
        <div class="rel-mid">
          <div class="rel-name">${n.def.name} <span style="font-size:11.5px;color:#6d6052">${n.def.title}</span>
            ${same ? '<span class="tag" style="font-size:10px;padding:0 4px">同城</span>' : `<span style="font-size:11px;color:#6d6052">在${cityName(n.city)}</span>`}
          </div>
          <div class="rel-sub">${n.def.desc.slice(0, 34)}…</div>
          <div class="bar red" style="max-width:260px"><i style="width:${r.aff}%"></i></div>
        </div>
        <div style="text-align:right;display:flex;flex-direction:column;gap:6px;align-items:flex-end">
          <span class="rel-tier">${relTierName(r.aff)} ${r.aff}</span>
          <button class="btn sm" data-npc="${n.id}" ${same ? '' : 'disabled'}>往见</button>
        </div>
      </div>`;
    }).join('') : '<div class="empty">你尚未结识任何人。入城拜访城中人物，或于旅途中相遇。</div>'}
    <div class="footnote">交情 25 以上可请教学艺；50 以上可请其举荐出仕；52 以上为知己，可托大事。</div>
  </div>`;
  onClick(root, '[data-npc]', (el) => openNpc(app, st, el.dataset.npc));
}
