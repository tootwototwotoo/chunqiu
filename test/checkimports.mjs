import fs from 'node:fs';
import path from 'node:path';
const root = 'js';
const files = [];
(function walk(d){ for (const f of fs.readdirSync(d)) { const p=path.join(d,f); if (fs.statSync(p).isDirectory()) walk(p); else if (p.endsWith('.js')) files.push(p); } })(root);
const exportsMap = {};
for (const f of files) {
  const src = fs.readFileSync(f,'utf8');
  const names = new Set();
  for (const m of src.matchAll(/export\s+(?:const|let|var|function|class)\s+([A-Za-z0-9_$]+)/g)) names.add(m[1]);
  for (const m of src.matchAll(/export\s*\{([^}]+)\}/g)) {
    for (const part of m[1].split(',')) {
      const n = part.trim().split(/\s+as\s+/)[1] || part.trim();
      if (n) names.add(n);
    }
  }
  exportsMap[path.resolve(f)] = names;
}
let bad = 0;
for (const f of files) {
  const src = fs.readFileSync(f,'utf8');
  for (const m of src.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]/g)) {
    const target = path.resolve(path.dirname(f), m[2]);
    if (!fs.existsSync(target)) { console.log('MISSING FILE', f, m[2]); bad++; continue; }
    const ex = exportsMap[target];
    if (!ex) continue;
    for (const part of m[1].split(',')) {
      const name = part.trim().split(/\s+as\s+/)[0];
      if (!name) continue;
      if (!ex.has(name)) { console.log('MISSING EXPORT', name, 'in', m[2], '<-', f); bad++; }
    }
  }
}
console.log(bad ? `${bad} import problems` : 'imports ok');
