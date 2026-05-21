-- 关闭 MYSQL_SYNCHRONIZE 时手动执行：models 表迁移为 ai_models

CREATE TABLE IF NOT EXISTS `ai_models` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `provider` VARCHAR(64) NOT NULL,
  `model_code` VARCHAR(255) NOT NULL,
  `api_model_name` VARCHAR(255) NOT NULL,
  `model_type` VARCHAR(32) NOT NULL DEFAULT 'text',
  `base_url` VARCHAR(2048) NULL,
  `enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `sort` INT NOT NULL DEFAULT 100,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `idx_ai_models_provider` (`provider`),
  KEY `idx_ai_models_enabled_sort` (`enabled`, `sort`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 从旧 models 表导入（若存在）
INSERT INTO `ai_models` (
  `provider`,
  `model_code`,
  `api_model_name`,
  `model_type`,
  `base_url`,
  `enabled`,
  `sort`,
  `created_at`,
  `updated_at`
)
SELECT
  LOWER(TRIM(`modelClassify`)),
  TRIM(`modelName`),
  TRIM(`modelName`),
  COALESCE(NULLIF(TRIM(`modelType`), ''), 'text'),
  NULL,
  CASE WHEN `status` = '1' THEN 1 ELSE 0 END,
  100,
  `createdAt`,
  `updatedAt`
FROM `models`
WHERE NOT EXISTS (
  SELECT 1 FROM `ai_models` am
  WHERE LOWER(am.provider) = LOWER(TRIM(`models`.`modelClassify`))
    AND am.model_code = TRIM(`models`.`modelName`)
);

-- 确认数据后可选：DROP TABLE `models`;
