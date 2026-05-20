import api from "@/api/apiList";
import { isSuperAdmin } from "@/constants/role";
import type { LoginMenuItem } from "@/types/auth.type";
import type { MenuRow } from "@/views/menu/types";
import { hasNestedChildren, listToMenuTree } from "@/views/menu/utils/tree";

const { findMenuListInterface } = api;

function normalizeToLoginMenuTree(list: MenuRow[]): LoginMenuItem[] {
  if (!list.length) {
    return [];
  }
  if (hasNestedChildren(list)) {
    return list as unknown as LoginMenuItem[];
  }
  return listToMenuTree(list) as unknown as LoginMenuItem[];
}

/**
 * 解析登录后用于路由/侧栏的菜单：
 * - 超级管理员（角色 id = 1）：拉取全部菜单
 * - 其他角色：使用登录接口返回的 menus
 */
export async function resolveLoginMenus(
  roleId: string | number | null | undefined,
  loginMenus?: LoginMenuItem[] | null,
): Promise<LoginMenuItem[]> {
  if (isSuperAdmin(roleId)) {
    try {
      const res = await findMenuListInterface({});
      if (res?.code === 200 || res?.code === 201) {
        const list = Array.isArray(res.data) ? res.data : [];
        return normalizeToLoginMenuTree(list as MenuRow[]);
      }
    } catch {
      // 回退到登录接口返回的菜单
    }
  }
  return loginMenus ?? [];
}
