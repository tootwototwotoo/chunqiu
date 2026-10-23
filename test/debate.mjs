// 论辩机制：对症收益、连用衰减、平常/相悖对比
import { newGame, player } from '../js/state.js';
import { startDebate, debateChoose } from '../js/systems/debate.js';

let fails = 0;
const ok = (c, m, x = '') => { console.log(`${c ? '✓' : '✗'} ${m}${x ? ' — ' + x : ''}`); if (!c) fails++; };

function fresh(seed = 1, skill = 3, diff = 60) {
  const st = newGame({ name: '辩士', profession: 'shuike', seed });
  st.player.skills.biancai = skill;
  st.player.stats.mei = 60;
  st.player.stats.zhi = 60;
  const d = startDebate(st, { name: '国君', bias: 'shi' }, { difficulty: diff });
  return { st, d };
}

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
}

// 平常话术仍有正收益，且弱于对症
{
  const { st, d } = fresh(2);
  const m0 = d.meter;
  debateChoose(st, d, 'shi');
  const matched = d.meter - m0;
  debateChoose(st, d, 'li'); // 慕强：言利是平常话术
  const m1 = d.meter;
  debateChoose(st, d, 'yi');
  const neutral = d.meter - m1;
  ok(neutral > 0, '对症之后用平常话术仍能推进', `+${neutral}`);
  ok(neutral < matched, '平常话术弱于对症', `${neutral} vs ${matched}`);
}

// 相悖话术（慕强 vs 动名）收益最低
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

// 日志带判定与得失
{
  const { st, d } = fresh(5);
  debateChoose(st, d, 'shi');
  ok(d.log.some(l => l.includes('【对症】') && /说服[+-]\d+/.test(l)), '日志显示对症与说服增减');
}

// 巧辩优于乱辩
function rate(skill, diff, smart, n = 250) {
  let win = 0;
  for (let i = 0; i < n; i++) {
    const { st, d } = fresh(100 + i, skill, diff);
    let guard = 0;
    while (!d.over && guard++ < 12) {
      const key = smart
        ? (guard % 2 === 1 ? 'shi' : 'li')
        : ['li', 'yi', 'ming', 'shi'][Math.floor(Math.random() * 4)];
      debateChoose(st, d, key);
    }
    if (d.won) win++;
  }
  return win / n;
}
const smart = rate(3, 70, true);
const random = rate(3, 70, false);
ok(smart > 0.3, '辩才3 对高智略者、巧辩可胜', `${Math.round(smart * 100)}%`);
ok(smart > random + 0.2, '巧辩明显优于乱选', `${Math.round(smart * 100)}% vs ${Math.round(random * 100)}%`);

console.log(fails ? `\n失败 ${fails} 项 ✗` : '\n论辩机制通过 ✓');
process.exit(fails ? 1 : 0);
