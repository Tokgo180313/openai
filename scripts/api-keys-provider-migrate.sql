-- 关闭 MYSQL_SYNCHRONIZE 时手动执行（按库内实际情况选择步骤）

-- A) 列仍为 modelClassify 时
-- ALTER TABLE `api_keys`
--   CHANGE COLUMN `modelClassify` `provider` VARCHAR(255) NOT NULL;

-- B) 若 synchronize 已生成空的 ai_providers，先删再重命名
-- DROP TABLE IF EXISTS `ai_providers`;
-- RENAME TABLE `api_keys` TO `ai_providers`;

-- C) 若仅有 api_keys 且无 ai_providers
-- RENAME TABLE `api_keys` TO `ai_providers`;
