-- 文案优化表
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `copy_optimizations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(36) NOT NULL,
  `content` text NOT NULL,
  `type` varchar(64) NOT NULL,
  `status` varchar(1) NOT NULL DEFAULT '1' COMMENT '1 启用 0 停用',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_copy_optimizations_user_id` (`user_id`),
  KEY `IDX_copy_optimizations_type_status` (`type`, `status`),
  CONSTRAINT `FK_copy_optimizations_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
