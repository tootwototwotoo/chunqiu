// 人物面板
import { skillRowHtml, onClick, statLine, stateName, cityName, avatar, relTierName } from './common.js';
import { SKILL_DEFS, STAT_DEFS, RANKS, MERCHANT_TIERS, SCHOLAR_TIERS, DIPLO_TIERS, skillTier, PEERAGES, peerageName } from '../data/defs.js';
import { GOODS } from '../data/goods.js';
import { player, age, fullTitle, careerTitle, skillLevel, rel, skillExpNeed } from '../state.js';
import { STATES, CITY_MAP } from '../data/world.js';
import { NPC_MAP } from '../data/npcs.js';
import { trainingModal } from './minigames.js';
import { officeChance } from '../systems/progression.js';
import { peerageSummary } from '../systems/peerage.js';
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
          ${['youxia', 'shuike', 'xuezhe'].includes(p.profession) ? `<dt>功勋</dt><dd>${p.merit}${p.stateId ? '' : ' <small style="color:#6d6052">（未出仕，先累积）</small>'}</dd><dt>爵位</dt><dd>${p.stateId ? (RANKS[p.rank]?.name ?? '士') : '布衣'}</dd>` : ''}
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

      ${careerPanelHtml(st)}

      <div class="panel">
        <div class="section-title">交游</div>
        ${Object.entries(p.relations).filter(([, r]) => r.met && r.aff > 0).sort((a, b) => b[1].aff - a[1].aff).slice(0, 6).map(([id, r]) => {
          const def = NPC_MAP[id];
          return `<div class="rel-row"><div class="rel-mid">
            <div class="rel-name">${def ? esc(def.name) : esc(id)}${def ? ` <span style="font-size:11px;color:#6d6052">${esc(def.title)}</span>` : ''}</div>
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



function careerPanelHtml(st) {
  const p = player(st);
  const canServe = ['youxia', 'shuike', 'xuezhe'].includes(p.profession);
  if (!canServe) {
    return `<div class="panel">
      <div class="section-title">仕途</div>
      <div class="footnote">商贾不入仕途——以商致富，名号随金钱而进：贩夫 → 行商 → 坐贾 → 巨商 → 富商 → 陶朱之富。</div>
    </div>`;
  }
  const serving = !!p.stateId;
  const cur = serving ? p.rank : 0;
  const next = RANKS[cur + 1];
  const pct = next ? Math.min(100, Math.round((p.merit / next.merit) * 100)) : 100;
  const sum = peerageSummary(st);
  const trialDesc = (() => {
    if (!sum.next) return '已至公爵，无可再封。';
    if (!sum.trial) return `未领受 · 往洛邑领受${sum.next.name}爵试炼`;
    if (sum.trial.status === 'done') return `已成（评价 ${sum.trial.performance}）· 回洛邑请封，成算约 ${Math.round(sum.chance * 100)}%`;
    if (sum.trial.status === 'pending') return `新试炼「${sum.variant?.title ?? ''}」· ${sum.cooldown} 日后可领受`;
    const target = sum.trialTarget ? CITY_MAP[sum.trialTarget]?.name : '洛邑';
    return `进行中「${sum.variant?.title ?? ''}」· 须至${target}开始`;
  })();
  return `<div class="panel">
    <div class="section-title">仕途</div>
    ${serving ? `
      <div class="kv">
        <dt>所仕</dt><dd>${STATES[p.stateId].name}国</dd>
        <dt>官阶</dt><dd>${RANKS[cur].name} <small style="color:#6d6052">月俸 ${RANKS[cur].pay} 金</small></dd>
        <dt>爵位</dt><dd>${p.peerage ? `${peerageName(p.peerage.rank)} <small style="color:#6d6052">食邑${CITY_MAP[p.peerage.fief]?.name ?? ''} · 月入${PEERAGES[p.peerage.rank].income}金</small>` : '未受封'}</dd>
        <dt>册命</dt><dd>${trialDesc}</dd>
        <dt>功勋</dt><dd>${p.merit}${next ? ` / ${next.merit}` : ''}</dd>
      </div>
      <div class="bar" style="margin-top:6px"><i style="width:${pct}%"></i></div>
      <div class="footnote">${next ? `距「${next.name}」还需功勋 ${Math.max(0, next.merit - p.merit)}；每月初按功勋擢升一级。` : '已至极品「执政」。'}</div>
    ` : `
      <div class="kv">
        <dt>身份</dt><dd>布衣</dd>
        <dt>求仕</dt><dd>名声 ≥ 8，往有朝廷的都城谒见国君</dd>
        <dt>成算</dt><dd>约 ${Math.round(officeChance(st) * 100)}%</dd>
      </div>
      <div class="footnote">亦可与卿相结好（交情 50 以上），请其举荐直接入仕。布衣所积功勋在出仕时不会作废。<br>
      五等爵须先在洛邑领受「册命之试」，完成专属试炼后再请封；每次未准都会另命新试。</div>
    `}
    <div class="divider"></div>
    <div class="footnote" style="line-height:1.8">官阶：${RANKS.slice(1).map(r => `${r.name}(${r.merit})`).join(' → ')}<br>
    五等爵：${PEERAGES.map(x => `${x.name}(${x.merit}功勋/${x.fame}名声)`).join(' → ')}</div>
  </div>`;
}
