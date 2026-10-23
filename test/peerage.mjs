// 五等爵：册命条件、食邑月入、晋爵与上限
import { newGame, player } from '../js/state.js';
import { STATES } from '../js/data/world.js';
import { PEERAGES, peerageName } from '../js/data/defs.js';
import { canRequestPeerage, requestPeerage, peerageNext, computeEnding } from '../js/systems/progression.js';
import { advanceDays } from '../js/systems/calendar.js';

let fails = 0;
const ok = (c, m, x = '') => { console.log(`${c ? '✓' : '✗'} ${m}${x ? ' — ' + x : ''}`); if (!c) fails++; };

// 各国国爵
ok(STATES.song.peer === '公', '宋为公爵');
ok(STATES.qi.peer === '侯' && STATES.jin.peer === '侯', '齐晋为侯爵');
ok(STATES.zheng.peer === '伯' && STATES.qin.peer === '伯', '郑秦为伯爵');
ok(STATES.chu.peer === '子' && STATES.wu.peer === '子', '楚吴为子爵');
ok(STATES.xu.peer === '男', '许为男爵');

const st = newGame({ name: '封君', profession: 'youxia', seed: 7 });
st.player.cityId = 'luoyi';
st.player.money = 1000;
st.player.merit = 900;
st.player.fame = 60;

// 未出仕不可请封
ok(!canRequestPeerage(st).ok, '未出仕不可请封', canRequestPeerage(st).msg);

// 出仕后可请封男爵
st.player.stateId = 'qi';
st.player.rank = 1;
const r1 = requestPeerage(st);
ok(r1.ok, '受封男爵', r1.msg);
ok(player(st).peerage?.rank === 0, '爵位写入男爵');
ok(player(st).money === 700, '贽礼扣 300 金', String(player(st).money));
ok(player(st).fame >= 68, '册命增名声', String(player(st).fame));
ok(peerageName(player(st).peerage.rank) === '男爵', '爵位名称正确');

// 食邑月入
const before = player(st).money;
advanceDays(st, 31);
ok(player(st).money >= before + PEERAGES[0].income, '每月食邑入账', `${before} → ${player(st).money}`);

// 晋爵：子 → 伯
st.player.merit = 1100; st.player.fame = 80; st.player.money = 1000;
const r2 = requestPeerage(st);
ok(r2.ok && player(st).peerage.rank === 1, '晋为子爵', r2.msg);
st.player.merit = 1300; st.player.fame = 100; st.player.money = 1000;
const r3 = requestPeerage(st);
ok(r3.ok && player(st).peerage.rank === 2, '晋为伯爵', r3.msg);

// 条件不足被拒
st.player.merit = 900;
ok(!canRequestPeerage(st).ok, '功勋不足不可晋爵', canRequestPeerage(st).msg);

// 封顶
st.player.peerage = { rank: 4, fief: 'luoyi', year: st.time.year };
st.player.merit = 9999; st.player.fame = 999; st.player.money = 9999;
ok(!peerageNext(st) && !canRequestPeerage(st).ok, '公爵为上限');

// 结局统计爵位
const ending = computeEnding(st);
ok(ending.stats.some(([k, v]) => k === '爵位' && v === '公爵'), '结局统计五等爵');

console.log(fails ? `\n失败 ${fails} 项 ✗` : '\n五等爵通过 ✓');
process.exit(fails ? 1 : 0);
