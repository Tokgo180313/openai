-- RBAC 初始化：roles 仅用 id；user_roles / role_menus 含自增 id
-- 角色 id：1 超管、2 管理员、3 普通用户、4 团队管理者、5 团队成员

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `menus` (
  `id` int NOT NULL AUTO_INCREMENT,
  `parent_id` int DEFAULT NULL,
  `code` varchar(64) NOT NULL,
  `name` varchar(64) NOT NULL,
  `path` varchar(128) DEFAULT NULL,
  `icon` varchar(64) DEFAULT NULL,
  `type` tinyint NOT NULL DEFAULT 1,
  `sort` int NOT NULL DEFAULT 0,
  `status` varchar(1) NOT NULL DEFAULT '1',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_menus_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `status` varchar(255) NOT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `user_roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(36) NOT NULL,
  `role_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_user_roles_user_role` (`user_id`, `role_id`),
  CONSTRAINT `FK_user_roles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_user_roles_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `role_menus` (
  `id` int NOT NULL AUTO_INCREMENT,
  `role_id` int NOT NULL,
  `menu_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_role_menus_role_menu` (`role_id`, `menu_id`),
  CONSTRAINT `FK_role_menus_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_role_menus_menu` FOREIGN KEY (`menu_id`) REFERENCES `menus` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 固定 id 写入角色（无 roleId 列）
INSERT INTO roles (id, name, status) VALUES
  (1, '超级管理员', '1'),
  (2, '管理员', '1'),
  (3, '普通用户', '1'),
  (4, '团队管理者', '1'),
  (5, '团队成员', '1')
ON DUPLICATE KEY UPDATE name = VALUES(name), status = VALUES(status);

INSERT INTO menus (id, parent_id, code, name, path, type, sort, status) VALUES
  (1,  NULL, 'system',           '系统管理',   '/system',           0, 10, '1'),
  (2,  1,    'system.user',      '用户管理',   '/system/user',      1, 11, '1'),
  (3,  1,    'system.role',      '角色管理',   '/system/role',      1, 12, '1'),
  (4,  1,    'system.menu',      '菜单管理',   '/system/menu',      1, 13, '1'),
  (5,  1,    'system.operation', '使用记录',   '/system/operation', 1, 14, '1'),
  (6,  NULL, 'model',            '模型管理',   '/model',            0, 20, '1'),
  (7,  6,    'model.config',     '模型配置',   '/model/config',     1, 21, '1'),
  (8,  6,    'model.ai',         'AI模型配置', '/model/ai',         1, 22, '1'),
  (9,  6,    'model.key',        'key管理',    '/model/key',        1, 23, '1'),
  (10, NULL, 'record',           '记录管理',   '/record',           0, 30, '1'),
  (11, 10,   'record.usage',     '用量记录',   '/record/usage',     1, 31, '1'),
  (12, 10,   'record.history',   '历史记录',   '/record/history',   1, 32, '1')
ON DUPLICATE KEY UPDATE
  parent_id = VALUES(parent_id), name = VALUES(name), path = VALUES(path),
  type = VALUES(type), sort = VALUES(sort), status = VALUES(status);

DELETE FROM role_menus;

INSERT IGNORE INTO role_menus (role_id, menu_id)
SELECT 1, m.id FROM menus m;

INSERT IGNORE INTO role_menus (role_id, menu_id)
SELECT 2, m.id FROM menus m WHERE m.code <> 'system.menu';

INSERT IGNORE INTO role_menus (role_id, menu_id)
SELECT 3, m.id FROM menus m
WHERE m.code IN ('record', 'record.usage', 'record.history');

INSERT IGNORE INTO role_menus (role_id, menu_id)
SELECT 4, m.id FROM menus m
WHERE m.code IN (
  'system', 'system.user', 'system.operation',
  'model', 'model.config', 'model.ai', 'model.key',
  'record', 'record.usage', 'record.history'
);

INSERT IGNORE INTO role_menus (role_id, menu_id)
SELECT 5, m.id FROM menus m
WHERE m.code IN ('record', 'record.history');

-- 用户-角色（每用户仅一条，见 scripts/user-roles-rebuild.sql）
DELETE FROM user_roles;
INSERT INTO user_roles (user_id, role_id) SELECT u.id, 1 FROM users u WHERE u.account = 'super-admin';
INSERT INTO user_roles (user_id, role_id) SELECT u.id, 2 FROM users u WHERE u.account = 'admin123';
INSERT INTO user_roles (user_id, role_id) SELECT u.id, 3 FROM users u WHERE u.account IN ('11004', '11003');
INSERT INTO user_roles (user_id, role_id) SELECT u.id, 4 FROM users u WHERE u.account = '100100';
INSERT INTO user_roles (user_id, role_id) SELECT u.id, 5 FROM users u WHERE u.account = '100101';
