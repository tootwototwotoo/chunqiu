// 标题、开局创建、结局
import { newGame, hasSave, loadGame, deleteSave, age } from '../state.js';
import { PROFESSIONS, ERAS } from '../data/defs.js';
import { onClick, gameDate } from './common.js';
import { esc, yearLabel } from '../util.js';

let mode = 'main';
let chosenProf = 'youxia';
let chosenGender = '男';
let chosenEra = 'early';

export function mount(root, st, app) {
  document.body.classList.add('title-mode');
  if (app && app.st && app.st.player && app.screen !== 'title') return;
  root.innerHTML = mode === 'main' ? mainHtml() : createHtml();
  if (mode === 'main') {
    onClick(root, '[data-act="new"]', () => { mode = 'create'; app.showTitle(); });
    onClick(root, '[data-act="help"]', () => openHelp(app));
    onClick(root, '[data-act="continue"]', () => {
      const saved = loadGame();
      if (!saved) { app.toast('未找到存档', 'war'); return; }
      mode = 'main';
      app.startGame(saved);
    });
  } else {
    onClick(root, '[data-act="back"]', () => { mode = 'main'; app.showTitle(); });
    onClick(root, '[data-prof]', (el) => {
      chosenProf = el.dataset.prof;
      root.querySelectorAll('[data-prof]').forEach(b => b.classList.toggle('sel', b.dataset.prof === chosenProf));
      const d = root.querySelector('#prof-desc');
      if (d) d.textContent = PROFESSIONS[chosenProf].desc;
    });
    onClick(root, '[data-era]', (el) => {
      chosenEra = el.dataset.era;
      root.querySelectorAll('[data-era]').forEach(b => b.classList.toggle('sel', b.dataset.era === chosenEra));
      const d = root.querySelector('#era-desc');
      if (d) d.textContent = ERAS.find(e => e.id === chosenEra).desc;
    });
    onClick(root, '[data-gender]', (el) => {
      chosenGender = el.dataset.gender;
      root.querySelectorAll('[data-gender]').forEach(b => b.classList.toggle('sel', b.dataset.gender === chosenGender));
    });
    onClick(root, '[data-act="start"]', () => {
      const name = (root.querySelector('#pname')?.value || '').trim() || '无名';
      const g = root.querySelector('#pseed')?.value;
      const st2 = newGame({ name, gender: chosenGender, profession: chosenProf, seed: g ? Number(g) || Date.now() : Date.now(), era: chosenEra });
      const eraDef = ERAS.find(e => e.id === chosenEra);
      const startCity = { luoyi: '洛邑', tao: '陶', qufu: '曲阜' }[st2.player.cityId] ?? '洛邑';
      mode = 'main';
      app.startGame(st2);
      app.modal({
        title: '乱世之始', wide: true, closable: false,
        body: `<div class="dialog-line"><div class="avatar">${esc(name[0])}</div>
          <div class="dl-body"><div class="dl-name">${eraDef.name} · ${yearLabel(st2.time.year)}</div>
          <div class="dl-text">${eraDef.desc}<br><br>
          你名${esc(name)}，${PROFESSIONS[chosenProf].name}之身，自${startCity}起步。<br>
          天下之大，何处不可去得？</div></div></div>
          <div class="footnote">提示：先在城中接些差事，攒钱修习技艺；名声既著，方可谒见国君。舆图可远行，纪事录于右侧。</div>`,
        foot: [{ label: '入世', cls: 'btn primary', onClick: h => h.close() }],
      });
    });
  }
}

function mainHtml() {
  return `
  <div class="title-screen">
    <div class="title-inner">
      <h1 class="title-big">春秋</h1>
      <div class="title-sub">列 国 志</div>
      <div class="title-quote">
        弑君三十六，亡国五十二，诸侯奔走不得保其社稷者，不可胜数。<br>
        ——《史记·太史公自序》
      </div>
      <div class="btn-row" style="justify-content:center">
        ${hasSave() ? '<button class="btn primary" data-act="continue">继续前缘</button>' : ''}
        <button class="btn ${hasSave() ? '' : 'primary'}" data-act="new">立身乱世</button>
        <button class="btn ghost" data-act="help">玩法</button>
      </div>
      <div class="footnote" style="margin-top:22px">
        前722年—前473年 · 列国十六城 · 游侠、商人、说客、学者四途
      </div>
    </div>
  </div>`;
}

function createHtml() {
  const profs = Object.values(PROFESSIONS).map(p => `
    <button class="prof-card" data-prof="${p.id}">
      <b>${p.seal} · ${p.name}</b>
      <small>${p.desc}</small>
      <small style="color:#9c2b26">金 ${p.start.money} · 名声 ${p.start.fame} · 武${p.start.stats.wu} 智${p.start.stats.zhi} 政${p.start.stats.zheng} 魅${p.start.stats.mei}</small>
    </button>`).join('');
  return `
  <div class="title-screen">
    <div class="panel" style="width:min(720px,94vw)">
      <h2>立身 <span class="sub">春秋之世，士农工商，皆可成名</span></h2>
      <div class="divider"></div>
      <div class="field"><label>姓名</label><input id="pname" type="text" maxlength="8" placeholder="请输入名讳" value=""></div>
      <div class="field"><label>性别</label>
        <div class="seg">
          <button data-gender="男" class="sel">男</button>
          <button data-gender="女">女</button>
        </div>
      </div>
      <div class="field"><label>天命</label><input id="pseed" type="text" placeholder="留空则听天由命（可填数字）"></div>
      <div class="section-title" style="margin-top:16px">择年代 <span class="hint">不同年代，人物与时局皆异</span></div>
      <div class="btn-row" style="flex-wrap:wrap">
        ${ERAS.map(e => `<button class="btn sm ${e.id === chosenEra ? 'primary' : ''}" data-era="${e.id}">${e.name}</button>`).join('')}
      </div>
      <div class="desc" id="era-desc">${ERAS[0].desc}</div>
      <div class="section-title" style="margin-top:6px">择一途</div>
      <div class="creation-grid">${profs}</div>
      <div class="desc" id="prof-desc">${PROFESSIONS[chosenProf].desc}</div>
      <div class="btn-row" style="justify-content:flex-end">
        <button class="btn ghost" data-act="back">返回</button>
        <button class="btn primary" data-act="start">入世</button>
      </div>
    </div>
  </div>`;
}

export function mountEnding(root, ending, st, app) {
  const stats = ending.stats.map(([k, v]) => `<div class="es"><b>${v}</b><small>${k}</small></div>`).join('');
  root.innerHTML = `
  <div class="title-screen">
    <div class="panel" style="width:min(680px,94vw)">
      <h2>一生 <span class="sub">${gameDate(st.time)} · 享年${ending.age}</span></h2>
      <div class="end-rank">${ending.rank}</div>
      <div class="end-quote">${ending.comment}<br><span style="color:#6d6052;font-size:13px">${ending.epilogue}</span></div>
      <div class="ending-stats">${stats}</div>
      <div class="desc">${ending.title} · 评分 ${ending.score}</div>
      <div class="divider"></div>
      <div class="btn-row" style="justify-content:flex-end">
        <button class="btn" data-act="title">回到标题</button>
        <button class="btn primary" data-act="again">再历一世</button>
      </div>
      <div class="footnote">你的故事已录入简册。旧存档仍在，可在标题画面继续。</div>
    </div>
  </div>`;
  onClick(root, '[data-act="again"]', () => {
    deleteSave();
    mode = 'create';
    app.showTitle();
  });
  onClick(root, '[data-act="title"]', () => {
    mode = 'main';
    app.showTitle();
  });
}


export function openHelp(app) {
  app.modal({
    title: '玩法', sub: '春秋·列国志', wide: true, closable: true,
    body: `
      <div class="section-title">所为何事</div>
      <p>你生于春秋乱世，以布衣之身择一途立命：或以剑仕国，或以商致富，或以辩合纵，或以学立言。
      名声既著，可谒见国君，由士而大夫而卿，佐一国称霸；亦可行走列国，观二百五十年兴亡。</p>

      <div class="section-title">四途</div>
      <ul style="line-height:2;margin:4px 0 8px 18px">
        <li><b>游侠</b>：演武、除害、从军。决斗以「斩克突、突克崩、崩克斩」相制，守可回气，绝招耗气。</li>
        <li><b>商人</b>：各地物价不同，贱买贵卖。扩充商队增载量，开设商号得月入，打探行情知贵贱。</li>
        <li><b>说客</b>：游说当道，观其性向（好利／重义／好名／尚势）对症下药，成则名声与盟约俱增。</li>
        <li><b>学者</b>：设坛讲学收弟子，著书立说成一家；亦可与名士论辩。</li>
      </ul>

      <div class="section-title">时日与技艺</div>
      <p>一切行事皆耗时日与体力。修习为时机小游戏：光标落入朱色区间时按「止」。城中校场、学宫、市肆各有所长，
      在其地修习可得地利。技艺十级为满，名声、爵位、金钱与弟子数决定结局评价。</p>

      <div class="section-title">交游与差事</div>
      <p>城中人物可交谈、赠礼、问学、切磋、论辩。交情二十五以上可请教学艺，五十二以上为知己，七十五以上为挚友。
      榜文上的差事分「出行」与「即办」两类：出行须在限期之内抵达目的地，运货类还须自备货物。</p>

      <div class="section-title">操作</div>
      <p>顶栏切换舆图、城中、人物、差事、交游、名鉴、存档。舆图上点击城邑可见路程与国势，再点「启程前往」。
      修习时可按 <kbd>空格</kbd> 代替「止」，<kbd>Esc</kbd> 关闭弹窗。存档可导出为文本备份。</p>
    `,
    foot: [{ label: '明白了', cls: 'btn primary', close: true }],
  });
}
