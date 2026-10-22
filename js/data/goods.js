// 货物与物价

export const GOODS = {
  su:      { name: '粟', unit: '石', base: 22, bulk: 1 },
  yan:     { name: '盐', unit: '车', base: 38, bulk: 1 },
  tie:     { name: '铁', unit: '担', base: 52, bulk: 1 },
  si:      { name: '丝', unit: '匹', base: 66, bulk: 1 },
  ma:      { name: '马', unit: '匹', base: 140, bulk: 2 },
  qi:      { name: '漆', unit: '桶', base: 44, bulk: 1 },
  yu:      { name: '玉', unit: '双', base: 210, bulk: 1 },
  ge:      { name: '革', unit: '张', base: 48, bulk: 1 },
};

// 城市产地：该货在此地便宜
export const LOCAL_SPECIALTY = {
  luoyi: 'yu', linzi: 'yan', qufu: 'si', jiang: 'ma', handan: 'tie',
  yong: 'ma', ying: 'qi', shangqiu: 'ge', chaoge: 'si', xinzheng: 'yu',
  ji: 'ge', gusu: 'si', kuaiji: 'tie', wanqiu: 'ge', shangcai: 'su', tao: 'su',
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
};

export const demandOf = (cityId, goodId) => DEMAND_BASE[cityId]?.[goodId] ?? 1;
