// 标题、开局创建、结局
import { newGame, hasSave, loadLatestGame, deleteSave, age } from '../state.js';
import { PROFESSIONS, ERAS } from '../data/defs.js';
import { CITIES } from '../data/world.js';
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
      const saved = loadLatestGame();
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
        前722年—前473年 · 列国${CITIES.length}城 · 游侠、商人、说客、学者四途
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
      <div class="desc">${esc(ending.title)} · 评分 ${ending.score}</div>
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
        <li><b>说客</b>：三回合论辩。认同度初始 50，每轮从三项具体回应中选一：切中顾虑 +15、有道理 +5、回避 −10；思路合心性 +5、相悖 −5；每局可出示一次相关证据 +10。三轮后 ≥70 成功、40–69 妥协、<40 失败。心性固定可见，三回合中不会改变。成则名声与盟约俱增。</li>
        <li><b>学者</b>：设坛讲学收弟子，著书立说成一家；亦可与名士论辩。</li>
      </ul>

      <div class="section-title">时日与技艺</div>
      <p>一切行事皆耗时日与体力。修习为时机小游戏：光标落入朱色区间时按「止」。城中校场、学宫、市肆各有所长，
      在其地修习可得地利。技艺十级为满，名声、爵位、金钱与弟子数决定结局评价。</p>

      <div class="section-title">交游与差事</div>
      <p>城中人物可交谈、赠礼、问学、切磋、论辩。交情二十五以上可请教学艺，五十二以上为知己，七十五以上为挚友。
      赠礼十日内只能一次，且最多把交情送到七十五；举荐需交情七十五、名声二十。美玉天下至多八块，一城一块，购后三十日补货，玉价每次上涨 15%。
      榜文上的差事分「出行」与「即办」两类：出行须在限期之内抵达目的地，运货类还须自备货物。</p>

      <div class="section-title">论辩</div>
      <p>论辩共三回合，认同度从 50 开始。每轮对方提出一个具体顾虑，你从三个回应中选择：
      切中顾虑 +15，有道理但未解决 +5，回避或触忌 −10；回应思路若合对方心性再 +5，相悖则 −5。
      每局可出示一次证据，只在对应顾虑时有效，+10，用错不消耗。三轮后 ≥70 说服成功、40–69 达成妥协、低于 40 失败。
      证据不再白送：平时在**城中「查访线索」**（技艺判定，失败后该城隔 1 日）、**人物面板「打听消息」**（交情 >20）、
      **市集「书肆」**（仅大城）获取，每件证据只有一种来源；
      证据按主题跨场景使用（粮草证据可论粮草，不能拿来论工程）。人物界面单列「证据」栏。
      50 个场景覆盖内政、邦交、军事、朝堂、商贸；妥协时有权限的对象会追加后续差事，降将、平民等则不会。</p>

      <div class="section-title">官阶与五等爵</div>
      <p>游侠、说客、学者可出仕（商人无仕途）。名声达到 8 后，往有「朝廷」的都城点「谒见国君」，
      成算取决于政略、魅力、名声与辩才；失败后须等十日。也可与卿相结好至交情 50，请其「举荐」直接入仕。</p>
      <p>出仕后获得的是<b>官阶</b>：士 → 中士 → 上士 → 大夫 → 中大夫 → 上大夫 → 卿 → 执政，
      每月初按功勋升一级，并按官阶领取月俸。</p>
      <p><b>爵位</b>是另一套五等爵：男 → 子 → 伯 → 侯 → 公，由周天子册命。官阶至卿、执政且功勋与名声达标后，
      可往洛邑领受「<b>册命之试</b>」：每级爵位有三道专属试炼（围捕/折冲/治邑/军略/定礼），
      完成后方可请封。请封按试炼评价计算成算，未准则名声小损、贽礼退半，并另命新试；
      累计五次未准后，第六次必得册命。受封后另有食邑月入，并计入结局评价。列国国君亦各有其爵：宋公、齐侯、郑伯、楚子、许男等。</p>
      <p style="color:#6d6052;font-size:13px">按史实，五等爵本为诸侯之封，卿大夫多以采邑为食；本作把「周室衰微、以功册命」作为演绎，
      让玩家也能由男爵累进至公爵。官阶（士→执政）则对应卿、大夫、士的官职体系。</p>

      <div class="section-title">操作</div>
      <p>顶栏切换舆图、城中、人物、差事、交游、名鉴、存档。舆图上点击城邑可见路程与国势，再点「启程前往」。
      修习时可按 <kbd>空格</kbd> 代替「止」，<kbd>Esc</kbd> 关闭弹窗。存档可导出为文本备份。</p>
    `,
    foot: [{ label: '明白了', cls: 'btn primary', close: true }],
  });
}
