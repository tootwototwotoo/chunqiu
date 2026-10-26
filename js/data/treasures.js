// 六种珍宝：一城一件、购后补货、每购一次全局涨价
// 价越高越罕见：城数越少、补货越久、涨幅越大

export const TREASURES = {
  yu: {
    id: 'yu', name: '美玉', unit: '双', base: 500,
    cities: ['luoyi', 'xinzheng', 'linzi', 'qufu', 'ying', 'yong', 'jiang', 'tao'],
    restock: 30, step: 1.15,
    text: '温润无瑕，诸侯聘问必以为礼。',
  },
  mingzhu: {
    id: 'mingzhu', name: '明珠', unit: '颗', base: 900,
    cities: ['gusu', 'kuaiji', 'linzi', 'ying'],
    restock: 40, step: 1.16,
    text: '南海所出，夜置暗室而光生。',
  },
  shan: {
    id: 'shan', name: '珊瑚树', unit: '株', base: 1400,
    cities: ['ji', 'linzi', 'gusu'],
    restock: 50, step: 1.17,
    text: '赤如丹砂，植于庭中，一望而知富。',
  },
  xijiao: {
    id: 'xijiao', name: '犀角', unit: '支', base: 2000,
    cities: ['ying', 'kuaiji', 'sui'],
    restock: 60, step: 1.18,
    text: '南中巨兽之角，药石所贵，可辟瘴疠。',
  },
  xiang: {
    id: 'xiang', name: '象牙', unit: '对', base: 2700,
    cities: ['ying', 'kuaiji'],
    restock: 70, step: 1.2,
    text: '长逾五尺，雕琢可成笏板与车饰。',
  },
  bi: {
    id: 'bi', name: '玄璧', unit: '件', base: 3600,
    cities: ['luoyi'],
    restock: 90, step: 1.22,
    text: '周室秘藏，玄色含光，唯天子及大诸侯得用之。',
  },
};

export const TREASURE_IDS = Object.keys(TREASURES);

// 本城有哪些珍宝
export function treasuresInCity(cityId) {
  return TREASURE_IDS.filter(id => TREASURES[id].cities.includes(cityId));
}
