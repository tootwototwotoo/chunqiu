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

// ---------------- 开号许可（市籍） ----------------
// 春秋「工商食官」，市有市籍，非有司许可不得列肆。
// 许可须向城中之人求取：有交情才肯通融，且仍需纳「市租」。

// 可授予许可的人物角色（按优先次序）
export const PERMIT_ROLES = ['ruler', 'minister', 'scholar'];
export const PERMIT_ROLE_NAMES = { ruler: '国君', minister: '卿相', scholar: '士人' };

// 许可条件
export const PERMIT = {
  minAff: 32,          // 交情门槛（「颇有往来」）
  feeRate: 0.25,       // 市租 = 开号成本 × 此比例
  days: 3,             // 求许可耗时
  minRank: 1,          // 须为行商
  minFame: 10,         // 名声门槛
  trialFame: 35,       // 达不到交情时，可凭名声再试一次
  trialFee: 300,       // 再试需另纳贽礼
  officialRate: 2,     // 城中无可托之人时，赴市亭立籍的费率倍数
};

// 城池经营系数：大城投入大、回报高
export function cityScale(city) {
  const pop = city?.pop ?? 40;
  return clampNum(pop / 40, 0.4, 2);
}

function clampNum(v, a, b) { return Math.max(a, Math.min(b, v)); }

// ---------------- 运输工具 ----------------
// 载重决定一次能运多少；装运速度决定每日处理多少载重；
// 体力系数乘在出行体力消耗上。水路工具只能在带 water 标记的城之间使用。
export const VEHICLES = {
  foot: {
    id: 'foot', name: '徒步', capacity: 24, load: 0, stamina: 1,
    price: 0, minRank: 0, water: false,
    desc: '负贩而行，只堪随身携带。',
  },
  cart: {
    id: 'cart', name: '独轮车', capacity: 60, load: 60, stamina: 1,
    price: 400, minRank: 1, water: false,
    desc: '一车可载六十，短途称便。',
  },
  oxcart: {
    id: 'oxcart', name: '牛车', capacity: 150, load: 50, stamina: 1.15,
    price: 1500, minRank: 2, water: false,
    desc: '载重可观，唯牛行迟缓，且更耗人力。',
  },
  wain: {
    id: 'wain', name: '马车', capacity: 320, load: 120, stamina: 0.95,
    price: 4000, minRank: 3, water: false,
    desc: '车马轻捷，载重与速度兼得。',
  },
  boat: {
    id: 'boat', name: '舟船', capacity: 800, load: 200, stamina: 0.7,
    price: 12000, minRank: 4, water: true,
    desc: '循水而行，载重最巨；唯不通内陆。',
  },
};

export const VEHICLE_IDS = Object.keys(VEHICLES);

// 大宗交割的起售量：贩夫、行商即时交割，其余须成批
export const BULK_TRADE = [
  { rank: 0, minQty: 1, instant: true },
  { rank: 1, minQty: 5, instant: true },
  { rank: 2, minQty: 20, instant: false },
  { rank: 3, minQty: 50, instant: false },
  { rank: 4, minQty: 100, instant: false },
  { rank: 5, minQty: 200, instant: false },
];

// 在途风险
export const HAUL_RISK = { base: 0.05, perLongDay: 0.01, longDay: 10, lossRate: 0.3, escortCost: 200, escortHalve: 0.5 };

// ---------------- 商盟（质誓） ----------------
// 郑国质誓：「尔无我叛，我无强贾」——有契约地位，但须共担国运。
export const PACT = {
  grandMinRank: 3,        // 须巨商
  minFame: 30,
  baseFee: 3000,          // 质金基数，每多一盟翻倍：baseFee * 2^n
  levyBonus: 0.06,        // 盟国牙钱加成
  shopMultiplier: 1.5,    // 盟国商号月入倍率
  powerPayRate: 2,        // 月缴 = 国势 × 此值
  warLevy: 500,           // 该国战时一次性
  arrearsLimit: 2,        // 欠缴月数上限，超过解盟
  breakFame: 15,          // 主动解盟名声惩罚
  ruinFame: 20,           // 国亡导致失效的名声惩罚
};
