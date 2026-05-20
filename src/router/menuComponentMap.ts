import type { RouteRecordRaw } from "vue-router";
import type { LoginMenuItem } from "@/types/auth.type";

type LazyComponent = RouteRecordRaw["component"];

/** 菜单 code -> 页面组件（优先匹配） */
export const MENU_CODE_COMPONENT_MAP: Record<string, LazyComponent> = {
  "system.user": () => import("@/views/user/index.vue"),
  "system.role": () => import("@/views/role/index.vue"),
  "system.menu": () => import("@/views/menu/index.vue"),
  "system.operation": () => import("@/views/record/index.vue"),
  "model.config": () => import("@/views/model/index.vue"),
  "model.ai": () => import("@/views/aiModelConfig/index.vue"),
  "model.key": () => import("@/views/key/index.vue"),
  "record.usage": () => import("@/views/usage/index.vue"),
  "record.history": () => import("@/views/history-record/index.vue"),
  "system.schedule": () => import("@/views/schedule/index.vue"),
};

/** 菜单 path -> 页面组件（兜底） */
export const MENU_PATH_COMPONENT_MAP: Record<string, LazyComponent> = {
  "/system/user": () => import("@/views/user/index.vue"),
  "/system/role": () => import("@/views/role/index.vue"),
  "/system/menu": () => import("@/views/menu/index.vue"),
  "/system/operation": () => import("@/views/record/index.vue"),
  "/model/config": () => import("@/views/model/index.vue"),
  "/model/ai": () => import("@/views/aiModelConfig/index.vue"),
  "/model/key": () => import("@/views/key/index.vue"),
  "/record/usage": () => import("@/views/usage/index.vue"),
  "/record/history": () => import("@/views/history-record/index.vue"),
  "/system/schedule": () => import("@/views/schedule/index.vue"),
  // 兼容旧路径
  "/user": () => import("@/views/user/index.vue"),
  "/role": () => import("@/views/role/index.vue"),
  "/menu": () => import("@/views/menu/index.vue"),
  "/record": () => import("@/views/record/index.vue"),
  "/model": () => import("@/views/model/index.vue"),
  "/usage": () => import("@/views/usage/index.vue"),
  "/key": () => import("@/views/key/index.vue"),
  "/schedule": () => import("@/views/schedule/index.vue"),
  "/aiModelConfig": () => import("@/views/aiModelConfig/index.vue"),
  "/historyRecord": () => import("@/views/history-record/index.vue"),
};

export function normalizeMenuPath(path: string): string {
  if (!path) return "";
  return path.startsWith("/") ? path : `/${path}`;
}

export function resolveMenuComponent(
  menu: LoginMenuItem,
): LazyComponent | undefined {
  const normalizedPath = normalizeMenuPath(menu.path);
  return (
    MENU_CODE_COMPONENT_MAP[menu.code] ??
    MENU_PATH_COMPONENT_MAP[normalizedPath]
  );
}
