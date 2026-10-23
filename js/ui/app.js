// 应用外壳：HUD、路由、弹窗、事件队列
import { addLog, saveGame, loadGame, hasSave, fullTitle, age, player, migrateState, AUTO_SAVE_ERROR } from '../state.js';
import { dateLabel, seasonOf } from '../systems/calendar.js';
import { prepareEvent, resolveChoice, choiceAvailable, collectTimeline, pendingEvents, finishEvent } from '../systems/events.js';
import { esc } from '../util.js';
import { computeEnding } from '../systems/progression.js';
import { startDuel, makeWanderer } from '../systems/combat.js';
import { sanitizeQuests, questRewardText } from '../systems/quests.js';
import { onClick } from './common.js';
import * as titleScreen from './title.js';
import * as mapScreen from './map.js';
import * as cityScreen from './city.js';
import * as characterScreen from './character.js';
import * as questsScreen from './quests.js';
import * as relationsScreen from './relations.js';
import * as cardsScreen from './cards.js';
import * as saveScreen from './save.js';

const SCREENS = {
  map: mapScreen, city: cityScreen, character: characterScreen,
  quests: questsScreen, relations: relationsScreen, cards: cardsScreen, save: saveScreen,
};

class App {
  constructor() {
    this.st = null;
    this.screen = 'title';
    this.queue = [];
    this.modalHandle = null;
    this.endingShown = false;
    this.bindShell();
  }

  // 顶栏导航：事件委托，避免重复绑定
  bindShell() {
    if (this.shellBound) return;
    this.shellBound = true;
    document.addEventListener('click', (e) => {
      const el = e.target && e.target.closest ? e.target.closest('#hud-nav button') : null;
      if (!el || !this.st) return;
      this.nav(el.dataset.screen);
    });
  }

  // ---------- 生命周期 ----------
  startGame(st) {
    migrateState(st);
    sanitizeQuests(st);
    collectTimeline(st);
    this.closeModal(false);
    this.st = st;
    this.queue = pendingEvents(st);
    document.body.classList.remove('title-mode');
    this.endingShown = false;
    this.screen = 'city';
    this.render();
    setTimeout(() => {
      if (this.st === st && this.screen !== 'title' && this.screen !== 'ending' && !this.modalHandle) this.nextEvent();
    }, 0);
  }

  showTitle() {
    this.closeModal(false);
    this.queue = [];
    this.screen = 'title';
    document.body.classList.add('title-mode');
    document.getElementById('screen').innerHTML = '';
    titleScreen.mount(document.getElementById('screen'), this.st, this);
    this.refreshHud();
    this.renderLog();
  }

  showEnding() {
    this.endingShown = true;
    const ending = computeEnding(this.st);
    this.screen = 'ending';
    document.body.classList.add('title-mode');
    const root = document.getElementById('screen');
    root.innerHTML = '';
    titleScreen.mountEnding(root, ending, this.st, this);
  }

  nav(screen) {
    if (!this.st || this.screen === 'ending') return;
    this.screen = screen;
    this.render();
  }

  // ---------- 渲染 ----------
  render() {
    if (!this.st) return;
    this.refreshHud();
    this.renderLog();
    if (this.screen === 'ending') return;
    const root = document.getElementById('screen');
    const sc = SCREENS[this.screen] || cityScreen;
    root.innerHTML = '';
    sc.mount(root, this.st, this);
  }

  refreshHud() {
    const st = this.st;
    if (!st) return;
    const p = player(st);
    document.getElementById('hud-name').textContent = p.name;
    document.getElementById('hud-prof').textContent = { youxia: '游侠', shangren: '商人', shuike: '说客', xuezhe: '学者' }[p.profession];
    document.getElementById('hud-rank').textContent = fullTitle(st);
    document.getElementById('hud-money').textContent = p.money;
    document.getElementById('hud-fame').textContent = p.fame;
    document.getElementById('hud-stamina').textContent = `${Math.round(p.stamina)}/${p.staminaMax}`;
    document.getElementById('hud-health').textContent = p.health;
    document.getElementById('hud-date').textContent = dateLabel(st.time) + ` ${st.time.day}日`;
    document.getElementById('hud-season').textContent = seasonOf(st.time);
    document.querySelectorAll('#hud-nav button').forEach(b => {
      b.classList.toggle('active', b.dataset.screen === this.screen);
    });
  }

  renderLog() {
    const list = document.getElementById('log-list');
    if (!list || !this.st) return;
    list.innerHTML = this.st.log.slice(0, 40).map(l =>
      `<li class="${esc(l.kind || '')}"><span class="l-date">${esc(l.d)}</span>${esc(l.text)}</li>`).join('');
  }

  log(text, kind = '') {
    addLog(this.st, text, kind);
    this.renderLog();
  }

  // ---------- 弹窗 ----------
  modal(opts) {
    if (this.modalHandle) this.closeModal(false);
    const root = document.getElementById('modal-root');
    root.classList.add('on');
    root.innerHTML = `
      <div class="modal-back"></div>
      <div class="modal ${opts.wide ? 'wide' : ''} ${opts.narrow ? 'narrow' : ''}">
        <div class="modal-head">
          <div><h3>${esc(opts.title ?? '')}</h3>${opts.sub ? `<div class="m-sub">${esc(opts.sub)}</div>` : ''}</div>
          ${opts.closable === false ? '' : '<button class="modal-close" title="关闭">✕</button>'}
        </div>
        <div class="modal-body"></div>
        <div class="modal-foot"></div>
      </div>`;
    const bodyEl = root.querySelector('.modal-body');
    const footEl = root.querySelector('.modal-foot');
    const back = root.querySelector('.modal-back');
    const closeBtn = root.querySelector('.modal-close');

    const handle = {
      root, bodyEl, footEl, opts,
      setBody(html) { bodyEl.innerHTML = html; return handle; },
      setFoot(items = []) {
        footEl.innerHTML = '';
        for (const it of items) {
          const b = document.createElement('button');
          b.className = it.cls ?? 'btn';
          b.textContent = it.label;
          b.disabled = !!it.disabled;
          b.addEventListener('click', () => {
            if (it.onClick) it.onClick(handle);
            if (it.close) handle.close();
          });
          footEl.appendChild(b);
        }
        footEl.style.display = items.length ? '' : 'none';
        return handle;
      },
      close: () => this.closeModal(true),
    };
    handle.bodyEl.innerHTML = opts.body ?? '';
    handle.setFoot(opts.foot ?? []);
    if (closeBtn) closeBtn.addEventListener('click', () => handle.close());
    if (back && opts.closable !== false) back.addEventListener('click', () => handle.close());
    this.modalHandle = handle;
    return handle;
  }

  closeModal(runNext = true) {
    const onClose = this.modalHandle?.opts.onClose;
    const root = document.getElementById('modal-root');
    root.classList.remove('on');
    root.innerHTML = '';
    this.modalHandle = null;
    if (runNext) onClose?.();
    if (runNext && this.queue.length) {
      setTimeout(() => this.nextEvent(), 40);
    } else if (runNext) {
      this.render();
    }
  }

  confirm(msg, onYes) {
    const h = this.modal({
      title: '确认', narrow: true, body: `<p>${esc(msg)}</p>`,
      foot: [
        { label: '罢了', close: true },
        { label: '确定', cls: 'btn primary', close: true, onClick: () => onYes() },
      ],
    });
    return h;
  }

  toast(text, kind = '') {
    const root = document.getElementById('toast-root');
    const t = document.createElement('div');
    t.className = `toast ${kind}`;
    t.textContent = text;
    root.appendChild(t);
    setTimeout(() => t.remove(), 2700);
  }

  // ---------- 行动结果统一处理 ----------
  after(res, opts = {}) {
    if (!res) return;
    const st = this.st;
    if (res.notes?.length) {
      for (const n of res.notes.slice(0, 4)) {
        const kind = n === AUTO_SAVE_ERROR ? 'war' : '';
        this.log(n, kind);
        if (opts.toast !== false) this.toast(n, kind);
      }
    }
    if (res.quests?.length) {
      for (const q of res.quests) {
        const detail = questRewardText(q, this.st);
        this.toast(`差事「${q.title}」已成：${detail}`, 'gain');
        this.log(`差事「${q.title}」已成：${detail}。`, 'gain');
      }
    }
    if (res.promotions?.length) {
      for (const p of res.promotions) {
        this.log(`以功勋擢为${p.state}国${p.rank}。`, 'big');
        this.toast(`擢为${p.state}国${p.rank}`, 'gain');
      }
    }
    this.refreshHud();
    if (res.died || (!this.st.player.alive && !this.endingShown)) {
      setTimeout(() => this.showEnding(), 400);
      return;
    }
    if (res.events?.length) {
      const current = this.modalHandle?.opts.event;
      this.queue = pendingEvents(st).filter(w => !current || w.kind !== current.kind || w.ev.id !== current.id);
      if (!this.modalHandle) this.nextEvent();
      else setTimeout(() => this.nextEvent(), 60);
    } else if (!this.modalHandle) {
      this.render();
    }
  }

  // ---------- 历史/随机事件队列 ----------
  nextEvent() {
    if (this.modalHandle || this.screen === 'title' || this.screen === 'ending') return;
    if (!this.queue.length) { this.render(); return; }
    const st = this.st;
    const wrapped = this.queue.shift();
    const prep = prepareEvent(st, wrapped);
    const ev = prep.ev;
    const isTimeline = wrapped.kind === 'timeline';
    const notesHtml = prep.notes?.length ? `<div class="footnote">${prep.notes.map(esc).join(' ')}</div>` : '';
    const baseBody = `<p style="line-height:1.95">${ev.body}</p>${notesHtml}`;

    const avail = (ev.choices ?? []).filter(c => choiceAvailable(st, c));
    const locked = (ev.choices ?? []).filter(c => !choiceAvailable(st, c));

    const h = this.modal({
      title: ev.title,
      sub: isTimeline ? `${dateLabel(st.time)} · 天下大势` : `${dateLabel(st.time)} · 际遇`,
      wide: true,
      body: baseBody,
      event: { kind: wrapped.kind, id: ev.id },
      onClose: () => finishEvent(st, wrapped.kind, ev.id),
      foot: [{ label: '知道了', cls: 'btn primary', onClick: hh => hh.close() }],
    });

    const showChoices = () => {
      const html = baseBody + `<div class="choices">` +
        avail.map((c, i) => `<button class="choice-btn" data-i="${i}">${c.label}${c.hint ? `<small>${c.hint}</small>` : ''}</button>`).join('') +
        locked.map(c => `<button class="choice-btn" disabled style="opacity:.45">${c.label}<small>条件不足</small></button>`).join('') +
        `</div>`;
      h.setBody(html);
      h.setFoot([]);
      onClick(h.bodyEl, '.choice-btn', (el) => {
        const choice = avail[+el.dataset.i];
        const r = resolveChoice(st, ev, choice);
        const resHtml = `<p style="line-height:1.95">${r.text}</p>` +
          (r.notes?.length ? `<div class="footnote">${r.notes.join(' ')}</div>` : '') +
          (r.checkInfo ? `<div class="footnote">判定：${r.checkInfo.success ? '成' : '不成'}（${r.checkInfo.roll} / ${r.checkInfo.dc}）</div>` : '');
        h.setBody(resHtml);
        h.setFoot([{ label: '继续', cls: 'btn primary', onClick: hh => {
          hh.close();
          if (r.pendingDuel) setTimeout(() => this.startEncounterDuel(r.pendingDuel), 60);
        } }]);
        this.refreshHud();
      });
    };

    if (avail.length) showChoices();
    else h.setFoot([{ label: '继续', cls: 'btn primary', onClick: hh => hh.close() }]);
  }

  startEncounterDuel(enemy) {
    import('./minigames.js').then(({ duelModal }) => {
      duelModal(this, this.st, { ...enemy }, {
        stakes: 'a chance encounter',
        onEnd: (won) => {
          this.after({ notes: [won ? '你胜了这一场。' : '你负了伤。'] });
        },
      });
    });
  }

  save(silent = false) {
    const ok = saveGame(this.st);
    if (!silent) this.toast(ok ? '已存档' : '存档失败：浏览器存储不可用或空间不足，请导出备份。', ok ? 'gain' : 'war');
    if (ok) this.log('记事已录于简册。');
  }
}

export const app = new App();
