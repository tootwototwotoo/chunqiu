// 人物交互弹窗
import { NPC_MAP } from '../data/npcs.js';
import { STATES, CITY_MAP } from '../data/world.js';
import { canTakeOffice } from '../systems/progression.js';
import { player, rel, npcsHere, addRel, addFame, addMoney, addMerit, skillLevel } from '../state.js';
import { talk, giveGift, learnFrom, teachInfo, giftCandidates, affName, affTier, npcDuelInfo, npcDebateInfo } from '../systems/relations.js';
import { biasName, BIAS_TIP } from '../systems/debate.js';
import { duelModal } from './minigames.js';
import { debateModal, categoryForRole } from './debate.js';
import { skillName, onClick, avatar, relTierName } from './common.js';
import { esc } from '../util.js';
import { npcEvidence, askNpc } from '../systems/evidence.js';
import { advanceDays } from '../systems/calendar.js';

export function openNpc(app, st, npcId) {
  const def = NPC_MAP[npcId];
  const r = rel(st, npcId);
  const atHome = st.npc[npcId]?.city === st.player.cityId;
  const f = DEF_BIAS(rel(st, npcId).aff >= 32);

  const handle = app.modal({
    title: def.name,
    sub: `${def.title} · ${STATES[def.state].name}国 · ${CITY_MAP[def.city].name}`,
    wide: true,
    body: '',
    foot: [{ label: '离开', close: true }],
  });

  function render(extra = '') {
    const rr = rel(st, npcId);
    const evs = npcEvidence(st, npcId);
    handle.setBody(`
      <div class="dialog-line">
        ${avatar(def.name, STATES[def.state].color)}
        <div class="dl-body">
          <div class="dl-name">${def.name} · ${def.title}</div>
          <div class="dl-text">「${def.quote}」</div>
        </div>
      </div>
      <div class="desc" style="margin-top:0">${def.desc}</div>
      <div style="display:flex;gap:18px;align-items:center;font-size:13px;margin:8px 0 12px">
        <div style="flex:1">
          <div style="display:flex;justify-content:space-between"><span>交情</span><span style="color:#9c2b26">${relTierName(rr.aff)} ${rr.aff}</span></div>
          <div class="bar red"><i style="width:${rr.aff}%"></i></div>
        </div>
        <div style="flex:0 0 auto;color:#6d6052;font-size:12px;max-width:190px;text-align:right" title="${BIAS_TIP[def.bias] ?? ''}">心性：${biasName(def.bias)}<br><span style="font-size:10.5px;color:#8d8478">${BIAS_TIP[def.bias] ?? ''}<br>论辩中心性不变</span></div>
      </div>
      ${extra}
      <div class="btn-row" style="margin-top:14px">
        <button class="btn" data-act="talk">交谈</button>
        <button class="btn" data-act="gift" ${atHome ? '' : 'disabled'}>赠礼</button>
        <button class="btn" data-act="learn" ${atHome ? '' : 'disabled'}>问学</button>
        <button class="btn" data-act="duel" ${atHome ? '' : 'disabled'}>切磋</button>
        <button class="btn" data-act="debate" ${atHome ? '' : 'disabled'}>论辩</button>
        ${evs.length ? `<button class="btn" data-act="ask" ${atHome && rr.aff > 20 ? '' : 'disabled'}>打听消息</button>` : ''}
        ${rr.aff >= 75 && player(st).fame >= 20 && canTakeOffice(st).ok ? '<button class="btn" data-act="recommend">举荐</button>' : ''}
      </div>
      ${!atHome ? '<div class="footnote">此人不在你所在之城，须先行前往。</div>' : ''}
    `);
    bind(handle);
  }

  function bind(h) {
    onClick(h.bodyEl, '[data-act="talk"]', () => {
      const res = talk(st, npcId);
      render(`<div class="dialog-line me"><div class="dl-body"><div class="dl-text">${res.line}</div></div></div>
        ${res.extra ? `<div class="footnote">${res.extra}</div>` : ''}
        <div class="footnote" style="color:#4d6f56">交情 +${res.aff}</div>`);
      app.refreshHud();
    });

    onClick(h.bodyEl, '[data-act="gift"]', () => {
      const all = giftCandidates(st, npcId);
      const list = all.filter(g => g.have > 0);
      if (list.length && list[0].blocked) { render(`<div class="footnote">${list[0].blocked}</div>`); return; }
      const html = list.length ? `
        <div class="section-title">择一物相赠</div>
        <div class="choices">
          ${list.map(g => `<button class="choice-btn" data-gift="${g.id}">${g.name}（现有${g.have}）${g.pref ? ' · <span style="color:#9c2b26">正合其意</span>' : ''}<small>交情约 +${g.gain}</small></button>`).join('')}
        </div>` : `<div class="empty">你并无货物可赠。可往市集购些玉、丝、马匹之类。</div>`;
      h.setBody(html);
      onClick(h.bodyEl, '[data-gift]', (el) => {
        const res = giveGift(st, npcId, el.dataset.gift);
        render(res.ok ? `<div class="dialog-line me"><div class="dl-body"><div class="dl-text">${res.line}</div></div></div>
          <div class="footnote" style="color:#4d6f56">交情 +${res.gain}${res.match ? '（投其所好）' : ''}</div>` : `<div class="footnote">${res.msg}</div>`);
        app.refreshHud();
      });
    });

    onClick(h.bodyEl, '[data-act="learn"]', () => {
      const opts = teachInfo(st, npcId).filter(t => t.npcLv >= 3);
      if (!opts.length) { render('<div class="footnote">此人并无可以传授于你的技艺。</div>'); return; }
      h.setBody(`<div class="section-title">请教学艺 <span class="hint">需交情 25 以上，束脩随技艺而增</span></div>
        <div class="choices">
          ${opts.map(t => `<button class="choice-btn" data-skill="${t.key}" ${t.can ? '' : 'disabled'}>
            ${t.name}<small>${def.name} ${t.npcLv} 级 · 你 ${t.myLv} 级 · 束脩 ${t.cost} 金${t.can ? '' : ' · 交情不足'}</small></button>`).join('')}
        </div>`);
      onClick(h.bodyEl, '[data-skill]', (el) => {
        const res = learnFrom(st, npcId, el.dataset.skill);
        render(res.ok ? `<div class="dialog-line me"><div class="dl-body"><div class="dl-text">${res.line}</div></div></div>
          <div class="footnote" style="color:#4d6f56">${skillName(el.dataset.skill)}经验 +${res.exp}${res.leveled ? ' · 晋一级！' : ''}</div>`
          : `<div class="footnote">${res.msg}</div>`);
        app.refreshHud();
      });
    });

    onClick(h.bodyEl, '[data-act="duel"]', () => {
      const info = npcDuelInfo(st, npcId);
      app.confirm(`与${def.name}切磋一番？点到为止，胜负不伤性命。`, () => {
        duelModal(app, st, info, {
          sub: '以武会友，点到为止', settleOpts: { rel: 6, fame: 2, money: 0 },
          onEnd: (won) => {
            render(`<div class="footnote">${won ? '你胜了，对方拱手称服。' : '你输了，对方扶你起来，笑道：「再来。」'}</div>`);
            app.refreshHud();
          },
        });
      });
    });

    onClick(h.bodyEl, '[data-act="debate"]', () => {
      debateModal(app, st, {
        id: def.id, name: def.name, title: def.title, bias: def.bias,
      }, {
        category: categoryForRole(def.role),
        onEnd: ({ result }) => {
          const line = result === 'success' ? '对方抚掌：「善哉斯言！」'
            : result === 'compromise' ? '对方沉吟：「容我再思。」'
              : '对方摇头：「子之言，未达也。」';
          render(`<div class="footnote">${line}</div>`);
          app.refreshHud();
        },
      });
    });

    onClick(h.bodyEl, '[data-act="ask"]', () => {
      const evs = npcEvidence(st, npcId);
      if (!evs.length) return;
      const askOne = (ev) => {
        h.close();
        const r = askNpc(st, npcId, ev.id);
        const adv = advanceDays(st, 1);
        app.modal({
          title: r.ok ? '打听所得' : '打听未果', narrow: true,
          body: `<p>${r.msg}</p>`,
          foot: [{ label: '继续', cls: 'btn primary', onClick: hh => { hh.close(); app.after({ notes: adv.notes, events: adv.events, died: adv.died }); } }],
        });
        app.refreshHud();
      };
      if (evs.length === 1) { askOne(evs[0]); return; }
      const sub = app.modal({
        title: '打听消息', sub: `${def.name}知道的事`, narrow: true,
        body: `<div class="choices">${evs.map(e => `<button class="choice-btn" data-ask-ev="${e.id}">${e.name}<small>${e.text}</small></button>`).join('')}</div>`,
        foot: [{ label: '罢了', close: true }],
      });
      onClick(sub.bodyEl, '[data-ask-ev]', (el) => {
        sub.close();
        askOne(evs.find(e => e.id === el.dataset.askEv));
      });
    });

    onClick(h.bodyEl, '[data-act="recommend"]', () => {
      const rr = rel(st, npcId);
      if (!canTakeOffice(st).ok) { render(`<div class="footnote">${canTakeOffice(st).msg}</div>`); return; }
      if (rr.aff < 75 || player(st).fame < 20) { render('<div class="footnote">交情或名声不足，对方不肯举荐。</div>'); return; }
      const p = player(st);
      if (p.stateId === def.state) {
        addMerit(st, 15);
        addRel(st, npcId, -2);
        app.log(`${def.name}为你进言，功勋+15。`, 'gain');
        render('<div class="footnote">对方在朝堂之上为你进言，功勋 +15。</div>');
      } else if (p.stateId && p.stateId !== def.state) {
        addFame(st, 2);
        render(`<div class="footnote">${def.name}道：「君已仕于${STATES[p.stateId].name}，何来他求？」</div>`);
      } else {
        p.stateId = def.state;
        p.rank = 1;
        p.merit = Math.max(p.merit, 10);
        addFame(st, 4);
        app.log(`得${def.name}举荐，仕于${STATES[def.state].name}。`, 'big');
        render(`<div class="footnote">${def.name}修书一封，你持书入朝，拜为${STATES[def.state].name}国士。</div>`);
      }
      app.refreshHud();
    });
  }

  render();
  return handle;
}

function DEF_BIAS() { return true; }
