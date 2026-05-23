-- message_attachment：消息与 upload_file 的关联表
CREATE TABLE IF NOT EXISTS `message_attachment` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键',
  `message_id` VARCHAR(24) NOT NULL COMMENT '关联消息 ID（MongoDB Content._id）',
  `file_id` BIGINT NOT NULL COMMENT '关联 upload_file.id',
  `attachment_type` VARCHAR(32) NOT NULL COMMENT '附件类型：input_image、input_file、output_image、output_file',
  `role` VARCHAR(16) NOT NULL COMMENT '消息侧角色：user 用户输入、assistant 助手输出',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT '同一条消息多附件时的排序',
  `metadata` JSON NULL COMMENT '扩展元数据（JSON）',
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_message_attachment_message` (`message_id`),
  KEY `idx_message_attachment_file` (`file_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='消息附件关联表';
