/**
 * 模块2接口自测脚本（开发联调用）
 * 运行：node test-api.js
 *
 * 说明：
 *   - 自动生成测试 token（与 .env 的 JWT_SECRET 一致，payload 与登录模块一致：{ userId, username }）
 *   - 上传一张测试图片，再发布一件测试商品
 *   - 需要先启动 MySQL 并执行 sql/init.sql（需存在 id=1 的用户，或先调注册接口），然后 node app.js 启动服务
 */
require('dotenv').config();
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const BASE = `http://localhost:${PORT}/api`;
const JWT_SECRET = process.env.JWT_SECRET || 'campus_secondhand_secret_key';

// 生成 1x1 测试 PNG
const PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const tmpImg = path.join(__dirname, 'test-upload.png');
fs.writeFileSync(tmpImg, Buffer.from(PNG_BASE64, 'base64'));

const token = jwt.sign({ userId: 1, username: 'test_user' }, JWT_SECRET);

async function main() {
  // 1. 上传图片
  const fd = new FormData();
  fd.append('files', new Blob([fs.readFileSync(tmpImg)]), 'test-upload.png');
  const upRes = await fetch(BASE + '/upload', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token },
    body: fd
  });
  const up = await upRes.json();
  console.log('[上传图片]', upRes.status, JSON.stringify(up));
  if (up.code !== 0) process.exit(1);

  // 2. 发布商品
  const body = JSON.stringify({
    title: '九成新高数教材',
    description: '教材二手转让，有少量笔记',
    price: 15.5,
    originalPrice: 59,
    categoryId: 1,
    images: up.data.urls
  });
  const goodsRes = await fetch(BASE + '/goods', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body
  });
  const goods = await goodsRes.json();
  console.log('[发布商品]', goodsRes.status, JSON.stringify(goods));
  if (goods.code !== 0) process.exit(1);

  console.log('✅ 自测通过');
}

main().catch((e) => {
  console.error('❌ 自测失败', e.message);
  process.exit(1);
});
