-- 重建 user_roles：每用户仅一个角色
-- 1 超管 2 管理员 3 普通用户 4 团队管理者 5 团队成员

SET NAMES utf8mb4;

DELETE FROM user_roles;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, 1 FROM users u WHERE u.account = 'super-admin';

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, 2 FROM users u WHERE u.account = 'admin123';

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, 3 FROM users u WHERE u.account IN ('11004', '11003');

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, 4 FROM users u WHERE u.account = '100100';

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, 5 FROM users u WHERE u.account = '100101';
