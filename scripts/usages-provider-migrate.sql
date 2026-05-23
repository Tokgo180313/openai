-- 关闭 MYSQL_SYNCHRONIZE 时手动执行：usages 表 modelClassify -> provider

ALTER TABLE `usages`
  CHANGE COLUMN `modelClassify` `provider` VARCHAR(255) NULL;
