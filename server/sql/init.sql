-- ============================================================
-- 校园闲置物品交易小程序 - 数据库初始化脚本（合并版）
--
-- 包含全部模块的表：用户（张三）、分类/商品/图片（李四/王五）、
-- 私信（钱七）、收藏（赵六）
-- 执行方式（命令行）：mysql -u root -p < init.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS campus_secondhand
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE campus_secondhand;

-- ------------------------------------------------------------
-- 用户表（张三：登录注册、个人信息管理）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id`          INT UNSIGNED     NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `username`    VARCHAR(30)      NOT NULL                COMMENT '用户名（登录账号，唯一）',
  `nickname`    VARCHAR(30)      DEFAULT NULL            COMMENT '昵称',
  `password`    VARCHAR(255)     NOT NULL                COMMENT '密码（bcrypt 加密存储）',
  `avatar`      VARCHAR(255)     DEFAULT NULL            COMMENT '头像URL',
  `phone`       VARCHAR(20)      DEFAULT NULL            COMMENT '手机号',
  `email`       VARCHAR(100)     DEFAULT NULL            COMMENT '邮箱',
  `student_id`  VARCHAR(30)      DEFAULT NULL            COMMENT '学号',
  `created_at`  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
  `updated_at`  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- ------------------------------------------------------------
-- 商品分类表（孙八：首页分类，本模块提供只读接口）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `category` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '分类ID',
  `name`       VARCHAR(50)  NOT NULL                COMMENT '分类名称',
  `icon`       VARCHAR(255) DEFAULT NULL            COMMENT '图标URL',
  `sort_order` INT          NOT NULL DEFAULT 0      COMMENT '排序（越小越靠前）',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品分类表';

-- ------------------------------------------------------------
-- 商品表（李四：发布 / 王五：列表搜索）
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
-- 商品图片表（李四：一商品多图）
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
-- 私信表（钱七：私信聊天）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `messages` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '消息ID',
  `sender_id`   INT UNSIGNED    NOT NULL                COMMENT '发送者ID',
  `receiver_id` INT UNSIGNED    NOT NULL                COMMENT '接收者ID',
  `content`     VARCHAR(2000)   NOT NULL                COMMENT '消息内容',
  `is_read`     TINYINT(1)      NOT NULL DEFAULT 0      COMMENT '是否已读：0未读 1已读',
  `created_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发送时间',
  PRIMARY KEY (`id`),
  KEY `idx_messages_sender_receiver_id` (`sender_id`, `receiver_id`, `id`),
  KEY `idx_messages_receiver_sender_id` (`receiver_id`, `sender_id`, `id`),
  CONSTRAINT `fk_messages_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_messages_receiver` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='私信消息';

-- ------------------------------------------------------------
-- 收藏表（赵六：商品收藏）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `collect` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '收藏主键',
  `user_id`     INT UNSIGNED NOT NULL                COMMENT '用户ID',
  `goods_id`    INT UNSIGNED NOT NULL                COMMENT '商品ID',
  `create_time` DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT '收藏时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_goods` (`user_id`, `goods_id`),
  KEY `idx_collect_goods` (`goods_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品收藏表';

-- ------------------------------------------------------------
-- 种子数据：商品分类
-- ------------------------------------------------------------
INSERT INTO `category` (`name`, `sort_order`) VALUES
('教材书籍', 1),
('数码电子', 2),
('生活用品', 3),
('服饰鞋包', 4),
('运动户外', 5),
('美妆个护', 6),
('其他', 99);

-- 说明：旧版 init.sql 中的 `user` 表（单数）已合并为 `users` 表，
--       如你的本地库中存在旧表，可执行：DROP TABLE IF EXISTS `user`;
