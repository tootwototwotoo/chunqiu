// 三回合论辩场景总表
import domestic from './domestic.js';
import diplomacy from './diplomacy.js';
import military from './military.js';
import court from './court.js';
import trade from './trade.js';

export const DEBATES = [...domestic, ...diplomacy, ...military, ...court, ...trade];
export const DEBATE_BY_ID = Object.fromEntries(DEBATES.map(d => [d.id, d]));

export const TAGS = {
  li: { name: '讲利害', heart: '好利' },
  yi: { name: '讲道义', heart: '重义' },
  ming: { name: '引先例', heart: '好名' },
  shi: { name: '陈形势', heart: '慕强' },
};
export const CATEGORY_NAMES = {
  domestic: '内政', diplomacy: '邦交', military: '军事', court: '朝堂', trade: '商贸',
};
export const OPPOSITE = { li: 'yi', yi: 'li', ming: 'shi', shi: 'ming' };

export function validateDebates(list = DEBATES) {
  const errors = [];
  const ids = new Set();
  if (list.length < 50) errors.push(`场景不足：${list.length}/50`);
  for (const d of list) {
    const where = d.id || '(无 id)';
    if (!d.id || ids.has(d.id)) errors.push(`${where}：id 缺失或重复`);
    ids.add(d.id);
    if (!['li', 'yi', 'ming', 'shi'].includes(d.heart)) errors.push(`${where}：心性非法`);
    if (!['domestic', 'diplomacy', 'military', 'court', 'trade'].includes(d.category)) errors.push(`${where}：分类非法`);
    if (!Array.isArray(d.concerns) || d.concerns.length !== 3) { errors.push(`${where}：须有 3 个顾虑`); continue; }
    for (const [ci, c] of d.concerns.entries()) {
      if (!c.q) errors.push(`${where} 第${ci + 1}轮：缺少台词`);
      if (!Array.isArray(c.options) || c.options.length !== 3) { errors.push(`${where} 第${ci + 1}轮：须有 3 个选项`); continue; }
      const levels = c.options.map(o => o.level);
      const tags = c.options.map(o => o.tag);
      if (new Set(tags).size !== 3) errors.push(`${where} 第${ci + 1}轮：思路重复`);
      if (!tags.every(t => t in TAGS)) errors.push(`${where} 第${ci + 1}轮：思路非法（${tags.join(',')}）`);
      if (levels.filter(l => l === 'hit').length !== 1) errors.push(`${where} 第${ci + 1}轮：切中项须为 1`);
      if (levels.filter(l => l === 'reason').length !== 1) errors.push(`${where} 第${ci + 1}轮：有道理项须为 1`);
      if (levels.filter(l => l === 'evade').length !== 1) errors.push(`${where} 第${ci + 1}轮：回避项须为 1`);
      if (!c.options.every(o => o.text && o.reply)) errors.push(`${where} 第${ci + 1}轮：选项缺文本或反应`);
    }
    if (!d.evidence || d.evidence.concern < 0 || d.evidence.concern > 2) errors.push(`${where}：证据缺失或指向错误`);
    if (!d.outcomes?.success || !d.outcomes?.compromise || !d.outcomes?.fail) errors.push(`${where}：结局文本不全`);
    if (!d.effects?.success) errors.push(`${where}：成功效果缺失`);
    if (d.authority && d.followup) {
      const f = d.followup;
      if (!['travel', 'check', 'combat'].includes(f.mode)) errors.push(`${where}：后续差事类型非法`);
      if (f.mode === 'travel' && !f.targetCity) errors.push(`${where}：出行差事缺目标城`);
      if (f.mode === 'check' && !f.checkSkill) errors.push(`${where}：判定差事缺技能`);
      if (f.mode === 'combat' && !f.enemy) errors.push(`${where}：战斗差事缺敌人`);
    }
    if (!d.authority && d.followup) errors.push(`${where}：无权限对象不应配置后续差事`);
  }
  return errors;
}
