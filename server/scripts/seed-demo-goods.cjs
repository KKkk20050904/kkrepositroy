/**
 * 示例商品播种脚本（7 个分类 × 每类 3 件 = 21 件）
 * - 发布者：用户名 kkk 的账号（如不存在会提示先注册）
 * - 图片：server/uploads/seed/demo-01.png ~ demo-21.png（随仓库提供）
 * - 幂等：重复执行只会补缺失的数据，不会重复插入
 *
 * 用法（在 server 目录下）：
 *   node scripts/seed-demo-goods.cjs
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = require('../config/db');

const OWNER_USERNAME = 'kkk';

// 与 scripts/gen-seed-images.py 中的 ITEMS 保持一致
const ITEMS = [
  { cat: '教材书籍', title: '高等数学教材（同济版）', price: 15, original: 59, desc: '九成新，笔记很少，适合大一大二' },
  { cat: '教材书籍', title: '大学英语四级词汇书', price: 12, original: 45, desc: '九成新，重点词汇已划，几乎全新' },
  { cat: '教材书籍', title: '线性代数课本', price: 10, original: 39, desc: '八成新，课后题未写，保存完好' },
  { cat: '数码电子', title: '蓝牙无线耳机', price: 89, original: 299, desc: '九成新，续航不错，配件齐全' },
  { cat: '数码电子', title: '机械键盘 87键', price: 129, original: 399, desc: '九成新，青轴手感好，送键帽' },
  { cat: '数码电子', title: '移动电源 20000mAh', price: 45, original: 129, desc: '九成新，双口快充，容量足' },
  { cat: '生活用品', title: '宿舍小台灯', price: 19, original: 59, desc: '九成新，三档调光，护眼不刺眼' },
  { cat: '生活用品', title: '保温杯 500ml', price: 25, original: 79, desc: '九成新，保温 12 小时，内胆干净' },
  { cat: '生活用品', title: '大号收纳箱', price: 15, original: 49, desc: '八成新，放床底刚好，盖子完整' },
  { cat: '服饰鞋包', title: '帆布双肩包', price: 35, original: 99, desc: '九成新，容量大，可放 16 寸电脑' },
  { cat: '服饰鞋包', title: '运动卫衣 L码', price: 45, original: 159, desc: '八成新，宽松版型，只洗过两次' },
  { cat: '服饰鞋包', title: '小白鞋 39码', price: 59, original: 199, desc: '九成新，只穿过两次，无明显磨损' },
  { cat: '运动户外', title: '羽毛球拍（双拍）', price: 39, original: 129, desc: '九成新，轻量拍，送球一筒' },
  { cat: '运动户外', title: '瑜伽垫', price: 25, original: 69, desc: '九成新，加厚防滑，附收纳带' },
  { cat: '运动户外', title: '篮球 7号', price: 49, original: 149, desc: '八成新，室内外两用，弹性好' },
  { cat: '美妆个护', title: '护肤品小样套装', price: 29, original: 99, desc: '全新未拆封，日期新鲜' },
  { cat: '美妆个护', title: '带灯化妆镜', price: 35, original: 89, desc: '九成新，三色调光，桌面摆放' },
  { cat: '美妆个护', title: '洗发水 400ml', price: 19, original: 59, desc: '全新未开封，正品保障' },
  { cat: '其他', title: '多肉盆栽', price: 9, original: 25, desc: '状态很好，小盆栽好养活' },
  { cat: '其他', title: '手写笔记本', price: 6, original: 18, desc: '全新，空白页，硬壳封面' },
  { cat: '其他', title: '卡通抱枕', price: 15, original: 45, desc: '八成新，柔软不塌陷，干净无污渍' }
];

function imagePath(index) {
  return `/uploads/seed/demo-${String(index + 1).padStart(2, '0')}.png`;
}

async function main() {
  const [users] = await pool.query('SELECT id, username FROM users WHERE username = ?', [OWNER_USERNAME]);
  if (users.length === 0) {
    console.error(`未找到账号 ${OWNER_USERNAME}，请先在 App 里注册/登录该账号后再执行本脚本`);
    process.exit(1);
  }
  const ownerId = users[0].id;

  const [categories] = await pool.query('SELECT id, name FROM category');
  const catMap = {};
  categories.forEach((c) => {
    catMap[c.name] = c.id;
  });

  const [before] = await pool.query('SELECT COUNT(*) AS c FROM goods WHERE user_id = ?', [ownerId]);

  let created = 0;
  let skipped = 0;

  for (let i = 0; i < ITEMS.length; i++) {
    const item = ITEMS[i];
    const categoryId = catMap[item.cat];
    if (!categoryId) {
      console.warn(`分类不存在，跳过：${item.cat}`);
      continue;
    }

    const [exists] = await pool.query(
      'SELECT id FROM goods WHERE user_id = ? AND title = ? LIMIT 1',
      [ownerId, item.title]
    );

    let goodsId;
    if (exists.length > 0) {
      goodsId = exists[0].id;
      // 已存在：同步刷新描述（含"几成新"等信息）
      await pool.query('UPDATE goods SET description = ? WHERE id = ?', [item.desc, goodsId]);
      skipped++;
    } else {
      const [result] = await pool.query(
        `INSERT INTO goods (user_id, title, description, price, original_price, category_id, status)
         VALUES (?, ?, ?, ?, ?, ?, 1)`,
        [ownerId, item.title, item.desc, item.price, item.original, categoryId]
      );
      goodsId = result.insertId;
      created++;
    }

    // 补图片（幂等）
    const [imgExists] = await pool.query(
      'SELECT id FROM goods_images WHERE goods_id = ? AND image_url = ? LIMIT 1',
      [goodsId, imagePath(i)]
    );
    if (imgExists.length === 0) {
      await pool.query(
        'INSERT INTO goods_images (goods_id, image_url, sort_order) VALUES (?, ?, 0)',
        [goodsId, imagePath(i)]
      );
    }
  }

  const [after] = await pool.query('SELECT COUNT(*) AS c FROM goods WHERE user_id = ?', [ownerId]);
  console.log(`账号 ${OWNER_USERNAME}（id=${ownerId}）原有商品 ${before[0].c} 件`);
  console.log(`本次新增 ${created} 件，跳过已存在 ${skipped} 件`);
  console.log(`当前该账号商品总数：${after[0].c} 件`);

  await pool.end();
}

main().catch((err) => {
  console.error('播种失败：', err.message);
  process.exit(1);
});
