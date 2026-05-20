import type { Router, RouteRecordRaw } from "vue-router";
import type { LoginMenuItem } from "@/types/auth.type";
import {
  normalizeMenuPath,
  resolveMenuComponent,
} from "./menuComponentMap";

export const MANAGE_ROUTE_PARENT = "Manage";

const addedRouteNames = new Set<string>();

export function menusToRouteRecords(menus: LoginMenuItem[]): RouteRecordRaw[] {
  const records: RouteRecordRaw[] = [];

  const walk = (items: LoginMenuItem[]) => {
    for (const item of items) {
      if (item.type === 1 && item.path) {
        const component = resolveMenuComponent(item);
        const path = normalizeMenuPath(item.path);
        const name = `menu-${item.code}`;

        if (component) {
          records.push({
            path,
            name,
            component,
            meta: {
              title: item.name,
              icon: item.icon,
              menuCode: item.code,
              menuId: item.id,
              requiredAuth: true,
            },
          });
        } else {
          console.warn(
            `[router] 未找到菜单对应页面组件: code=${item.code}, path=${path}`,
          );
        }
      }
      if (item.children?.length) {
        walk(item.children);
      }
    }
  };

  walk(menus);
  return records;
}

export function setupManageRoutes(router: Router, menus: LoginMenuItem[]) {
  resetManageRoutes(router);

  const records = menusToRouteRecords(menus);
  for (const record of records) {
    router.addRoute(MANAGE_ROUTE_PARENT, record);
    if (record.name) {
      addedRouteNames.add(record.name as string);
    }
  }
}

export function resetManageRoutes(router: Router) {
  addedRouteNames.forEach((name) => {
    router.removeRoute(name);
  });
  addedRouteNames.clear();
}

export function getFirstMenuPath(menus: LoginMenuItem[]): string | null {
  for (const item of menus) {
    if (item.type === 1 && item.path) {
      return normalizeMenuPath(item.path);
    }
    if (item.children?.length) {
      const childPath = getFirstMenuPath(item.children);
      if (childPath) {
        return childPath;
      }
    }
  }
  return null;
}

export function hasManageMenus(menus: LoginMenuItem[] | null | undefined): boolean {
  return getFirstMenuPath(menus ?? []) != null;
}
