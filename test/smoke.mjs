// 无头冒烟测试：不依赖 DOM，验证核心系统可运行
import { newGame, player, addSkillExp, skillLevel } from '../js/state.js';
import { advanceDays } from '../js/systems/calendar.js';
import { travelPlan, travelTo } from '../js/systems/travel.js';
import { refreshBoard, acceptQuest, checkArrivalQuests } from '../js/systems/quests.js';
import { buy, sell } from '../js/systems/trade.js';
import { startDuel, duelAct, settleDuel, makeWanderer, makeBanditChief } from '../js/systems/combat.js';
import { startDebate, debateChoose, settleDebate } from '../js/systems/debate.js';
import { seekOffice, joinCampaign, checkPromotion, computeEnding } from '../js/systems/progression.js';
import { canAdvise, pickIssue, adviseOutcome } from '../js/systems/policy.js';
import { talk, learnFrom, giftCandidates } from '../js/systems/relations.js';

import { CITIES, CITY_MAP } from '../js/data/world.js';
import { GOODS } from '../js/data/goods.js';
import { NPCS } from '../js/data/npcs.js';

let failures = 0;
const ok = (cond, msg) => { if (!cond) { console.log('  ✗ ' + msg); failures++; } };

function runDuel(st, enemy) {
  const d = startDuel(st, enemy);
  let guard = 0;
  while (!d.over && guard++ < 100) {
    const moves = ['zhan', 'tu', 'beng', 'guard', 'special'];
    duelAct(st, d, moves[Math.floor(Math.random() * moves.length)]);
  }
  ok(d.over, '决斗应当结束');
  return settleDuel(st, d, enemy.id ?? null, {});
}

function runDebate(st, npc) {
  const d = startDebate(st, npc, {});
  let guard = 0;
  while (!d.over && guard++ < 6) {
    debateChoose(st, d, Math.floor(Math.random() * 3));
  }
  ok(d.over, '辩论应当结束');
  return settleDebate(st, d, npc.id ?? null, {});
}

for (const prof of ['youxia', 'shangren', 'shuike', 'xuezhe']) {
  console.log(`\n== ${prof} ==`);
  const st = newGame({ name: '测试', profession: prof, seed: 42 });
  ok(st.player.money > 0, '初始金钱');
  ok(Object.keys(st.world.prices).length === CITIES.length, '物价初始化');

  // 修习
  for (const k of Object.keys(player(st).skills)) {
    addSkillExp(st, k, 60);
    ok(player(st).skills[k] >= 0, '技能增长');
  }
  ok(skillLevel(st, 'jianshu') >= 1, '剑术应升级');

  // 交易
  if (prof === 'shangren') {
    for (const g of Object.keys(GOODS)) {
      const b = buy(st, g, 2);
      if (b.ok) {
        const s = sell(st, g, 2);
        ok(s.ok, '卖出成功');
        ok(player(st).money >= 0, '金钱非负');
      }
    }
  }

  // 差事
  const board = refreshBoard(st, true);
  ok(board.length >= 2, '榜文生成');
  const travelQuest = board.find(q => q.mode === 'travel');
  if (travelQuest) {
    const acc = acceptQuest(st, travelQuest.id);
    ok(acc.ok, '接受差事');
    if (travelQuest.kind === 'supply') {
      // 备货
      for (let i = 0; i < 20 && (player(st).inventory[travelQuest.goodId] ?? 0) < travelQuest.qty; i++) {
        if (!buy(st, travelQuest.goodId, 1).ok) break;
      }
    }
    const plan = travelPlan(st, travelQuest.targetCity);
    ok(!!plan, '存在路线');
    const tr = travelTo(st, travelQuest.targetCity);
    ok(tr.ok, '旅行成功');
    const done = checkArrivalQuests(st, travelQuest.targetCity);
    ok(done.length >= 0, '抵达检查');
  }

  // 决斗 & 辩论
  runDuel(st, makeWanderer(st, 2));
  runDuel(st, makeBanditChief(st, 1));
  const npc = NPCS.find(n => n.birth == null || (st.time.year >= n.birth && st.time.year <= (n.death ?? 9999)));
  if (npc) {
    runDebate(st, { id: npc.id, name: npc.name, title: npc.title, bias: npc.bias, stats: npc.stats });
    const g = giftCandidates(st, npc.id);
    ok(g.length > 0, '礼物候选');
    talk(st, npc.id);
    learnFrom(st, npc.id, npc.teach?.[0] ?? 'jianshu');
  }

  // 仕途
  st.player.fame = Math.max(st.player.fame, 30);
  for (let k = 0; k < 3; k++) st.quests.done.push({ id: `sm${k}`, title: `差事${k}`, status: 'done', reward: {} });
  const office = seekOffice(st, 'qi');
  if (office.ok) {
    if (canAdvise(st).ok) {
      const issue = pickIssue(st);
      adviseOutcome(st, issue, 0, 'li');
    }
    joinCampaign(st);
    checkPromotion(st);
  }

  // 长时段模拟：40 年
  let died = false;
  for (let i = 0; i < 40 && !died; i++) {
    const res = advanceDays(st, 360, {});
    died = res.died;
    if (res.events.length) {
      ok(res.events.every(e => e.ev && e.kind), '事件结构');
    }
    // 每年旅行一次
    const target = CITIES[Math.floor(Math.random() * CITIES.length)];
    const tr = travelTo(st, target.id);
    if (tr.ok && tr.died) died = true;
  }
  const ending = computeEnding(st);
  ok(!!ending.rank, '应有结局评语');
  console.log(`  结局：${ending.rank} / 评分 ${ending.score} / 享年 ${ending.age}`);
  console.log(`  名声 ${player(st).fame} 金 ${player(st).money} 城 ${CITY_MAP[player(st).cityId].name} 事件 ${st.events.news.length}`);
}

// 存档往返
const st = newGame({ name: '存档', profession: 'youxia', seed: 7 });
advanceDays(st, 100);
const clone = JSON.parse(JSON.stringify(st));
ok(clone.time.year === st.time.year, '存档序列化');
ok(clone.world.prices === undefined ? false : true, '物价随存档');

console.log(failures === 0 ? '\n全部通过 ✓' : `\n失败 ${failures} 项 ✗`);
process.exit(failures ? 1 : 0);
