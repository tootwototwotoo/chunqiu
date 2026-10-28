// 市井传闻：无知名之士的城池，以传闻提供内容与线索
// 传闻可作论辩证据（视同查访所得），也可只是地方风物
export const RUMORS = {
  shu: [
    { id: 'shu_fisher', topic: 'trade', name: '舒泽渔簿', skill: 'shanggu', dc: 42,
      text: '群舒水泽纵横，渔户按籍纳鱼。簿上所记与官府所收，年年对不上。',
      detail: '乡老言：鱼税簿上少了三成，渔户说都让「水耗」吃去了。' },
    { id: 'shu_reed', topic: 'grain', name: '泽畔芦荡', skill: 'xuewen', dc: 40,
      text: '舒地多芦，秋熟可织席。近年无人收，任其枯死水中。',
      detail: '妇人言：往年芦席卖到郢都，如今商旅不来，只好烂在泽里。' },
  ],
  chengpu: [
    { id: 'cp_bones', topic: 'army', name: '城濮故垒', skill: 'bingfa', dc: 44,
      text: '城濮田野间时见断戈朽骨。晋楚之战已五十余年，垄亩之下犹有遗骸。',
      detail: '耕者言：犁地常翻出箭头，铁已锈尽，一捏就碎。' },
    { id: 'cp_oath', topic: 'diplomacy', name: '践土旧盟', skill: 'biancai', dc: 45,
      text: '城濮之胜后，晋侯盟诸侯于践土。盟书虽佚，其辞犹在故老之口。',
      detail: '老者能诵盟辞数句：「皆奖王室，无相侵夺。」' },
  ],
  zhuji: [
    { id: 'zj_forge', topic: 'trade', name: '冶剑旧坊', skill: 'shanggu', dc: 43,
      text: '诸暨山民善冶，所铸剑器犀利。坊中残炉尚存，炭灰深可没膝。',
      detail: '匠人言：此山之铁宜为剑，不宜为农器。' },
    { id: 'zj_sword', topic: 'army', name: '断剑残铭', skill: 'jianshu', dc: 44,
      text: '山涧中拾得断剑一截，铭文漫漶，似是越人所铸。',
      detail: '剑脊有鸟虫书数字，识者以为越之工名。' },
  ],
  linyi: [
    { id: 'ly_horse', topic: 'army', name: '易水马政', skill: 'bingfa', dc: 42,
      text: '临易近戎狄，马市颇盛。官府所录马数，与市上所见不符。',
      detail: '牙人言：好马多私下卖与北边，官册上只剩老弱。' },
    { id: 'ly_beacon', topic: 'diplomacy', name: '北鄙烽燧', skill: 'xuewen', dc: 41,
      text: '燕之北鄙多烽燧，台基犹在。近年烽火不举，戍卒散去。',
      detail: '戍卒后人言：烽燧之制，一炬传百里，今无人识其法。' },
  ],
  taolin: [
    { id: 'tl_pass', topic: 'land', name: '桃林塞籍', skill: 'quanmou', dc: 44,
      text: '桃林为秦之塞邑，扼关中之咽喉。过关者须录名于籍。',
      detail: '关吏言：近年过关者渐多，多称「东市」，其实都往中原。' },
  ],
};

export function rumorsHere(cityId) {
  return RUMORS[cityId] ?? [];
}

export function rumorById(id) {
  for (const list of Object.values(RUMORS)) {
    const hit = list.find(r => r.id === id);
    if (hit) return hit;
  }
  return null;
}

// 已听过的传闻记在 flags 里
export function heardRumors(st) {
  st.flags.rumorsHeard = st.flags.rumorsHeard ?? [];
  return st.flags.rumorsHeard;
}
