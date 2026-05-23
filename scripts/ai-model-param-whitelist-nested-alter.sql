-- 已有 ai_model_param_whitelists 表（旧版扁平结构）时执行

ALTER TABLE `ai_model_param_whitelists`
  ADD COLUMN `parent_id` BIGINT NULL COMMENT '父参数 id' AFTER `model_id`,
  ADD COLUMN `param_path` VARCHAR(512) NULL COMMENT '系统内全路径' AFTER `parent_id`,
  ADD COLUMN `api_param_path` VARCHAR(512) NULL COMMENT '上游全路径' AFTER `api_param_key`,
  ADD COLUMN `item_param_type` VARCHAR(32) NULL COMMENT 'array 元素类型' AFTER `param_type`,
  ADD COLUMN `sort` INT NOT NULL DEFAULT 0 COMMENT '同级排序' AFTER `enabled`;

-- 旧数据：param_path / api_param_path 回填为单层 param_key
UPDATE `ai_model_param_whitelists`
SET
  `param_path` = `param_key`,
  `api_param_path` = `api_param_key`
WHERE `param_path` IS NULL OR `param_path` = '';

ALTER TABLE `ai_model_param_whitelists`
  MODIFY `param_path` VARCHAR(512) NOT NULL,
  MODIFY `api_param_path` VARCHAR(512) NOT NULL;

ALTER TABLE `ai_model_param_whitelists`
  DROP INDEX `uk_model_param_key`,
  ADD UNIQUE KEY `uk_model_param_path` (`model_id`, `param_path`),
  ADD KEY `idx_param_whitelist_parent` (`parent_id`),
  ADD CONSTRAINT `fk_param_whitelist_parent`
    FOREIGN KEY (`parent_id`) REFERENCES `ai_model_param_whitelists` (`id`)
    ON DELETE CASCADE;

-- param_type 扩展：允许 object / object[]（无需改列类型，仅约定）
