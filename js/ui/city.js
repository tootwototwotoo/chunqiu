// 城中：诸般行动
import { CITY_MAP, STATES, cityState } from '../data/world.js';
import { GOODS } from '../data/goods.js';
import { SKILL_DEFS, PEERAGES, peerageName } from '../data/defs.js';
import { player, npcsHere, rel, addMoney, addFame, addMerit, addStamina, addHealth, addLog,
  skillLevel, R, isMerchant, isWarrior, isDiplomat, isScholar, addRel } from '../state.js';
import { restAtInn, advanceDays } from '../systems/calendar.js';
import { priceAt } from '../systems/trade.js';
import { makeWanderer } from '../systems/combat.js';
import { seekOffice, advise, joinCampaign, officeChance, officeCooldownLeft } from '../systems/progression.js';
import { npcDuelInfo, npcDebateInfo, affName } from '../systems/relations.js';
import { biasName } from '../systems/debate.js';
import { canAcceptTrial, acceptTrial, canStartTrial, canPetition, petition, peerageSummary } from '../systems/peerage.js';
import { openTrialGame } from './trials.js';
import { duelModal, debateModal } from './minigames.js';
import { trainingModal } from './training.js';
import { marketModal } from './market.js';
import { openBoard } from './quests.js';
import { openNpc } from './npc.js';
import { onClick, stateColor, stateName, cityTag, relTierName, skillName } from './common.js';
import { esc, ri, clamp } from '../util.js';

export function mount(root, st, app) {
  const c = CITY_MAP[player(st).cityId];
  const owner = st.world.owner[c.id];
  const p = player(st);
  const acts = buildActions(st, app, c, owner);

  root.innerHTML = `
  <div class="city-hero">
    <div>
      <h1>${c.name}</h1>
      <div class="hero-sub">${c.desc}</div>
      <div class="hero-tags">
        ${cityTag(st, c.id)}
        ${(c.tags ?? []).map(t => `<span class="tag">${{ market: '市集', academy: '学宫', barracks: '校场', court: '朝廷' }[t] ?? t}</span>`).join('')}
        <span class="tag gray">人口 ${c.pop}千</span>
        <span class="tag gray">国势 ${st.world.power[owner] ?? 0}</span>
        ${STATES[owner]?.peer && STATES[owner].peer !== '王' ? `<span class="tag">${STATES[owner].peer}爵</span>` : '<span class="tag">王畿</span>'}
      </div>
    </div>
    <div style="text-align:right;font-size:13px;color:#6d6052;line-height:1.9">
      <div>体力 <b style="color:${p.stamina < 30 ? '#9c2b26' : '#42392f'}">${Math.round(p.stamina)}</b> / ${p.staminaMax}</div>
      <div>健康 <b>${p.health}</b> · 名声 <b>${p.fame}</b></div>
      <div>行囊 ${Object.values(p.inventory).reduce((a, b) => a + b, 0)} / ${p.caravan}</div>
    </div>
  </div>
  <div class="cols">
    <div class="panel">
      <div class="section-title">诸般行事 <span class="hint">耗日、耗力，皆有时节</span></div>
      <div class="action-grid" id="action-grid">
        ${acts.map(a => `
          <button class="action" data-act="${a.id}" ${a.disabled ? 'disabled' : ''}>
            <div class="a-name"><span>${a.name}</span></div>
            ${a.cost ? `<div class="a-cost">${a.cost}</div>` : ''}
            <div class="a-desc">${a.desc}</div>
          </button>`).join('')}
      </div>
      <div class="divider"></div>
      <div class="section-title">市价一览 <span class="hint">本地特产最贱</span></div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:6px 14px;font-size:13px">
        ${Object.keys(GOODS).slice(0, 8).map(g => {
          const price = priceAt(st, c.id, g);
          return `<div style="display:flex;justify-content:space-between;border-bottom:1px dotted rgba(120,95,60,.25);padding:3px 0">
            <span>${GOODS[g].name}</span><b style="color:${c.good === g ? '#4d6f56' : '#6d6052'}">${price}</b></div>`;
        }).join('')}
      </div>
    </div>

    <div style="display:flex;flex-direction:column;gap:12px">
      <div class="panel">
        <div class="section-title">城中人物 <span class="hint">${npcsHere(st).length}人</span></div>
        <div class="npc-list">
          ${npcsHere(st).map(n => {
            const r = rel(st, n.id);
            return `<div class="npc-row" data-npc="${n.id}">
              <div class="avatar" style="background:linear-gradient(160deg,${stateColor(n.def.state)},#2a2118)">${n.def.name[0]}</div>
              <div class="n-main"><div class="n-name">${n.def.name}</div><div class="n-title">${n.def.title} · ${biasName(n.def.bias)}</div></div>
              <div class="n-rel">${r.met ? relTierName(r.aff) : '未识'}</div>
            </div>`;
          }).join('') || '<div class="empty">城中并无知名之士。</div>'}
        </div>
      </div>
      ${profPanelHtml(st, app, c)}
    </div>
  </div>`;

  onClick(root, '.action', (el) => {
    const a = acts.find(x => x.id === el.dataset.act);
    if (!a || a.disabled) return;
    a.run();
  });
  onClick(root, '.npc-row', (el) => openNpc(app, st, el.dataset.npc));
}

function buildActions(st, app, c, owner) {
  const p = player(st);
  const acts = [];
  const add = (a) => acts.push(a);

  add({
    id: 'rest', name: '客栈歇息', cost: '3日 · 24金',
    desc: '住店养神，恢复体力与健康。',
    disabled: p.money < 24,
    run: () => {
      const res = restAtInn(st, 3);
      if (!res.ok) { app.toast(res.msg, 'war'); return; }
      app.after(res);
    },
  });

  add({
    id: 'odd', name: '帮佣度日', cost: '1日',
    desc: '在市井做些零工，得几文钱，亦可养息体力。',
    run: () => {
      addStamina(st, 12);
      addMoney(st, 3, true);
      const adv = advanceDays(st, 1);
      app.log('做了一日零工，得钱三文，筋骨稍舒。');
      app.after({ notes: adv.notes, events: adv.events, died: adv.died });
    },
  });

  add({
    id: 'market', name: '市集买卖', cost: '即时',
    desc: `货殖之事，贱买贵卖。行囊容量 ${p.caravan}。`,
    run: () => marketModal(app, st),
  });

  add({
    id: 'train', name: '修习技艺', cost: '1日 · 8力',
    desc: '校场习武，学宫问学，市肆学贾。',
    disabled: p.stamina < 8,
    run: () => openTrain(app, st, c),
  });

  add({
    id: 'board', name: '领受差事', cost: '看榜',
    desc: '官府、世族、商号皆有委托，成则得金与名声。',
    run: () => openBoard(app, st),
  });

  add({
    id: 'travel', name: '出行远游', cost: '按程计日',
    desc: '往舆图另择城邑，车马劳顿，亦有所遇。',
    run: () => app.nav('map'),
  });

  // ---- 职业专属 ----
  if (isWarrior(st)) {
    add({
      id: 'spar', name: '演武较技', cost: '1日 · 12力',
      desc: '于校场与人比试，胜则得彩头与名声。',
      disabled: p.stamina < 12,
      run: () => {
        const foe = makeWanderer(st, 1 + Math.floor(p.fame / 35));
        duelModal(app, st, foe, {
          sub: '演武较技，点到为止',
          settleOpts: { fame: 3, money: 25 + p.fame },
          onEnd: (won) => {
            const adv = advanceDays(st, 1);
            app.after({ ...adv, notes: [...adv.notes, won ? '演武得胜，彩头入手。' : '演武落败，众人唏嘘。'] });
          },
        });
      },
    });
    if (c.tags.includes('court')) {
      const cd = officeCooldownLeft(st);
      const pct = Math.round(officeChance(st) * 100);
      add({
        id: 'office', name: '谒见国君', cost: cd ? `${cd}日后` : '半日',
        desc: p.stateId === owner
          ? '已在朝中，可献策议事。'
          : p.fame < 8
            ? `名声不足（${p.fame}/8），先接差事扬名。`
            : `求仕于${stateName(owner)} · 成算约${pct}%${cd ? ` · ${cd}日后可再谒见` : ''}`,
        disabled: p.stateId === owner || p.fame < 8 || cd > 0,
        run: () => {
          const res = seekOffice(st, owner);
          app.modal({
            title: res.ok ? '拜官' : '求见', narrow: true,
            body: `<p>${res.msg}</p>`,
            foot: [{ label: res.ok ? '谢恩' : '知道了', cls: 'btn primary', onClick: h => h.close() }],
          });
          app.after({});
        },
      });
    }
    if (p.stateId) {
      add({
        id: 'advise', name: '献策于朝', cost: '1日 · 8力',
        desc: '以智略谋国，提升本国势力，积累功勋。',
        disabled: p.stamina < 8,
        run: () => {
          const res = advise(st);
          const adv = advanceDays(st, 1);
          app.modal({
            title: '献策', narrow: true, body: `<p>${res.msg}</p>`,
            foot: [{ label: '继续', cls: 'btn primary', onClick: h => h.close() }],
          });
          app.after(adv);
        },
      });
      add({
        id: 'campaign', name: '从军出征', cost: '20日 · 18力',
        desc: '随本国之师征伐他国，以兵法决胜，功勋与赏赐俱厚。',
        disabled: p.stamina < 18 || !c.tags.includes('barracks'),
        run: () => {
          const res = joinCampaign(st);
          const adv = advanceDays(st, 20);
          app.modal({
            title: '从军', narrow: true,
            body: `<p>${res.msg}</p>`, foot: [{ label: '继续', cls: 'btn primary', onClick: h => h.close() }],
          });
          app.after({ notes: adv.notes, events: adv.events, died: adv.died });
        },
      });
    }
  }

  if (isMerchant(st)) {
    const cost = 200 + p.caravan * 10;
    add({
      id: 'caravan', name: '扩充商队', cost: `${cost}金`,
      desc: `增置车马，行囊容量 +6。现容量 ${p.caravan}。`,
      disabled: p.money < cost,
      run: () => {
        addMoney(st, -cost);
        p.caravan += 6;
        app.log(`商队扩充，行囊增至${p.caravan}。`, 'gain');
        app.after({});
      },
    });
    add({
      id: 'shop', name: '开设商号', cost: '800金',
      desc: p.shops.includes(c.id) ? '本城已有你的商号。' : '设肆于此，每月有进项。',
      disabled: p.money < 800 || p.shops.includes(c.id) || !c.tags.includes('market'),
      run: () => {
        addMoney(st, -800);
        p.shops.push(c.id);
        addFame(st, 3);
        app.log(`于${c.name}开设商号。`, 'big');
        app.after({});
      },
    });
    add({
      id: 'rumor', name: '打探行情', cost: '10金 · 半日',
      desc: '遣人四出探价，知何处可获厚利。',
      disabled: p.money < 10,
      run: () => {
        addMoney(st, -10, true);
        const rows = Object.keys(GOODS).map(g => {
          const here = priceAt(st, c.id, g);
          let best = null;
          for (const cc of Object.values(CITY_MAP)) {
            if (cc.id === c.id) continue;
            const pr = priceAt(st, cc.id, g);
            if (!best || pr > best.price) best = { city: cc.name, price: pr };
          }
          return `<tr><td>${GOODS[g].name}</td><td class="num">${here}</td><td class="num">${best.city}</td><td class="num" style="color:#4d6f56">${best.price - here}</td></tr>`;
        }).join('');
        app.modal({
          title: '行情', sub: '牙人报来的市价', wide: true,
          body: `<table class="table"><thead><tr><th>货</th><th class="num">本地价</th><th class="num">最贵之城</th><th class="num">差价</th></tr></thead><tbody>${rows}</tbody></table>
            <div class="footnote">差价未计路费与牙钱，慎之。</div>`,
          foot: [{ label: '关闭', close: true }],
        });
      },
    });
  }

  if (isDiplomat(st)) {
    add({
      id: 'persuade', name: '游说当道', cost: '1日 · 10力',
      desc: '以口舌动之，成则名声大振，或结两国之好。',
      disabled: p.stamina < 10,
      run: () => openPersuade(app, st),
    });
    if (c.tags.includes('court') && p.stateId !== owner) {
      add({
        id: 'office', name: '谒见国君', cost: '半日',
        desc: `求仕于${stateName(owner)}，以辩才干禄 · 成算约${Math.round(officeChance(st) * 100)}%。`,
        run: () => {
          const res = seekOffice(st, owner);
          app.modal({ title: '求见', narrow: true, body: `<p>${res.msg}</p>`, foot: [{ label: '知道了', cls: 'btn primary', onClick: h => h.close() }] });
          app.after({});
        },
      });
    }
    if (p.stateId) {
      add({
        id: 'advise', name: '献策于朝', cost: '1日 · 8力',
        desc: '以权谋之策动国君，增国势、积功勋。',
        disabled: p.stamina < 8,
        run: () => {
          const res = advise(st);
          const adv = advanceDays(st, 1);
          app.modal({ title: '献策', narrow: true, body: `<p>${res.msg}</p>`, foot: [{ label: '继续', cls: 'btn primary', onClick: h => h.close() }] });
          app.after(adv);
        },
      });
    }
  }

  if (isScholar(st)) {
    add({
      id: 'lecture', name: '设坛讲学', cost: '1日 · 10力',
      desc: '开讲经义，招徕弟子，得束脩与名声。',
      disabled: p.stamina < 10,
      run: () => {
        addStamina(st, -10);
        const roll = skillLevel(st, 'xuewen') * 6 + p.stats.zhi * 0.35 + p.fame * 0.3 + R.int(st, 0, 20);
        const adv = advanceDays(st, 1);
        if (roll >= 34) {
          p.disciples += 1;
          addFame(st, 4);
          addMoney(st, 30 + p.disciples * 2);
          app.log('设坛讲学，听众甚众，有弟子来投。', 'gain');
          app.modal({
            title: '讲学', narrow: true,
            body: `<p>你登坛陈义，听者数百。讲毕，有少年执贽来拜，愿为弟子。</p><div class="footnote">弟子+1，名声+4，得束脩${30 + p.disciples * 2}金。</div>`,
            foot: [{ label: '继续', cls: 'btn primary', onClick: h => h.close() }],
          });
        } else {
          addFame(st, 1);
          app.log('讲学一场，应者寥寥。');
          app.modal({ title: '讲学', narrow: true, body: '<p>你登坛讲了一日，听者渐散。学未至，人未信。</p>', foot: [{ label: '继续', cls: 'btn primary', onClick: h => h.close() }] });
        }
        app.after({ notes: adv.notes, events: adv.events, died: adv.died });
      },
    });
    add({
      id: 'book', name: '著书立说', cost: '10日 · 100金',
      desc: p.works.length ? `已成书${p.works.length}篇，再著可增名望。` : '立一家之言，成一家之书。需学问五级。',
      disabled: p.money < 100 || skillLevel(st, 'xuewen') < 5 || p.stamina < 20,
      run: () => openBook(app, st),
    });
    add({
      id: 'debate_scholar', name: '与士论辩', cost: '1日 · 6力',
      desc: '城中若有名士，可与论难，以广见闻。',
      disabled: p.stamina < 6,
      run: () => {
        const target = npcsHere(st).find(n => ['scholar', 'minister'].includes(n.def.role));
        if (!target) { app.toast('城中无可论辩之人。', 'war'); return; }
        debateModal(app, st, { ...npcDebateInfo(st, target.id), title: target.def.title, stats: target.def.stats }, {
          sub: '论道', topic: '学问',
          settleOpts: { fame: 2, rel: 5 },
          onEnd: () => app.after({}),
        });
      },
    });
  }

  // 任何人都可向在场的国君求仕
  if (!['merchant'].includes(p.profession) && c.tags.includes('court') && p.stateId !== owner && !acts.some(a => a.id === 'office')) {
    add({
      id: 'office', name: '谒见国君', cost: '半日',
      desc: p.fame < 8 ? `名声不足（${p.fame}/8），先接差事扬名。` : `求仕于${stateName(owner)} · 成算约${Math.round(officeChance(st) * 100)}%。`,
      disabled: p.fame < 8,
      run: () => {
        const res = seekOffice(st, owner);
        app.modal({ title: '求见', narrow: true, body: `<p>${res.msg}</p>`, foot: [{ label: '知道了', cls: 'btn primary', onClick: h => h.close() }] });
        app.after({});
      },
    });
  }

  for (const a of trialActions(st, app, c)) add(a);

  return acts;
}


function trialActions(st, app, c) {
  const p = player(st);
  const out = [];
  if (!['youxia', 'shuike', 'xuezhe'].includes(p.profession)) return out;
  const sum = peerageSummary(st);
  const atLuoyi = c.id === 'luoyi';

  if (atLuoyi) {
    const acc = canAcceptTrial(st);
    if (acc.ok) {
      out.push({
        id: 'trial_accept', name: '领受册命之试', cost: '1日',
        desc: `目标${acc.next.name}爵 · ${['乡邑之试', '邦交之试', '国政之试', '霸业之试', '天下秩序'][acc.idx]}：${sum.next ? `需功勋${acc.next.merit}、名声${acc.next.fame}` : ''}`,
        run: () => {
          const res = acceptTrial(st);
          if (!res.ok) { app.toast(res.msg, 'war'); return; }
          const adv = advanceDays(st, 1);
          const target = res.variant.targetCity ? CITY_MAP[res.variant.targetCity].name : '洛邑';
          app.modal({
            title: '领受册命之试',
            sub: res.variant.title,
            body: `<p>${esc(res.variant.desc)}</p>
              <div class="kv"><dt>地点</dt><dd>${target}</dd><dt>限期</dt><dd>${res.trial.exp != null ? Math.max(0, res.trial.exp - (st.time.year + 722) * 360 - (st.time.month - 1) * 30 - st.time.day) : '—'} 日</dd></div>
              <div class="footnote">至${target}后即可开始；逾期则试炼失败，周室另命新试。</div>`,
            foot: [{ label: '知道了', cls: 'btn primary', onClick: h => { h.close(); app.after({ notes: adv.notes, events: adv.events }); } }],
          });
        },
      });
    } else if (sum.trial?.status === 'pending' && sum.cooldown > 0) {
      out.push({
        id: 'trial_wait', name: '周室议而未决', cost: `${sum.cooldown}日`,
        desc: `新试炼「${sum.variant?.title ?? '待定'}」须待${sum.cooldown}日后方可领受。`,
        disabled: true, run: () => {},
      });
    }
  }

  const stChk = canStartTrial(st);
  if (stChk.ok) {
    out.push({
      id: 'trial_start', name: '开始册命之试', cost: '即刻',
      desc: `${stChk.variant.title}：${stChk.variant.desc}`,
      run: () => openTrialGame(app, st),
    });
  }

  if (atLuoyi) {
    const pet = canPetition(st);
    if (pet.ok) {
      out.push({
        id: 'trial_petition', name: '请封于周', cost: '300金',
        desc: `请封${pet.next.name}爵 · 成算约${Math.round(pet.chance * 100)}%${sum.fails ? ` · 已${sum.fails}次未准` : ''}`,
        run: () => openPetition(app, st),
      });
    } else if (sum.trial?.status === 'done') {
      out.push({ id: 'trial_petition_blocked', name: '请封于周', cost: '条件不足', desc: pet.msg, disabled: true, run: () => {} });
    }
  }
  return out;
}

function openPetition(app, st) {
  const chk = canPetition(st);
  if (!chk.ok) { app.toast(chk.msg, 'war'); return; }
  const sum = peerageSummary(st);
  const pct = Math.round(chk.chance * 100);
  app.modal({
    title: '请封于周', sub: `目标：${chk.next.name}爵`, wide: false,
    body: `<p>试炼「${sum.variant?.title ?? ''}」已成，评价 <b>${sum.trial?.performance ?? 0}</b>。</p>
      <div class="kv">
        <dt>成算</dt><dd>${pct}%${sum.guarantee ? '（天子感其诚，必准）' : ''}</dd>
        <dt>诚意</dt><dd>${sum.fails} 次未准${sum.fails ? `（+${Math.min(24, sum.fails * 8)}%）` : ''}</dd>
        <dt>贽礼</dt><dd>300 金（未准退半）</dd>
      </div>
      <div class="footnote">未准则名声小损，周室另命新试；五次未准后，第六次必得册命。</div>`,
    foot: [
      { label: '再候时机', close: true },
      { label: '请封', cls: 'btn primary', onClick: (h) => {
        h.close();
        const res = petition(st);
        if (!res.ok) { app.toast(res.msg, 'war'); return; }
        app.modal({
          title: res.success ? '册命' : '未准',
          body: `<p>${res.msg}</p>${res.success ? `<div class="footnote">受封${res.peer.name}爵，食邑${CITY_MAP[res.fief].name}，每月食禄${res.peer.income}金。</div>` : '<div class="footnote">名声-2，贽礼退半；新试炼已下。</div>'}`,
          foot: [{ label: '继续', cls: 'btn primary', onClick: hh => { hh.close(); app.after({}); } }],
        });
        app.refreshHud();
      } },
    ],
  });
}

function openTrain(app, st, c) {
  const p = player(st);
  const bonusFor = (k) => {
    if (c.tags.includes('barracks') && ['jianshu', 'sheshu', 'bingfa'].includes(k)) return 6;
    if (c.tags.includes('academy') && ['biancai', 'quanmou', 'xuewen'].includes(k)) return 6;
    if (c.tags.includes('market') && ['shanggu', 'suanshu'].includes(k)) return 6;
    return 0;
  };
  const h = app.modal({
    title: '修习', sub: '择一艺而习之', narrow: true,
    body: `<div class="footnote">于校场、学宫、市肆修习，可得地利。现体力 ${Math.round(p.stamina)}。</div>
      <div class="choices" style="margin-top:10px">
        ${Object.keys(SKILL_DEFS).map(k => {
          const b = bonusFor(k);
          return `<button class="choice-btn" data-k="${k}">${SKILL_DEFS[k].name}
            <small>${SKILL_DEFS[k].where} · 现有 ${p.skills[k] ?? 0} 级${b ? ' · <span style="color:#9c2b26">地利（经验 +2）</span>' : ''}</small></button>`;
        }).join('')}
      </div>`,
    foot: [{ label: '关闭', close: true }],
  });
  onClick(h.bodyEl, '[data-k]', (el) => {
    if (p.stamina < 8) { app.toast('体力不济。', 'war'); return; }
    h.close();
    trainingModal(app, st, el.dataset.k, { bonus: bonusFor(el.dataset.k), sub: `${CITY_MAP[p.cityId].name} · ${SKILL_DEFS[el.dataset.k].where}` });
  });
}

function openPersuade(app, st) {
  const here = npcsHere(st);
  const target = here.find(n => n.def.role === 'ruler') ?? here.find(n => n.def.role === 'minister') ?? here[0];
  if (!target) { app.toast('此地无人可说服。', 'war'); return; }
  const info = npcDebateInfo(st, target.id);
  debateModal(app, st, { ...info, title: target.def.title, stats: target.def.stats }, {
    sub: `游说${target.def.name}`, topic: '结好之事', difficulty: info.difficulty,
    onEnd: (won) => {
      if (won) {
        const p = player(st);
        p.missions += 1;
        p.alliances += 1;
        addMoney(st, 80);
        addFame(st, 6);
        addRel(st, target.id, 8);
        st.world.power[target.def.state] = clamp((st.world.power[target.def.state] ?? 30) + 2, 5, 100);
        app.log(`游说${target.def.name}成功，两国通好。`, 'big');
        app.after({ notes: ['游说成功：名声+6，得金80，促成盟约一则。'] });
      } else {
        app.after({ notes: ['对方不应，游说不成。'] });
      }
    },
  });
}

function openBook(app, st) {
  const p = player(st);
  const doctrines = ['儒家', '道家', '墨家', '法家', '兵家', '阴阳家'];
  if (!p.doctrine) {
    const h = app.modal({
      title: '立说', sub: '择一家之言', narrow: true,
      body: `<p>著书之前，须先立定宗旨。</p><div class="choices">${doctrines.map(d => `<button class="choice-btn" data-d="${d}">${d}</button>`).join('')}</div>`,
      foot: [{ label: '再思', close: true }],
    });
    onClick(h.bodyEl, '[data-d]', (el) => { p.doctrine = el.dataset.d; h.close(); writeBook(app, st); });
  } else writeBook(app, st);
}

function writeBook(app, st) {
  const p = player(st);
  addMoney(st, -100);
  addStamina(st, -20);
  const titles = ['《' + (p.doctrine ?? '道') + '论》', '《治世书》', '《问对》', '《春秋微言》', '《政要》'];
  const title = R.pick(st, titles);
  const adv = advanceDays(st, 10);
  p.works.push({ title, year: st.time.year });
  addFame(st, 10);
  app.log(`著${title}成，名声大振。`, 'big');
  app.modal({
    title: '书成', wide: false,
    body: `<p>闭户十日，${title}成。你搁笔时，窗外已是另一个季节。</p>
      <div class="footnote">名声+10，学统一脉，自此有本。</div>`,
    foot: [{ label: '继续', cls: 'btn primary', onClick: h => h.close() }],
  });
  app.after({ notes: adv.notes, events: adv.events, died: adv.died });
}

function profPanelHtml(st, app, c) {
  const p = player(st);
  if (p.profession === 'shangren') {
    const income = p.shops.length * 55 + p.hired * 8;
    return `<div class="panel">
      <div class="section-title">商号</div>
      <div class="kv">
        <dt>商队容量</dt><dd>${p.caravan}</dd>
        <dt>商号</dt><dd>${p.shops.length ? p.shops.map(id => CITY_MAP[id].name).join('、') : '无'}</dd>
        <dt>月入</dt><dd>${income} 金</dd>
      </div>
      <div class="footnote">开号于通都大邑，每月坐收其利；走货于贱贵之间，可获倍蓰之息。</div>
    </div>`;
  }
  if (p.profession === 'xuezhe') {
    return `<div class="panel">
      <div class="section-title">学统</div>
      <div class="kv">
        <dt>宗旨</dt><dd>${esc(p.doctrine ?? '未立')}</dd>
        <dt>弟子</dt><dd>${p.disciples} 人</dd>
        <dt>著述</dt><dd>${p.works.length ? p.works.map(w => esc(w.title)).join('、') : '无'}</dd>
      </div>
      <div class="footnote">讲学得名，著书立说；弟子既众，束脩自至。</div>
    </div>`;
  }
  return `<div class="panel">
    <div class="section-title">${p.profession === 'shuike' ? '纵横' : '仕途'}</div>
    <div class="kv">
      <dt>所仕</dt><dd>${p.stateId ? STATES[p.stateId].name : '未仕'}</dd>
      <dt>官阶</dt><dd>${p.stateId ? ['布衣','士','中士','上士','大夫','中大夫','上大夫','卿','执政'][p.rank] : '—'}</dd>
      <dt>爵位</dt><dd>${p.peerage ? `${peerageName(p.peerage.rank)}·食邑${CITY_MAP[p.peerage.fief]?.name ?? ''}` : '未受封'}</dd>
      <dt>功勋</dt><dd>${p.merit}</dd>
      <dt>${p.profession === 'shuike' ? '盟约' : '胜绩'}</dt><dd>${p.profession === 'shuike' ? p.missions : st.stats.duelWins}</dd>
    </div>
    <div class="footnote">${p.stateId ? '献策、从军、巡守皆可积累功勋，功勋既厚，自得擢升。' : '先谋出仕，方可一展抱负。'}</div>
  </div>`;
}
