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
};

// 只收集「对象的字段名」，不收集字典的键（如 NPC_MAP 的 id、VOICES 的 npcId）——
// 那些键是数据标识，代码里以变量索引，不会出现字面量。
// 判断方式：顶层容器若是「键→对象」的纯字典，则先下沉一层。
export function collectFields(obj, { depth = 3, sample = 2 } = {}) {
  // 纯字典：键几乎全是标识符形态（小写下划线），且值的类型单一。
  // 用比例而非全等判断，避免个别异常键把整张字典误判成对象。
  const isDict = (v) => {
    if (!v || typeof v !== 'object' || Array.isArray(v)) return false;
    const keys = Object.keys(v);
    if (keys.length < 4) return false;
    const identLike = keys.filter(k => /^[a-z][a-z0-9_]*$/.test(k)).length;
    if (identLike / keys.length < 0.9) return false;
    const kinds = new Set(keys.map(k => (v[k] && typeof v[k] === 'object' ? 'obj' : 'scalar')));
    return kinds.size === 1;
  };

  const seen = new Set();
  const visit = (v, d, skipKeys) => {
    if (!v || typeof v !== 'object' || d > depth) return;
    if (Array.isArray(v)) {
      for (const x of v.slice(0, sample)) visit(x, d + 1, false);
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

const isRead = (code, key) =>
  new RegExp(`\\.${key}(?![A-Za-z0-9_])`).test(code) || code.includes(`'${key}'`) || code.includes(`"${key}"`);

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
  process.exit(bad.length ? 1 : 0);
}
