// 技能、属性、身份、爵位定义

export const STAT_DEFS = {
  wu:   { name: '武艺', desc: '剑术与勇力，决斗之根本' },
  zhi:  { name: '智略', desc: '谋算与机变，兵法辩论之基' },
  zheng:{ name: '政略', desc: '治民与外交，仕途之要' },
  mei:  { name: '魅力', desc: '言辞与仪态，交游之资' },
};

export const SKILL_DEFS = {
  jianshu:  { name: '剑术', cat: '武', where: '校场', desc: '持剑相搏，决胜于三招之间' },
  sheshu:   { name: '射术', cat: '武', where: '校场', desc: '百步穿杨，战阵之技' },
  bingfa:   { name: '兵法', cat: '武', where: '校场', desc: '知彼知己，将帅之学' },
  biancai:  { name: '辩才', cat: '文', where: '学宫', desc: '口若悬河，动人心志' },
  quanmou:  { name: '权谋', cat: '文', where: '学宫', desc: '纵横捭阖，离间合纵' },
  shanggu:  { name: '商贾', cat: '市', where: '市肆', desc: '识货知价，贱买贵卖' },
  suanshu:  { name: '算术', cat: '市', where: '市肆', desc: '心计精明，分毫必较' },
  xuewen:   { name: '学问', cat: '文', where: '学宫', desc: '博古通今，成一家之言' },
};

export const SKILL_LEVEL_NAMES = ['未习', '初窥', '略通', '渐熟', '精熟', '擅长', '大家', '宗师'];
export const skillTier = (lv) => SKILL_LEVEL_NAMES[Math.min(SKILL_LEVEL_NAMES.length - 1, Math.floor(lv))] || '宗师';
// 技能等级 0-10，10 为满
export const SKILL_MAX = 10;

export const PROFESSIONS = {
  youxia: {
    id: 'youxia', name: '游侠', seal: '侠',
    desc: '仗剑去国，辞亲远游。以武立身，可仕于列国，由士而卿，终佐霸主。',
    start: { money: 200, fame: 0, stats: { wu: 58, zhi: 42, zheng: 30, mei: 44 }, skills: { jianshu: 3, sheshu: 2, bingfa: 1 } },
    path: '仕途',
  },
  shangren: {
    id: 'shangren', name: '商人', seal: '商',
    desc: '转毂四方，以有为无。善观时变，可富甲天下，亦可挟财势以动列国。',
    start: { money: 600, fame: 0, stats: { wu: 34, zhi: 52, zheng: 44, mei: 52 }, skills: { shanggu: 3, suanshu: 2, biancai: 1 } },
    path: '商途',
  },
  shuike: {
    id: 'shuike', name: '说客', seal: '辩',
    desc: '一言之辩，重于九鼎。游走列国，以口舌定盟约、解纷争，纵横天下。',
    start: { money: 260, fame: 0, stats: { wu: 32, zhi: 60, zheng: 56, mei: 60 }, skills: { biancai: 3, quanmou: 2, xuewen: 1 } },
    path: '纵横',
  },
  xuezhe: {
    id: 'xuezhe', name: '学者', seal: '文',
    desc: '游学问道，讲席授徒。立一家之言，桃李满天下，名垂后世。',
    start: { money: 160, fame: 0, stats: { wu: 30, zhi: 56, zheng: 48, mei: 54 }, skills: { xuewen: 3, biancai: 2, suanshu: 1 } },
    path: '学统',
  },
};

// 仕途爵位（武士/说客/学者皆可用于本国）
export const RANKS = [
  { name: '布衣', merit: 0,   pay: 0 },
  { name: '士',   merit: 30,  pay: 12 },
  { name: '中士', merit: 80,  pay: 24 },
  { name: '上士', merit: 150, pay: 40 },
  { name: '大夫', merit: 260, pay: 70 },
  { name: '中大夫', merit: 420, pay: 110 },
  { name: '上大夫', merit: 640, pay: 165 },
  { name: '卿',   merit: 900, pay: 240 },
  { name: '执政', merit: 1300, pay: 360 },
];

// 五等爵：男 → 子 → 伯 → 侯 → 公（周天子册命，食邑食禄）
export const PEERAGES = [
  { id: 'nan', name: '男', merit: 1800, fame: 120, income: 40 },
  { id: 'zi',  name: '子', merit: 2250, fame: 160, income: 70 },
  { id: 'bo',  name: '伯', merit: 2750, fame: 200, income: 110 },
  { id: 'hou', name: '侯', merit: 3350, fame: 250, income: 160 },
  { id: 'gong',name: '公', merit: 4000, fame: 300, income: 220 },
];
export const peerageName = (idx) => (idx == null || idx < 0 ? '未受封' : `${PEERAGES[idx]?.name ?? ''}爵`);

export const MERCHANT_TIERS = [
  { name: '贩夫', need: 0 },
  { name: '行商', need: 1200 },
  { name: '坐贾', need: 3500 },
  { name: '巨商', need: 8000 },
  { name: '富商', need: 16000 },
  { name: '陶朱之富', need: 32000 },
];

export const SCHOLAR_TIERS = [
  { name: '学子', need: 0 },
  { name: '门生', need: 3 },
  { name: '讲师', need: 8 },
  { name: '名士', need: 16 },
  { name: '一家', need: 28 },
  { name: '宗师', need: 45 },
];

export const DIPLO_TIERS = [
  { name: '游士', need: 0 },
  { name: '门客', need: 2 },
  { name: '上宾', need: 5 },
  { name: '国士', need: 9 },
  { name: '纵横家', need: 14 },
  { name: '天下辩士', need: 20 },
];

// 可选年代：让不同时期的名人与事件都可在寿命内经历
export const ERAS = [
  { id: 'early', name: '王室东迁', year: -722,
    desc: '周平王四十九年。王纲解纽，郑庄公小霸，齐鲁宋卫交错于中原。',
    power: { zhou: 26, qi: 56, jin: 54, qin: 38, chu: 58, lu: 38, song: 40, wei: 30, zheng: 48, yan: 26, wu: 14, yue: 12, chen: 22, cai: 20, cao: 18 } },
  { id: 'huan', name: '桓公称霸', year: -685,
    desc: '齐桓公即位，管仲相齐，尊王攘夷。北杏、召陵、葵丘之会相继而起。',
    power: { zhou: 24, qi: 64, jin: 52, qin: 40, chu: 62, lu: 36, song: 38, wei: 26, zheng: 44, yan: 24, wu: 14, yue: 12, chen: 20, cai: 18, cao: 18 } },
  { id: 'jinchu', name: '晋楚争雄', year: -640,
    desc: '齐桓既没，晋文、楚成并起。城濮一战，晋伯诸侯；此后百年，晋楚拉锯。',
    power: { zhou: 20, qi: 48, jin: 70, qin: 48, chu: 68, lu: 32, song: 34, wei: 24, zheng: 34, yan: 24, wu: 20, yue: 14, chen: 18, cai: 16, cao: 16 } },
  { id: 'mibing', name: '弭兵之世', year: -560,
    desc: '晋楚俱疲，向戌合诸侯之大夫盟于宋。天下息兵，卿族渐强。',
    power: { zhou: 18, qi: 46, jin: 64, qin: 50, chu: 66, lu: 30, song: 30, wei: 22, zheng: 30, yan: 22, wu: 34, yue: 22, chen: 16, cai: 14, cao: 14 } },
  { id: 'wuyue', name: '吴越争雄', year: -515,
    desc: '楚势稍衰，吴越并起于东南。孙武、伍胥佐吴，勾践、范蠡兴越。',
    power: { zhou: 16, qi: 48, jin: 52, qin: 50, chu: 58, lu: 26, song: 26, wei: 18, zheng: 26, yan: 20, wu: 68, yue: 44, chen: 14, cai: 12, cao: 12 } },
];
