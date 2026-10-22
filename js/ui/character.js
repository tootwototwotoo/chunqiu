// 人物面板
import { skillRowHtml, onClick, statLine, stateName, cityName, avatar, relTierName } from './common.js';
import { SKILL_DEFS, STAT_DEFS, RANKS, MERCHANT_TIERS, SCHOLAR_TIERS, DIPLO_TIERS, skillTier } from '../data/defs.js';
import { GOODS } from '../data/goods.js';
import { player, age, fullTitle, careerTitle, skillLevel, rel, skillExpNeed } from '../state.js';
import { STATES } from '../data/world.js';
import { NPC_MAP } from '../data/npcs.js';
import { trainingModal } from './minigames.js';
import { esc, diffTier, clamp } from '../util.js';

export function mount(root, st, app) {
  const p = player(st);
  const inv = Object.entries(p.inventory).filter(([, q]) => q > 0);
  root.innerHTML = `
  <div class="cols" style="grid-template-columns:1fr 1fr">
    <div class="panel">
      <h2>${esc(p.name)} <span class="sub">${age(st)}岁 · ${esc(fullTitle(st))}</span></h2>
      <div class="desc">${stateName(p.stateId) !== p.stateId && p.stateId ? `${STATES[p.stateId].name}国` : '尚未出仕'} · 身在${cityName(p.cityId)} · 名声 ${p.fame}</div>
      <div class="section-title">四维</div>
      <div class="stat-grid">
        ${Object.entries(STAT_DEFS).map(([k, d]) => statLine(d.name, p.stats[k])).join('')}
      </div>
      <div class="section-title" style="margin-top:16px">技艺 <span class="hint">0—10 级</span></div>
      <table class="skill-table">
        ${Object.keys(SKILL_DEFS).map(k => skillRowHtml(st, k, true)).join('')}
      </table>
      <div class="footnote">于校场、学宫、市肆修习可得地利；亦可行束脩之礼，向城中贤者请益。</div>
    </div>

    <div style="display:flex;flex-direction:column;gap:12px">
      <div class="panel">
        <div class="section-title">生涯</div>
        <div class="kv">
          <dt>身份</dt><dd>${esc(fullTitle(st))}</dd>
          <dt>金钱</dt><dd>${p.money} 金</dd>
          <dt>体力</dt><dd>${Math.round(p.stamina)} / ${p.staminaMax}</dd>
          <dt>健康</dt><dd>${p.health}</dd>
          <dt>行囊</dt><dd>${Object.values(p.inventory).reduce((a, b) => a + b, 0)} / ${p.caravan}</dd>
          ${p.profession === 'youxia' || p.profession === 'shuike' ? `<dt>功勋</dt><dd>${p.merit}</dd><dt>爵位</dt><dd>${RANKS[p.rank]?.name ?? '布衣'}</dd>` : ''}
          ${p.profession === 'shangren' ? `<dt>商队</dt><dd>${p.caravan}</dd><dt>商号</dt><dd>${p.shops.length}</dd>` : ''}
          ${p.profession === 'xuezhe' ? `<dt>弟子</dt><dd>${p.disciples}</dd><dt>宗旨</dt><dd>${esc(p.doctrine ?? '未立')}</dd><dt>著述</dt><dd>${p.works.length}</dd>` : ''}
        </div>
        <div class="divider"></div>
        <div class="section-title">行囊</div>
        ${inv.length ? `<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 12px;font-size:13px">
          ${inv.map(([g, q]) => `<div style="display:flex;justify-content:space-between"><span>${GOODS[g].name}</span><b>${q}</b></div>`).join('')}
        </div>` : '<div class="empty">空空如也。</div>'}
        ${p.works.length ? `<div class="divider"></div><div class="section-title">著述</div>
          <div style="font-size:13px">${p.works.map(w => `${esc(w.title)}（前${-w.year}年）`).join('、')}</div>` : ''}
      </div>

      <div class="panel">
        <div class="section-title">交游</div>
        ${Object.values(p.relations).filter(r => r.met && r.aff > 0).sort((a, b) => b.aff - a.aff).slice(0, 6).map(r => {
          const nm = r.id ? (st.npc[r.id] ? r.id : r.id) : '';
          return `<div class="rel-row"><div class="rel-mid">
            <div class="rel-name">${npcNameOf(r.id)}</div>
            <div class="bar red" style="margin-top:3px"><i style="width:${r.aff}%"></i></div>
          </div><span class="rel-tier">${relTierName(r.aff)}</span></div>`;
        }).join('') || '<div class="empty">尚无深交之人。</div>'}
        <div class="footnote">相识既多，可观「名鉴」。交情深厚者，可请教学艺、切磋论辩。</div>
      </div>
    </div>
  </div>`;

  onClick(root, '[data-train]', (el) => {
    if (p.stamina < 8) { app.toast('体力不济，先歇息罢。', 'war'); return; }
    trainingModal(app, st, el.dataset.train, { sub: '独自修习' });
  });
}

const npcNameOf = (id) => NPC_MAP[id]?.name ?? id;
