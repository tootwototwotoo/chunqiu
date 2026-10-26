// 证据获取：查访 / 打听 / 购买
import { newGame, addEvidence, hasEvidence, player } from '../js/state.js';
import { DEBATES, BOOKSHOPS } from '../js/data/debates/index.js';
import { NPC_MAP } from '../js/data/npcs.js';
import {
  investigateHere, investigate, investigateCooldown,
  npcEvidence, askNpc, marketHere, buyEvidence,
} from '../js/systems/evidence.js';
import { startDebate, useEvidence, settleDebate } from '../js/systems/debate.js';

let fails = 0;
const ok = (c, m, x = '') => { console.log(`${c ? '✓' : '✗'} ${m}${x ? ' — ' + x : ''}`); if (!c) fails++; };

// 三种来源都已落位
const byType = { investigate: 0, npc: 0, market: 0 };
for (const d of DEBATES) {
  const s = d.evidence.source;
  byType[s.type]++;
  if (s.type === 'investigate') ok(!!d.evidence.homeCity, `${d.id} 查访有城`);
  if (s.type === 'market') ok(BOOKSHOPS.includes(d.evidence.homeCity), `${d.id} 书肆在大城`);
  if (s.type === 'npc') ok(!!NPC_MAP[s.npcId], `${d.id} 打听有 NPC`);
}
ok(Object.values(byType).every(n => n > 10), '三种来源各覆盖一部分', JSON.stringify(byType));

// 查访
{
  const st = newGame({ name: '查访', profession: 'youxia', seed: 2 });
  st.player.cityId = 'tao';
  st.player.skills.suanshu = 10;
  st.player.stats.zhi = 100;
  st.player.stamina = 100;
  const list = investigateHere(st, 'tao');
  ok(list.length > 0, '本城有可查线索');
  const target = list[0];
  const r = investigate(st, target.id);
  ok(r.ok && hasEvidence(st, target.id), '查访成功入库', r.msg);
  ok(player(st).stamina === 92, '查访耗 8 体力');

  // 失败冷却按城市
  const f = newGame({ name: '失败', profession: 'youxia', seed: 3 });
  f.player.cityId = 'qufu';
  f.player.skills.suanshu = 0;
  f.player.stats.zhi = 0;
  f.player.fame = 0;
  f.player.stamina = 100;
  const q = investigateHere(f, 'qufu')[0];
  const bad = investigate(f, q.id);
  ok(!bad.ok, '低能力查访会失败');
  ok(investigateCooldown(f, 'qufu') > 0, '失败后本城进入冷却');
  const again = investigate(f, q.id);
  ok(!again.ok && again.msg.includes('日后再试'), '冷却中不能重复查访', again.msg);
  f.player.cityId = 'linzi';
  ok(investigateCooldown(f, 'linzi') === 0, '冷却只影响失败的城市');
}

// 打听：交情 > 20
{
  const st = newGame({ name: '打听', profession: 'shuike', seed: 4 });
  st.player.cityId = 'linzi';
  st.player.stamina = 100;
  const ev = npcEvidence(st, 'guan_zhong')[0];
  ok(!!ev, '管仲有可打听的证据');
  st.player.relations['guan_zhong'] = { aff: 20, met: true, gifts: 0 };
  ok(!askNpc(st, 'guan_zhong', ev.id).ok, '交情 20 不肯说');
  st.player.relations['guan_zhong'].aff = 21;
  const r = askNpc(st, 'guan_zhong', ev.id);
  ok(r.ok && hasEvidence(st, ev.id), '交情 21 可打听', r.msg);
}

// 购买：只在大城书肆
{
  const st = newGame({ name: '购买', profession: 'shangren', seed: 5 });
  st.player.cityId = 'luoyi';
  st.player.money = 1000;
  const list = marketHere(st, 'luoyi');
  ok(list.length > 0, '洛邑书肆有售');
  const ev = list[0];
  const before = player(st).money;
  const r = buyEvidence(st, ev.id);
  ok(r.ok && hasEvidence(st, ev.id), '购买成功入库', r.msg);
  ok(player(st).money === before - ev.source.price, '购买扣除金钱');
  ok(ev.source.price >= 500, '书肆证物价不低于 500 金', String(ev.source.price));

  st.player.cityId = 'jiang';
  ok(marketHere(st, 'jiang').length === 0, '非大城无书肆');
}

// 使用后永久保留
{
  const st = newGame({ name: '复用', profession: 'shuike', seed: 6 });
  addEvidence(st, 'relief_ev');
  const d = startDebate(st, { name: '县令', bias: 'li' }, { scenario: DEBATES.find(x => x.id === 'relief') });
  const r = useEvidence(st, d, 'relief_ev');
  ok(r.ok, '论辩中可出示');
  settleDebate(st, d, null);
  ok(hasEvidence(st, 'relief_ev'), '用后不消失，可再次使用');
}

console.log(fails ? `\n失败 ${fails} 项 ✗` : '\n证据获取通过 ✓');
process.exit(fails ? 1 : 0);
