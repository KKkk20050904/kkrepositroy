-- ============================================
-- 校园闲置物品交易小程序 - 建表脚本
-- 负责模块：商品列表、搜索、分页（王五）
-- 说明：user/category 表为其他组员模块所需，此处先建好，
--       保证商品列表联表查询（分类名、卖家信息）可用
-- ============================================

CREATE DATABASE IF NOT EXISTS campus_secondhand DEFAULT CHARSET utf8mb4;
USE campus_secondhand;

-- 1. 用户表（张三：登录注册模块）
CREATE TABLE IF NOT EXISTS `user` (
  `id`          INT PRIMARY KEY AUTO_INCREMENT,
  `username`    VARCHAR(50)  NOT NULL,
  `password`    VARCHAR(100) NOT NULL,
  `avatar`      VARCHAR(255) DEFAULT '',
  `phone`       VARCHAR(20)  DEFAULT '',
  `create_time` DATETIME     DEFAULT CURRENT_TIMESTAMP
);

-- 2. 商品分类表（孙八：分类接口）
CREATE TABLE IF NOT EXISTS `category` (
  `id`   INT PRIMARY KEY AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL
);

-- 3. 商品表（李四发布 / 王五列表 / 赵六详情共用）
CREATE TABLE IF NOT EXISTS `goods` (
  `id`          INT PRIMARY KEY AUTO_INCREMENT,
  `user_id`     INT NOT NULL COMMENT '发布者id',
  `category_id` INT NOT NULL COMMENT '分类id',
  `title`       VARCHAR(100) NOT NULL COMMENT '商品标题',
  `price`       DECIMAL(10,2) NOT NULL COMMENT '售价',
  `description` TEXT COMMENT '商品描述',
  `images`      TEXT COMMENT '多张图片地址，逗号分隔',
  `status`      TINYINT DEFAULT 0 COMMENT '0上架 1已售出 2下架',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '发布时间',
  KEY `idx_category` (`category_id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_status_time` (`status`, `create_time`)
);

-- 示例分类数据（与前端分类栏对应，id 从 1 开始）
INSERT INTO `category` (`name`) VALUES
('教材书籍'), ('数码电子'), ('生活用品'), ('服饰鞋包'), ('运动器材'), ('其他');

-- 示例商品数据（测试分页和搜索用，user_id 先填 1）
INSERT INTO `goods` (`user_id`, `category_id`, `title`, `price`, `description`, `images`, `status`) VALUES
(1, 1, '高等数学第七版 上册', 15.00, '教材，几乎全新，无笔记，考研用不上了', 'http://localhost:3000/uploads/g1.jpg', 0),
(1, 2, '罗技 G102 鼠标', 60.00, '用了一年，功能正常，送鼠标垫', 'http://localhost:3000/uploads/g2.jpg', 0),
(1, 3, '小台灯 宿舍床头灯', 12.00, '暖光，可充电，宿舍神器', 'http://localhost:3000/uploads/g3.jpg', 0),
(1, 1, '四级英语真题试卷', 8.00, '全新未做，附听力音频', 'http://localhost:3000/uploads/g4.jpg', 0),
(1, 4, '帆布鞋 42码', 25.00, '穿了一个月，洗过，很干净', 'http://localhost:3000/uploads/g5.jpg', 0);
