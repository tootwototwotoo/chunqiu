// 疆域层：以城邑为种子生成 Voronoi 势力范围，按所属国上色
import { CITIES, STATES } from '../data/world.js';
import { player } from '../state.js';

const W = 940, H = 660;
const STATE_IDS = Object.keys(STATES);
const STATE_INDEX = Object.fromEntries(STATE_IDS.map((id, i) => [id, i]));
let cache = { sig: '', image: null };

const hexToRgb = (hex) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const rgb = Object.fromEntries(Object.entries(STATES).map(([id, s]) => [id, hexToRgb(s.color)]));

export function territorySignature(st) {
  const owners = CITIES.map(c => st.world.owner[c.id] ?? c.state).join('');
  return `${owners}|${st.player.stateId ?? ''}`;
}

export function drawTerritory(canvas, st) {
  if (!canvas) return;
  let ctx = null;
  try { ctx = canvas.getContext('2d'); } catch { ctx = null; }
  if (!ctx) return;

  const sig = territorySignature(st);
  if (cache.sig === sig && cache.image) {
    canvas.width = W; canvas.height = H;
    ctx.putImageData(cache.image, 0, 0);
    return;
  }

  const cityOwner = CITIES.map(c => STATE_INDEX[st.world.owner[c.id] ?? c.state] ?? 0);
  const ownerGrid = new Uint8Array(W * H);
  const cityGrid = new Uint8Array(W * H);
  const cx = CITIES.map(c => c.x), cy = CITIES.map(c => c.y);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let best = 1e9, bestI = 0;
      for (let i = 0; i < CITIES.length; i++) {
        const dx = x - cx[i], dy = y - cy[i];
        const d = dx * dx + dy * dy;
        if (d < best) { best = d; bestI = i; }
      }
      const p = y * W + x;
      ownerGrid[p] = cityOwner[bestI];
      cityGrid[p] = bestI;
    }
  }

  const img = ctx.createImageData(W, H);
  const data = img.data;
  const myState = st.player.stateId;
  const alphaNormal = 51;   // 20%
  const alphaHome = 82;     // 32%

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const p = y * W + x;
      const sid = STATE_IDS[ownerGrid[p]];
      const [r, g, b] = rgb[sid] ?? [128, 120, 100];
      const home = myState && sid === myState;
      const a = home ? alphaHome : alphaNormal;
      const i = p * 4;
      data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = a;
    }
  }

  // 国界：只在不同国相邻处描边，虚线用坐标取模实现
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const p = y * W + x;
      const here = ownerGrid[p];
      const right = x + 1 < W ? ownerGrid[p + 1] : here;
      const down = y + 1 < H ? ownerGrid[p + W] : here;
      let edge = false;
      if (right !== here && (x % 8) < 4) edge = true;
      if (down !== here && (y % 8) < 4) edge = true;
      if (!edge) continue;
      const sid = STATE_IDS[here];
      const home = myState && sid === myState;
      const [r, g, b] = home ? [166, 124, 52] : rgb[sid] ?? [80, 70, 60];
      const i = p * 4;
      data[i] = home ? r : Math.round(r * 0.72);
      data[i + 1] = home ? g : Math.round(g * 0.72);
      data[i + 2] = home ? b : Math.round(b * 0.72);
      data[i + 3] = home ? 210 : 150;
    }
  }

  canvas.width = W; canvas.height = H;
  ctx.putImageData(img, 0, 0);
  cache = { sig, image: img };
}
