-- 关闭 MYSQL_SYNCHRONIZE 时手动执行：AI 模型参数白名单表（支持嵌套 object / object[]）

CREATE TABLE IF NOT EXISTS `ai_model_param_whitelists` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `model_id` BIGINT NOT NULL COMMENT '关联 ai_models.id',
  `parent_id` BIGINT NULL COMMENT '父参数 id，根节点为 NULL',
  `param_path` VARCHAR(512) NOT NULL COMMENT '系统内全路径，如 messages[].content[].type',
  `param_key` VARCHAR(128) NOT NULL COMMENT '当前层级段名',
  `api_param_key` VARCHAR(128) NOT NULL COMMENT '上游当前层级字段名',
  `api_param_path` VARCHAR(512) NOT NULL COMMENT '上游全路径',
  `param_type` VARCHAR(32) NOT NULL COMMENT 'number/string/boolean/enum/array/object/object[]',
  `item_param_type` VARCHAR(32) NULL COMMENT 'param_type=array 时元素类型',
  `required` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否必填',
  `default_value` JSON NULL COMMENT '默认值（容器节点为空）',
  `min_value` DECIMAL(20, 6) NULL COMMENT '最小值',
  `max_value` DECIMAL(20, 6) NULL COMMENT '最大值',
  `enum_values` JSON NULL COMMENT '枚举可选值',
  `enabled` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否启用',
  `sort` INT NOT NULL DEFAULT 0 COMMENT '同级排序',
  `remark` VARCHAR(512) NULL COMMENT '备注',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_model_param_path` (`model_id`, `param_path`),
  KEY `idx_param_whitelist_model_enabled` (`model_id`, `enabled`),
  KEY `idx_param_whitelist_parent` (`parent_id`),
  CONSTRAINT `fk_param_whitelist_model`
    FOREIGN KEY (`model_id`) REFERENCES `ai_models` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_param_whitelist_parent`
    FOREIGN KEY (`parent_id`) REFERENCES `ai_model_param_whitelists` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
