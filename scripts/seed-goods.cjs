#!/usr/bin/env node
/**
 * 一键入库：用「发布商品」接口往数据库里造几件示例商品
 *
 * 用法：
 *   1. 先启动后端            node server/app.js
 *   2. 再执行本脚本          node scripts/seed-goods.cjs
 *   可选：SEED_BASE 指定服务地址（默认 http://127.0.0.1:3000）
 *
 * 它做的事（全部走项目自己的接口，不直接写数据库）：
 *   注册/登录演示账号 → POST /api/upload 传图 → POST /api/goods 发布
 *   已存在同名商品就跳过，可重复执行。
 */
const fs = require('node:fs');
const path = require('node:path');

const BASE = process.env.SEED_BASE || 'http://127.0.0.1:3000';
const USER = { username: 'lisi_demo', password: 'lisi123456', nickname: '李四（二手教材）' };
const IMG_DIR = path.join(__dirname, 'seed-images');

const ITEMS = [
  { file: '01-book.png', categoryId: 1, price: 26, originalPrice: 68,
    title: '考研数学复习全书（基础篇 第3版）',
    description: '李永乐、王式安编写，只做了前三章笔记，其余全新。适合 2027 考研起步用。' },
  { file: '02-headphones.png', categoryId: 2, price: 219, originalPrice: 699,
    title: '头戴式降噪蓝牙耳机',
    description: '续航约 30 小时，降噪正常，耳罩无脱皮。附图原装收纳盒，换新出。' },
  { file: '03-lamp.png', categoryId: 3, price: 45, originalPrice: 129,
    title: '宿舍护眼台灯（三档调光）',
    description: 'USB 供电，三档色温可调，灯管无闪烁。搬宿舍带不走，便宜出。' },
  { file: '04-keyboard.png', categoryId: 2, price: 158, originalPrice: 399,
    title: '87 键机械键盘（茶轴）',
    description: '自用半年，键帽无打油，所有轴体手感一致，附赠拔键器。' },
  { file: '05-racket.png', categoryId: 5, price: 55, originalPrice: 189,
    title: '羽毛球拍（已穿线 24 磅）',
    description: '碳素拍身，手胶刚换过，拍框无磕碰。适合入门到进阶。' },
  { file: '06-totebag.png', categoryId: 4, price: 22, originalPrice: 79,
    title: '帆布托特包（可装 14 寸电脑）',
    description: '加厚帆布，内有一个拉链小袋，肩带结实。洗过一次，无污渍。' },
  { file: '07-mouse.png', categoryId: 2, price: 69, originalPrice: 159,
    title: '罗技 M330 静音无线鼠标',
    description: '静音按键，图书馆用不吵人；送一节电池，接收器收在电池仓里，无掉漆。' },
  { file: '08-dict.png', categoryId: 1, price: 15, originalPrice: 45,
    title: '四级词汇（乱序版）',
    description: '背了大约三分之一，书页干净无笔记，附赠四级真题小册子。' },
  { file: '09-box.png', categoryId: 3, price: 28, originalPrice: 79,
    title: '宿舍收纳箱（60L 带盖）',
    description: '可装换季衣物和被单，箱体无裂痕，盖子卡扣完好，搬宿舍出。' },
  { file: '10-coat.png', categoryId: 4, price: 120, originalPrice: 599,
    title: '加厚棉服（L 码 · 藏青）',
    description: '去年冬天买的，只穿过一季，无破损无污渍，拉链顺滑，蓬松度还很好。' },
  { file: '11-yogamat.png', categoryId: 5, price: 32, originalPrice: 99,
    title: '瑜伽垫（10mm 加厚防滑）',
    description: '用过几次，表面无破损，没有异味，送收纳背带。' },
  { file: '12-mug.png', categoryId: 99, price: 12, originalPrice: 39,
    title: '陶瓷马克杯（350ml · 全新未拆）',
    description: '买重了，全新没拆封，可微波炉加热，杯身有 CAMPUS 印花。' },
];

async function api(method, url, { body, token } = {}) {
  const res = await fetch(BASE + url, {
    method,
    headers: {
      ...(body ? { 'content-type': 'application/json' } : {}),
      ...(token ? { authorization: 'Bearer ' + token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text.slice(0, 200) }; }
  if (!res.ok) throw new Error(`${method} ${url} → ${res.status} ${data.message || text.slice(0, 120)}`);
  return data;
}

async function login() {
  try {
    const r = await api('POST', '/api/auth/register', { body: USER });
    return r.data.token;
  } catch (err) {
    if (!/已存在/.test(err.message)) throw err;
  }
  const r = await api('POST', '/api/auth/login', { body: { username: USER.username, password: USER.password } });
  return r.data.token;
}

async function upload(token, file) {
  const buf = fs.readFileSync(path.join(IMG_DIR, file));
  const fd = new FormData();
  fd.append('files', new Blob([buf], { type: 'image/png' }), file);
  const res = await fetch(BASE + '/api/upload', {
    method: 'POST',
    headers: { authorization: 'Bearer ' + token },
    body: fd,
  });
  const json = await res.json();
  if (!res.ok || !json.data?.urls?.length) throw new Error('上传失败：' + JSON.stringify(json).slice(0, 160));
  return json.data.urls[0];
}

async function exists(title) {
  const r = await api('GET', '/api/goods?page=1&pageSize=100&keyword=' + encodeURIComponent(title));
  return r.data.list.some((g) => g.title === title);
}

(async () => {
  const health = await api('GET', '/api/health');
  console.log('后端在线：', health.data.time);

  const token = await login();
  console.log('已登录：', USER.username);

  let added = 0;
  let skipped = 0;
  for (const item of ITEMS) {
    if (await exists(item.title)) {
      console.log('跳过（已存在）：', item.title);
      skipped += 1;
      continue;
    }
    const url = await upload(token, item.file);
    const r = await api('POST', '/api/goods', {
      token,
      body: {
        title: item.title,
        description: item.description,
        price: item.price,
        originalPrice: item.originalPrice,
        categoryId: item.categoryId,
        images: [url],
      },
    });
    added += 1;
    console.log(`已发布 #${r.data.id}  ${item.title}  ¥${item.price}`);
  }

  const list = await api('GET', '/api/goods?page=1&pageSize=5');
  console.log(`\n完成：新增 ${added} 件，跳过 ${skipped} 件；当前在售共 ${list.data.total} 件。`);
  list.data.list.forEach((g) => console.log(`  #${g.id} ${g.title}  ¥${g.price}  卖家 ${g.seller_name}`));
})().catch((err) => {
  console.error('失败：', err.message);
  process.exit(1);
});
