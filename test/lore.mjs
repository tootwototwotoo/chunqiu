// 市井传闻与本地人物
import { newGame, hasEvidence } from '../js/state.js';
import { NPCS } from '../js/data/npcs.js';
import { CITIES } from '../js/data/world.js';
import { rumorsHere, RUMORS } from '../js/data/rumors.js';
import { unheardRumors, hearRumor } from '../js/systems/lore.js';

let fails = 0;
const ok = (c, m, x = '') => { console.log(`${c ? '✓' : '✗'} ${m}${x ? ' — ' + x : ''}`); if (!c) fails++; };

// ---------------- 每座城都有人或有传闻 ----------------
{
  const byCity = {};
  for (const n of NPCS) (byCity[n.city] ||= []).push(n.name);
  const bare = CITIES.filter(c => !(byCity[c.id]?.length) && !rumorsHere(c.id).length);
  ok(bare.length === 0, '每座城都有人物或传闻', bare.map(c => c.name).join(','));
}

// ---------------- 传闻数据 ----------------
{
  const all = Object.values(RUMORS).flat();
  ok(all.length >= 8, '传闻数量充足', String(all.length));
  const ids = new Set(all.map(r => r.id));
  ok(ids.size === all.length, '传闻 id 唯一');
  const bad = all.filter(r => !r.name || !r.text || !r.topic || !r.skill || !r.dc);
  ok(bad.length === 0, '传闻字段完整', bad.map(r => r.id).join(','));
  // 每座有传闻的城都是「零人物城」
  const byCity = {};
  for (const n of NPCS) (byCity[n.city] ||= []).push(n);
  const conflict = Object.keys(RUMORS).filter(cid => byCity[cid]?.length);
  ok(conflict.length === 0, '有传闻的城本就没有人物', conflict.join(','));
}

// ---------------- 听传闻 ----------------
{
  const st = newGame({ name: 'x', profession: 'youxia', seed: 5 });
  const p = st.player;
  p.cityId = 'shu';
  p.stamina = 100;
  p.skills.shanggu = 10;
  p.stats.wu = 90;

  const before = unheardRumors(st).length;
  ok(before >= 2, '舒城有未闻之事', String(before));

  const r = hearRumor(st, 'shu_fisher');
  ok(r.ok, '可听传闻', r.msg?.slice(0, 20) ?? '');
  ok(!!r.rumor, '返回传闻内容');
  ok(unheardRumors(st).length === before - 1, '听后不再列出');
  ok(!hearRumor(st, 'shu_fisher').ok, '同一件不可重复听');

  // 技能高时应记入证据
  const st2 = newGame({ name: 'x', profession: 'youxia', seed: 6 });
  st2.player.cityId = 'shu';
  st2.player.stamina = 100;
  st2.player.skills.shanggu = 10;
  st2.player.stats.wu = 100;
  let got = false;
  for (let i = 0; i < 20 && !got; i++) {
    const s3 = newGame({ name: 'x', profession: 'youxia', seed: 100 + i });
    s3.player.cityId = 'shu';
    s3.player.stamina = 100;
    s3.player.skills.shanggu = 10;
    s3.player.stats.wu = 100;
    const rr = hearRumor(s3, 'shu_fisher');
    if (rr.success && hasEvidence(s3, 'shu_fisher')) got = true;
  }
  ok(got, '判定通过则记入证据');
}

// ---------------- 体力不足 ----------------
{
  const st = newGame({ name: 'x', profession: 'youxia', seed: 7 });
  st.player.cityId = 'shu';
  st.player.stamina = 2;
  ok(!hearRumor(st, 'shu_fisher').ok, '体力不足不可听');
}

// ---------------- 本地人物 ----------------
{
  const locals = NPCS.filter(n => /大夫|仓吏|邑宰|守臣|边将|戍将|守将/.test(n.name));
  ok(locals.length >= 8, '本地人物数量', String(locals.length));
  const bad = locals.filter(n => !n.desc?.includes('名不见经传'));
  ok(bad.length === 0, '本地人物都注明名不见经传', bad.map(n => n.name).join(','));
  const badRole = locals.filter(n => !['minister', 'general'].includes(n.role));
  ok(badRole.length === 0, '本地人物为卿相或将帅', badRole.map(n => n.name).join(','));
  // 都能教授技艺
  const noTeach = locals.filter(n => !(n.teach?.length));
  ok(noTeach.length === 0, '本地人物均可授艺', noTeach.map(n => n.name).join(','));
}

console.log(fails ? `\n失败 ${fails} 项 ✗` : '\n传闻与本地人物通过 ✓');
process.exit(fails ? 1 : 0);
