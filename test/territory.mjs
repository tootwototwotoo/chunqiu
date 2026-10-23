// 疆域层：Voronoi 归属、本国高亮、缓存签名
import { JSDOM } from 'jsdom';
import { newGame } from '../js/state.js';
import { CITIES } from '../js/data/world.js';
import { drawTerritory, territorySignature } from '../js/ui/territory.js';

const dom = new JSDOM('<canvas id="c"></canvas>', { pretendToBeVisual: true });
const canvas = dom.window.document.querySelector('#c');
let fails = 0;
const ok = (c, m, x = '') => { console.log(`${c ? '✓' : '✗'} ${m}${x ? ' — ' + x : ''}`); if (!c) fails++; };

// jsdom 不自带 canvas，装一个记录调用的桩
const ctx = {
  last: null,
  createImageData(w, h) { return { width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }; },
  putImageData(img) { this.last = img; },
};
canvas.getContext = () => ctx;

const st = newGame({ name: '图', profession: 'youxia', seed: 1 });
drawTerritory(canvas, st);
ok(canvas.width === 940 && canvas.height === 660, '画布尺寸正确');
const alphaAt = (x, y) => ctx.last.data[(y * 940 + x) * 4 + 3];
ok(alphaAt(470, 330) > 0, '城邑坐标有疆域颜色');

const first = territorySignature(st);
drawTerritory(canvas, st);
ok(territorySignature(st) === first, '相同归属签名不变');

// 改变一城归属后签名应变化
st.world.owner[CITIES[0].id] = 'qi';
ok(territorySignature(st) !== first, '城池易主后签名变化');
drawTerritory(canvas, st);
ok(territorySignature(st) === territorySignature(st), '重绘后可再次取签名');

// 本国高亮：出仕后签名变化，且属国像素更浓
const before = territorySignature(st);
st.player.stateId = 'qi';
ok(territorySignature(st) !== before, '本国高亮改变签名');
drawTerritory(canvas, st);
ok(alphaAt(742, 252) >= 51, '本国疆域有不低于普通填充的浓度', String(alphaAt(742, 252)));

console.log(fails ? `\n失败 ${fails} 项 ✗` : '\n疆域层通过 ✓');
process.exit(fails ? 1 : 0);
