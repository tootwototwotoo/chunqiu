// 辩论与游说
import { R, player, skillLevel, addRel, addFame, addStamina, addMoney } from '../state.js';
import { ri, clamp } from '../util.js';

export const ARGS = {
  li:   { name: '言利', hint: '以利害动之', opp: 'yi' },
  yi:   { name: '晓义', hint: '以道义责之', opp: 'li' },
  ming: { name: '动名', hint: '以声名诱之', opp: 'shi' },
  shi:  { name: '陈势', hint: '以形势迫之', opp: 'ming' },
};

const BIAS_NAME = { li: '好利', yi: '重义', ming: '好名', shi: '慕强' };
export const biasName = (b) => BIAS_NAME[b] ?? '难测';
export const BIAS_TIP = {
  li: '看重实际利益，宜以「言利」动之',
  yi: '看重礼义名节，宜以「晓义」动之',
  ming: '看重声名评价，宜以「动名」动之',
  shi: '看重实力与形势，宜以「陈势」动之',
};

const LINES = {
  li: [
    '「君若许之，岁得盐铁之利，府库可实。」',
    '「此策一行，商旅辐辏，君之赋税倍于往日。」',
    '「与其争一日之短长，不若图百年之利。」',
  ],
  yi: [
    '「霸主之业，不在兵甲，而在信义。」',
    '「君以义动诸侯，诸侯孰不愿从？」',
    '「背盟弃信，虽得一时，终失天下之心。」',
  ],
  ming: [
    '「君之名，当与齐桓、晋文并垂于后世。」',
    '「今日之举，史官必书。君愿书作何辞？」',
    '「诸侯观望，所重者君之声名耳。」',
  ],
  shi: [
    '「晋楚之势，君岂不知？不早为之所，悔将无及。」',
    '「大国已陈兵于境，君欲待其入境而后谋乎？」',
    '「天下将变，先动者制人，后动者制于人。」',
  ],
};

const REBUT = [
  '「子之言，似是而非。」',
  '「此事自有庙算，不劳先生费心。」',
  '「子欲以口舌取富贵耶？」',
  '「容寡人思之。」',
];

export function startDebate(st, npc, opts = {}) {
  const p = player(st);
  return {
    over: false, won: null,
    round: 1, maxRounds: opts.maxRounds ?? 6,
    meter: 12,
    bias: npc.bias ?? 'li',
    difficulty: opts.difficulty ?? 40,
    targetName: npc.name,
    targetTitle: npc.title ?? '',
    log: [`${npc.name}端坐席上，等你开口。`],
    used: [],
    topic: opts.topic ?? '国事',
    npcId: npc.id ?? null,
    opts,
  };
}

export function debateChoose(st, d, key) {
  if (d.over) return d;
  const p = player(st);
  const skill = skillLevel(st, 'biancai');
  const track = Math.min(3, Math.floor(skill / 3));
  const base = 8 + skill * 1.9 + (p.stats.mei - 50) * 0.12 + (p.stats.zhi - 50) * 0.08 + R.int(st, 0, 6);
  let mult = 1.20, tag = '平常';
  if (key === d.bias) { mult = 2.0; tag = '对症'; }
  else if (ARGS[key].opp === d.bias) { mult = 0.55; tag = '相悖'; }
  let value = base * mult;
  // 连续重复同一话术，效力递减；间隔使用只轻微递减
  const last = d.used[d.used.length - 1];
  const repeat = d.used.filter(k => k === key).length;
  if (key === last) value *= 0.55;
  else if (repeat >= 2) value *= 0.85;
  const resist = Math.max(4, d.difficulty * 0.17) + R.int(st, 0, 4);
  const delta = Math.round(value - resist);
  d.meter = clamp(d.meter + value - resist, 0, 100);
  d.used.push(key);
  d.lastDelta = delta;
  d.lastTag = tag;
  d.log.push(`${LINES[key][R.int(st, 0, 2)]}【${tag}】说服${delta >= 0 ? '+' : ''}${delta}`);
  if (d.meter >= 100) {
    d.over = true; d.won = true;
    d.log.push(`${d.targetName}默然良久，终于颔首：「先生之言，寡人受教。」`);
  } else {
    d.log.push(REBUT[R.int(st, 0, 3)]);
    d.round++;
    if (d.round > d.maxRounds) {
      d.over = true; d.won = false;
      d.log.push(`${d.targetName}拂袖而起，谈话不欢而散。`);
    }
  }
  return d;
}

export function settleDebate(st, d, npcId, opts = {}) {
  st.stats.debates++;
  addStamina(st, -6);
  if (d.won) {
    st.stats.debateWins++;
    addFame(st, opts.fame ?? 3);
    if (npcId) addRel(st, npcId, opts.rel ?? 6);
    if (opts.money) addMoney(st, opts.money);
    return { won: true };
  }
  if (npcId) addRel(st, npcId, -2);
  return { won: false };
}

export function debatePreview(st, npc) {
  const skill = skillLevel(st, 'biancai');
  const diff = 34 + (npc.stats?.zhi ?? 50) * 0.35;
  return { bias: npc.bias, biasText: biasName(npc.bias), difficulty: Math.round(diff), skill };
}
