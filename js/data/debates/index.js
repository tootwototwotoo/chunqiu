// 三回合论辩场景总表与证据元数据
import domestic from './domestic.js';
import diplomacy from './diplomacy.js';
import military from './military.js';
import court from './court.js';
import trade from './trade.js';
import { NPC_MAP } from '../npcs.js';

const RAW = [...domestic, ...diplomacy, ...military, ...court, ...trade];

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

export const BOOKSHOPS = ['luoyi', 'linzi', 'qufu', 'xinzheng', 'tao', 'ying', 'shangqiu'];

const HOME_CITY = {
  relief: 'tao', tax: 'qufu', refugees: 'shangqiu', prices: 'pengcheng',
  marriage: 'linzi', tribute: 'luoyi', border: 'xinzheng', truce: 'jiang',
  recruit: 'handan', exchange: 'ying', landcase: 'shangcai', succession: 'qufu',
  law: 'luoyi', recommend: 'qufu', inflation: 'pengcheng', manumit: 'tao',
  hoarding: 'tao',
  wall: 'luoyi', academy: 'qufu', fields: 'xinzheng', passage: 'luoyi',
  meeting: 'linzi', fugitive: 'shangqiu', surrender: 'ying', siege: 'linzi',
  deserters: 'tao', captives: 'shangqiu', impeach: 'luoyi', ritual: 'qufu',
  hunt: 'tao', saltiron: 'linzi', strike: 'tao', fraud: 'xinzheng',
};

const NPC_BY_EVIDENCE = {
  flood: 'guan_zhong', officials: 'ji_zu', clans: 'zheng_zhuang',
  alliance: 'bao_shuya', hostage: 'lu_yin', mediator: 'liu_xiahui',
  market: 'bai_li_xi', pursuit: 'xian_zhen', grain: 'jian_shu',
  reward: 'hu_yan', injustice: 'cao_gui', corruption: 'wei_wen',
  merits: 'yan_zhuang', seedloan: 'chen_xuan', caravan: 'zi_wen',
  water: 'ji_liang', pirates: 'fan_li',
};

export const TOPIC_NAMES = {
  grain: '粮草', water: '水利', construction: '工程', army: '军务',
  diplomacy: '邦交', law: '刑律', trade: '商贸', ritual: '礼制',
  people: '民生', land: '田界', tax: '赋税', court: '朝政', misc: '杂事',
};

// 证据按主题跨场景使用：粮草证据可解粮草之虑，但不能拿来论工程
const TOPIC_BY_ID = {
  relief: 'grain', flood: 'water', wall: 'construction', tax: 'tax',
  officials: 'law', academy: 'ritual', refugees: 'people', clans: 'law',
  fields: 'land', prices: 'grain',
  alliance: 'diplomacy', passage: 'diplomacy', marriage: 'diplomacy',
  hostage: 'diplomacy', meeting: 'diplomacy', tribute: 'diplomacy',
  mediator: 'diplomacy', fugitive: 'law', border: 'land', market: 'trade',
  surrender: 'army', truce: 'army', pursuit: 'army', siege: 'army',
  recruit: 'army', grain: 'grain', deserters: 'army', exchange: 'army',
  reward: 'army', captives: 'army',
  landcase: 'land', injustice: 'law', impeach: 'law', succession: 'ritual',
  corruption: 'law', ritual: 'ritual', law: 'law', merits: 'court',
  hunt: 'people', recommend: 'people',
  seedloan: 'grain', saltiron: 'trade', inflation: 'grain', caravan: 'trade',
  strike: 'trade', manumit: 'people', water: 'water', fraud: 'trade',
  hoarding: 'grain', pirates: 'trade',
};

const SKILL_BY_CATEGORY = {
  domestic: 'suanshu', diplomacy: 'biancai', military: 'bingfa', court: 'quanmou', trade: 'shanggu',
};
// 书肆证物：一件可永久复用，故定价高，起步 500 金
const PRICE_BY_CATEGORY = {
  trade: 500, domestic: 550, military: 600, diplomacy: 650, court: 700,
};

// 三种获取方式轮流分配，互不重叠
RAW.forEach((d, i) => {
  d.topic = TOPIC_BY_ID[d.id] ?? 'misc';
  d.concerns.forEach(c => { c.topic = c.topic ?? d.topic; });
  const ev = d.evidence;
  ev.id = `${d.id}_ev`;
  ev.topic = d.topic;
  const type = ['investigate', 'npc', 'market'][i % 3];
  ev.source = type === 'investigate'
    ? { type, skill: SKILL_BY_CATEGORY[d.category], dc: 44, city: HOME_CITY[d.id] ?? null }
    : type === 'market'
      ? { type, price: PRICE_BY_CATEGORY[d.category], city: HOME_CITY[d.id] ?? null }
      : { type, npcId: NPC_BY_EVIDENCE[d.id] ?? null };
  if (ev.source.type === 'npc') {
    ev.homeCity = NPC_MAP[ev.source.npcId]?.city ?? null;
  } else {
    ev.homeCity = ev.source.city;
  }
});

export const DEBATES = RAW;
export const DEBATE_BY_ID = Object.fromEntries(DEBATES.map(d => [d.id, d]));
export const EVIDENCE_BY_ID = Object.fromEntries(DEBATES.map(d => [
  d.evidence.id,
  { ...d.evidence, scenarioId: d.id, category: d.category },
]));

export function validateDebates(list = DEBATES) {
  const errors = [];
  const ids = new Set(), evIds = new Set();
  if (list.length < 50) errors.push(`场景不足：${list.length}/50`);
  for (const d of list) {
    const where = d.id || '(无 id)';
    if (!d.id || ids.has(d.id)) errors.push(`${where}：id 缺失或重复`);
    ids.add(d.id);
    if (!['li', 'yi', 'ming', 'shi'].includes(d.heart)) errors.push(`${where}：心性非法`);
    if (!['domestic', 'diplomacy', 'military', 'court', 'trade'].includes(d.category)) errors.push(`${where}：分类非法`);
    if (!TOPIC_NAMES[d.topic]) errors.push(`${where}：主题非法`);
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
    const ev = d.evidence;
    if (!ev || !ev.id || !ev.name || !ev.topic) errors.push(`${where}：证据缺失`);
    else {
      if (evIds.has(ev.id)) errors.push(`${where}：证据 id 重复`);
      evIds.add(ev.id);
      if (!['investigate', 'npc', 'market'].includes(ev.source?.type)) errors.push(`${where}：证据来源非法`);
      if (ev.source?.type === 'investigate' && !ev.source.skill) errors.push(`${where}：查访证据缺技能`);
      if (ev.source?.type === 'market' && !(ev.source.price >= 500)) errors.push(`${where}：购买证据价格不得低于 500 金`);
      if (ev.source?.type === 'npc' && !ev.source.npcId) errors.push(`${where}：打听证据缺 NPC`);
      if (ev.source?.type !== 'npc' && !ev.homeCity) errors.push(`${where}：证据缺所在城`);
      if (ev.source?.type === 'market' && !BOOKSHOPS.includes(ev.homeCity)) errors.push(`${where}：购买证据不在书肆城`);
    }
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
