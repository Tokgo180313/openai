-- 结构迁移：去掉 roles.roleId；user_roles / role_menus 增加自增 id
-- 执行前请备份 nest 库

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1) roles：删除 roleId 列（若存在）
SET @drop_roleId = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'roles' AND COLUMN_NAME = 'roleId'
);
SET @sql_drop = IF(@drop_roleId > 0, 'ALTER TABLE roles DROP COLUMN roleId', 'SELECT 1');
PREPARE s1 FROM @sql_drop; EXECUTE s1; DEALLOCATE PREPARE s1;

-- 2) user_roles：复合主键 -> 自增 id
SET @ur_has_id = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_roles' AND COLUMN_NAME = 'id'
);
SET @sql_ur = IF(@ur_has_id = 0,
  'ALTER TABLE user_roles
     DROP PRIMARY KEY,
     ADD COLUMN id INT NOT NULL AUTO_INCREMENT PRIMARY KEY FIRST,
     ADD UNIQUE KEY UQ_user_roles_user_role (user_id, role_id)',
  'SELECT 1');
PREPARE s2 FROM @sql_ur; EXECUTE s2; DEALLOCATE PREPARE s2;

-- 3) role_menus：复合主键 -> 自增 id
SET @rm_has_id = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'role_menus' AND COLUMN_NAME = 'id'
);
SET @sql_rm = IF(@rm_has_id = 0,
  'ALTER TABLE role_menus
     DROP PRIMARY KEY,
     ADD COLUMN id INT NOT NULL AUTO_INCREMENT PRIMARY KEY FIRST,
     ADD UNIQUE KEY UQ_role_menus_role_menu (role_id, menu_id)',
  'SELECT 1');
PREPARE s3 FROM @sql_rm; EXECUTE s3; DEALLOCATE PREPARE s3;

SET FOREIGN_KEY_CHECKS = 1;

-- 4) 统一角色 id 与名称（按主键 1-5）
INSERT INTO roles (id, name, status) VALUES
  (1, '超级管理员', '1'),
  (2, '管理员', '1'),
  (3, '普通用户', '1'),
  (4, '团队管理者', '1'),
  (5, '团队成员', '1')
ON DUPLICATE KEY UPDATE name = VALUES(name), status = VALUES(status);
