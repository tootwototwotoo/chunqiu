// 通用工具
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// 时间基准：全项目唯一的「绝对日」定义。
// 放在 util 里是因为 state 与 calendar 互相依赖，而 util 无依赖，各系统都能安全引用。
export const START_YEAR = -722;
export const DAYS_PER_MONTH = 30;
export const MONTHS_PER_YEAR = 12;
export const DAYS_PER_YEAR = DAYS_PER_MONTH * MONTHS_PER_YEAR;

/** 绝对日：自纪元首年 1 月 1 日起算的天数，首日为 0 */
export function absDay(t) {
  return (t.year - START_YEAR) * DAYS_PER_YEAR + (t.month - 1) * DAYS_PER_MONTH + (t.day - 1);
}

// 线性同余随机，状态存在存档里，保证可复现
export function rnd(s) {
  s.rng = (Math.imul(s.rng || 1, 1664525) + 1013904223) >>> 0;
  return s.rng / 4294967296;
}
export function ri(s, a, b) { return a + Math.floor(rnd(s) * (b - a + 1)); }
export function pick(s, arr) { return arr[Math.floor(rnd(s) * arr.length)]; }
export function chance(s, p) { return rnd(s) < p; }
export function shuffle(s, arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd(s) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

export const esc = (str) => String(str ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const yearLabel = (y) => (y < 0 ? `前${-y}年` : `公元${y}年`);
export const monthLabel = (m) => ['正月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'][m - 1] || `${m}月`;
export const NUM_CN = ['零','一','二','三','四','五','六','七','八','九','十'];


export function $(sel) { return document.querySelector(sel); }

export function bar(value, max, cls = '') {
  const pct = clamp((value / Math.max(1, max)) * 100, 0, 100);
  return `<div class="bar ${cls}"><i style="width:${pct.toFixed(1)}%"></i></div>`;
}

export function weightedPick(s, list) {
  const total = list.reduce((a, it) => a + (it.w ?? 1), 0);
  let r = rnd(s) * total;
  for (const it of list) { r -= (it.w ?? 1); if (r <= 0) return it; }
  return list[list.length - 1];
}



export const GIFT_TIERS = [0, 15, 32, 52, 75, 100];
export const GIFT_TIER_NAMES = ['陌路', '相识', '友善', '知己', '挚友', '生死之交'];
