// 静态一致性回归：专门盯 lint 抓不到的「跨文件语义错误」。
// 起因：审核发现 city.js 里写 ['merchant']（项目职业 id 是 shangren），
// 这类笔误既不是语法错、也不是未定义变量，只能靠数据交叉校验拦下来。
import fs from 'node:fs';
import path from 'node:path';

let fails = 0;
const ok = (c, m, x = '') => { console.log(`${c ? '✓' : '✗'} ${m}${x ? ' — ' + x : ''}`); if (!c) fails++; };

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

const { PROFESSIONS, RANKS, PEERAGES, MERCHANT_TIERS, SCHOLAR_TIERS } = await import('../js/data/defs.js');
const { GOODS, PLAIN_GOODS, TREASURE_GOODS } = await import('../js/data/goods.js');
const { TREASURES, TREASURE_IDS } = await import('../js/data/treasures.js');
const { CITIES, CITY_MAP, STATES, ROADS } = await import('../js/data/world.js');
const { NPCS } = await import('../js/data/npcs.js');
const { BOOKSHOPS, DEBATES, EVIDENCE_BY_ID } = await import('../js/data/debates/index.js');
const { ISSUES, POLICIES } = await import('../js/systems/policy.js');

const PROF_IDS = Object.keys(PROFESSIONS);

// ---------------- 1. 职业 id 必须来自 defs，不得出现臆造名 ----------------
{
  const files = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
      const rel = `${dir}/${e.name}`;
      if (e.isDirectory()) walk(rel);
      else if (e.name.endsWith('.js')) files.push(rel);
    }
  };
  walk('js');

  // 收集源码里所有候选职业字符串（出现在引号中且形似职业名）
  // 职业 id 必须来自 defs；三种写法都要管：
  //   p.profession === 'x' / 'x' === p.profession / ['x'].includes(p.profession)
  const PROF_PATTERNS = [
    /profession\s*(?:===?|!==?)\s*'([a-z_]+)'/g,
    /'([a-z_]+)'\s*(?:===?|!==?)\s*\w*\.?profession/g,
    /\[\s*'([a-z_]+)'\s*\][\s\S]{0,20}?includes\(\s*\w*\.?profession/g,
  ];
  const suspicious = [];
  for (const f of files) {
    const src = fs.readFileSync(path.join(root, f), 'utf8');
    for (const re of PROF_PATTERNS) {
      for (const m of src.matchAll(re)) {
        const v = m[1];
        if (!PROF_IDS.includes(v)) suspicious.push(`${f}: ${v}`);
      }
    }
  }
  ok(suspicious.length === 0, 'profession 比较用的字符串均来自数据定义', suspicious.slice(0, 5).join(' | '));

  // 反向确认：全项目不再出现 'merchant' 当作职业
  const bad = files.filter(f => /profession[^\n]*'merchant'/.test(fs.readFileSync(path.join(root, f), 'utf8')));
  ok(bad.length === 0, '没有把 merchant 当作职业 id', bad.join(','));
}

// ---------------- 2. 职业一致性：可仕三途 + 商人例外 ----------------
{
  ok(PROF_IDS.length === 4, '四个职业', PROF_IDS.join(','));
  const { canTakeOffice } = await import('../js/systems/progression.js');
  const { newGame } = await import('../js/state.js');
  for (const prof of PROF_IDS) {
    const st = newGame({ name: 'x', profession: prof, seed: 1 });
    const gate = canTakeOffice(st).ok;
    ok(gate === (prof !== 'shangren'), `${prof} 仕途闸门符合设计`, String(gate));
  }
}

// ---------------- 3. 货物 / 珍宝 / 特产 / 偏好 全部对得上 ----------------
{
  ok(Object.keys(GOODS).length === PLAIN_GOODS.length + TREASURE_GOODS.length, '普通货物与珍宝划分完整');
  ok(TREASURE_IDS.every(id => GOODS[id]), '每个珍宝 id 都在 GOODS 中', TREASURE_IDS.join(','));
  ok(TREASURE_GOODS.every(id => TREASURES[id]), '每个 treasure 标记都有配置');
  ok(PLAIN_GOODS.every(id => !TREASURES[id]), '普通货物不混入珍宝表');

  // 城池特产只能是普通货物
  const { LOCAL_SPECIALTY } = await import('../js/data/goods.js');
  const badSpecialty = Object.entries(LOCAL_SPECIALTY).filter(([cid, g]) => !CITY_MAP[cid] || !PLAIN_GOODS.includes(g));
  ok(badSpecialty.length === 0, '城池特产均为普通货物且城 id 有效', badSpecialty.slice(0, 3).map(x => x.join(':')).join(','));

  // NPC 偏好必须是存在的货物
  const badPref = NPCS.filter(n => n.pref != null && !GOODS[n.pref]);
  ok(badPref.length === 0, 'NPC 偏好均为有效货物', badPref.slice(0, 3).map(n => `${n.name}:${n.pref}`).join(','));

  // 珍宝 id 不得与城池 id 冲突
  const clash = TREASURE_IDS.filter(id => CITY_MAP[id]);
  ok(clash.length === 0, '珍宝 id 不与城池 id 冲突', clash.join(','));
}

// ---------------- 4. 世界数据完整性 ----------------
{
  ok(CITIES.length === 31, '31 城', String(CITIES.length));
  ok(Object.keys(STATES).length === 19, '19 国', String(Object.keys(STATES).length));
  ok(NPCS.length === 42, '42 位 NPC', String(NPCS.length));
  const badState = CITIES.filter(c => !STATES[c.state]);
  ok(badState.length === 0, '每座城的国别有效');
  const badRoad = ROADS.filter(r => !CITY_MAP[r[0]] || !CITY_MAP[r[1]]);
  ok(badRoad.length === 0, '每条道路两端城有效');

  // 城池连通：从任一城可达其余所有城
  const { shortestPath } = await import('../js/systems/pathfind.js');
  const { newGame } = await import('../js/state.js');
  const st = newGame({ name: 'x', profession: 'youxia', seed: 1 });
  const from = CITIES[0].id;
  const unreachable = CITIES.filter(c => c.id !== from && !shortestPath(from, c.id, st));
  ok(unreachable.length === 0, '31 城全部连通', unreachable.map(c => c.id).join(','));
}

// ---------------- 5. 论辩 / 证据 / 书肆 数据自洽 ----------------
{
  ok(DEBATES.length === 50, '50 个论辩场景', String(DEBATES.length));
  const evIds = Object.keys(EVIDENCE_BY_ID);
  ok(evIds.length === 50, '50 件证据', String(evIds.length));
  const badBook = DEBATES.filter(d => d.evidence?.source?.type === 'market' && !BOOKSHOPS.includes(d.evidence.homeCity));
  ok(badBook.length === 0, '书肆证据都落在有书肆的城');
  const cheap = DEBATES.filter(d => d.evidence?.source?.type === 'market' && !(d.evidence.source.price >= 500));
  ok(cheap.length === 0, '书肆证据价格不低于 500 金');
  const sources = new Set(DEBATES.map(d => d.evidence?.source?.type));
  ok(['investigate', 'npc', 'market'].every(t => sources.has(t)), '三种证据来源都有', [...sources].join(','));
}

// ---------------- 6. 国策与议题自洽 ----------------
{
  ok(Object.keys(POLICIES).length === 5, '五个国策', Object.keys(POLICIES).join(','));
  for (const issue of ISSUES) {
    ok(issue.options.length === 3, `${issue.name} 三选一`);
    ok(issue.options.filter(o => o.fit).length === 1, `${issue.name} 恰有一策契合`);
    ok(issue.options.every(o => POLICIES[o.policy]), `${issue.name} 引用的国策都存在`);
  }
}

// ---------------- 7. 官阶 / 爵位 / 阶次表单调递增 ----------------
{
  const rankMerit = RANKS.map(r => r.merit);
  ok(rankMerit.every((v, i) => i === 0 || v > rankMerit[i - 1]), '官阶功勋门槛递增');
  const peerMerit = PEERAGES.map(p => p.merit);
  ok(peerMerit.every((v, i) => i === 0 || v > peerMerit[i - 1]), '爵位功勋门槛递增');
  const peerFame = PEERAGES.map(p => p.fame);
  ok(peerFame.every((v, i) => i === 0 || v > peerFame[i - 1]), '爵位名声门槛递增');
  ok(MERCHANT_TIERS.every((t, i) => i === 0 || t.need > MERCHANT_TIERS[i - 1].need), '商人阶次递增');
  ok(SCHOLAR_TIERS.every((t, i) => i === 0 || t.need > SCHOLAR_TIERS[i - 1].need), '学者阶次递增');
}

// ---------------- 8. UI 引用的动作 id 都真实存在 ----------------
{
  // 所有 UI 模块里注册的动作 / 界面 id 汇总
  const uiFiles = fs.readdirSync(path.join(root, 'js/ui')).filter(f => f.endsWith('.js'));
  const allIds = new Set();
  for (const f of uiFiles) {
    const src = read(`js/ui/${f}`);
    for (const m of src.matchAll(/\bid:\s*'([a-z_]+)'/g)) allIds.add(m[1]);
    for (const m of src.matchAll(/data-act="([a-z_]+)"/g)) allIds.add(m[1]);
    for (const m of src.matchAll(/data-screen="([a-z_]+)"/g)) allIds.add(m[1]);
  }
  for (const m of read('index.html').matchAll(/data-screen="([a-z_]+)"/g)) allIds.add(m[1]);
  ok(allIds.size > 20, '汇总到足够多的界面动作', String(allIds.size));

  // UI 测试点击的动作 / 界面必须都在实现里存在
  const uisrc = read('test/ui-smoke.mjs');
  const clickedActs = [...uisrc.matchAll(/data-act="([a-z_]+)"/g)].map(m => m[1]);
  const clickedScreens = [...uisrc.matchAll(/data-screen="([a-z_]+)"/g)].map(m => m[1]);
  const missing = [...new Set([...clickedActs, ...clickedScreens])].filter(id => !allIds.has(id));
  ok(missing.length === 0, 'UI 测试点击的动作与界面都有实现', missing.join(','));
}

// ---------------- 9. 存档字段与默认状态一致 ----------------
{
  const { newGame } = await import('../js/state.js');
  const st = newGame({ name: 'x', profession: 'youxia', seed: 1 });
  for (const key of ['owner', 'power', 'prices', 'treasures', 'policy']) {
    ok(st.world[key] !== undefined, `world.${key} 已初始化`);
  }
  ok(Array.isArray(st.player.evidence), 'player.evidence 为数组');
  ok(typeof st.flags === 'object', 'flags 存在');
  ok(!('jade' in st.world), '不再残留旧 world.jade');
}

// ---------------- 10. 无 Math.random 出现在游戏逻辑 ----------------
{
  const files = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
      const rel = `${dir}/${e.name}`;
      if (e.isDirectory()) walk(rel);
      else if (e.name.endsWith('.js')) files.push(rel);
    }
  };
  walk('js');
  const bad = files.filter(f => fs.readFileSync(path.join(root, f), 'utf8').includes('Math.random'));
  ok(bad.length === 0, '游戏逻辑不使用 Math.random', bad.join(','));
}

console.log(fails ? `\n失败 ${fails} 项 ✗` : '\n数据一致性回归通过 ✓');
process.exit(fails ? 1 : 0);
