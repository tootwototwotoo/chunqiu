// 册命试炼的五套专属小游戏 UI
import { esc } from '../util.js';
import { canStartTrial, finishTrial } from '../systems/peerage.js';
import {
  startHunt, huntSearch, startNegotiation, negotiate, NEG_CARD_LIST,
  startGovernance, govern, GOV_POLICY_LIST, startBattle, battleRound, FORMATION_LIST,
  startRites, riteSubmit, riteHint,
} from '../systems/trialGames.js';
import { onClick } from './common.js';

const METER = (v, max, cls = '') => `<div class="bar ${cls}"><i style="width:${Math.max(0, Math.min(100, (v / max) * 100))}%"></i></div>`;

function wrap(app, st, g, variant, render) {
  const h = app.modal({
    title: `${variant.title}`,
    sub: '册命之试',
    wide: true,
    closable: false,
    body: '',
  });
  const draw = () => {
    h.setBody(render());
    bind();
    if (g.done) finish(h);
  };
  const finish = (handle) => {
    if (handle._finished) return;
    handle._finished = true;
    const res = finishTrial(st, g);
    handle.setBody(render() + `
      <div class="mg-result" style="margin-top:12px;color:${res.success ? '#4d6f56' : '#9c2b26'}">
        ${res.success ? '试炼已成' : '试炼未成'}
        <div style="font-size:12.5px;color:#6d6052;margin-top:4px">评价 ${res.performance ?? 0} / 100</div>
      </div>`);
    handle.setFoot([{ label: '复命', cls: 'btn primary', onClick: () => {
      handle.close();
      app.modal({
        title: res.success ? '试炼已成' : '试炼未成',
        body: res.success
          ? `<p>「${variant.title}」已成，评价 <b>${res.performance}</b>。回洛邑向周天子请封。</p>`
          : `<p>「${variant.title}」未成，名声受损。周室另命新试：「${esc(res.nextVariant?.title ?? '')}」，十五日后可领受。</p>`,
        foot: [{ label: '继续', cls: 'btn primary', onClick: hh => { hh.close(); app.after({}); } }],
      });
      app.refreshHud();
    } }]);
    app.refreshHud();
  };
  const bind = () => {
    const b = h.bodyEl;
    if (g.kind === 'hunt') {
      onClick(b, '[data-cell]', (el) => { huntSearch(st, g, Number(el.dataset.cell)); draw(); });
    } else if (g.kind === 'neg') {
      onClick(b, '[data-card]', (el) => { negotiate(st, g, el.dataset.card); draw(); });
    } else if (g.kind === 'gov') {
      onClick(b, '[data-pol]', (el) => { govern(st, g, el.dataset.pol); draw(); });
    } else if (g.kind === 'war') {
      onClick(b, '[data-form]', (el) => { battleRound(st, g, el.dataset.form); draw(); });
    } else if (g.kind === 'rite') {
      onClick(b, '[data-rite]', (el) => {
        if (g.done) return;
        const item = el.dataset.rite;
        if (!g._order) g._order = [];
        if (g._order.includes(item)) return;
        if (g._order.length >= g.trueOrder.length) return;
        g._order.push(item);
        draw();
      });
      onClick(b, '[data-pop]', () => { if (g._order?.length) { g._order.pop(); draw(); } });
      onClick(b, '[data-hint]', () => { riteHint(st, g); draw(); });
      onClick(b, '[data-submit]', () => {
        if (!g._order || g._order.length !== g.trueOrder.length) return;
        riteSubmit(st, g, g._order);
        if (g.done && g.success) g._order = [...g.trueOrder];
        draw();
      });
    }
  };
  draw();
  return h;
}

export function openTrialGame(app, st) {
  const chk = canStartTrial(st);
  if (!chk.ok) { app.toast(chk.msg || '无法开始试炼', 'war'); return; }
  const { variant } = chk;
  if (variant.engine === 'hunt') {
    const g = startHunt(st, variant);
    wrap(app, st, g, variant, () => renderHunt(g));
  } else if (variant.engine === 'neg') {
    const g = startNegotiation(st, variant);
    wrap(app, st, g, variant, () => renderNeg(g));
  } else if (variant.engine === 'gov') {
    const g = startGovernance(st, variant);
    wrap(app, st, g, variant, () => renderGov(g));
  } else if (variant.engine === 'war') {
    const g = startBattle(st, variant);
    wrap(app, st, g, variant, () => renderWar(g));
  } else if (variant.engine === 'rite') {
    const g = startRites(st, variant);
    wrap(app, st, g, variant, () => renderRite(g));
  }
}

// ---------------- 围捕 ----------------
function renderHunt(g) {
  const cells = Array.from({ length: g.n * g.n }, (_, i) => {
    const d = g.searched[i];
    const cls = d === 0 ? 'hit' : d == null ? '' : d <= 2 ? 'near' : 'far';
    const label = d === 0 ? '获' : d == null ? '' : d <= 2 ? '近' : d <= 4 ? '中' : '远';
    return `<button class="trial-cell ${cls}" data-cell="${i}" ${d != null || g.done ? 'disabled' : ''}>${label}</button>`;
  }).join('');
  return `
    <div class="mg-hint">搜捕次数 <b>${g.turns}</b> / ${g.maxTurns}　·　"近"表示相距 1~2，"远"表示更远</div>
    <div class="trial-grid" style="grid-template-columns:repeat(${g.n},1fr)">${cells}</div>
    <div class="combat-log">${g.log.slice(-6).map(l => `<p>${esc(l)}</p>`).join('')}</div>`;
}

// ---------------- 折冲 ----------------
function renderNeg(g) {
  const pct = Math.min(100, (g.progress / g.goal) * 100);
  const sup = Math.min(100, (g.suspicion / g.suspicionMax) * 100);
  return `
    <div class="mg-hint">第 ${Math.min(g.round, g.maxRounds)} / ${g.maxRounds} 轮</div>
    <div style="font-size:12.5px;color:#6d6052">盟约进度 <b>${g.progress}</b> / ${g.goal}</div>
    ${METER(g.progress, g.goal, 'green')}
    <div style="font-size:12.5px;color:#6d6052;margin-top:8px">对方戒心 <b>${g.suspicion}</b> / ${g.suspicionMax}</div>
    ${METER(g.suspicion, g.suspicionMax, 'red')}
    <div class="debate-opts" style="margin-top:12px">
      ${NEG_CARD_LIST.map(c => `<button class="debate-opt" data-card="${c.id}" ${g.done ? 'disabled' : ''}>
        <b>${c.name}</b><small>${c.hint}</small></button>`).join('')}
    </div>
    <div class="combat-log">${g.log.slice(-8).map(l => `<p>${esc(l)}</p>`).join('')}</div>`;
}

// ---------------- 治邑 ----------------
function renderGov(g) {
  const th = g.thresholds;
  const line = (name, v, t, cls) => `<div style="margin-bottom:6px">
    <div style="display:flex;justify-content:space-between;font-size:12.5px"><span>${name}</span><span>${v} / 需 ${t}</span></div>
    ${METER(v, 100, cls)}</div>`;
  return `
    <div class="mg-hint">第 ${Math.min(g.turn, g.maxTurns)} / ${g.maxTurns} 月</div>
    ${line('民生', g.min, th.min, 'green')}
    ${line('城防', g.def, th.def, 'blue')}
    ${line('府库', g.fisc, th.fisc, '')}
    <div class="move-grid" style="grid-template-columns:repeat(4,1fr);margin-top:10px">
      ${GOV_POLICY_LIST.map(p => `<button class="move-btn" data-pol="${p.id}" ${g.done ? 'disabled' : ''}>
        <b>${p.name}</b><small>${p.hint}</small></button>`).join('')}
    </div>
    <div class="combat-log">${g.log.slice(-8).map(l => `<p>${esc(l)}</p>`).join('')}</div>`;
}

// ---------------- 军略 ----------------
function renderWar(g) {
  const terrain = { plain: '平原', pass: '隘口', water: '水泽' }[g.terrain] ?? '原野';
  return `
    <div class="mg-hint">第 ${Math.min(g.round, g.maxRounds)} / ${g.maxRounds} 阵　·　地形：${terrain}</div>
    <div class="combat-hp">
      <div class="side"><div><b>我军</b> <span style="font-size:12px;color:#6d6052">兵 ${g.troops} 气 ${g.morale}</span></div>
        ${METER(g.troops, 100, 'green')}${METER(g.morale, 100, 'blue')}</div>
      <div class="side right"><div><b>${esc(g.enemy)}师</b> <span style="font-size:12px;color:#6d6052">兵 ${g.enemyTroops} 气 ${g.enemyMorale}</span></div>
        ${METER(g.enemyTroops, 100, 'red')}${METER(g.enemyMorale, 100, 'red')}</div>
    </div>
    <div class="move-grid" style="grid-template-columns:repeat(3,1fr);margin-top:10px">
      ${FORMATION_LIST.map(f => `<button class="move-btn" data-form="${f.id}" ${g.done ? 'disabled' : ''}>
        <b>${f.name}</b><small>克${f.beats === 'fang' ? '方' : f.beats === 'yuan' ? '圆' : '雁'}阵</small></button>`).join('')}
    </div>
    <div class="combat-log">${g.log.slice(-8).map(l => `<p>${esc(l)}</p>`).join('')}</div>`;
}

// ---------------- 定礼 ----------------
function renderRite(g) {
  const order = g._order ?? [];
  const left = g.trueOrder.filter(r => !order.includes(r));
  const slots = g.trueOrder.map((_, i) => order[i]
    ? `<span class="rite-chip done">${esc(order[i])}</span>`
    : `<span class="rite-chip">${g.revealed?.[i] ? esc(g.revealed[i]) : '？'}</span>`).join('<span class="rite-arrow">→</span>');
  return `
    <div class="mg-hint">按正确次序排列仪节　·　余 ${g.attempts} 次机会　·　提示 ${g.hints - g.usedHints} 次</div>
    <div class="rite-clues">
      ${g.clues.map(c => `<div>· 「${esc(c.before)}」在「${esc(c.after)}」之前</div>`).join('')}
    </div>
    <div class="rite-line">${slots}</div>
    <div class="btn-row" style="margin:8px 0">
      ${left.map(r => `<button class="btn sm" data-rite="${esc(r)}">${esc(r)}</button>`).join('')}
    </div>
    <div class="btn-row">
      <button class="btn sm ghost" data-pop>撤末位</button>
      <button class="btn sm" data-hint ${g.usedHints >= g.hints || g.done ? 'disabled' : ''}>求提示</button>
      <button class="btn sm primary" data-submit ${order.length !== g.trueOrder.length || g.done ? 'disabled' : ''}>定序</button>
    </div>
    <div class="combat-log">${g.log.slice(-8).map(l => `<p>${esc(l)}</p>`).join('')}</div>`;
}
