-- 校园闲置物品交易小程序 - 数据库初始化脚本
-- 使用方式：mysql -u root -p < schema.sql
-- 注意：本文件只包含"用户登录注册模块（第一部分）"用到的表；
--       其他成员的模块表由各自成员负责维护。

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
