// 数据字段「是否被消费」的静态检查
//
// 背景：本项目已四次出现「数据写了但没人读」的问题——
//   LOCAL_NOTABLES、PERMIT.trialBonus、voices 的 intro、季隗的开场白。
// 共同点：数据文件里字段齐全，运行时不报错，只是永远不生效。
//
// 做法：从数据模块里抽出实际存在的字段名，再去非 data 源码里找有没有
// 「读取」的痕迹。找不到就报警。
//
// 判定「被读取」的三种痕迹：
//   x.field        —— 属性访问
//   x?.field       —— 可选链
//   'field'        —— 字符串键访问 / 解构 / 白名单
//
// 已知豁免写在 ALLOW 里，每条都要写清理由，避免变成垃圾桶。

import fs from 'node:fs';

// 只做「存在性」检查的字段：由通用校验（fill / numericMap / 白名单）统一处理，
// 不需要逐个属性访问。
const ALLOW = {
  // 存档字段由 state.js 的 fill/defaults 统一补齐与校验
  __storeFields: [
    'gender', 'ageDays', 'startAge', 'peerageHistory', 'alive', 'retire',
    'doctrine', 'works', 'missions', 'alliances', 'disciples', 'evidence',
    'cards', 'caravan', 'shops', 'hired', 'permits', 'vehicle', 'hauls',
    'pacts', 'passiveIncome', 'peakMoney', 'givenAway', 'skillExp',
  ],
  // NPC 的静态描述字段：由界面统一渲染，或仅作数据留档
  __npcMeta: [
    'desc', 'birth', 'death', 'reign', 'stats', 'skills', 'role', 'title',
  ],
  // NPC 的 skills/teach 里的键是技艺 id，本身即被当作数据使用，
  // 不需要代码里出现字面量（通过 SKILL_DEFS 遍历）
  __skillIds: [
    'jianshu', 'sheshu', 'bingfa', 'biancai', 'quanmou', 'shanggu', 'suanshu', 'xuewen',
  ],
  // 字典项内与键同名的 id：字典本身由 Object.values() 遍历消费，
  // 取出的对象再用 .id 引用（如 GIVEAWAYS / PARLEY_TOPICS / VEHICLES）
  __dictId: ['relief', 'passage'],
  // evidence.concern：标注该证据对应第几轮顾虑（1/2/3）。
  // 它不参与判定——匹配改由 topic 承担；保留它是为了叙事定位（写到第几问时
  // 该出示），删掉会丢失作者意图。故登记豁免而非清理。
  __evidenceMeta: ['concern'],
};

// 只收集「对象的字段名」，不收集字典的键（如 NPC_MAP 的 id、VOICES 的 npcId）——
// 那些键是数据标识，代码里以变量索引，不会出现字面量。
// 判断方式：顶层容器若是「键→对象」的纯字典，则先下沉一层。
// depth 与是否有 sample 截断都直接影响覆盖面：
// 原先 sample=2 只遍历数组前两项，孔子三场论辩的第 3 场独有字段会被跳过，
// 且 depth=3 到不了 concerns[].options[] 这一层——实测对 VOICES 只收集到
// 16 个字段（全量为 106 个），等于检查器在这类数据上近乎失效。
export function collectFields(obj, { depth = 10 } = {}) {
  // 纯字典（键是数据标识，不参与字段检查）的两个判据：
  //   a) 键几乎全是标识符形态，且**值全是对象**——NPC_MAP / CITY_MAP / VOICES
  //   b) 键数很多且值全为标量——LINES 这类「id → 文案」表
  //
  // 不能只凭「键是标识符 + 值单一类型」判定：evidence.source 只有
  // { type, skill, dc, city } 四个字段，也满足那个条件，会被整体跳过。
  const isDict = (v) => {
    if (!v || typeof v !== 'object' || Array.isArray(v)) return false;
    const keys = Object.keys(v);
    if (keys.length < 4) return false;
    const identLike = keys.filter(k => /^[a-z][a-z0-9_]*$/.test(k)).length;
    if (identLike / keys.length < 0.9) return false;
    const allObj = keys.every(k => v[k] && typeof v[k] === 'object');
    if (allObj) return true;
    // 值全为标量时，只有键数明显多于「普通对象字段数」才认为是查表
    const allScalar = keys.every(k => !v[k] || typeof v[k] !== 'object');
    return allScalar && keys.length >= 20;
  };

  const seen = new Set();
  const visit = (v, d, skipKeys) => {
    if (!v || typeof v !== 'object' || d > depth) return;
    if (Array.isArray(v)) {
      // 全量遍历：数组元素的独有字段同样要收集
      for (const x of v) visit(x, d + 1, false);
      return;
    }
    for (const [k, val] of Object.entries(v)) {
      if (!skipKeys) seen.add(k);
      if (val && typeof val === 'object') visit(val, d + 1, isDict(val));
    }
  };
  visit(obj, 0, isDict(obj));
  return seen;
}

export function sourceIndexOf(root = 'js') {
  const files = [];
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = `${d}/${e.name}`;
      if (e.isDirectory()) {
        if (p === `${root}/data`) continue;   // 只跳过 data 目录本身
        walk(p);
      } else if (p.endsWith('.js')) files.push(p);
    }
  })(root);
  return { files, code: files.map(f => fs.readFileSync(f, 'utf8')).join('\n') };
}

// 判「被读取」的痕迹，都需带标识符边界。
//
// 原实现用 code.includes(`'concern'`) 这类子串匹配，导致字段名是另一个
// 标识符的子串时静默放行：evidence.concern 全库无 .concern 访问，
// 却因为源码里有 currentConcern 而被判为已读。
//
// 只认三种「真正读了它」的形态，不把任意同名标识符当证据：
//   1) .key / ?.key          —— 属性访问
//   2) 'key' / "key" / `key`  —— 字符串键（查表、白名单）
//   3) { key } / { key:       —— 对象解构
// 注意：正则里的点号必须用 String.raw 拼接。
// 普通模板字符串里 `\.` 会在某些转义链上退化成 `.`，从而匹配任意字符——
// 这正是 evidence.concern 长期漏报的原因：`const concern = ...` 里的
// 空格被 `.` 匹配，误判为「有 .concern 属性访问」。
const DOT = String.raw`\.`;
// 引号字符类：单引号、双引号、反引号
const QUOTES = "['\"`]";
const identBoundary = (key) => `(?<![A-Za-z0-9_$])${key}(?![A-Za-z0-9_$])`;

const isRead = (code, key) => {
  const b = identBoundary(key);
  // 1) 属性访问 .key / ?.key
  if (new RegExp(DOT + key + String.raw`(?![A-Za-z0-9_])`).test(code)) return true;
  // 2) 字符串键 'key' / "key" / `key`
  if (new RegExp(QUOTES + b + QUOTES).test(code)) return true;
  // 3) 对象解构 { key } 或 { key:
  if (new RegExp(String.raw`\{[^}]{0,200}` + b + String.raw`\s*[,}:]`).test(code)) return true;
  return false;
};

// 返回 [{ module, field }]，只报真正没人读的
export function findUnconsumed(mods, { allow = ALLOW } = {}) {
  const { code } = sourceIndexOf();
  const whitelist = new Set(Object.values(allow).flat());
  const out = [];
  for (const [mod, data] of Object.entries(mods)) {
    if (!data || typeof data !== 'object') continue;

    for (const field of collectFields(data)) {
      if (whitelist.has(field)) continue;
      // 模块级导出名（全大写下划线或函数）不是字段，跳过
      if (/^[A-Z][A-Z0-9_]*$/.test(field)) continue;
      if (typeof data[field] === 'function') continue;
      if (!isRead(code, field)) out.push({ module: mod, field });
    }
  }
  return out;
}

// ---------------------------------------------------------------- 自检

if (process.argv[1]?.endsWith('field-usage.mjs')) {
  const mods = {
    npcs: (await import('../js/data/npcs.js')).NPC_MAP,
    cities: (await import('../js/data/world.js')).CITY_MAP,
    goods: (await import('../js/data/goods.js')).GOODS,
    merchant: await import('../js/data/merchant.js'),
    trials: await import('../js/data/trials.js'),
    treasures: (await import('../js/data/treasures.js')).TREASURES,
    rumors: (await import('../js/data/rumors.js')).RUMORS,
    lines: (await import('../js/data/debates/lines.js')).LINES,
    voices: (await import('../js/data/debates/voices.js')).VOICES,
  };

  const bad = findUnconsumed(mods);
  for (const { module, field } of bad) console.log(`✗ ${module}.${field} 从未被读取`);
  console.log(bad.length ? `\n发现 ${bad.length} 个未消费字段 ✗` : '\n数据字段全部有消费方 ✓');

  // ---------------- 自查：检查器本身必须能被验证 ----------------
  // 「全绿」不足以证明检查器有效——它可能只是因为收集不到字段而永远不报。
  // 下面几条负向用例保证：喂入已知死数据时，必须真的报警。
  let selfFails = 0;
  const expect = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) selfFails++; };

  // 1) 最小负例：数组第 3 项独有的字段（曾被 sample=2 截断吞掉）
  {
    const probe = { list: [{ a: 1 }, { a: 1 }, { zzzDeepField: 1 }] };
    const got = collectFields(probe);
    expect(got.has('zzzDeepField'), '收集器能到达数组末尾元素');
    expect(findUnconsumed({ probe }).some(h => h.field === 'zzzDeepField'),
      '数组中深层独有字段会被报出');
  }

  // 2) 嵌套 object 的字段（曾被 isDict 误判成字典而整体跳过）
  {
    const probe = { evidence: { zzzNestedField: 1, b: 2, c: 3, d: 4 } };
    expect(findUnconsumed({ probe }).some(h => h.field === 'zzzNestedField'),
      '嵌套小对象的字段会被报出');
  }

  // 3) 真字典的键不应被报（否则会产生海量噪音）
  {
    const probe = { map: { aaa: { x: 1 }, bbb: { x: 1 }, ccc: { x: 1 }, ddd: { x: 1 } } };
    const hit = findUnconsumed({ probe });
    expect(!hit.some(h => ['aaa', 'bbb', 'ccc', 'ddd'].includes(h.field)), '字典的键不被误报');
  }

  // 4) 已被读取的字段不应报
  expect(!findUnconsumed({ probe: { topic: 1 } }).some(h => h.field === 'topic'),
    '有消费方的字段不报');

  process.exit(bad.length || selfFails ? 1 : 0);
}
