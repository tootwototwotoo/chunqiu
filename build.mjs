// 构建单文件版 chunqiu.html：内联 CSS 与打包后的 JS，可直接双击打开
import * as esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

const root = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1');

const result = await esbuild.build({
  entryPoints: [path.join(root, 'js/main.js')],
  bundle: true,
  format: 'iife',
  target: ['es2021'],
  charset: 'utf8',
  minify: true,
  legalComments: 'none',
  write: false,
  logLevel: 'info',
});

const js = result.outputFiles[0].text;
const css = fs.readFileSync(path.join(root, 'css/style.css'), 'utf8');
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

if (!html.includes('href="css/style.css"')) throw new Error('index.html 中未找到样式表引用');
if (!html.includes('src="js/main.js"')) throw new Error('index.html 中未找到入口脚本引用');

html = html.replace('<link rel="stylesheet" href="css/style.css">', () => `<style>
${css}
</style>`);
html = html.replace('<script type="module" src="js/main.js"></script>', () => `<script>
${js}
</script>`);
html = html.replace('直接打开单文件版 <b>chunqiu.html</b>', '直接打开单文件版 <b>chunqiu.html</b>');

fs.writeFileSync(path.join(root, 'chunqiu.html'), html);
const kb = (Buffer.byteLength(html, 'utf8') / 1024).toFixed(1);
console.log(`已生成 chunqiu.html（${kb} KB，单文件、可离线双击运行）`);
