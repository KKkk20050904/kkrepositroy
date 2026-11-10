'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createServer } = require('../server.js');
const { categories, products } = require('../public/js/catalog.js');

let server;
let baseUrl;

test.before(async () => {
  server = createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

test.after(async () => {
  if (!server) return;
  await new Promise((resolve) => server.close(resolve));
});

test('GET /api/category 返回全部 12 个分类', async () => {
  const response = await fetch(`${baseUrl}/api/category`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /application\/json/);
  assert.match(response.headers.get('cache-control'), /no-store/);

  const payload = await response.json();
  assert.equal(payload.code, 0);
  assert.equal(payload.message, 'ok');
  assert.ok(Array.isArray(payload.data));
  assert.equal(payload.data.length, 12);

  const names = payload.data.map((category) => category.name);
  assert.ok(names.includes('蔬菜水果'));
  assert.ok(names.includes('手机数码'));

  for (const category of payload.data) {
    assert.ok(category.id);
    assert.ok(category.name);
    assert.ok(category.icon);
    assert.ok(Array.isArray(category.children));
    assert.equal(category.children.length, 6);
  }

  assert.equal(new Set(payload.data.map((category) => category.id)).size, payload.data.length);
});

test('GET /api/category 与本地目录数据保持一致', async () => {
  const response = await fetch(`${baseUrl}/api/category`);
  const payload = await response.json();
  assert.deepEqual(payload.data, JSON.parse(JSON.stringify(categories)));
  assert.ok(products.length >= 10);
});

test('三个页面均可通过友好路径和 .html 路径访问', async () => {
  const routes = [
    ['/', 'data-page="home"', '猜你喜欢'],
    ['/home', 'data-page="home"', '猜你喜欢'],
    ['/category', 'data-page="category"', '商品分类'],
    ['/category.html', 'data-page="category"', '商品分类'],
    ['/profile', 'data-page="profile"', '个人中心'],
    ['/profile.html', 'data-page="profile"', '个人中心']
  ];

  for (const [route, marker, text] of routes) {
    const response = await fetch(`${baseUrl}${route}`);
    assert.equal(response.status, 200, `${route} 应返回 200`);
    assert.match(response.headers.get('content-type'), /text\/html/);
    const html = await response.text();
    assert.ok(html.includes('lang="zh-CN"'), `${route} 应包含中文语言声明`);
    assert.ok(html.includes(marker), `${route} 应包含 ${marker}`);
    assert.ok(html.includes(text), `${route} 应包含 ${text}`);
  }
});

test('静态资源与商品图可正常加载', async () => {
  const assets = [
    ['/css/styles.css', 'text/css'],
    ['/js/app.js', 'javascript'],
    ['/js/catalog.js', 'javascript'],
    ['/images/icons.svg', 'image/svg+xml'],
    ['/images/avatar.svg', 'image/svg+xml'],
    ['/images/products/headphones.svg', 'image/svg+xml'],
    ['/images/products/catfood.svg', 'image/svg+xml']
  ];

  for (const [asset, expectedType] of assets) {
    const response = await fetch(`${baseUrl}${asset}`);
    assert.equal(response.status, 200, `${asset} 应返回 200`);
    assert.ok(
      (response.headers.get('content-type') || '').includes(expectedType),
      `${asset} 的 Content-Type 应包含 ${expectedType}`
    );
    assert.ok((await response.arrayBuffer()).byteLength > 0, `${asset} 不应为空`);
  }
});

test('所有商品都有对应的本地图片', () => {
  const publicDir = path.join(__dirname, '..', 'public');
  for (const product of products) {
    const asset = path.join(publicDir, product.image);
    assert.ok(fs.existsSync(asset), `缺少商品图片：${product.image}`);
    assert.ok(fs.statSync(asset).size > 100, `商品图片为空：${product.image}`);
  }
});

test('未知接口返回 JSON 404，未知页面返回 HTML 404', async () => {
  const apiResponse = await fetch(`${baseUrl}/api/not-exists`);
  assert.equal(apiResponse.status, 404);
  assert.match(apiResponse.headers.get('content-type'), /application\/json/);
  const apiPayload = await apiResponse.json();
  assert.equal(apiPayload.code, 404);

  const pageResponse = await fetch(`${baseUrl}/not-a-page`);
  assert.equal(pageResponse.status, 404);
  assert.match(pageResponse.headers.get('content-type'), /text\/html/);
  const html = await pageResponse.text();
  assert.ok(html.includes('页面走丢了'));
});

test('非 GET/HEAD 请求返回 405', async () => {
  const response = await fetch(`${baseUrl}/api/category`, { method: 'POST' });
  assert.equal(response.status, 405);
  assert.equal(response.headers.get('allow'), 'GET, HEAD');
  const payload = await response.json();
  assert.equal(payload.code, 405);
});

test('路径穿越请求不会读取 public 目录之外的文件', async () => {
  const response = await fetch(`${baseUrl}/..%2fserver.js`);
  assert.equal(response.status, 404);
  const html = await response.text();
  assert.ok(!html.includes('createServer'));
});

test('页面响应包含基础安全响应头', async () => {
  const response = await fetch(`${baseUrl}/`);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('x-frame-options'), 'DENY');
  assert.match(response.headers.get('content-security-policy'), /default-src 'self'/);
});
