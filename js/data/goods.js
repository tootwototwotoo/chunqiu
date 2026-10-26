// 货物与物价

export const GOODS = {
  su:      { name: '粟', unit: '石', base: 22, bulk: 1 },
  yan:     { name: '盐', unit: '车', base: 38, bulk: 1 },
  tie:     { name: '铁', unit: '担', base: 52, bulk: 1 },
  si:      { name: '丝', unit: '匹', base: 66, bulk: 1 },
  ma:      { name: '马', unit: '匹', base: 140, bulk: 2 },
  qi:      { name: '漆', unit: '桶', base: 44, bulk: 1 },
  ge:      { name: '革', unit: '张', base: 48, bulk: 1 },
  // 珍宝：不在市集买卖，只在「珍宝」页以稀缺价出售
  yu:      { name: '美玉', unit: '双', base: 500, bulk: 1, treasure: true },
  mingzhu: { name: '明珠', unit: '颗', base: 900, bulk: 1, treasure: true },
  shan:    { name: '珊瑚树', unit: '株', base: 1400, bulk: 1, treasure: true },
  xijiao:  { name: '犀角', unit: '支', base: 2000, bulk: 1, treasure: true },
  xiang:   { name: '象牙', unit: '对', base: 2700, bulk: 1, treasure: true },
  bi:      { name: '玄璧', unit: '件', base: 3600, bulk: 1, treasure: true },
};

// 普通货物（排除珍宝）
export const PLAIN_GOODS = Object.keys(GOODS).filter(g => !GOODS[g].treasure);
export const TREASURE_GOODS = Object.keys(GOODS).filter(g => GOODS[g].treasure);
export const isTreasure = (g) => !!GOODS[g]?.treasure;

// 城市产地：该货在此地便宜
// 城池特产：只列普通货物。珍宝由珍宝市单独定价，不参与普通物价折扣。
export const LOCAL_SPECIALTY = {
  luoyi: 'si', linzi: 'yan', qufu: 'si', jiang: 'ma', handan: 'tie',
  yong: 'ma', ying: 'qi', shangqiu: 'ge', chaoge: 'si', xinzheng: 'tie',
  ji: 'ge', gusu: 'si', kuaiji: 'tie', wanqiu: 'ge', shangcai: 'su', tao: 'su',
  ju: 'yan', zhu: 'su', fei: 'si', diqiu: 'ge', quwo: 'tie', pingyang: 'ma',
  shen: 'tie', xi: 'qi', sui: 'ma', qi2: 'qi', pengcheng: 'su', zhoulai: 'ge',
  zhuji: 'si', xu: 'ge', linyi: 'ma',
};

// 各地对各货的需求系数（1 为平）
const DEMAND_BASE = {
  luoyi:    { yu: 1.35, si: 1.15, yan: 0.95, ma: 0.9 },
  linzi:    { yan: 0.72, si: 0.95, tie: 1.15, ma: 1.1, yu: 1.05 },
  qufu:     { si: 0.78, su: 0.95, yu: 1.1, yan: 1.1 },
  jiang:    { ma: 0.82, tie: 0.95, su: 1.0, si: 1.1, yan: 1.15 },
  handan:   { tie: 0.78, ma: 1.05, su: 1.0, ge: 1.05 },
  yong:     { ma: 0.8, tie: 1.05, si: 1.25, yan: 1.2, yu: 1.15 },
  ying:     { qi: 0.8, si: 0.95, yu: 1.15, ma: 1.15 },
  shangqiu: { ge: 0.82, su: 0.95, tie: 1.1, yu: 1.1 },
  chaoge:   { si: 0.85, su: 0.9, yan: 1.05, qi: 1.1 },
  xinzheng: { yu: 0.85, si: 1.0, su: 0.95, tie: 1.05 },
  ji:       { ge: 0.85, su: 1.05, si: 1.3, yan: 1.25, tie: 1.1 },
  gusu:     { si: 0.86, yan: 1.2, yu: 1.2, qi: 1.1 },
  kuaiji:   { tie: 0.82, yan: 1.25, si: 1.25, su: 1.0 },
  wanqiu:   { ge: 0.88, su: 1.0, qi: 1.1 },
  shangcai: { su: 0.88, ge: 1.0, ma: 1.15 },
  tao:      { su: 0.86, si: 1.0, yan: 1.05, yu: 1.12, ge: 1.0 },
  ju:       { yan: 0.7, si: 1.1, ma: 1.05, su: 1.0 },
  zhu:      { su: 0.88, ge: 1.05, si: 1.05 },
  fei:      { si: 0.82, su: 0.95, yu: 1.1 },
  diqiu:    { ge: 0.85, su: 1.0, yan: 1.05, tie: 1.05 },
  quwo:     { tie: 0.8, ma: 1.0, su: 1.0 },
  pingyang: { ma: 0.8, tie: 1.05, si: 1.1 },
  shen:     { tie: 0.82, qi: 1.1, yu: 1.1, su: 0.98 },
  xi:       { qi: 0.85, su: 0.98, yu: 1.05 },
  sui:      { yu: 0.86, si: 1.05, qi: 1.05 },
  qi2:      { qi: 0.86, yu: 1.05, ma: 1.08 },
  pengcheng:{ su: 0.86, ge: 1.0, si: 1.08 },
  zhoulai:  { ge: 0.88, yan: 1.1, tie: 1.1 },
  zhuji:    { si: 0.88, tie: 1.1, yan: 1.15 },
  xu:       { ge: 0.9, su: 0.95, yu: 1.08 },
  linyi:    { ma: 0.85, ge: 1.05, si: 1.15 },
};

export const demandOf = (cityId, goodId) => DEMAND_BASE[cityId]?.[goodId] ?? 1;


// 兼容旧代码：美玉的配置（完整珍宝表见 treasures.js）
export const JADE = {
  cities: ['luoyi', 'xinzheng', 'linzi', 'qufu', 'ying', 'yong', 'jiang', 'tao'],
  basePrice: 500,
  restockDays: 30,
  priceStep: 1.15,
  maxStock: 8,
};
