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
