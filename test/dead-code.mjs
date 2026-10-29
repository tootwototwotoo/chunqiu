// 导出函数「是否有调用方」的静态检查
//
// 与 field-usage.mjs 同类：这个项目反复出现「写了但没人用」的问题。
// 已发生：LOCAL_NOTABLES、trialBonus、intro、theme（60 处）、CAN_HEAL 等。
//
// 判定规则：
//   1. 收集非 data 目录里的导出函数（export function / export const X = (...)）
//   2. 剥掉「定义处」那一行的函数名，避免定义本身被算作引用
//   3. 统计生产代码与测试里的引用次数
//   4. 两者都为 0 → 死代码
//
// 关键细节（都是踩过的坑）：
//   - 命名空间导入 `import * as titleScreen from './title.js'` 会把整份导出
//     挂在对象上，此时调用写作 `titleScreen.mountEnding(...)`。这类文件的
//     导出一律视为「可能被使用」，不报死代码。
//   - 不能用正则 \b 拼模板字符串，容易被转义吃掉，改用 includes 判定义行。
//   - 名字出现在注释或字符串里也算引用（宁可漏报，不可误删）。

import fs from 'node:fs';
import path from 'node:path';

const WORD_BOUNDARY = /(?<![\w$.])NAME(?![\w$])/;

export function collectExports(root = 'js') {
  const files = [];
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = `${d}/${e.name}`;
      if (e.isDirectory()) { if (p !== `${root}/data`) walk(p); }
      else if (p.endsWith('.js')) files.push(p);
    }
  })(root);

  const exported = new Map();   // name → 所在文件
  const nsFiles = new Set();    // 被 import * as 引入的文件
  const contents = new Map();
  for (const f of files) {
    const src = fs.readFileSync(f, 'utf8');
    contents.set(f, src);
    for (const m of src.matchAll(/export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g)) exported.set(m[1], f);
    for (const m of src.matchAll(/export\s+const\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:\(|function)/g)) exported.set(m[1], f);
  }
  // 找出被整份 import 的模块（相对路径基于引用文件所在目录解析）
  for (const [f, src] of contents) {
    for (const m of src.matchAll(/import\s+\*\s+as\s+[\w$]+\s+from\s+['"](\.[^'"]+)['"]/g)) {
      const abs = path.posix.normalize(path.posix.join(path.posix.dirname(f), m[1]));
      const resolved = [...contents.keys()].find(k => k === abs || k === `${abs}.js`);
      if (resolved) nsFiles.add(resolved);
    }
  }
  return { files, contents, exported, nsFiles };
}

const isDefLine = (line, name) =>
  line.includes(`export function ${name}`)
  || line.includes(`export async function ${name}`)
  || line.includes(`export const ${name} =`);

function countRefs(contents, name, { self = null } = {}) {
  const re = new RegExp(WORD_BOUNDARY.source.replace('NAME', name), 'g');
  let n = 0;
  for (const [f, src] of contents) {
    let body = src;
    if (f === self) {
      body = src.split('\n')
        .map(line => (isDefLine(line, name) ? line.split(name).join('_'.repeat(name.length)) : line))
        .join('\n');
    }
    n += (body.match(re) || []).length;
  }
  return n;
}

// 返回 { dead: [{name, file}], testOnly: [{name, file}] }
export function findUncalled({ root = 'js', testDir = 'test' } = {}) {
  const { files, contents, exported, nsFiles } = collectExports(root);
  const prod = new Map([...contents].filter(([f]) => files.includes(f)));

  const testFiles = fs.existsSync(testDir)
    ? fs.readdirSync(testDir).filter(f => f.endsWith('.mjs')).map(f => `${testDir}/${f}`)
    : [];
  const tests = new Map(testFiles.map(f => [f, fs.readFileSync(f, 'utf8')]));

  const dead = [], testOnly = [];
  for (const [name, file] of exported) {
    if (nsFiles.has(file)) continue;              // 整份导入的模块，导出可能以 X.fn() 使用
    const p = countRefs(prod, name, { self: file });
    const t = countRefs(tests, name);
    if (p === 0 && t === 0) dead.push({ name, file });
    else if (p === 0 && t > 0) testOnly.push({ name, file });
  }
  return { dead, testOnly, total: exported.size };
}

// ---------------------------------------------------------------- 自检

if (process.argv[1]?.endsWith('dead-code.mjs')) {
  const { dead, testOnly, total } = findUncalled();
  for (const d of dead) console.log(`✗ ${d.name.padEnd(24)} ${d.file} 从未被调用`);
  for (const d of testOnly) console.log(`△ ${d.name.padEnd(24)} ${d.file} 仅测试调用`);
  console.log(`\n导出函数 ${total} 个，死代码 ${dead.length} 个，仅测试 ${testOnly.length} 个`);
  process.exit(dead.length ? 1 : 0);
}
