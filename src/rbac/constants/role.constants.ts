/** 角色主键 roles.id：1 超管 … 5 团队成员 */
export const RoleId = {
  SUPER_ADMIN: 1,
  ADMIN: 2,
  MEMBER: 3,
  TEAM_MANAGER: 4,
  TEAM_MEMBER: 5,
} as const;

export type RoleIdValue = (typeof RoleId)[keyof typeof RoleId];

/** 超级管理员、管理员：全量数据范围 */
export const FULL_ACCESS_ROLE_IDS = new Set<number>([
  RoleId.SUPER_ADMIN,
  RoleId.ADMIN,
]);

/** 不参与上下级关系的角色 */
export const ROLE_IDS_WITHOUT_HIERARCHY = new Set<number>([
  RoleId.SUPER_ADMIN,
  RoleId.ADMIN,
]);
