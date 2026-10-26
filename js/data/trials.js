// 册命之试：五等爵专属试炼（每级 3 个变体，各自独立小游戏）
// engine: hunt 围捕 / neg 折冲 / gov 治邑 / war 军略 / rite 定礼

export const TRIAL_RANKS = [
  { rank: 0, name: '男', theme: '乡邑之试', base: 0.74, floor: 0.30, days: 20, dc: 42 },
  { rank: 1, name: '子', theme: '邦交之试', base: 0.70, floor: 0.34, days: 26, dc: 50 },
  { rank: 2, name: '伯', theme: '国政之试', base: 0.66, floor: 0.38, days: 32, dc: 56 },
  { rank: 3, name: '侯', theme: '霸业之试', base: 0.62, floor: 0.44, days: 38, dc: 62 },
  { rank: 4, name: '公', theme: '天下秩序', base: 0.58, floor: 0.52, days: 45, dc: 68 },
];

export const TRIAL_VARIANTS = [
  // ---------- 男爵：围捕 ----------
  { id: 'hunt_bandit', rank: 0, engine: 'hunt', title: '讨平山贼',
    desc: '洛邑郊外山贼劫掠行旅。你须在有限的搜捕次数内，从乡野间找出贼首。',
    params: { n: 5, turns: 9 } },
  { id: 'hunt_river', rank: 0, engine: 'hunt', title: '清剿水匪',
    desc: '陶邑水网纵横，水匪藏匿芦荡。循迹搜捕，莫要惊动他们。',
    targetCity: 'tao', params: { n: 6, turns: 8 } },
  { id: 'hunt_deserter', rank: 0, engine: 'hunt', title: '追捕逃兵',
    desc: '邯郸营中逃兵携械藏匿于市井。你须在日落前将其揪出。',
    targetCity: 'handan', params: { n: 4, turns: 7 } },

  // ---------- 子爵：折冲 ----------
  { id: 'neg_lu', rank: 1, engine: 'neg', title: '折冲于鲁',
    desc: '鲁人重礼义。你须在席间以言辞动之，使两国通好，又不失国体。',
    targetCity: 'qufu', params: { rounds: 6, goal: 100, suspicionMax: 80, bias: 'yi' } },
  { id: 'neg_chu', rank: 1, engine: 'neg', title: '通使于楚',
    desc: '楚人慕强，重实力与形势。面对令尹的咄咄逼人，你须以利害与形势周旋。',
    targetCity: 'ying', params: { rounds: 6, goal: 105, suspicionMax: 80, bias: 'shi' } },
  { id: 'neg_song', rank: 1, engine: 'neg', title: '说宋结盟',
    desc: '宋人好名。若能给宋君一个体面的名分，盟约或可一举而定。',
    targetCity: 'shangqiu', params: { rounds: 6, goal: 100, suspicionMax: 78, bias: 'ming' } },

  // ---------- 伯爵：治邑 ----------
  { id: 'gov_famine', rank: 2, engine: 'gov', title: '救荒之政',
    desc: '洛邑大旱，流民塞道。六个月内须使民生、城防、府库三者皆不至于崩溃。',
    params: { turns: 6, scenario: 'famine', thresholds: { min: 62, def: 50, fisc: 45 } } },
  { id: 'gov_flood', rank: 2, engine: 'gov', title: '治水修防',
    desc: '帝丘濒河，秋汛将至。修堤、赈民、筹粮，皆在一人之断。',
    targetCity: 'diqiu', params: { turns: 6, scenario: 'flood', thresholds: { min: 55, def: 64, fisc: 48 } } },
  { id: 'gov_army', rank: 2, engine: 'gov', title: '抚军筹饷',
    desc: '绛都大军将发，粮饷、民力、府库三者不可偏废。',
    targetCity: 'jiang', params: { turns: 6, scenario: 'war', thresholds: { min: 55, def: 58, fisc: 60 } } },

  // ---------- 侯爵：军略 ----------
  { id: 'war_relief', rank: 3, engine: 'war', title: '救盟之役',
    desc: '盟国告急，诸侯之师已至境上。五阵之内，须破敌解围。',
    targetCity: 'shangqiu', params: { rounds: 5, terrain: 'plain', enemy: '宋' } },
  { id: 'war_pass', rank: 3, engine: 'war', title: '争隘之战',
    desc: '两军争一隘口，地狭不可展开。阵形之选，关乎全军生死。',
    targetCity: 'xinzheng', params: { rounds: 5, terrain: 'pass', enemy: '郑' } },
  { id: 'war_pursuit', rank: 3, engine: 'war', title: '追北之师',
    desc: '敌军已溃，然殿后精锐未散。追之须速，亦须防其反噬。',
    targetCity: 'chaoge', params: { rounds: 4, terrain: 'plain', enemy: '卫' } },

  // ---------- 公爵：定礼 ----------
  { id: 'rite_jiao', rank: 4, engine: 'rite', title: '郊祭定礼',
    desc: '周天子将行郊祭，仪节错乱则天下讥之。你须排出正确的行礼次序。',
    params: { rites: ['迎神', '献牲', '读祝', '撤馔', '送神'], clues: 3 } },
  { id: 'rite_pin', rank: 4, engine: 'rite', title: '朝聘定仪',
    desc: '诸侯来朝，聘礼之序不可有差。请在三次尝试内定下仪节。',
    params: { rites: ['入境', '致礼', '献币', '受飨', '归国'], clues: 3 } },
  { id: 'rite_ce', rank: 4, engine: 'rite', title: '策命之礼',
    desc: '天子册命诸侯，受册、拜命、受服、飨宴、复命，次序森然。',
    params: { rites: ['受册', '拜命', '受服', '飨宴', '复命'], clues: 4 } },
];

export const TRIAL_BY_ID = Object.fromEntries(TRIAL_VARIANTS.map(v => [v.id, v]));
export const variantsOfRank = (rank) => TRIAL_VARIANTS.filter(v => v.rank === rank);

export const TRIAL_CHANCE_TEXT = {
  hunt: '围捕：在有限次数内找出贼首',
  neg: '折冲：以言辞与分寸达成盟约',
  gov: '治邑：六个月的内政取舍',
  war: '军略：五阵之内破敌',
  rite: '定礼：排出正确的仪节次序',
};
