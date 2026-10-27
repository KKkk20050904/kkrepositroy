-- 校园闲置物品交易小程序 - 数据库初始化脚本
-- 使用方式：mysql -u root -p < schema.sql
-- 包含登录、商品详情及收藏模块所需的表。

CREATE DATABASE IF NOT EXISTS campus_secondhand
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE campus_secondhand;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id          INT UNSIGNED     NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  username    VARCHAR(30)      NOT NULL                COMMENT '用户名（登录账号，唯一）',
  nickname    VARCHAR(30)      DEFAULT NULL            COMMENT '昵称',
  password    VARCHAR(255)     NOT NULL                COMMENT '密码（bcrypt 加密存储）',
  avatar      VARCHAR(255)     DEFAULT NULL            COMMENT '头像URL',
  phone       VARCHAR(20)      DEFAULT NULL            COMMENT '手机号',
  email       VARCHAR(100)     DEFAULT NULL            COMMENT '邮箱',
  student_id  VARCHAR(30)      DEFAULT NULL            COMMENT '学号',
  created_at  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
  updated_at  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

CREATE TABLE IF NOT EXISTS category (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品分类表';

INSERT IGNORE INTO category (id, name) VALUES
  (1, '书籍教材'),
  (2, '数码电子'),
  (3, '宿舍用品'),
  (4, '服饰鞋包');

CREATE TABLE IF NOT EXISTS goods (
  id INT NOT NULL AUTO_INCREMENT,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image VARCHAR(255) DEFAULT NULL,
  category_id INT DEFAULT NULL,
  user_id INT UNSIGNED NOT NULL,
  status TINYINT NOT NULL DEFAULT 1 COMMENT '1-上架 0-下架',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_goods_category (category_id),
  KEY idx_goods_title (title),
  KEY idx_goods_user (user_id),
  CONSTRAINT fk_goods_category FOREIGN KEY (category_id) REFERENCES category (id),
  CONSTRAINT fk_goods_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='闲置商品表';

CREATE TABLE IF NOT EXISTS collect (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  goods_id INT NOT NULL,
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_collect_user_goods (user_id, goods_id),
  CONSTRAINT fk_collect_user FOREIGN KEY (user_id) REFERENCES users (id),
  CONSTRAINT fk_collect_goods FOREIGN KEY (goods_id) REFERENCES goods (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品收藏表';
