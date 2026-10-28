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
  const noSpecialty = CITIES.filter(c => !LOCAL_SPECIALTY[c.id]).map(c => c.id);
  ok(noSpecialty.length === 0, '每座城都有特产', noSpecialty.join(','));

  // NPC 偏好必须是存在的货物
  const badPref = NPCS.filter(n => n.pref != null && !GOODS[n.pref]);
  ok(badPref.length === 0, 'NPC 偏好均为有效货物', badPref.slice(0, 3).map(n => `${n.name}:${n.pref}`).join(','));

  // 珍宝 id 不得与城池 id 冲突
  const clash = TREASURE_IDS.filter(id => CITY_MAP[id]);
  ok(clash.length === 0, '珍宝 id 不与城池 id 冲突', clash.join(','));
}

// ---------------- 4. 世界数据完整性 ----------------
{
  ok(CITIES.length >= 31, '城池数量充足', String(CITIES.length));
  ok(Object.keys(STATES).length === 19, '19 国', String(Object.keys(STATES).length));
  ok(NPCS.length >= 42, 'NPC 数量充足', String(NPCS.length));
  // id 去重之外还要按姓名查重：同一角色被写成两个 id 时，id 检查拦不住
  const byName = new Map();
  for (const n of NPCS) {
    if (!byName.has(n.name)) byName.set(n.name, []);
    byName.get(n.name).push(n.id);
  }
  const dupNames = [...byName].filter(([, ids]) => ids.length > 1);
  ok(dupNames.length === 0, 'NPC 姓名不重复', dupNames.map(([n, ids]) => `${n}:${ids.join('/')}`).join(','));
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
  ok(unreachable.length === 0, '所有城池连通', unreachable.map(c => c.id).join(','));
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



// ---------------- 廷对与商人交涉的题库自洽 ----------------
{
  const { AUDIENCE_QUESTIONS, AUDIENCE_FOLLOW_UPS } = await import('../js/data/audience.js');
  const { PARLEY_QUESTIONS, PARLEY_TOPICS } = await import('../js/data/merchant.js');

  ok(AUDIENCE_QUESTIONS.length >= 20, '廷对题目数量充足', String(AUDIENCE_QUESTIONS.length));
  ok(AUDIENCE_FOLLOW_UPS.length >= 12, '廷对追问数量充足', String(AUDIENCE_FOLLOW_UPS.length));
  const qIds = new Set(AUDIENCE_QUESTIONS.map(q => q.id));
  ok(qIds.size === AUDIENCE_QUESTIONS.length, '廷对题目 id 唯一');
  const fIds = new Set(AUDIENCE_FOLLOW_UPS.map(f => f.id));
  ok(fIds.size === AUDIENCE_FOLLOW_UPS.length, '追问问 id 唯一');

  // 每道题都是三选一，且恰好一个 evade
  const badQ = AUDIENCE_QUESTIONS.filter(q => q.options.length !== 3
    || q.options.filter(o => o.level === 'evade').length !== 1);
  ok(badQ.length === 0, '廷对题目均为三选一且恰一回避', badQ.map(q => q.id).join(','));
  const badF = AUDIENCE_FOLLOW_UPS.filter(f => f.options.length !== 3
    || f.options.filter(o => o.level === 'evade').length !== 1);
  ok(badF.length === 0, '追问问均为三选一且恰一回避', badF.map(f => f.id).join(','));

  // 商人交涉
  ok(PARLEY_QUESTIONS.length >= 15, '商人交涉题库充足', String(PARLEY_QUESTIONS.length));
  const pIds = new Set(PARLEY_QUESTIONS.map(q => q.id));
  ok(pIds.size === PARLEY_QUESTIONS.length, '交涉题目 id 唯一');
  const badP = PARLEY_QUESTIONS.filter(q => q.options.length !== 3
    || q.options.filter(o => o.level === 'hit').length !== 1);
  ok(badP.length === 0, '交涉题目均为三选一且恰一切中', badP.map(q => q.id).join(','));
  const badTopic = PARLEY_QUESTIONS.filter(q => !PARLEY_TOPICS[q.topic]);
  ok(badTopic.length === 0, '交涉题目的议题均有效', badTopic.map(q => q.id).join(','));
  // 三个议题都要有题
  for (const t of Object.keys(PARLEY_TOPICS)) {
    const n = PARLEY_QUESTIONS.filter(q => q.topic === t).length;
    ok(n >= 1, `议题「${PARLEY_TOPICS[t].name}」有对应题目`, String(n));
  }
}


// ---------------- 角色类别与女性角色 ----------------
{
  const { ROLE_NAMES } = await import('../js/data/npcs.js');
  const nobles = NPCS.filter(n => n.role === 'noble');
  ok(nobles.length >= 12, '女性角色数量充足', String(nobles.length));
  ok(ROLE_NAMES.noble === '夫人', 'noble 类别名为「夫人」', ROLE_NAMES.noble);

  // 每位 noble 都有完整的可用字段
  const bad = nobles.filter(n => !n.name || !n.title || !n.city || !n.bias || !n.desc);
  ok(bad.length === 0, '女性角色字段完整', bad.map(n => n.id).join(','));

  // 心性合法
  const badBias = nobles.filter(n => !['li', 'yi', 'ming', 'shi'].includes(n.bias));
  ok(badBias.length === 0, '女性角色心性合法', badBias.map(n => n.id).join(','));

  // 分布在不同国家，不是全挤在一处
  const states = new Set(nobles.map(n => n.state));
  ok(states.size >= 6, '女性角色分布多国', String(states.size));

  // 各国有卿相或将帅（避免某国完全没有可对话的臣属）
  const noOfficer = Object.keys(STATES).filter(sid =>
    !NPCS.some(n => n.state === sid && (n.role === 'minister' || n.role === 'general')));
  ok(noOfficer.length === 0, '每国都有卿相或将帅', noOfficer.join(','));
  ok(NPCS.filter(n => n.role === 'minister').length >= 50, '卿相数量充足',
    String(NPCS.filter(n => n.role === 'minister').length));
  ok(NPCS.filter(n => n.role === 'general').length >= 25, '将帅数量充足',
    String(NPCS.filter(n => n.role === 'general').length));

  // 名士与女性
  {
    const scholars = NPCS.filter(n => n.role === 'scholar');
    ok(scholars.length >= 30, '名士数量充足', String(scholars.length));
    ok(scholars.every(n => n.quote && n.desc && n.stats && n.bias), '名士字段完整');
    ok(scholars.filter(n => n.teach?.length).length >= 25, '多数名士可授艺',
      String(scholars.filter(n => n.teach?.length).length));

    const nobles = NPCS.filter(n => n.role === 'noble');
    ok(nobles.length >= 30, '女性数量充足', String(nobles.length));
    ok(nobles.every(n => n.insight), '每位女性都有问政专长',
      nobles.filter(n => !n.insight).map(n => n.name).join(','));
    const kinds = new Set(nobles.map(n => n.insight));
    ok([...kinds].every(k => ['court', 'diplo', 'army', 'people'].includes(k)),
      '问政专长取值合法', [...kinds].join(','));
    ok(kinds.size === 4, '四种专长齐备', [...kinds].join(','));
  }

  // 百工
  const artisans = NPCS.filter(n => n.role === 'artisan');
  ok(artisans.length >= 8, '百工数量充足', String(artisans.length));
  ok(ROLE_NAMES.artisan === '百工', 'artisan 类别名为「百工」', ROLE_NAMES.artisan);
  const badArtisan = artisans.filter(n => !n.name || !n.title || !n.bias || !n.desc);
  ok(badArtisan.length === 0, '百工字段完整', badArtisan.map(n => n.id).join(','));
  // 医者存在且可诊
  const healers = artisans.filter(n => ['yi_he', 'yi_huan'].includes(n.id));
  ok(healers.length === 2, '两位秦国良医', healers.map(n => n.name).join(','));

  // 所有 role 都在 ROLE_NAMES 里
  const unknown = [...new Set(NPCS.map(n => n.role))].filter(r => !ROLE_NAMES[r]);
  ok(unknown.length === 0, '所有角色类别都有名称', unknown.join(','));
}

// ---------------- 枚举清单不得在多处重写（防「定义改了、行为不改」） ----------------
{
  const fs = await import('node:fs');
  const files = [];
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = d + '/' + e.name;
      if (e.isDirectory()) walk(p);
      else if (p.endsWith('.js')) files.push(p);
    }
  })('js');
  const srcs = files.map(f => [f, fs.readFileSync(f, 'utf8')]);

  // 可出仕职业：除 defs.js 正本外，任何文件都不应再写这个数组
  const career = srcs.filter(([f, src]) =>
    !f.endsWith('data/defs.js') && /\['youxia',\s*'shuike',\s*'xuezhe'\]/.test(src));
  ok(career.length === 0, '可出仕职业清单只在 defs.js 定义',
    career.map(([f]) => f).join(','));

  // 官阶名数组不应被手抄
  const rankNames = srcs.filter(([f, src]) => /\['布衣',\s*'士',\s*'中士'/.test(src));
  ok(rankNames.length === 0, '官阶名不再手抄（改用 RANKS[].name）',
    rankNames.map(([f]) => f).join(','));

  // 技艺→属性映射不应被手抄
  const skillStat = srcs.filter(([f, src]) =>
    !f.endsWith('data/defs.js') && /\['jianshu',\s*'sheshu',\s*'bingfa'\]/.test(src));
  ok(skillStat.length === 0, '技艺→属性映射只在 defs.js 定义',
    skillStat.map(([f]) => f).join(','));

  // 效果类型：测试须引用 events.js 的正本
  const { EFFECT_TYPES } = await import('../js/systems/events.js');
  const evSrc = fs.readFileSync('js/systems/events.js', 'utf8');
  const cases = [...new Set([...evSrc.matchAll(/case '([a-z]+)'/g)].map(m => m[1]))];
  const missing = cases.filter(c => !EFFECT_TYPES.includes(c));
  const extra = EFFECT_TYPES.filter(t => !cases.includes(t));
  ok(missing.length === 0, 'EFFECT_TYPES 覆盖全部 switch 分支', missing.join(','));
  ok(extra.length === 0, 'EFFECT_TYPES 无多余项', extra.join(','));

  // 心性四值只在 TAGS 定义
  const heartList = srcs.filter(([f, src]) => !f.endsWith('data/debates/index.js')
    && /\['li',\s*'yi',\s*'ming',\s*'shi'\]/.test(src));
  ok(heartList.length === 0, '心性四值只在 TAGS 定义', heartList.map(([f]) => f).join(','));

  // 技艺 → 属性映射与 SKILL_DEFS 一致
  const { SKILL_DEFS, SKILL_STAT, statOfSkill } = await import('../js/data/defs.js');
  const badStat = Object.keys(SKILL_DEFS).filter(k => !['wu', 'zhi', 'zheng'].includes(statOfSkill(k)));
  ok(badStat.length === 0, '每项技艺都有合法属性', badStat.join(','));
  ok(Object.keys(SKILL_STAT).length === Object.keys(SKILL_DEFS).length, '技艺属性表无遗漏');
}

// ---------------- 事件效果类型必须被系统支持 ----------------
{
  const { TIMELINE, RANDOM_EVENTS } = await import('../js/data/events.js');
  // 引用 events.js 的正本，不再手抄一份
  const { EFFECT_TYPES } = await import('../js/systems/events.js');
  const SUPPORTED = new Set(EFFECT_TYPES);
  const bad = [];
  const scan = (list, tag) => {
    for (const ev of list) {
      for (const e of ev.effects ?? []) if (!SUPPORTED.has(e.t)) bad.push(`${tag}/${ev.id}: ${e.t}`);
      for (const c of ev.choices ?? []) {
        for (const e of c.effects ?? []) if (!SUPPORTED.has(e.t)) bad.push(`${tag}/${ev.id}/choice: ${e.t}`);
        for (const e of c.success ?? []) if (!SUPPORTED.has(e.t)) bad.push(`${tag}/${ev.id}/success: ${e.t}`);
        for (const e of c.fail ?? []) if (!SUPPORTED.has(e.t)) bad.push(`${tag}/${ev.id}/fail: ${e.t}`);
      }
    }
  };
  scan(TIMELINE, 'timeline');
  scan(RANDOM_EVENTS, 'random');
  ok(bad.length === 0, '事件效果类型均被支持', bad.slice(0, 5).join(','));
  ok(TIMELINE.length >= 34, '历史事件数量充足', String(TIMELINE.length));
  const ids = new Set(TIMELINE.map(e => e.id));
  ok(ids.size === TIMELINE.length, '历史事件 id 唯一');
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
