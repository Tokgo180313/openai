/** 角色 ID（数据库：1–5，对应原 0–4） */
export const ROLE = {
  SUPER_ADMIN: "1",
  ADMIN: "2",
  NORMAL_USER: "3",
  TEAM_MANAGER: "4",
  TEAM_MEMBER: "5",
} as const;

export const ROLE_NAME_MAP: Record<string, string> = {
  [ROLE.SUPER_ADMIN]: "超级管理员",
  [ROLE.ADMIN]: "管理员",
  [ROLE.NORMAL_USER]: "普通用户",
  [ROLE.TEAM_MANAGER]: "团队管理者",
  [ROLE.TEAM_MEMBER]: "团队成员",
};

export type RoleId = (typeof ROLE)[keyof typeof ROLE];

export function normalizeRoleId(
  roleId: string | number | null | undefined,
): string {
  if (roleId === null || roleId === undefined || roleId === "") {
    return "";
  }
  return String(roleId);
}

export function getRoleName(roleId: string | number | null | undefined): string {
  const id = normalizeRoleId(roleId);
  return ROLE_NAME_MAP[id] ?? id;
}

export function isSuperAdmin(roleId: string | number | null | undefined): boolean {
  return normalizeRoleId(roleId) === ROLE.SUPER_ADMIN;
}

/** 可进入后台管理（原 0、1） */
export function isManageRole(roleId: string | number | null | undefined): boolean {
  const id = normalizeRoleId(roleId);
  return id === ROLE.SUPER_ADMIN || id === ROLE.ADMIN;
}

export function isNormalUser(roleId: string | number | null | undefined): boolean {
  return normalizeRoleId(roleId) === ROLE.NORMAL_USER;
}

export function normalizeRoleIds(
  roleIds: (string | number)[] | null | undefined,
): string[] {
  if (!roleIds?.length) {
    return [];
  }
  return roleIds.map((id) => normalizeRoleId(id)).filter(Boolean);
}
