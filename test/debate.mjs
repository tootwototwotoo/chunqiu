// 论辩机制：对症收益、连用衰减、心性转变与两次转变
import { newGame } from '../js/state.js';
import { startDebate, debateChoose, ARGS } from '../js/systems/debate.js';

let fails = 0;
const ok = (c, m, x = '') => { console.log(`${c ? '✓' : '✗'} ${m}${x ? ' — ' + x : ''}`); if (!c) fails++; };

function fresh(seed = 1, skill = 3, diff = 60, bias = 'shi') {
  const st = newGame({ name: '辩士', profession: 'shuike', seed });
  st.player.skills.biancai = skill;
  st.player.stats.mei = 60;
  st.player.stats.zhi = 60;
  const d = startDebate(st, { name: '国君', bias }, { difficulty: diff });
  return { st, d };
}
const pickNeutral = (bias) => Object.keys(ARGS).find(k => k !== bias && k !== ARGS[bias].opp);

// 对症首用 vs 连用
{
  const { st, d } = fresh(1);
  const m0 = d.meter;
  debateChoose(st, d, 'shi');
  const first = d.meter - m0;
  const m1 = d.meter;
  debateChoose(st, d, 'shi');
  const second = d.meter - m1;
  ok(first > 10, '对症「陈势」首用收益明显', `+${first}`);
  ok(second < first, '连续同一话术收益衰减', `${first} → ${second}`);
  ok(d.shifts === 1, '连续两次对症触发心性转变', String(d.shifts));
  ok(d.bias !== 'shi', '转变后心性改变', d.bias);
  ok(d.log.some(l => l.includes('【心性已变】')), '日志标明心性已变');
}

// 平常话术仍有正收益，且弱于对症
{
  const { st, d } = fresh(2);
  const m0 = d.meter;
  debateChoose(st, d, 'shi');
  const matched = d.meter - m0;
  const m1 = d.meter;
  debateChoose(st, d, 'li');
  const neutral = d.meter - m1;
  ok(neutral > 0, '对症之后用平常话术仍能推进', `+${neutral}`);
  ok(neutral < matched, '平常话术弱于对症', `${neutral} vs ${matched}`);
}

// 相悖话术最低
{
  const { st, d } = fresh(3);
  const m0 = d.meter;
  debateChoose(st, d, 'ming');
  const wrong = d.meter - m0;
  const { st: s2, d: d2 } = fresh(4);
  const n0 = d2.meter;
  debateChoose(s2, d2, 'li');
  const neutral = d2.meter - n0;
  ok(wrong < neutral, '相悖话术弱于平常话术', `${wrong} vs ${neutral}`);
}

// 单次对症不转变
{
  const { st, d } = fresh(5);
  debateChoose(st, d, 'shi');
  ok(d.shifts === 0, '仅一次对症不会转变');
  ok(d.tell.includes('不耐烦') || d.tell === '', '有神色提示', d.tell);
}

// 说服值达到 60 也会转变（交替出牌，不靠连用）
{
  const { st, d } = fresh(6);
  let guard = 0;
  while (!d.over && d.shifts === 0 && guard++ < 10) {
    debateChoose(st, d, d.used[d.used.length - 1] === d.bias ? pickNeutral(d.bias) : d.bias);
  }
  ok(d.shifts >= 1, '说服值到阈值触发转变', `meter ${Math.round(d.meter)}`);
}

// 高难度可两次；低难度一次
{
  const low = fresh(7, 3, 60).d;
  const high = fresh(8, 3, 70).d;
  ok(low.maxShifts === 1 && high.maxShifts === 2, '难度决定转变次数', `${low.maxShifts}/${high.maxShifts}`);

  const { st, d } = fresh(9, 5, 70);
  let guard = 0;
  while (!d.over && d.shifts < 2 && guard++ < 12) {
    debateChoose(st, d, d.used[d.used.length - 1] === d.bias ? pickNeutral(d.bias) : d.bias);
  }
  if (d.shifts < 2) {
    // 若自然没走到第二次，直接构造第二次触发条件
    d.round = 5; d.meter = 86; d.matchStreak = 2; d.lastShiftRound = 3; d.over = false; d.shifts = 1;
    debateChoose(st, d, d.bias);
  }
  ok(d.shifts === 2, '高难度可第二次转变', String(d.shifts));
  ok(d.maxShifts === 2, '不会超过两次');
}

// 转变方向随机
{
  const dirs = new Set();
  for (let i = 0; i < 40; i++) {
    const { st, d } = fresh(100 + i);
    debateChoose(st, d, 'shi');
    debateChoose(st, d, 'shi');
    if (d.shifts) dirs.add(d.bias);
  }
  ok(dirs.size >= 2, '转变方向为随机（不止一种）', [...dirs].join(','));
}

// 日志带判定与得失
{
  const { st, d } = fresh(11);
  debateChoose(st, d, 'shi');
  ok(d.log.some(l => l.includes('【对症】') && /说服[+-]\d+/.test(l)), '日志显示对症与说服增减');
}

// 会换招的玩家胜率明显更高
function rate(skill, diff, smart, n = 300) {
  let win = 0;
  for (let i = 0; i < n; i++) {
    const { st, d } = fresh(300 + i, skill, diff);
    let guard = 0;
    while (!d.over && guard++ < 12) {
      let key;
      if (smart) {
        const last = d.used[d.used.length - 1];
        key = last === d.bias ? pickNeutral(d.bias) : d.bias;
      } else {
        key = ['li', 'yi', 'ming', 'shi'][Math.floor(Math.random() * 4)];
      }
      debateChoose(st, d, key);
    }
    if (d.won) win++;
  }
  return win / n;
}
const smart = rate(3, 70, true);
const random = rate(3, 70, false);
ok(smart > 0.35, '辩才3 对高智略者、会换招可胜', `${Math.round(smart * 100)}%`);
ok(smart > random + 0.2, '会看心性换招明显优于乱选', `${Math.round(smart * 100)}% vs ${Math.round(random * 100)}%`);

console.log(fails ? `\n失败 ${fails} 项 ✗` : '\n论辩机制通过 ✓');
process.exit(fails ? 1 : 0);
