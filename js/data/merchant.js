// 商人：阶次、商号、伙计、散财
// 商人无仕途，另有一条与五等爵平行的势力路径；最后一阶不看钱，看「散」了多少。

// 阶次：后两阶要求事功而非单纯金钱
export const MERCHANT_RANKS = [
  { idx: 0, name: '贩夫', money: 0, desc: '负贩于市，朝聚暮散。' },
  { idx: 1, name: '行商', money: 1200, desc: '行旅四方，逐贱趋贵。' },
  { idx: 2, name: '坐贾', money: 3500, shops: 1, desc: '设肆于市，坐而待价。' },
  { idx: 3, name: '巨商', money: 8000, shops: 3, desc: '车马连骑，货通列国。' },
  { idx: 4, name: '商盟之主', money: 16000, pacts: 1, desc: '与国盟誓，分庭抗礼。' },
  { idx: 5, name: '陶朱公', given: 8000, peak: 32000, desc: '三致千金，三散其财。' },
];

export const TOP_RANK = MERCHANT_RANKS.length - 1;

// 商号三档：回本约 6~7 个月
export const SHOP_LEVELS = [
  null,
  { level: 1, name: '小肆', cost: 800, income: 120, hiredMax: 1 },
  { level: 2, name: '大铺', cost: 2000, income: 320, hiredMax: 2 },
  { level: 3, name: '总号', cost: 5000, income: 800, hiredMax: 3 },
];

export const SHOP_MAX_LEVEL = SHOP_LEVELS.length - 1;

// 伙计：单名雇价与月支，每名为所在商号加固定月入
export const HIRE = { cost: 300, wage: 8, income: 30 };

// 散财三途：分别对应名声、权势、长线收益
export const GIVEAWAYS = {
  relief: { id: 'relief', name: '赈济灾民', cost: 1000, fame: 10, power: 1, text: '开仓散粟，城中父老叩谢。' },
  army: { id: 'army', name: '助军资', cost: 2000, power: 3, fameWithPact: 8, text: '输金助军，国君亲书谢简。' },
  road: { id: 'road', name: '修桥铺路', cost: 1500, shopBonus: 20, text: '修治道路，商旅称便。' },
};

// 求仕转职：极其昂贵的一条特例通道
export const BUY_OFFICE = {
  cost: 20000,
  fameNeed: 60,
  minRank: 3,
  rankGranted: 3, // 上士
  shopPassive: 0.3,
};
