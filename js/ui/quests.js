// 差事界面与受托弹窗
import { CITY_MAP } from '../data/world.js';
import { player, npcsHere, addFame } from '../state.js';
import { refreshBoard, acceptQuest, completeQuest, resolveCheck, questRewardText, sanitizeQuests } from '../systems/quests.js';
import { duelModal, debateModal } from './minigames.js';
import { onClick, cityName } from './common.js';
import { esc } from '../util.js';
import { absDay, dateLabel } from '../systems/calendar.js';
import { shortestPath } from '../systems/pathfind.js';
import { STATES } from '../data/world.js';

export function mount(root, st, app) {
  sanitizeQuests(st);
  const board = refreshBoard(st);
  const doneIds = new Set(st.quests.done.map(q => q.id));
  const activeList = st.quests.active.filter(q => q.status === 'active' && !doneIds.has(q.id));
  const doneList = st.quests.done.filter(q => q.status === 'done' || q.status === 'failed');
  root.innerHTML = `
    <div class="panel">
      <h2>差事 <span class="sub">受人托付，忠人之事</span></h2>
      <div class="divider"></div>
      <div class="cols">
        <div>
          <div class="section-title">进行中 <span class="hint">${activeList.length}件</span></div>
          ${activeList.length ? activeList.map(q => questCard(st, q, true)).join('') : '<div class="empty">眼下并无未了之事。</div>'}
          <div class="section-title" style="margin-top:18px">已了 <span class="hint">近事</span></div>
          ${doneList.length ? doneList.slice(0, 8).map(q => questCard(st, q, false)).join('') : '<div class="empty">尚无旧事可记。</div>'}
        </div>
        <div>
          <div class="section-title">城中榜文 <span class="hint">${CITY_MAP[player(st).cityId].name}</span></div>
          ${board.length ? board.map(q => questCard(st, q, false, true)).join('') : '<div class="empty">今日无榜。</div>'}
          <div class="btn-row" style="margin-top:10px">
            <button class="btn" data-act="refresh">再看新榜</button>
          </div>
          <div class="footnote">领受差事后，可往「舆图」出行完成。运货类须自备货物。</div>
        </div>
      </div>
    </div>`;
  bindBoard(app, st, root);
  onClick(root, '[data-act="refresh"]', () => { refreshBoard(st, true); app.render(); });
}

export function questCard(st, q, active, offer = false) {
  const leftNum = q.exp != null ? Math.max(0, q.exp - absDay(st.time)) : null;
  const left = leftNum != null ? `${leftNum}日` : '—';
  const route = q.targetCity ? (shortestPath(player(st).cityId, q.targetCity, st)?.days ?? null) : null;
  const tooLate = active && route != null && leftNum != null && leftNum < route;
  const urgent = active && ((leftNum != null && leftNum <= 2) || tooLate);
  const rw = q.reward ?? {};
  return `<div class="quest ${q.status === 'done' ? 'done' : ''} ${urgent ? 'urgent' : ''}">
    <div class="q-top">
      <h4>${esc(q.title)}</h4>
      <span class="q-from">${esc(q.giverName ?? '')}</span>
    </div>
    <div class="q-desc">${esc(q.desc ?? '')}</div>
    <div class="q-meta">
      ${q.targetCity ? `<span>目标 <b>${CITY_MAP[q.targetCity].name}</b></span>` : ''}
      ${route != null ? `<span>路程 <b>${route}日</b></span>` : ''}
      ${active ? `<span>余限 <b>${left}</b></span>` : ''}
      ${offer && q.days ? `<span>限期 <b>${esc(q.days)}日</b></span>` : ''}
      ${tooLate ? '<span style="color:#9c2b26">恐来不及</span>' : ''}
      ${rw.money ? `<span>酬金 <b>${esc(rw.money)}</b></span>` : ''}
      ${rw.fame ? `<span>名声 <b>+${esc(rw.fame)}</b></span>` : ''}
      ${rw.merit ? `<span>功勋 <b>+${esc(rw.merit)}</b></span>` : ''}
      ${q.status === 'done' ? '<span>已成</span>' : q.status === 'failed' ? '<span style="color:#9c2b26">已误</span>' : ''}
    </div>
    ${offer ? `<div class="btn-row" style="margin-top:8px"><button class="btn sm primary" data-accept="${esc(q.id)}">领受</button></div>` : ''}
    ${active ? `<div class="btn-row" style="margin-top:8px"><button class="btn sm ghost" data-abandon="${esc(q.id)}">放弃</button></div>` : ''}
  </div>`;
}

function bindBoard(app, st, root) {
  onClick(root, '[data-abandon]', (el) => {
    const q = st.quests.active.find(x => x.id === el.dataset.abandon);
    if (!q) return;
    app.confirm(`放弃「${q.title}」？信誉将略有损伤。`, () => {
      completeQuest(st, q, false);
      app.log(`放弃了差事「${q.title}」。`);
      app.render();
    });
  });
  onClick(root, '[data-accept]', (el) => {
    const res = acceptQuest(st, el.dataset.accept);
    if (!res.ok) { app.toast(res.msg, 'war'); return; }
    if (!res.instant) {
      app.toast(res.msg ?? '已领受', 'gain');
      app.log(res.msg ?? '已领受差事。');
      app.render();
      return;
    }
    const q = res.quest;
    if (res.instant === 'combat') {
      app.toast(`领受「${q.title}」`);
      duelModal(app, st, q.enemy, {
        sub: q.title, settleOpts: { fame: 2 },
        onEnd: (won) => {
          completeQuest(st, q, won);
          app.after({ notes: [won ? `「${q.title}」成了。` : `「${q.title}」未成。`] });
          app.render();
        },
      });
    } else if (res.instant === 'debate') {
      const target = q.npcId2 ? { id: q.npcId2, name: '对方大夫', title: '', bias: 'li', stats: { zhi: 70 } } : { name: `${STATES[q.targetState].name}国大夫`, title: '', bias: 'li', stats: { zhi: 70 } };
      debateModal(app, st, target, {
        sub: q.title, difficulty: q.difficulty, topic: '结盟之事',
        settleOpts: { fame: 3 },
        onEnd: (won) => {
          completeQuest(st, q, won);
          app.after({ notes: [won ? `「${q.title}」成了。` : `「${q.title}」未成。`] });
          app.render();
        },
      });
    } else if (res.instant === 'check') {
      const r = resolveCheck(st, q);
      app.modal({
        title: q.title, narrow: true,
        body: `<p>${r.ok ? '你办得妥当，差事顺遂。' : '事情办得并不顺手。'}</p>
          <div class="footnote">判定 ${r.ok ? '成' : '不成'}（${r.roll}）</div>`,
        foot: [{ label: '继续', cls: 'btn primary', onClick: h => { h.close(); app.render(); } }],
      });
      app.refreshHud();
    }
  });
}

// 城中的受托弹窗（不跳转）
export function openBoard(app, st) {
  refreshBoard(st);
  const h = app.modal({
    title: '榜文', sub: `${CITY_MAP[player(st).cityId].name} · 受人托付`, wide: true,
    body: `<div id="board-list">${(st.quests.offers ?? []).map(q => questCard(st, q, false, true)).join('') || '<div class="empty">今日无榜。</div>'}</div>`,
    foot: [{ label: '关闭', close: true }],
  });
  bindBoard(app, st, h.bodyEl);
  return h;
}
