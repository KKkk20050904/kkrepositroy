/**
 * 全链路冒烟测试（合并版）
 * 覆盖：注册 → 登录 → 上传图片 → 发布商品 → 商品列表/搜索 → 商品详情 → 收藏列表 → 私信
 * 前置：MySQL 已执行 server/sql/init.sql，后端已启动（node app.js）
 * 用法：node scripts/smoke-test.cjs
 */
const fs = require('fs');
const path = require('path');

const BASE = 'http://127.0.0.1:3000';

let pass = 0;
let fail = 0;

function check(name, cond, detail) {
  if (cond) {
    pass++;
    console.log(`  PASS  ${name}`);
  } else {
    fail++;
    console.log(`  FAIL  ${name}  => ${detail}`);
  }
}

async function req(method, url, body, token) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetch(BASE + url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });
  let json = null;
  try { json = await res.json(); } catch (e) { json = null; }
  return { status: res.status, body: json };
}

// 生成 1x1 PNG 作为测试图片
function pngBuffer() {
  return Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64'
  );
}

async function uploadImage(token) {
  const form = new FormData();
  form.append('files', new Blob([pngBuffer()], { type: 'image/png' }), 'test.png');
  const res = await fetch(BASE + '/api/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form
  });
  return res.json();
}

async function main() {
  const stamp = Date.now().toString().slice(-8);
  const u1 = { username: `seller${stamp}`, password: '123456', nickname: '卖家小张', phone: '13800138001' };
  const u2 = { username: `buyer${stamp}`, password: '123456', nickname: '买家小李' };

  // ---------- 1. 注册两个账号 ----------
  let r = await req('POST', '/api/auth/register', u1);
  check('卖家注册成功 (201, code 0)', r.status === 201 && r.body.code === 0, JSON.stringify(r.body));
  const sellerToken = r.body.data && r.body.data.token;
  const sellerId = r.body.data && r.body.data.user.id;

  r = await req('POST', '/api/auth/register', u2);
  check('买家注册成功', r.status === 201 && r.body.code === 0, JSON.stringify(r.body));
  const buyerToken = r.body.data && r.body.data.token;
  const buyerId = r.body.data && r.body.data.user.id;

  // ---------- 2. 登录 ----------
  r = await req('POST', '/api/auth/login', { username: u1.username, password: '123456' });
  check('卖家登录成功', r.body.code === 0 && r.body.data.token, JSON.stringify(r.body));

  // ---------- 3. 分类 ----------
  r = await req('GET', '/api/category');
  check('分类列表返回数组', r.body.code === 0 && Array.isArray(r.body.data) && r.body.data.length >= 5, JSON.stringify(r.body));
  const categories = r.body.data || [];

  // ---------- 4. 上传图片 ----------
  const up = await uploadImage(sellerToken);
  check('图片上传成功', up.code === 0 && up.data && up.data.urls.length === 1, JSON.stringify(up));
  const imageUrl = up.data && up.data.urls[0];

  // ---------- 5. 发布商品 ----------
  const goods = {
    title: '九成新高数教材（冒烟测试）',
    description: '笔记不多，适合大一大二',
    price: 15.5,
    originalPrice: 59,
    categoryId: categories[0].id,
    images: [imageUrl]
  };
  r = await req('POST', '/api/goods', goods, sellerToken);
  check('发布商品成功', r.body.code === 0 && r.body.data.id, JSON.stringify(r.body));
  const goodsId = r.body.data && r.body.data.id;

  // ---------- 6. 商品列表 + 搜索 + 分类筛选 ----------
  r = await req('GET', '/api/goods?page=1&pageSize=10');
  check('商品列表 code 0 且有 list', r.body.code === 0 && Array.isArray(r.body.data.list), JSON.stringify(r.body).slice(0, 200));
  check('列表含刚发布的商品', r.body.data.list.some((g) => g.id === goodsId), 'goodsId=' + goodsId);

  r = await req('GET', `/api/goods?keyword=${encodeURIComponent('冒烟测试')}&page=1&pageSize=10`);
  check('关键词搜索命中', r.body.code === 0 && r.body.data.list.some((g) => g.id === goodsId), JSON.stringify(r.body).slice(0, 200));

  r = await req('GET', `/api/goods?categoryId=${categories[0].id}&page=1&pageSize=10`);
  check('分类筛选命中', r.body.code === 0 && r.body.data.list.some((g) => g.id === goodsId), JSON.stringify(r.body).slice(0, 200));

  // ---------- 7. 商品详情（未登录） ----------
  r = await req('GET', `/api/goods/${goodsId}`);
  check('详情支持未登录访问且 isCollect=false', r.body.code === 0 && r.body.data.isCollect === false && r.body.data.image, JSON.stringify(r.body).slice(0, 200));

  // ---------- 8. 收藏 ----------
  r = await req('POST', '/api/collect', { goodsId }, buyerToken);
  check('收藏成功', r.body.code === 0, JSON.stringify(r.body));

  r = await req('POST', '/api/collect', { goodsId }, buyerToken);
  check('重复收藏返回 1002', r.status === 400 && r.body.code === 1002, JSON.stringify(r.body));

  r = await req('GET', `/api/goods/${goodsId}`, undefined, buyerToken);
  check('登录后详情 isCollect=true', r.body.code === 0 && r.body.data.isCollect === true, JSON.stringify(r.body).slice(0, 120));

  r = await req('GET', '/api/collect?page=1&pageSize=10', undefined, buyerToken);
  check('收藏列表包含该商品', r.body.code === 0 && r.body.data.list.some((x) => x.id === goodsId), JSON.stringify(r.body).slice(0, 200));

  r = await req('DELETE', `/api/collect/${goodsId}`, undefined, buyerToken);
  check('取消收藏成功', r.body.code === 0, JSON.stringify(r.body));

  // ---------- 9. 私信 ----------
  r = await req('POST', '/api/msg', { receiverId: sellerId, content: '你好，教材还在吗？' }, buyerToken);
  check('发送私信成功 (201)', r.status === 201 && r.body.code === 0, JSON.stringify(r.body));

  r = await req('GET', `/api/msg?peerId=${buyerId}`, undefined, sellerToken);
  check('卖家收到私信', r.body.code === 0 && r.body.data.list.some((m) => m.content.includes('教材还在吗')), JSON.stringify(r.body).slice(0, 200));

  r = await req('GET', '/api/msg/conversations', undefined, sellerToken);
  check('会话列表可用', r.body.code === 0 && Array.isArray(r.body.data.list), JSON.stringify(r.body).slice(0, 200));

  // ---------- 10. 权限与 404 ----------
  r = await req('POST', '/api/goods', { title: 'x', price: 1 });
  check('未登录发布商品 401 + 1004', r.status === 401 && r.body.code === 1004, `${r.status}/${r.body.code}`);

  r = await req('GET', '/api/not-exist');
  check('404 统一格式 1006', r.status === 404 && r.body.code === 1006, `${r.status}/${r.body.code}`);

  console.log(`\n结果: ${pass} 通过, ${fail} 失败`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error('测试执行异常:', e);
  process.exit(1);
});
