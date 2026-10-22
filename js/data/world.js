// 列国、城邑、道路

export const STATES = {
  zhou: { id: 'zhou', name: '周', color: '#8a7f6d', title: '天子之畿', power: 26 },
  qi:   { id: 'qi',   name: '齐', color: '#c9782b', title: '太公之后', power: 60 },
  jin:  { id: 'jin',  name: '晋', color: '#4e7a52', title: '唐叔之后', power: 58 },
  qin:  { id: 'qin',  name: '秦', color: '#4a4a4a', title: '西陲强国', power: 42 },
  chu:  { id: 'chu',  name: '楚', color: '#a8402f', title: '荆蛮之雄', power: 66 },
  lu:   { id: 'lu',   name: '鲁', color: '#b08d57', title: '周公之国', power: 38 },
  song: { id: 'song', name: '宋', color: '#5b7fa6', title: '商汤之后', power: 40 },
  wei:  { id: 'wei',  name: '卫', color: '#6c8a9a', title: '康叔之国', power: 28 },
  zheng:{ id: 'zheng',name: '郑', color: '#b57a8a', title: '姬姓之邦', power: 44 },
  yan:  { id: 'yan',  name: '燕', color: '#6f6a86', title: '召公之后', power: 26 },
  wu:   { id: 'wu',   name: '吴', color: '#3f6f7a', title: '句吴之国', power: 20 },
  yue:  { id: 'yue',  name: '越', color: '#7a8a3f', title: '於越之邦', power: 16 },
  chen: { id: 'chen', name: '陈', color: '#a08a5a', title: '舜后之封', power: 22 },
  cai:  { id: 'cai',  name: '蔡', color: '#9a7a4a', title: '蔡叔之后', power: 20 },
  cao:  { id: 'cao',  name: '曹', color: '#8a8a6a', title: '曹叔之国', power: 18 },
};

export const CITIES = [
  { id: 'luoyi',    name: '洛邑', state: 'zhou',  x: 470, y: 330, pop: 62, tags: ['academy', 'market', 'court'], good: 'jade',
    desc: '周室东都，九鼎所在。天子虽微，礼乐犹存，天下士人往来不绝。' },
  { id: 'linzi',    name: '临淄', state: 'qi',    x: 742, y: 252, pop: 78, tags: ['market', 'barracks', 'academy', 'court'], good: 'salt',
    desc: '齐都，负海之国。通鱼盐之利，冠带衣履天下，市声昼夜不息。' },
  { id: 'qufu',     name: '曲阜', state: 'lu',    x: 676, y: 330, pop: 54, tags: ['academy', 'market', 'court'], good: 'silk',
    desc: '鲁都，周公礼乐所在。民好儒术，士人彬彬，闾巷之间弦歌不辍。' },
  { id: 'jiang',    name: '绛',   state: 'jin',   x: 452, y: 222, pop: 66, tags: ['market', 'barracks', 'court'], good: 'horse',
    desc: '晋都，表里山河。戎马之盛冠于中原，卿族林立，暗流涌动。' },
  { id: 'handan',   name: '邯郸', state: 'jin',   x: 600, y: 240, pop: 44, tags: ['market', 'barracks'], good: 'iron',
    desc: '晋东大邑，冶铁之利甲于诸夏。赵氏之族据之，兵甲精良。' },
  { id: 'yong',     name: '雍',   state: 'qin',   x: 238, y: 322, pop: 42, tags: ['market', 'barracks', 'court'], good: 'horse',
    desc: '秦都，据关中之固。西接戎狄，民风犷悍，常怀东出之志。' },
  { id: 'ying',     name: '郢',   state: 'chu',   x: 486, y: 556, pop: 70, tags: ['market', 'barracks', 'court'], good: 'lacquer',
    desc: '楚都，江汉之会。地广人众，犀兕麋鹿满野，铜器漆器精美绝伦。' },
  { id: 'shangqiu', name: '商丘', state: 'song',  x: 622, y: 376, pop: 48, tags: ['market', 'court'], good: 'leather',
    desc: '宋都，殷商故地。宋人守礼而好仁义，处四战之地，常为兵冲。' },
  { id: 'chaoge',   name: '朝歌', state: 'wei',   x: 566, y: 272, pop: 40, tags: ['market', 'court'], good: 'silk',
    desc: '卫都，旧殷王畿。桑间濮上，风诗所出，然国势日蹙。' },
  { id: 'xinzheng', name: '新郑', state: 'zheng', x: 536, y: 372, pop: 52, tags: ['market', 'court'], good: 'jade',
    desc: '郑都，天下辐辏。商贾云集，弦高之属以商而闻于诸侯。' },
  { id: 'ji',       name: '蓟',   state: 'yan',   x: 700, y: 96,  pop: 30, tags: ['market', 'barracks'], good: 'leather',
    desc: '燕都，僻处北陲。近山戎，寒风凛冽，然为中原之北门。' },
  { id: 'gusu',     name: '姑苏', state: 'wu',    x: 782, y: 494, pop: 36, tags: ['market', 'barracks'], good: 'silk',
    desc: '吴都，水乡泽国。舟楫之利甲于东南，近来渐染中原之俗。' },
  { id: 'kuaiji',   name: '会稽', state: 'yue',   x: 824, y: 566, pop: 28, tags: ['market'], good: 'iron',
    desc: '越都，山川险阻。断发文身，善冶铸，剑器之利闻于天下。' },
  { id: 'wanqiu',   name: '宛丘', state: 'chen',  x: 592, y: 470, pop: 30, tags: ['market'], good: 'leather',
    desc: '陈都，舜后之封。地近淮夷，好巫鬼之祀，民风柔缓。' },
  { id: 'shangcai', name: '上蔡', state: 'cai',   x: 608, y: 510, pop: 26, tags: ['market'], good: 'su',
    desc: '蔡都，地薄民贫。介于楚、宋之间，屡为大国所役。' },
  { id: 'tao',      name: '陶',   state: 'cao',   x: 632, y: 418, pop: 50, tags: ['market'], good: 'su',
    desc: '天下之中，诸侯四通。货物交易之所，富商大贾多居之。' },
];

export const CITY_MAP = Object.fromEntries(CITIES.map(c => [c.id, c]));

// 道路：[a, b, 天数]
export const ROADS = [
  ['ji', 'linzi', 8],
  ['ji', 'handan', 9],
  ['linzi', 'qufu', 5],
  ['linzi', 'chaoge', 8],
  ['linzi', 'tao', 7],
  ['linzi', 'handan', 9],
  ['qufu', 'shangqiu', 6],
  ['qufu', 'tao', 4],
  ['qufu', 'chaoge', 6],
  ['chaoge', 'jiang', 8],
  ['chaoge', 'luoyi', 6],
  ['chaoge', 'xinzheng', 4],
  ['chaoge', 'handan', 5],
  ['handan', 'jiang', 4],
  ['luoyi', 'jiang', 6],
  ['luoyi', 'xinzheng', 3],
  ['luoyi', 'yong', 9],
  ['xinzheng', 'shangqiu', 4],
  ['shangqiu', 'tao', 3],
  ['shangqiu', 'wanqiu', 4],
  ['tao', 'shangcai', 6],
  ['tao', 'wanqiu', 5],
  ['wanqiu', 'shangcai', 3],
  ['wanqiu', 'ying', 10],
  ['shangcai', 'ying', 8],
  ['ying', 'gusu', 14],
  ['ying', 'kuaiji', 16],
  ['gusu', 'kuaiji', 4],
  ['gusu', 'tao', 14],
  ['yong', 'jiang', 10],
];

export function cityState(st, cityId) {
  return st.world.owner[cityId] || CITY_MAP[cityId].state;
}
export function citiesOfState(st, stateId) {
  return CITIES.filter(c => cityState(st, c.id) === stateId);
}
export function stateName(id) { return STATES[id]?.name ?? id; }

// 国名在地图上的大致位置
export const STATE_LABEL_POS = [
  ['yan', 745, 150], ['qi', 800, 300], ['lu', 700, 300], ['wei', 566, 236],
  ['jin', 372, 180], ['zhou', 428, 300], ['zheng', 520, 420], ['song', 668, 340],
  ['qin', 176, 280], ['chu', 372, 600], ['wu', 830, 450], ['yue', 862, 620],
  ['chen', 548, 440], ['cai', 646, 540], ['cao', 668, 460],
];
