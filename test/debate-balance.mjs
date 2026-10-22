import { newGame } from '../js/state.js';
import { startDebate, debateChoose, ARGS } from '../js/systems/debate.js';
const keys = ['li','yi','ming','shi'];
function trial(skill, diff, bias, mode, n = 500) {
  let wins = 0;
  for (let i = 0; i < n; i++) {
    const st = newGame({ name: '士', profession: 'shuike', seed: i + 100 });
    st.player.skills.biancai = skill;
    const d = startDebate(st, { name: '国君', bias }, { difficulty: diff });
    let guard = 0, k = 0;
    while (!d.over && guard++ < 20) {
      let key;
      if (mode === 'smart') key = (k++ % 2 === 0) ? bias : keys.find(x => x !== bias && x !== ARGS[bias].opp);
      else key = keys[Math.floor(Math.random() * 4)];
      debateChoose(st, d, key);
    }
    if (d.won) wins++;
  }
  return (wins / n * 100).toFixed(0) + '%';
}
for (const skill of [1, 3, 5, 8])
  console.log(`辩才${skill}: ` + [40, 55, 70].map(diff => `难${diff} 巧辩${trial(skill, diff, 'li', 'smart')}/乱辩${trial(skill, diff, 'li', 'rand')}`).join('  '));
