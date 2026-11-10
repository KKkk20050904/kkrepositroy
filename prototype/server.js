'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { categories } = require('./public/js/catalog.js');

const PUBLIC_DIR = path.join(__dirname, 'public');
const DEFAULT_PORT = 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8'
};

const PAGE_ROUTES = new Map([
  ['/', 'index.html'],
  ['/home', 'index.html'],
  ['/category', 'category.html'],
  ['/profile', 'profile.html']
]);

function setSecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; " +
      "base-uri 'self'; form-action 'self'; object-src 'none'; frame-ancestors 'none'"
  );
}

function sendJson(res, statusCode, payload, extraHeaders = {}) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    ...extraHeaders
  });
  res.end(body);
}

function sendNotFound(req, res, isApi) {
  if (isApi) {
    sendJson(res, 404, { code: 404, message: '接口不存在' });
    return;
  }
  const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>页面走丢了 · 拼多多简单版</title>
  <style>
    body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f7f5f4;color:#2c2422;font-family:system-ui,-apple-system,"Microsoft YaHei",sans-serif}
    main{text-align:center;padding:32px}
    .face{font-size:64px;line-height:1;margin-bottom:16px}
    h1{font-size:22px;margin:0 0 8px}
    p{color:#8a817d;margin:0 0 24px}
    a{display:inline-block;background:#e02e24;color:#fff;text-decoration:none;padding:11px 24px;border-radius:999px;font-weight:600}
  </style>
</head>
<body>
  <main>
    <div class="face">🧧</div>
    <h1>页面走丢了</h1>
    <p>这个页面可能已经被拼走啦</p>
    <a href="/">回到首页</a>
  </main>
</body>
</html>`;
  res.writeHead(404, {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Length': Buffer.byteLength(html),
    'Cache-Control': 'no-store'
  });
  res.end(req.method === 'HEAD' ? undefined : html);
}

function sendFile(req, res, filePath) {
  fs.stat(filePath, (statError, stats) => {
    if (statError || !stats.isFile()) {
      sendNotFound(req, res, false);
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    const isHtml = extension === '.html';
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[extension] || 'application/octet-stream',
      'Content-Length': stats.size,
      'Cache-Control': isHtml ? 'no-cache' : 'public, max-age=3600'
    });

    if (req.method === 'HEAD') {
      res.end();
      return;
    }

    const stream = fs.createReadStream(filePath);
    stream.on('error', () => {
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      }
      res.end('读取文件失败');
    });
    stream.pipe(res);
  });
}

function handleRequest(req, res) {
  setSecurityHeaders(res);

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    sendJson(res, 405, { code: 405, message: '仅支持 GET / HEAD 请求' });
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch {
    sendJson(res, 400, { code: 400, message: '请求路径不合法' });
    return;
  }

  if (pathname === '/api/category') {
    sendJson(res, 200, {
      code: 0,
      message: 'ok',
      data: categories
    });
    return;
  }

  if (pathname.startsWith('/api/')) {
    sendJson(res, 404, { code: 404, message: '接口不存在' });
    return;
  }

  if (PAGE_ROUTES.has(pathname)) {
    sendFile(req, res, path.join(PUBLIC_DIR, PAGE_ROUTES.get(pathname)));
    return;
  }

  if (pathname === '/category/' || pathname === '/profile/') {
    res.writeHead(301, { Location: pathname.slice(0, -1) });
    res.end();
    return;
  }

  let relativePath = pathname.replace(/^\/+/, '');
  if (!relativePath || relativePath.endsWith('/')) {
    relativePath += 'index.html';
  }

  const filePath = path.resolve(PUBLIC_DIR, relativePath);
  const publicRoot = PUBLIC_DIR.endsWith(path.sep) ? PUBLIC_DIR : PUBLIC_DIR + path.sep;
  if (filePath !== PUBLIC_DIR && !filePath.startsWith(publicRoot)) {
    sendNotFound(req, res, false);
    return;
  }

  sendFile(req, res, filePath);
}

function createServer() {
  return http.createServer(handleRequest);
}

if (require.main === module) {
  const port = Number.parseInt(process.env.PORT, 10) || DEFAULT_PORT;
  const host = process.env.HOST || '0.0.0.0';
  const server = createServer();

  server.listen(port, host, () => {
    const displayHost = host === '0.0.0.0' ? 'localhost' : host;
    console.log(`拼多多简单版已启动：http://${displayHost}:${port}`);
    console.log(`分类接口：http://${displayHost}:${port}/api/category`);
  });

  server.on('error', (error) => {
    console.error('服务启动失败：', error.message);
    process.exitCode = 1;
  });
}

module.exports = { createServer, categories };
