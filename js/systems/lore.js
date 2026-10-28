// 传闻与本地人物：给僻远城池提供内容
import { rumorsHere, heardRumors } from '../data/rumors.js';
import { player, addLog, addStamina, addEvidence, R } from '../state.js';

// 本城尚未听过的传闻
export function unheardRumors(st, cityId = player(st).cityId) {
  const heard = heardRumors(st);
  return rumorsHere(cityId).filter(r => !heard.includes(r.id));
}

// 听传闻：耗半日，按技艺判定；成功则记入证据（视同查访所得）
export function hearRumor(st, rumorId) {
  const p = player(st);
  const heard = heardRumors(st);
  const rumor = rumorsHere(p.cityId).find(r => r.id === rumorId);
  if (!rumor) return { ok: false, msg: '并无此闻。' };
  if (heard.includes(rumorId)) return { ok: false, msg: '此事你已听过。' };
  if (p.stamina < 5) return { ok: false, msg: '精神不济，听不进去。' };

  addStamina(st, -5);
  const lv = p.skills?.[rumor.skill] ?? 0;
  const stat = rumor.skill === 'xuewen' ? p.stats.zhi : p.stats.wu;
  const roll = lv * 5 + stat * 0.3 + R.int(st, 0, 20);
  const ok = roll >= rumor.dc;

  heard.push(rumorId);
  if (ok) {
    addEvidence(st, rumorId);
    addLog(st, `闻「${rumor.name}」。`, 'gain');
    return {
      ok: true, success: true, rumor,
      msg: `${rumor.detail}`,
      note: `已记入证据：${rumor.name}`,
    };
  }
  addLog(st, `听「${rumor.name}」，未得要领。`);
  return {
    ok: true, success: false, rumor,
    msg: `${rumor.detail}（你听了个大概，却不得要领。）`,
    note: '判定未过，未记入证据',
  };
}

// 本地人物：给大邑配的「名不见经传」的守臣
export const LOCAL_NOTABLES = {
  pengcheng: { name: '彭城大夫', title: '宋之东鄙大夫', state: 'song', city: 'pengcheng',
    role: 'minister', bias: 'yi', pref: 'su', birth: -620, death: -560,
    stats: { wu: 46, zhi: 72, zheng: 74, mei: 64 }, skills: { quanmou: 6, bingfa: 5 },
    teach: ['quanmou'], quote: '彭城为泗上之会，不敢不守。',
    desc: '宋之东鄙守臣，名不见经传，史籍仅载其守邑之事。' },
  huai: { name: '淮阳仓吏', title: '陈之仓吏', state: 'chen', city: 'huai',
    role: 'minister', bias: 'li', pref: 'su', birth: -600, death: -540,
    stats: { wu: 36, zhi: 70, zheng: 76, mei: 60 }, skills: { suanshu: 7, shanggu: 6 },
    teach: ['suanshu'], quote: '仓中之粟，颗粒皆民之膏血。',
    desc: '陈之仓吏，掌淮阳粮仓。名不见经传，唯仓籍上留其姓。' },
  yongqiu: { name: '雍丘邑宰', title: '宋之杞邑宰', state: 'song', city: 'yongqiu',
    role: 'minister', bias: 'yi', pref: 'si', birth: -620, death: -560,
    stats: { wu: 44, zhi: 70, zheng: 72, mei: 62 }, skills: { quanmou: 5, xuewen: 5 },
    teach: ['xuewen'], quote: '杞人忧天，吾忧其田。',
    desc: '宋之杞邑宰。名不见经传，史籍仅载其治邑。' },
  qi2: { name: '岐山守臣', title: '秦之周原守臣', state: 'qin', city: 'qi2',
    role: 'minister', bias: 'yi', pref: 'su', birth: -680, death: -620,
    stats: { wu: 48, zhi: 74, zheng: 76, mei: 64 }, skills: { xuewen: 6, quanmou: 5 },
    teach: ['xuewen'], quote: '周原膴膴，堇荼如饴。',
    desc: '秦之守臣，守岐山周原故地。名不见经传，唯《诗》存其地。' },
  ju_chao: { name: '郈邑宰', title: '鲁之郈邑宰', state: 'lu', city: 'ju_chao',
    role: 'minister', bias: 'li', pref: 'si', birth: -580, death: -520,
    stats: { wu: 40, zhi: 72, zheng: 74, mei: 62 }, skills: { quanmou: 6 },
    teach: ['quanmou'], quote: '郈为季氏之邑，吾为季氏之宰。',
    desc: '鲁之郈邑宰，实为三桓家臣。名不见经传，政在家门。' },

  pingyang: { name: '平阳边将', title: '晋之边将', state: 'jin', city: 'pingyang',
    role: 'general', bias: 'shi', pref: 'ma', birth: -620, death: -560,
    stats: { wu: 74, zhi: 68, zheng: 58, mei: 56 }, skills: { bingfa: 7, jianshu: 6 },
    teach: ['bingfa'], quote: '胡马南来，吾当之。',
    desc: '晋北边将，御戎狄于平阳。名不见经传，唯烽燧下有碑记其守。' },
  zhoulai: { name: '州来戍将', title: '吴之戍将', state: 'wu', city: 'zhoulai',
    role: 'general', bias: 'shi', pref: 'tie', birth: -560, death: -500,
    stats: { wu: 78, zhi: 66, zheng: 56, mei: 54 }, skills: { bingfa: 7, sheshu: 6 },
    teach: ['sheshu'], quote: '州来一日三易主，吾不知明日属谁。',
    desc: '吴之西境戍将，守州来。吴楚争此城，屡易其主。' },
  zhi: { name: '虎牢守将', title: '郑之制邑守将', state: 'zheng', city: 'zhi',
    role: 'general', bias: 'shi', pref: 'ma', birth: -620, death: -570,
    stats: { wu: 76, zhi: 70, zheng: 58, mei: 54 }, skills: { bingfa: 8 },
    teach: ['bingfa'], quote: '制，岩邑也，虢叔死焉。',
    desc: '郑之制邑守将，守虎牢之险。名不见经传，唯险要之地需人守。' },
  yun: { name: '郧邑戍将', title: '楚之北鄙戍将', state: 'chu', city: 'yun',
    role: 'general', bias: 'yi', pref: 'si', birth: -600, death: -540,
    stats: { wu: 70, zhi: 68, zheng: 62, mei: 56 }, skills: { bingfa: 6, quanmou: 5 },
    teach: ['bingfa'], quote: '汉水之滨，楚之门户。',
    desc: '楚之北鄙戍将，守郧。名不见经传，唯与随、邓相邻。' },
};
