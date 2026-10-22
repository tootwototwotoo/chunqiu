// 个人决斗
import { R, player, skillLevel, addRel, addFame, addMoney, addMerit, addHealth, addStamina, addLog } from '../state.js';
import { ri, clamp } from '../util.js';

export const MOVES = {
  zhan: { name: '斩', hint: '克突', beats: 'tu' },
  tu:   { name: '突', hint: '克崩', beats: 'beng' },
  beng: { name: '崩', hint: '克斩', beats: 'zhan' },
  guard:{ name: '守', hint: '回气减伤' },
  special: { name: '绝招', hint: '耗气四', qi: 4 },
};

const HIT_LINES = [
  '{a}的{m}直取{b}，{b}闷哼一声。',
  '{a}踏步上前，一记{m}破开{b}的架势。',
  '{b}闪避不及，被{a}的{m}扫中。',
  '{a}沉肩发劲，{m}结结实实落在{b}身上。',
];
const MISS_LINES = [
  '{b}侧身让过，{a}的{m}落了空。',
  '{b}横剑格挡，金铁交击之声刺耳。',
  '{a}的{m}被{b}堪堪化开。',
];

export function startDuel(st, enemy, opts = {}) {
  const p = player(st);
  const myHp = Math.round(70 + p.stats.wu * 0.8);
  const eHp = enemy.hp ?? Math.round(70 + (enemy.wu ?? 50) * 0.8);
  return {
    over: false, won: null,
    round: 1,
    p: { name: p.name, hp: myHp, maxHp: myHp, qi: 2, maxQi: 8, wu: p.stats.wu, skill: skillLevel(st, 'jianshu'), history: [] },
    e: { name: enemy.name, hp: eHp, maxHp: eHp, qi: 2, maxQi: 8, wu: enemy.wu ?? 50, skill: enemy.skill ?? 2, history: [] },
    log: [`${enemy.name}拔剑而立，目光如电。`],
    friendly: !!opts.friendly,
    stakes: opts.stakes ?? 0,
    enemyId: enemy.id ?? null,
    opts,
  };
}

function calcDamage(st, att, def, move, matchup, guarded) {
  const r = R.int(st, 0, 6);
  let base = 7 + att.skill * 1.35 + att.wu * 0.11 + r;
  if (move === 'special') base = (12 + att.skill * 1.6 + att.wu * 0.14 + r) * 1.35;
  else if (matchup > 0) base *= 1.55;
  else if (matchup < 0) base *= 0.55;
  if (guarded) base *= move === 'special' ? 0.6 : 0.35;
  return Math.max(1, Math.round(base));
}

export function duelAct(st, d, move) {
  if (d.over) return d;
  const p = d.p, e = d.e;
  if (move === 'special' && p.qi < MOVES.special.qi) return d;
  const eMove = pickEnemyMove(st, d);
  const pMove = move;
  const lines = [];

  if (pMove === 'special') p.qi -= MOVES.special.qi;
  if (eMove === 'special') e.qi -= MOVES.special.qi;

  const pGuarded = pMove === 'guard';
  const eGuarded = eMove === 'guard';

  // 玩家出手
  if (pMove === 'guard') {
    p.qi = Math.min(p.maxQi, p.qi + 2);
    lines.push(`${p.name}凝神守御，气力渐复。`);
  } else {
    const guarded = eGuarded;
    let matchup = 0;
    if (pMove !== 'special' && eMove !== 'guard' && eMove !== 'special') matchup = MOVES[pMove].beats === eMove ? 1 : (MOVES[eMove].beats === pMove ? -1 : 0);
    const dmg = calcDamage(st, p, e, pMove, matchup, guarded);
    e.hp = Math.max(0, e.hp - dmg);
    p.qi = Math.min(p.maxQi, p.qi + 1);
    const line = (guarded || matchup < 0 ? MISS_LINES : HIT_LINES)[R.int(st, 0, 2)].replaceAll('{a}', p.name).replaceAll('{b}', e.name).replaceAll('{m}', MOVES[pMove].name);
    lines.push(line + (guarded ? `（${dmg}）` : `（${dmg}）`));
  }
  // 敌人出手
  if (!d.over && e.hp > 0) {
    if (eMove === 'guard') {
      e.qi = Math.min(e.maxQi, e.qi + 2);
      lines.push(`${e.name}退步守势，伺机而动。`);
    } else {
      const guarded = pGuarded;
      let matchup = 0;
      if (eMove !== 'special' && pMove !== 'guard' && pMove !== 'special') matchup = MOVES[eMove].beats === pMove ? 1 : (MOVES[pMove].beats === eMove ? -1 : 0);
      const dmg = calcDamage(st, e, p, eMove, matchup, guarded);
      p.hp = Math.max(0, p.hp - dmg);
      e.qi = Math.min(e.maxQi, e.qi + 1);
      const line = (guarded || matchup < 0 ? MISS_LINES : HIT_LINES)[R.int(st, 0, 2)].replaceAll('{a}', e.name).replaceAll('{b}', p.name).replaceAll('{m}', MOVES[eMove].name);
      lines.push(line + `（${dmg}）`);
    }
  }

  p.history.push(pMove);
  e.history.push(eMove);
  d.log.push(...lines);
  d.round++;

  if (e.hp <= 0 || p.hp <= 0) {
    d.over = true;
    d.won = e.hp <= 0 && p.hp > 0;
    d.log.push(d.won ? `${e.name}弃剑于地，认输了。` : `${p.name}力竭倒地，眼前一黑。`);
  }
  if (d.round > 40) { d.over = true; d.won = p.hp > e.hp; }
  return d;
}

function pickEnemyMove(st, d) {
  const e = d.e, p = d.p;
  if (e.hp < e.maxHp * 0.3 && e.qi < 4 && R.chance(st, 0.5)) return 'guard';
  if (e.qi >= 4 && R.chance(st, 0.28)) return 'special';
  const lastP = p.history[p.history.length - 1];
  if (lastP && R.chance(st, 0.45)) {
    const counter = Object.keys(MOVES).find(k => MOVES[k].beats === lastP);
    if (counter) return counter;
  }
  if (R.chance(st, 0.18)) return 'guard';
  return R.pick(st, ['zhan', 'tu', 'beng']);
}

// 结算决斗：返回奖励文本
export function settleDuel(st, d, npcId, opts = {}) {
  st.stats.duels++;
  if (d.won) {
    st.stats.duelWins++;
    const gain = opts.reward ?? (8 + R.int(st, 0, 10));
    addFame(st, opts.fame ?? 3);
    if (opts.money) addMoney(st, opts.money);
    if (npcId) addRel(st, npcId, opts.rel ?? 4);
    addLog(st, `与${d.e.name}交手，胜。`, 'gain');
    return { won: true, money: opts.money ?? 0 };
  }
  addHealth(st, -Math.round(8 + R.int(st, 0, 8)));
  addStamina(st, -10);
  addLog(st, `与${d.e.name}交手，败。`, 'war');
  return { won: false };
}

export function makeWanderer(st, tier = 1) {
  const names = ['无名剑客', '游士', '负剑之徒', '江湖客', '亡命之徒'];
  return {
    id: null,
    name: R.pick(st, names),
    wu: 40 + tier * 8 + R.int(st, 0, 10),
    skill: clamp(2 + tier, 1, 9),
  };
}

export function makeBanditChief(st, tier = 1) {
  return { id: null, name: '贼首', wu: 42 + tier * 10 + R.int(st, 0, 8), skill: clamp(2 + tier, 1, 9), hp: 90 + tier * 20 };
}

export function duelRewardText(res) {
  return res.won ? '你胜了，围观者喝彩，声名稍稍传开。' : '你败了，身上添了几道伤。';
}
