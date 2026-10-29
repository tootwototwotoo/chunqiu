// UI 公共片段
import { esc, bar } from '../util.js';
import { STATES, CITY_MAP } from '../data/world.js';
import { SKILL_DEFS } from '../data/defs.js';

export const stateColor = (id) => STATES[id]?.color ?? '#8a7f6d';
export const stateName = (id) => STATES[id]?.name ?? id;

export function avatar(name, color) {
  const ch = (name || '？').trim()[0] || '？';
  return `<div class="avatar" ${color ? `style="background:linear-gradient(160deg,${color},${shade(color)})"` : ''}>${esc(ch)}</div>`;
}
function shade(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, ((n >> 16) & 255) - 45), g = Math.max(0, ((n >> 8) & 255) - 45), b = Math.max(0, (n & 255) - 45);
  return `rgb(${r},${g},${b})`;
}

export function statLine(label, value, max = 100) {
  return `<div class="stat-line"><div class="sl-top"><b>${label}</b><span>${value}</span></div>${bar(value, max)}</div>`;
}

export function skillName(k) { return SKILL_DEFS[k]?.name ?? k; }


export function cityTag(st, cityId) {
  const sid = st.world.owner[cityId];
  return `<span class="state-tag" style="background:${stateColor(sid)}">${stateName(sid)}</span>`;
}

export function relTierName(aff) {
  if (aff >= 100) return '生死之交';
  if (aff >= 75) return '挚友';
  if (aff >= 52) return '知己';
  if (aff >= 32) return '友善';
  if (aff >= 15) return '相识';
  return '陌路';
}

export function gameDate(t) {
  const y = t.year < 0 ? `前${-t.year}年` : `公元${t.year}年`;
  const m = ['正月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'][t.month - 1];
  return `${y} ${m}`;
}


export function cityName(id) { return CITY_MAP[id]?.name ?? id; }

export function onClick(root, sel, fn) {
  root.querySelectorAll(sel).forEach(el => {
    el.addEventListener('click', (ev) => { ev.preventDefault(); fn(el, ev); });
  });
}

export function skillRowHtml(st, k, canTrain) {
  const lv = st.player.skills[k] ?? 0;
  const exp = st.player.skillExp[k] ?? 0;
  const need = 30 + lv * 22;
  const pct = Math.min(100, (exp / need) * 100);
  return `<tr>
    <td><b>${SKILL_DEFS[k].name}</b> <small style="color:#6d6052">${SKILL_DEFS[k].cat}</small></td>
    <td class="lv">${lv >= 10 ? '满' : lv}</td>
    <td style="width:34%"><div class="bar"><i style="width:${pct.toFixed(0)}%"></i></div></td>
    <td class="act">${canTrain ? `<button class="btn sm" data-train="${k}">修习</button>` : ''}</td>
  </tr>`;
}



// 国君随年份在「公子 / 国君 / 前国君」之间变化，称号随之改变
// 国君的显示名：在位用谥号（史书惯例），非在位且有本名则用本名。
// 谥号是死后才有的——公子阶段叫「宋襄公」是穿越，该叫「公子兹父」。
export function displayNameOf(npcLike, stage) {
  const { def } = npcLike ?? {};
  if (!def) return '';
  const st = stage ?? npcLike?.stage ?? npcLike?.effectiveRole;
  if (def.role !== 'ruler' || st === 'ruler') return def.name;
  if (def.given) return def.given;
  return def.name;   // 无本名者暂用谥号（宁可将就，不造名）
}

export function stageLabel(npcLike) {
  const { def, effectiveRole, stage } = npcLike ?? {};
  if (!def) return '';
  const role = effectiveRole ?? stage ?? def.role;
  if (role === 'prince') return def.given ? `公子${def.given}` : '公子';
  if (role === 'retired') return def.given ? `前君${def.given}` : '前国君';
  if (role === 'ruler') return def.title ?? '国君';
  return def.title ?? '';
}
