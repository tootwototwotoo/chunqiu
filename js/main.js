// 入口
import { app } from './ui/app.js';
import { hasSave } from './state.js';

window.addEventListener('error', (e) => {
  console.error('[春秋] 出错：', e.message, e.filename, e.lineno);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && app.modalHandle && app.modalHandle.opts.closable !== false) {
    app.modalHandle.close();
  }
});

// 阻止空格滚动
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && e.target === document.body) e.preventDefault();
});

window.app = app;  // 肖像就绪重渲染等低层模块需要回调入口
app.showTitle();

if (!hasSave()) {
  console.log('%c春秋·列国志', 'font-size:20px;color:#9c2b26;letter-spacing:4px');
  console.log('前722年，周室东迁，诸侯并起。择一途，立身乱世。');
}
