// 存档与设置
import { saveGame, loadGame, deleteSave, hasSave, player, age, fullTitle } from '../state.js';
import { onClick } from './common.js';
import { gameDate } from './common.js';
import { openHelp } from './title.js';
import { esc } from '../util.js';

export function mount(root, st, app) {
  const readAuto = () => {
    try { return JSON.parse(localStorage.getItem('chunqiu_lieguozhi_auto') || 'null'); } catch { return null; }
  };
  const auto = readAuto();
  root.innerHTML = `
  <div class="cols" style="grid-template-columns:1fr 1fr">
    <div class="panel">
      <h2>存档 <span class="sub">简册所录</span></h2>
      <div class="desc">${esc(player(st).name)} · ${esc(fullTitle(st))} · ${gameDate(st.time)} · ${age(st)}岁</div>
      <div class="btn-row">
        <button class="btn primary" data-act="save">存档</button>
        <button class="btn" data-act="load">读档</button>
        <button class="btn" data-act="title">回到标题</button>
      </div>
      <div class="divider"></div>
      <div class="section-title">导出 / 导入</div>
      <div class="desc" style="margin-top:0">可将存档文本复制保存，或粘贴他人存档以继续。</div>
      <textarea class="save-area" id="save-area" placeholder="存档文本"></textarea>
      <div class="btn-row" style="margin-top:8px">
        <button class="btn sm" data-act="export">导出到框</button>
        <button class="btn sm" data-act="copy">复制</button>
        <button class="btn sm" data-act="import">从框导入</button>
      </div>
    </div>

    <div class="panel">
      <h2>世局 <span class="sub">此刻天下</span></h2>
      <div class="kv">
        <dt>年月</dt><dd>${gameDate(st.time)}</dd>
        <dt>身份</dt><dd>${esc(fullTitle(st))}</dd>
        <dt>名声</dt><dd>${player(st).fame}</dd>
        <dt>金钱</dt><dd>${player(st).money}</dd>
        <dt>体力</dt><dd>${Math.round(player(st).stamina)}</dd>
        <dt>健康</dt><dd>${player(st).health}</dd>
        <dt>决斗</dt><dd>${st.stats.duelWins} 胜 / ${st.stats.duels} 战</dd>
        <dt>交易</dt><dd>${st.stats.trades} 次</dd>
      </div>
      <div class="divider"></div>
      <div class="section-title">自动存档</div>
      <div class="desc" style="margin-top:0">${auto ? `每月自动记录于简册。最近：${esc(auto.player?.name ?? '—')} · ${auto.time ? `前${-auto.time.year}年` : ''}` : '尚无自动存档。'}</div>
      <div class="btn-row">
        <button class="btn sm" data-act="auto">读取自动存档</button>
      </div>
      <div class="divider"></div>
      <div class="section-title">重开</div>
      <div class="desc" style="margin-top:0">另起一世，旧存档将被覆盖。慎之。</div>
      <div class="btn-row">
        <button class="btn sm" data-act="restart">重新开始</button>
        <button class="btn sm ghost" data-act="help">玩法</button>
      </div>
      <div class="footnote">存档保存于本机浏览器（localStorage）。清除浏览数据将失去存档，建议定期导出。</div>
    </div>
  </div>`;

  const area = root.querySelector('#save-area');

  onClick(root, '[data-act="save"]', () => {
    app.save();
    app.render();
  });
  onClick(root, '[data-act="load"]', () => {
    const s = loadGame();
    if (!s) { app.toast('无存档可读', 'war'); return; }
    app.startGame(s);
    app.toast('已读档', 'gain');
  });
  onClick(root, '[data-act="export"]', () => {
    area.value = JSON.stringify(st);
    app.toast('已导出到文本框');
  });
  onClick(root, '[data-act="copy"]', async () => {
    area.value = JSON.stringify(st);
    try { await navigator.clipboard.writeText(area.value); app.toast('已复制到剪贴板', 'gain'); }
    catch { app.toast('复制失败，请手动选择文本', 'war'); }
  });
  onClick(root, '[data-act="import"]', () => {
    try {
      const obj = JSON.parse(area.value);
      if (!obj.player || !obj.time) throw new Error('格式不对');
      app.startGame(obj);
      app.toast('已导入存档', 'gain');
    } catch (e) { app.toast('存档文本无效', 'war'); }
  });
  onClick(root, '[data-act="auto"]', () => {
    try {
      const obj = readAuto();
      if (!obj) { app.toast('无自动存档', 'war'); return; }
      app.startGame(obj);
      app.toast('已读取自动存档', 'gain');
    } catch { app.toast('自动存档损坏', 'war'); }
  });
  onClick(root, '[data-act="title"]', () => app.showTitle());
  onClick(root, '[data-act="help"]', () => openHelp(app));
  onClick(root, '[data-act="restart"]', () => {
    app.confirm('确定另起一世？当前进度若未存档将失去。', () => {
      deleteSave();
      app.showTitle();
    });
  });
}
