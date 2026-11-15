-- ============================================================
-- 示例商品种子数据（12 件，图片在 server/uploads/seed/）
--
-- 由 scripts/setup-db.cjs 自动导入（表为空时导一次）；也可手动：
--   mysql -u root -p --default-character-set=utf8mb4 campus_secondhand < server/sql/seed-goods.sql
--
-- 可重复执行：同标题商品、同一张图都不会重复插入。
-- ============================================================
USE campus_secondhand;

INSERT INTO users (username, nickname, password) VALUES
  ('lisi_demo', '李四（二手教材）', '$2a$10$6Ldkn5v22DhH1MWqJ8aHlO30pozNAVyTiPQP5e/dfUfNosx4izKla')
  ON DUPLICATE KEY UPDATE nickname = VALUES(nickname);

SET @uid := (SELECT id FROM users WHERE username = 'lisi_demo');

INSERT INTO goods (user_id, title, description, price, original_price, category_id, status)
SELECT @uid, '考研数学复习全书（基础篇 第3版）', '李永乐、王式安编写，只做了前三章笔记，其余全新。适合 2027 考研起步用。', 26, 68, 1, 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM goods g WHERE g.title = '考研数学复习全书（基础篇 第3版）');
INSERT INTO goods_images (goods_id, image_url, sort_order)
SELECT g.id, '/uploads/seed/01-book.png', 0 FROM goods g
WHERE g.title = '考研数学复习全书（基础篇 第3版）'
  AND NOT EXISTS (SELECT 1 FROM goods_images gi WHERE gi.goods_id = g.id AND gi.image_url = '/uploads/seed/01-book.png')
LIMIT 1;

INSERT INTO goods (user_id, title, description, price, original_price, category_id, status)
SELECT @uid, '头戴式降噪蓝牙耳机', '续航约 30 小时，降噪正常，耳罩无脱皮。附图原装收纳盒，换新出。', 219, 699, 2, 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM goods g WHERE g.title = '头戴式降噪蓝牙耳机');
INSERT INTO goods_images (goods_id, image_url, sort_order)
SELECT g.id, '/uploads/seed/02-headphones.png', 0 FROM goods g
WHERE g.title = '头戴式降噪蓝牙耳机'
  AND NOT EXISTS (SELECT 1 FROM goods_images gi WHERE gi.goods_id = g.id AND gi.image_url = '/uploads/seed/02-headphones.png')
LIMIT 1;

INSERT INTO goods (user_id, title, description, price, original_price, category_id, status)
SELECT @uid, '宿舍护眼台灯（三档调光）', 'USB 供电，三档色温可调，灯管无闪烁。搬宿舍带不走，便宜出。', 45, 129, 3, 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM goods g WHERE g.title = '宿舍护眼台灯（三档调光）');
INSERT INTO goods_images (goods_id, image_url, sort_order)
SELECT g.id, '/uploads/seed/03-lamp.png', 0 FROM goods g
WHERE g.title = '宿舍护眼台灯（三档调光）'
  AND NOT EXISTS (SELECT 1 FROM goods_images gi WHERE gi.goods_id = g.id AND gi.image_url = '/uploads/seed/03-lamp.png')
LIMIT 1;

INSERT INTO goods (user_id, title, description, price, original_price, category_id, status)
SELECT @uid, '87 键机械键盘（茶轴）', '自用半年，键帽无打油，所有轴体手感一致，附赠拔键器。', 158, 399, 2, 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM goods g WHERE g.title = '87 键机械键盘（茶轴）');
INSERT INTO goods_images (goods_id, image_url, sort_order)
SELECT g.id, '/uploads/seed/04-keyboard.png', 0 FROM goods g
WHERE g.title = '87 键机械键盘（茶轴）'
  AND NOT EXISTS (SELECT 1 FROM goods_images gi WHERE gi.goods_id = g.id AND gi.image_url = '/uploads/seed/04-keyboard.png')
LIMIT 1;

INSERT INTO goods (user_id, title, description, price, original_price, category_id, status)
SELECT @uid, '羽毛球拍（已穿线 24 磅）', '碳素拍身，手胶刚换过，拍框无磕碰。适合入门到进阶。', 55, 189, 5, 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM goods g WHERE g.title = '羽毛球拍（已穿线 24 磅）');
INSERT INTO goods_images (goods_id, image_url, sort_order)
SELECT g.id, '/uploads/seed/05-racket.png', 0 FROM goods g
WHERE g.title = '羽毛球拍（已穿线 24 磅）'
  AND NOT EXISTS (SELECT 1 FROM goods_images gi WHERE gi.goods_id = g.id AND gi.image_url = '/uploads/seed/05-racket.png')
LIMIT 1;

INSERT INTO goods (user_id, title, description, price, original_price, category_id, status)
SELECT @uid, '帆布托特包（可装 14 寸电脑）', '加厚帆布，内有一个拉链小袋，肩带结实。洗过一次，无污渍。', 22, 79, 4, 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM goods g WHERE g.title = '帆布托特包（可装 14 寸电脑）');
INSERT INTO goods_images (goods_id, image_url, sort_order)
SELECT g.id, '/uploads/seed/06-totebag.png', 0 FROM goods g
WHERE g.title = '帆布托特包（可装 14 寸电脑）'
  AND NOT EXISTS (SELECT 1 FROM goods_images gi WHERE gi.goods_id = g.id AND gi.image_url = '/uploads/seed/06-totebag.png')
LIMIT 1;

INSERT INTO goods (user_id, title, description, price, original_price, category_id, status)
SELECT @uid, '罗技 M330 静音无线鼠标', '静音按键，图书馆用不吵人；送一节电池，接收器收在电池仓里，无掉漆。', 69, 159, 2, 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM goods g WHERE g.title = '罗技 M330 静音无线鼠标');
INSERT INTO goods_images (goods_id, image_url, sort_order)
SELECT g.id, '/uploads/seed/07-mouse.png', 0 FROM goods g
WHERE g.title = '罗技 M330 静音无线鼠标'
  AND NOT EXISTS (SELECT 1 FROM goods_images gi WHERE gi.goods_id = g.id AND gi.image_url = '/uploads/seed/07-mouse.png')
LIMIT 1;

INSERT INTO goods (user_id, title, description, price, original_price, category_id, status)
SELECT @uid, '四级词汇（乱序版）', '背了大约三分之一，书页干净无笔记，附赠四级真题小册子。', 15, 45, 1, 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM goods g WHERE g.title = '四级词汇（乱序版）');
INSERT INTO goods_images (goods_id, image_url, sort_order)
SELECT g.id, '/uploads/seed/08-dict.png', 0 FROM goods g
WHERE g.title = '四级词汇（乱序版）'
  AND NOT EXISTS (SELECT 1 FROM goods_images gi WHERE gi.goods_id = g.id AND gi.image_url = '/uploads/seed/08-dict.png')
LIMIT 1;

INSERT INTO goods (user_id, title, description, price, original_price, category_id, status)
SELECT @uid, '宿舍收纳箱（60L 带盖）', '可装换季衣物和被单，箱体无裂痕，盖子卡扣完好，搬宿舍出。', 28, 79, 3, 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM goods g WHERE g.title = '宿舍收纳箱（60L 带盖）');
INSERT INTO goods_images (goods_id, image_url, sort_order)
SELECT g.id, '/uploads/seed/09-box.png', 0 FROM goods g
WHERE g.title = '宿舍收纳箱（60L 带盖）'
  AND NOT EXISTS (SELECT 1 FROM goods_images gi WHERE gi.goods_id = g.id AND gi.image_url = '/uploads/seed/09-box.png')
LIMIT 1;

INSERT INTO goods (user_id, title, description, price, original_price, category_id, status)
SELECT @uid, '加厚棉服（L 码 · 藏青）', '去年冬天买的，只穿过一季，无破损无污渍，拉链顺滑，蓬松度还很好。', 120, 599, 4, 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM goods g WHERE g.title = '加厚棉服（L 码 · 藏青）');
INSERT INTO goods_images (goods_id, image_url, sort_order)
SELECT g.id, '/uploads/seed/10-coat.png', 0 FROM goods g
WHERE g.title = '加厚棉服（L 码 · 藏青）'
  AND NOT EXISTS (SELECT 1 FROM goods_images gi WHERE gi.goods_id = g.id AND gi.image_url = '/uploads/seed/10-coat.png')
LIMIT 1;

INSERT INTO goods (user_id, title, description, price, original_price, category_id, status)
SELECT @uid, '瑜伽垫（10mm 加厚防滑）', '用过几次，表面无破损，没有异味，送收纳背带。', 32, 99, 5, 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM goods g WHERE g.title = '瑜伽垫（10mm 加厚防滑）');
INSERT INTO goods_images (goods_id, image_url, sort_order)
SELECT g.id, '/uploads/seed/11-yogamat.png', 0 FROM goods g
WHERE g.title = '瑜伽垫（10mm 加厚防滑）'
  AND NOT EXISTS (SELECT 1 FROM goods_images gi WHERE gi.goods_id = g.id AND gi.image_url = '/uploads/seed/11-yogamat.png')
LIMIT 1;

INSERT INTO goods (user_id, title, description, price, original_price, category_id, status)
SELECT @uid, '陶瓷马克杯（350ml · 全新未拆）', '买重了，全新没拆封，可微波炉加热，杯身有 CAMPUS 印花。', 12, 39, 99, 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM goods g WHERE g.title = '陶瓷马克杯（350ml · 全新未拆）');
INSERT INTO goods_images (goods_id, image_url, sort_order)
SELECT g.id, '/uploads/seed/12-mug.png', 0 FROM goods g
WHERE g.title = '陶瓷马克杯（350ml · 全新未拆）'
  AND NOT EXISTS (SELECT 1 FROM goods_images gi WHERE gi.goods_id = g.id AND gi.image_url = '/uploads/seed/12-mug.png')
LIMIT 1;
