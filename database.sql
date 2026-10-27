-- ==========4新增收藏表==========
CREATE TABLE IF NOT EXISTS `collect` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '收藏主键',
  `user_id` int NOT NULL COMMENT '用户id',
  `goods_id` int NOT NULL COMMENT '商品id',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '收藏时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY uk_user_goods (`user_id`,`goods_id`) COMMENT '同一个用户不能重复收藏同一个商品'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品收藏表';