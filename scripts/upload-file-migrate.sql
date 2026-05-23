-- upload_file：存储用户上传图片、文档（PDF/TXT/Word/PPT）、AI 生成图片/文件及后续导出文件的元数据
CREATE TABLE IF NOT EXISTS `upload_file` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '文件 ID，主键',
  `user_id` VARCHAR(36) NOT NULL COMMENT '上传者或文件归属用户 ID',
  `source` VARCHAR(32) NOT NULL DEFAULT 'user_upload' COMMENT '文件来源：user_upload 用户上传、ai_generated AI 生成、system_generated 系统生成',
  `file_type` VARCHAR(16) NOT NULL COMMENT '文件大类：image 图片、file 文档/通用文件、audio 音频、video 视频',
  `mime_type` VARCHAR(128) NOT NULL COMMENT '文件 MIME 类型，如 image/png、application/pdf',
  `original_name` VARCHAR(512) NOT NULL COMMENT '上传前的原始文件名',
  `storage_name` VARCHAR(512) NOT NULL COMMENT '服务器本地存储用的文件名',
  `storage_path` VARCHAR(1024) NOT NULL COMMENT '文件在服务器上的物理存储路径（如 uploads 目录下相对/绝对路径）',
  `url` VARCHAR(1024) NULL COMMENT '前端可访问该文件的 URL',
  `size` BIGINT NOT NULL DEFAULT 0 COMMENT '文件大小，单位：字节',
  `ext` VARCHAR(32) NULL COMMENT '文件扩展名，如 png、pdf、txt',
  `hash` VARCHAR(128) NULL COMMENT '文件哈希值，用于去重',
  `width` INT NULL COMMENT '图片宽度；非图片文件可为空',
  `height` INT NULL COMMENT '图片高度；非图片文件可为空',
  `duration` INT NULL COMMENT '音频/视频时长（秒）；其它类型可为空',
  `status` VARCHAR(16) NOT NULL DEFAULT 'temp' COMMENT '文件状态：temp 暂存、used 使用中、deleted 已删除',
  `metadata` JSON NULL COMMENT '扩展信息/元数据（JSON）',
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
  `deleted_at` DATETIME(6) NULL COMMENT '软删除时间，可选',
  PRIMARY KEY (`id`),
  KEY `idx_upload_file_user_status` (`user_id`, `status`),
  KEY `idx_upload_file_hash` (`hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='上传/生成文件元数据表';
