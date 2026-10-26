// 第 1 轮必修项的回归测试：商人仕途闸门、服务器健壮性、随机事件冷却、差事过期、修习可复现
import { newGame } from '../js/state.js';
import { canTakeOffice, canSeekOffice, seekOffice, OFFICE_FAME, OFFICE_QUEST_COUNT } from '../js/systems/progression.js';
import { startAudience } from '../js/systems/audience.js';
import { refreshBoard, acceptQuest, expireQuests } from '../js/systems/quests.js';
import { advanceDays } from '../js/systems/calendar.js';
import { rollRandomEvent } from '../js/systems/events.js';

import fs from 'node:fs';
import path from 'node:path';

let fails = 0;
const ok = (c, m, x = '') => { console.log(`${c ? '✓' : '✗'} ${m}${x ? ' — ' + x : ''}`); if (!c) fails++; };

// ---------------- 商人无仕途：四条路径全部封死 ----------------
{
  const ready = (prof) => {
    const st = newGame({ name: '试', profession: prof, seed: 3 });
    st.player.fame = OFFICE_FAME + 100;
    st.player.money = 99999;
    st.player.cityId = 'linzi';
    for (let i = 0; i < OFFICE_QUEST_COUNT + 2; i++) {
      st.quests.done.push({ id: `d${i}`, title: `差事${i}`, status: 'done', reward: {} });
    }
    return st;
  };

  const merchant = ready('shangren');
  ok(!canTakeOffice(merchant).ok, '商人不可入仕途', canTakeOffice(merchant).msg);
  ok(!canSeekOffice(merchant).ok, '商人 canSeekOffice 拒绝');
  ok(!seekOffice(merchant, 'qi').ok, '商人 seekOffice 拒绝');
  const aud = startAudience(merchant, 'qi');
  ok(aud.ok === false, '商人 startAudience 拒绝', aud.msg);
  ok(merchant.player.stateId == null, '商人未获官职');

  // 三个可仕职业仍可通过
  for (const prof of ['youxia', 'shuike', 'xuezhe']) {
    const st = ready(prof);
    ok(canTakeOffice(st).ok, `${prof} 可入仕途`);
    ok(canSeekOffice(st).ok, `${prof} canSeekOffice 通过`);
    ok(seekOffice(st, 'qi').ok, `${prof} seekOffice 通过`);
  }
}

// ---------------- 商人举荐入仕路径封死 ----------------
{
  const src = fs.readFileSync(path.join(process.cwd(), 'js/ui/npc.js'), 'utf8');
  const btnLine = src.split(String.fromCharCode(10)).find(l => l.includes('data-act="recommend"') && l.includes('<button'));
  ok(!!btnLine && btnLine.includes('canTakeOffice'), '举荐按钮对商人隐藏');
  const seg = src.slice(src.indexOf('data-act="recommend"]'), src.indexOf('data-act="recommend"]') + 400);
  ok(seg.includes('canTakeOffice'), '举荐处理器校验职业');
}

// ---------------- serve.cjs 健壮性 ----------------
{
  const src = fs.readFileSync(path.join(process.cwd(), 'serve.cjs'), 'utf8');
  ok(/try\s*\{[\s\S]{0,120}decodeURIComponent/.test(src), 'decodeURIComponent 有 try/catch');
  ok(src.includes('path.sep'), '路径前缀判断带分隔符');
  ok(!/startsWith\(root\)(?!\s*\+)/.test(src.replace(/file\.startsWith\(root \+ path\.sep\)/g, '')), '不再用裸 startsWith(root)');
}

// ---------------- 随机事件冷却以「日」为单位 ----------------
{
  const st = newGame({ name: '事', profession: 'youxia', seed: 11 });
  st.flags.recentRandom = {};
  st.events.pending = [];
  const first = rollRandomEvent(st);
  ok(!!first, '可触发随机事件');
  const id = first.ev.id;

  // 第 20 日：同事件不应重现
  st.time = { year: -722, month: 1, day: 21 };
  let in20 = 0;
  for (let k = 0; k < 300; k++) {
    st.events.pending = [];
    const e = rollRandomEvent(st);
    if (e?.ev.id === id) in20++;
  }
  ok(in20 === 0, '30 日冷却内不重现同一事件', `第20日重现 ${in20} 次`);

  // 第 35 日：允许重现
  st.time = { year: -722, month: 2, day: 6 };
  let in35 = 0;
  for (let k = 0; k < 300; k++) {
    st.events.pending = [];
    const e = rollRandomEvent(st);
    if (e?.ev.id === id) in35++;
  }
  ok(in35 > 0, '满 30 日后可重现同一事件', `第35日重现 ${in35} 次`);
}

// ---------------- 非出行差事也会过期 ----------------
{
  const st = newGame({ name: '限', profession: 'youxia', seed: 5 });
  st.player.cityId = 'linzi';
  let q = null;
  for (let i = 0; i < 60 && !q; i++) {
    q = refreshBoard(st, true).find(o => o.mode !== 'travel');
  }
  ok(!!q, '找到即时差事', q?.kind);
  ok(q.exp != null, '即时差事也设限期');
  const acc = acceptQuest(st, q.id);
  ok(acc.ok, '领受即时差事');
  advanceDays(st, (q.days ?? 10) + 30);
  expireQuests(st);
  ok(st.quests.active.length === 0, '逾期差事移出进行中');
  ok(st.quests.done.some(x => x.id === q.id && x.status === 'failed'), '逾期差事记为 failed');

  // 未到期时不应被误判
  const st3 = newGame({ name: '限3', profession: 'youxia', seed: 8 });
  st3.player.cityId = 'linzi';
  let q3 = null;
  for (let i = 0; i < 60 && !q3; i++) q3 = refreshBoard(st3, true).find(o => o.mode !== 'travel');
  if (q3) {
    acceptQuest(st3, q3.id);
    expireQuests(st3);
    ok(st3.quests.active.length === 1, '未到期差事不被误判');
  }

  // 出行差事仍照旧过期
  const st2 = newGame({ name: '限2', profession: 'youxia', seed: 6 });
  st2.player.cityId = 'linzi';
  let t = null;
  for (let i = 0; i < 60 && !t; i++) t = refreshBoard(st2, true).find(o => o.mode === 'travel');
  if (t) {
    acceptQuest(st2, t.id);
    advanceDays(st2, (t.days ?? 15) + 30);
    expireQuests(st2);
    ok(st2.quests.done.some(x => x.id === t.id && x.status === 'failed'), '出行差事仍会过期');
  } else {
    ok(true, '本种子无出行差事，跳过');
  }
}

// ---------------- 修习使用种子随机，不再用 Math.random ----------------
{
  const src = fs.readFileSync(path.join(process.cwd(), 'js/ui/training.js'), 'utf8');
  ok(!src.includes('Math.random'), '修习不再使用 Math.random');
  ok(/newZone\(\s*g\s*,\s*st\s*\)/.test(src) || /function newZone\(g, st\)/.test(src), 'newZone 接收 st');
  ok(/R\.next\(st\)/.test(src), '修习改用 R.next(st)');

  // 同一存档重复取区间应可复现
  const { R } = await import('../js/state.js');
  const a = newGame({ name: '复', profession: 'youxia', seed: 888 });
  const b = newGame({ name: '复', profession: 'youxia', seed: 888 });
  const va = [R.next(a), R.next(a), R.next(a)];
  const vb = [R.next(b), R.next(b), R.next(b)];
  ok(JSON.stringify(va) === JSON.stringify(vb), '同种子随机序列一致');
}


// ---------------- 第 2 轮：一致性与体验 ----------------
{
  console.log('\n--- 第 2 轮 ---');
  const { absDay: absDayU, START_YEAR } = await import('../js/util.js');
  const cal = await import('../js/systems/calendar.js');
  ok(absDayU({ year: START_YEAR, month: 1, day: 1 }) === 0, 'util.absDay 首日为 0');
  ok(cal.absDay === absDayU, 'calendar 复用同一 absDay');

  // 全部系统不再各写 dayOf
  for (const f of ['debate', 'peerage', 'policy', 'progression', 'relations']) {
    const src = fs.readFileSync(path.join(process.cwd(), `js/systems/${f}.js`), 'utf8');
    ok(!src.includes('dayOf'), `${f}.js 不再自带 dayOf`);
  }

  // 首日的冷却不能被真假值判断吞掉
  const st = newGame({ name: '冷', profession: 'youxia', seed: 3 });
  st.player.fame = 100; st.player.merit = 120; st.player.cityId = 'linzi';
  for (let i = 0; i < 3; i++) st.quests.done.push({ id: `z${i}`, status: 'done', reward: {} });
  const { seekOffice, officeCooldownLeft } = await import('../js/systems/progression.js');
  seekOffice(st, 'qi');
  ok(officeCooldownLeft(st) === 10, '首日出仕后冷却为 10 日', String(officeCooldownLeft(st)));

  const { giveGift } = await import('../js/systems/relations.js');
  const g = newGame({ name: '礼', profession: 'shangren', seed: 4 });
  g.player.inventory.yu = 5;
  giveGift(g, 'guan_zhong', 'yu');
  const r2 = giveGift(g, 'guan_zhong', 'yu');
  ok(!r2.ok, '首日赠礼后当日不能再赠', r2.msg);

  // 国君缺失的国家有合成国君，不再让卿相/名士代答
  const { audienceRuler } = await import('../js/systems/audience.js');
  const st2 = newGame({ name: '朝', profession: 'youxia', era: 'huan', seed: 1 });
  const { NPC_MAP } = await import('../js/data/npcs.js');
  for (const s of ['zhou', 'qin', 'lu', 'zheng', 'wu', 'yue', 'ju', 'zhu', 'sui', 'xu']) {
    const r = audienceRuler(st2, s);
    const isRealRuler = r && NPC_MAP[r.id]?.role === 'ruler';
    ok(!!r && (isRealRuler || r.synthetic), `${s} 有可用国君或合成国君`);
    ok(!!r?.bias, `${s} 国君有心性`, r?.bias);
  }

  // 舆图选中可重置
  const mapMod = await import('../js/ui/map.js');
  ok(typeof mapMod.resetSelection === 'function', '舆图提供 resetSelection');
  const appSrc = fs.readFileSync(path.join(process.cwd(), 'js/ui/app.js'), 'utf8');
  ok((appSrc.match(/resetSelection\(\)/g) ?? []).length >= 2, '开局与回标题都重置选中城');

  // 珍宝查询无副作用
  const { treasureStatus } = await import('../js/systems/trade.js');
  const st3 = newGame({ name: '宝', profession: 'shangren', seed: 6 });
  st3.player.cityId = 'luoyi';
  st3.world.treasures.bi.cities.luoyi.nextDay = 5;
  const before = JSON.stringify(st3.world.treasures.bi);
  treasureStatus(st3, 'bi', 'luoyi');
  treasureStatus(st3, 'bi', 'luoyi');
  ok(JSON.stringify(st3.world.treasures.bi) === before, 'treasureStatus 不改写存档');

  // 珍宝改名 + 旧存档迁移
  const { TREASURE_IDS, TREASURES } = await import('../js/data/treasures.js');
  ok(TREASURE_IDS.includes('xijiao') && !TREASURE_IDS.includes('xi'), '犀角 id 为 xijiao');
  ok(!('xi' in TREASURES), '旧 id xi 已移除');
  const { migrateState } = await import('../js/state.js');
  const legacy = newGame({ name: '旧', profession: 'shangren', seed: 7 });
  delete legacy.world.treasures.xijiao;
  legacy.world.treasures.xi = { price: 2200, sold: 1, cities: { ying: { nextDay: 5 } } };
  legacy.player.inventory = { xi: 2 };
  const mig = migrateState(legacy);
  ok(mig.player.inventory.xijiao === 2 && mig.player.inventory.xi === undefined, '旧存档犀角库存迁移');
  ok(mig.world.treasures.xijiao.price === 2200, '旧存档犀角价格保留', String(mig.world.treasures.xijiao.price));
  ok(mig.world.treasures.xi === undefined, '旧键已删除');

  // 死代码已清理
  const util = fs.readFileSync(path.join(process.cwd(), 'js/util.js'), 'utf8');
  ok(!/export function el\(/.test(util), 'util.el 已移除');
  const stateSrc = fs.readFileSync(path.join(process.cwd(), 'js/state.js'), 'utf8');
  ok(!/export function diploTier/.test(stateSrc), 'diploTier 已移除');
  const travelSrc = fs.readFileSync(path.join(process.cwd(), 'js/systems/travel.js'), 'utf8');
  ok(!/encounterOnRoad/.test(travelSrc), 'encounterOnRoad 已移除');
  const npcSrc = fs.readFileSync(path.join(process.cwd(), 'js/ui/npc.js'), 'utf8');
  ok(!/DEF_BIAS/.test(npcSrc), 'DEF_BIAS 已移除');
  const combatSrc = fs.readFileSync(path.join(process.cwd(), 'js/systems/combat.js'), 'utf8');
  ok(/WANDERER_NAMES/.test(combatSrc), '决斗名号复用 npcs.js 共享名单');

  // 文案一致
  const charSrc = fs.readFileSync(path.join(process.cwd(), 'js/ui/character.js'), 'utf8');
  ok(charSrc.includes('交情 75'), '举荐文案与实现一致');
}

console.log(fails ? ('\n失败 ' + fails + ' 项 ✗') : '\n加固与一致性测试全部通过 ✓');
process.exit(fails ? 1 : 0);
