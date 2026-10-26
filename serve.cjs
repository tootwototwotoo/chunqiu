#!/usr/bin/env node
// 极简静态服务器：node serve.cjs [port]
// 同时监听 IPv4(0.0.0.0) 与 IPv6(::)，避免 localhost 解析差异导致访问不到
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const port = Number(process.argv[2] || 5173);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.md': 'text/markdown; charset=utf-8',
};

function handler(req, res) {
  // 畸形百分号转义会让 decodeURIComponent 抛错，未捕获会拖垮整个进程
  let urlPath;
  try {
    urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  } catch {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('400 bad request');
  }
  if (urlPath === '/' || urlPath === '') urlPath = '/index.html';
  // 前缀判断必须带路径分隔符，否则 chunqiu 与 chunqiu_evil 这类兄弟目录会被放行
  const file = path.resolve(root, '.' + path.posix.normalize('/' + urlPath));
  if (file !== root && !file.startsWith(root + path.sep)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('403 forbidden');
  }
  fs.readFile(file, (err, buf) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('404 ' + urlPath + '\n请确认访问的是项目根目录，或改用 chunqiu.html 单文件版。');
    }
    res.writeHead(200, {
      'Content-Type': types[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(buf);
  });
}

const servers = [];
function listen(host) {
  const s = http.createServer(handler);
  s.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      console.error(`端口 ${port} 已被占用（${host}）。请关闭其他服务，或运行：node serve.cjs 5174`);
      process.exit(1);
    }
    if (e.code === 'EAFNOSUPPORT' || e.code === 'EADDRNOTAVAIL') return; // 该协议族不可用则忽略
    console.error(e);
  });
  s.listen(port, host, () => {
    servers.push(s);
    console.log(`  监听 ${host === '0.0.0.0' ? 'IPv4' : 'IPv6'}  ${host}:${port}`);
    if (servers.length === 2) ready();
  });
  return s;
}

let announced = false;
function ready() {
  if (announced) return;
  announced = true;
  console.log(`\n春秋·列国志已启动：`);
  console.log(`  http://localhost:${port}/`);
  console.log(`  http://127.0.0.1:${port}/`);
  console.log(`静态资源目录：${root}`);
  console.log('按 Ctrl+C 停止。若页面空白，请按 F12 查看控制台，或直接打开 chunqiu.html。\n');
}

listen('0.0.0.0');
listen('::');

// 若 IPv6 不可用，仅 IPv4 也要能正常提示
setTimeout(() => { if (!announced && servers.length >= 1) ready(); }, 300);

process.on('SIGINT', () => {
  servers.forEach(s => s.close());
  process.exit(0);
});
