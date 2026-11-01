-- ============================================================
-- 校园闲置物品交易小程序 - 数据库初始化脚本
-- 模块2：闲置商品发布、图片上传（feature/lisi-publish）
--
-- 执行方式（命令行）：
--   mysql -u root -p < init.sql
-- 或使用 Navicat / DataGrip 等工具直接运行本文件
-- ============================================================

CREATE DATABASE IF NOT EXISTS campus_secondhand
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE campus_secondhand;

-- ------------------------------------------------------------
-- 用户表（由"用户登录注册"模块张三维护，本模块只使用 user_id）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user` (
  `id`         INT UNSIGNED     NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `username`   VARCHAR(50)      NOT NULL                COMMENT '用户名',
  `password`   VARCHAR(255)     NOT NULL                COMMENT '密码（加密存储）',
  `nickname`   VARCHAR(50)      DEFAULT NULL            COMMENT '昵称',
  `avatar`     VARCHAR(255)     DEFAULT NULL            COMMENT '头像URL',
  `created_at` DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- ------------------------------------------------------------
-- 商品分类表（由"首页分类"模块孙八维护，本模块只读取）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `category` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '分类ID',
  `name`       VARCHAR(50)  NOT NULL                COMMENT '分类名称',
  `icon`       VARCHAR(255) DEFAULT NULL            COMMENT '图标URL',
  `sort_order` INT          NOT NULL DEFAULT 0      COMMENT '排序（越小越靠前）',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品分类表';

-- ------------------------------------------------------------
-- 商品表（本模块核心表）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `goods` (
  `id`             INT UNSIGNED  NOT NULL AUTO_INCREMENT COMMENT '商品ID',
  `user_id`        INT UNSIGNED  NOT NULL               COMMENT '发布者ID',
  `title`          VARCHAR(50)   NOT NULL               COMMENT '商品标题',
  `description`    TEXT                                 COMMENT '商品描述',
  `price`          DECIMAL(10,2) NOT NULL               COMMENT '转让价格',
  `original_price` DECIMAL(10,2) DEFAULT NULL           COMMENT '原价（选填）',
  `category_id`    INT UNSIGNED  DEFAULT NULL           COMMENT '分类ID',
  `status`         TINYINT       NOT NULL DEFAULT 1     COMMENT '状态：1在售 2已售出 3已下架',
  `created_at`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发布时间',
  `updated_at`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_category_id` (`category_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='闲置商品表';

-- ------------------------------------------------------------
-- 商品图片表（本模块核心表，一商品多图）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `goods_images` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '图片ID',
  `goods_id`   INT UNSIGNED NOT NULL                COMMENT '商品ID',
  `image_url`  VARCHAR(255) NOT NULL                COMMENT '图片地址',
  `sort_order` INT          NOT NULL DEFAULT 0      COMMENT '排序（越小越靠前，0为封面）',
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间',
  PRIMARY KEY (`id`),
  KEY `idx_goods_id` (`goods_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品图片表';

-- ------------------------------------------------------------
-- 种子数据
-- ------------------------------------------------------------
INSERT INTO `category` (`name`, `sort_order`) VALUES
('教材书籍', 1),
('数码电子', 2),
('生活用品', 3),
('服饰鞋包', 4),
('运动户外', 5),
('美妆个护', 6),
('其他', 99);

-- 测试用户（张三登录模块接入前，用于联调发布接口）
-- 密码 123456 的 MD5 值；正式登录模块请使用 bcrypt 等安全加密
INSERT INTO `user` (`username`, `password`, `nickname`) VALUES
('test_user', 'e10adc3949ba59abbe56e057f20f883e', '测试用户');
