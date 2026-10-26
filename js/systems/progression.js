// 仕途、晋升、结局
import { RANKS, MERCHANT_TIERS, SCHOLAR_TIERS, PEERAGES, peerageName } from '../data/defs.js';
import { STATES, CITY_MAP } from '../data/world.js';
import { player, addLog, addFame, addMerit, addMoney, addRel, addStamina, skillLevel, rankName, age, careerTitle, R, rel } from '../state.js';
import { ri, clamp, diffTier, absDay } from '../util.js';
import { currentPolicy } from './policy.js';
import { treasureHonor, collectedTreasureKinds, offeredAllKinds } from './treasures.js';

export function checkPromotion(st) {
  const p = player(st);
  if (!p.stateId) return null;
  if (!['youxia', 'shuike', 'xuezhe'].includes(p.profession)) return null;
  const next = RANKS[p.rank + 1];
  if (next && p.merit >= next.merit) {
    p.rank += 1;
    addLog(st, `以功勋擢为${STATES[p.stateId].name}国${next.name}。`, 'big');
    addFame(st, 4, true);
    return { rank: next.name, pay: next.pay, state: STATES[p.stateId].name };
  }
  return null;
}



function rankForMerit(merit) {
  let rank = 1;
  for (let i = 1; i < RANKS.length; i++) if (merit >= RANKS[i].merit) rank = i;
  return rank;
}

const OFFICE_DC = 55;

// 求仕成算：政略、魅力、名声、辩才共同决定
export const OFFICE_FAME = 20;
export const OFFICE_QUEST_COUNT = 3;

// 仕途唯一闸门：商人无仕途，其余三途方可入仕。
// UI（朝堂谒见 / NPC 举荐）与系统（seekOffice / 廷对）都必须先过这一关。
export const CAREER_PROFESSIONS = ['youxia', 'shuike', 'xuezhe'];

export function canTakeOffice(st) {
  const p = player(st);
  if (!CAREER_PROFESSIONS.includes(p.profession)) {
    return { ok: false, msg: '商贾不入仕途，唯以货殖立身。' };
  }
  return { ok: true };
}

export function canSeekOffice(st) {
  const p = player(st);
  const gate = canTakeOffice(st);
  if (!gate.ok) return gate;
  if (p.fame < OFFICE_FAME) return { ok: false, msg: `名声不足（${p.fame}/${OFFICE_FAME}）。` };
  const done = st.quests?.done?.filter(q => q.status === 'done').length ?? 0;
  if (done < OFFICE_QUEST_COUNT) return { ok: false, msg: `差事未足（${done}/${OFFICE_QUEST_COUNT}）。` };
  return { ok: true };
}

export function officeChance(st) {
  const p = player(st);
  const score = 10 + p.stats.zheng * 0.55 + p.stats.mei * 0.4 + p.fame * 0.55 + skillLevel(st, 'biancai') * 2.2;
  return Math.max(0.05, Math.min(0.95, (score + 20 - OFFICE_DC) / 20));
}

export function officeCooldownLeft(st) {
  // 注意：纪元首日的 absDay 为 0，不能用真假值判断「是否出仕过」
  const last = st.flags.lastOffice;
  if (last == null) return 0;
  return Math.max(0, 10 - (absDay(st.time) - last));
}

export function markOfficeAttempt(st) {
  st.flags.lastOffice = absDay(st.time);
}

export function seekOffice(st, stateId) {
  const p = player(st);
  const gate = canTakeOffice(st);
  if (!gate.ok) return gate;
  if (p.stateId === stateId) return { ok: false, msg: `君已仕于${STATES[stateId].name}。` };
  if (p.fame < OFFICE_FAME) return { ok: false, msg: `名声未著（${p.fame}/${OFFICE_FAME}），国君不见。` };
  const doneCount = st.quests?.done?.filter(q => q.status === 'done').length ?? 0;
  if (doneCount < OFFICE_QUEST_COUNT) return { ok: false, msg: `未见实绩（差事 ${doneCount}/${OFFICE_QUEST_COUNT}），国君不见。` };
  const now = absDay(st.time);
  if (st.flags.lastOffice != null && now - st.flags.lastOffice < 10) return { ok: false, msg: '门吏挡驾：「君且待旬日再来。」' };
  st.flags.lastOffice = now;
  const roll = 10 + p.stats.zheng * 0.55 + p.stats.mei * 0.4 + p.fame * 0.55 + skillLevel(st, 'biancai') * 2.2 + R.int(st, 0, 20);
  const chancePct = Math.round(officeChance(st) * 100);
  const prevState = p.stateId;
  if (roll >= OFFICE_DC) {
    p.stateId = stateId;
    if (prevState && prevState !== stateId) {
      // 改仕他国：旧功减半，须从士重新做起
      p.merit = Math.round(p.merit * 0.5);
      p.rank = 1;
    } else {
      // 初次出仕：布衣时积累的功勋不抹去，按功勋授予初爵（最高上士）
      p.rank = Math.max(1, Math.min(3, rankForMerit(p.merit)));
      if (p.merit < 10) p.merit = 10;
    }
    addLog(st, `谒见${STATES[stateId].name}君，拜为${RANKS[p.rank].name}。`, 'big');
    addFame(st, 3);
    const ruler = npcRulerOf(st, stateId);
    if (ruler) addRel(st, ruler, 8);
    return { ok: true, msg: `国君与语，大悦，拜你为${STATES[stateId].name}国${RANKS[p.rank].name}。`, state: stateId, rank: p.rank };
  }
  addStamina(st, -5);
  return {
    ok: false, chance: chancePct,
    msg: `国君不见，门吏只让你在廊下候了半日。（成算约${chancePct}%）可先修习辩才、累积名声，或结好卿相请其举荐。`,
  };
}

export function npcRulerOf(st, stateId) {
  const ownerOf = (cityId) => st.world.owner[cityId] ?? CITY_MAP[cityId]?.state;
  const found = Object.values(st.npc).find(n => n.alive && n.city && ownerOf(n.city) === stateId);
  return found ? found.id : null;
}

// 献策：提升本国势力
// 从军出征（简化的战阵判定）
export function joinCampaign(st) {
  const p = player(st);
  if (!p.stateId) return { ok: false, msg: '未仕于国，无从军之命。' };
  const city = CITY_MAP[p.cityId];
  if (!city || !city.tags.includes('barracks')) return { ok: false, msg: '须于本国兵营领命出征。' };
  if (st.world.owner[p.cityId] !== p.stateId) return { ok: false, msg: '此处非本国兵营，出征须归国领命。' };
  addStamina(st, -18);
  const skill = skillLevel(st, 'bingfa');
  const powerMod = ((st.world.power[p.stateId] ?? 50) - 50) * 0.35;
  const policyMod = currentPolicy(st)?.id === 'army' ? 8 : 0;
  const roll = skill * 4 + p.stats.wu * 0.4 + p.stats.zhi * 0.3 + powerMod + policyMod + R.int(st, 0, 25);
  const foeState = R.pick(st, Object.keys(STATES).filter(s => s !== p.stateId && s !== 'zhou'));
  if (roll >= 52) {
    const merit = 12 + Math.floor(roll / 3);
    st.world.power[p.stateId] = clamp((st.world.power[p.stateId] ?? 30) + 2, 5, 100);
    st.world.power[foeState] = clamp((st.world.power[foeState] ?? 30) - 1, 5, 100);
    addMerit(st, merit);
    addFame(st, 4);
    addMoney(st, 30 + merit, true);
    addLog(st, `从军伐${STATES[foeState].name}，有功。`, 'gain');
    return { ok: true, msg: `你随军伐${STATES[foeState].name}，斩获颇多，功勋+${merit}，得赏${30 + merit}金。`, win: true };
  }
  const names = { jianshu: '剑术', bingfa: '兵法', sheshu: '射术' };
  addLog(st, `从军不利，身被数创。`, 'war');
  return { ok: true, msg: '战阵失利，你负伤而还，功勋未增。', win: false };
}

export function scoreOf(st) {
  const p = player(st);
  const skills = Object.values(p.skills).reduce((a, b) => a + b, 0);
  const honor = treasureHonor(st);
  return Math.round(
    p.fame * 3 + p.merit * 0.6 + skills * 6 + p.money / 60 +
    p.disciples * 4 + p.missions * 6 + p.alliances * 10 + p.shops.length * 8 +
    (p.rank * 12) + (p.peerage ? (p.peerage.rank + 1) * 80 : 0) +
    (honor ? honor.bonus : 0)
  );
}

export function computeEnding(st) {
  const p = player(st);
  const score = scoreOf(st);
  const s = st.stats;
  let rank = '', comment = '', epilogue = '';
  if (p.profession === 'youxia') {
    if (p.rank >= 7) { rank = '一国之相'; comment = '出将入相，权倾朝野。'; }
    else if (p.rank >= 5) { rank = '柱国之臣'; comment = '位列上大夫，名重诸侯。'; }
    else if (p.fame >= 60) { rank = '天下名侠'; comment = '一剑之任，重于九鼎。'; }
    else if (p.fame >= 30) { rank = '一方游侠'; comment = '仗剑江湖，颇有侠名。'; }
    else { rank = '无名剑客'; comment = '剑在匣中，名在风里。'; }
    epilogue = `你一生交手${s.duels}次，胜${s.duelWins}次。`;
  } else if (p.profession === 'shangren') {
    const tier = MERCHANT_TIERS.filter(t => p.money >= t.need).pop();
    rank = tier.name;
    comment = p.money >= 16000 ? '三致千金，名显天下，世称陶朱。' : p.money >= 3500 ? '坐列贩卖，家累千金。' : '贩贱卖贵，聊以自足。';
    epilogue = `你行商${s.trades}次，累计获利颇丰。`;
  } else if (p.profession === 'shuike') {
    if (p.missions >= 14) { rank = '天下辩士'; comment = '一怒而诸侯惧，安居而天下熄。'; }
    else if (p.missions >= 9) { rank = '国士'; comment = '片言解纷，诸侯宾之。'; }
    else if (p.missions >= 5) { rank = '上宾'; comment = '往来列国，诸侯待为上客。'; }
    else { rank = '游士'; comment = '口舌之利，未逢其时。'; }
    epilogue = `你游说${s.debates}次，成${s.debateWins}次，促成盟约${p.missions}次。`;
  } else {
    const tier = SCHOLAR_TIERS.filter(t => p.disciples >= t.need).pop();
    rank = tier.name;
    comment = p.disciples >= 28 ? '立一家之言，弟子遍天下，后世宗师之。' : p.disciples >= 8 ? '讲学授徒，门庭若市。' : '弦歌不辍，独善其身。';
    epilogue = `你收徒${p.disciples}人，著书${p.works.length}篇。`;
  }
  const honor = treasureHonor(st);
  if (honor) comment = `${honor.text}${comment}`;
  if (offeredAllKinds(st)) epilogue = `${epilogue}六种珍宝俱曾献于朝，君臣之义亦厚矣。`;
  return {
    rank, comment, epilogue, score,
    age: age(st),
    stats: [
      ['名声', p.fame], ['官阶', careerTitle(st) || rankName(st)],
      ['爵位', p.peerage ? peerageName(p.peerage.rank) : '未受封'],
      ['功勋', p.merit],
      ['珍宝', `${collectedTreasureKinds(st).length}/6`],
      ['知己', Object.values(p.relations).filter(r => r.aff >= 52).length],
      ['决斗胜', `${s.duelWins}/${s.duels}`],
    ],
    date: st.time,
    title: `${p.name}·${careerTitle(st) || rank}`,
  };
}
