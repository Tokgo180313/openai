import type { RouteRecordRaw } from "vue-router";
import AppLayout from "../layout/AppLayout.vue";
import ManageLayout from "../layout/ManageLayout.vue";
import { ROLE } from "@/constants/role";
import { MANAGE_ROUTE_PARENT } from "./dynamicRoutes";

/** 前台固定路由：所有登录用户均可使用 */
const routes: RouteRecordRaw[] = [
  {
    path: "/",
    component: AppLayout,
    name: "Home",
    children: [
      {
        path: "/chat",
        name: "/chat",
        meta: { title: "首页" },
        component: () => import("@/views/chat/index.vue"),
      },
      {
        path: "/image",
        name: "/image",
        meta: { title: "图片" },
        component: () => import("@/views/image/index.vue"),
      },
      {
        path: "/imageTask",
        name: "/imageTask",
        meta: { title: "图片任务" },
        component: () => import("@/views/imageTask/index.vue"),
      },
    ],
    meta: {
      title: "首页",
      requiredAuth: true,
      roleId: [ROLE.NORMAL_USER],
    },
  },
  {
    path: "/login",
    name: "/login",
    component: () => import("@/views/login/index.vue"),
    meta: {
      title: "登录",
      requiredAuth: false,
    },
  },
  {
    path: "/manage",
    name: MANAGE_ROUTE_PARENT,
    component: ManageLayout,
    children: [],
    meta: {
      title: "管理",
      requiredAuth: true,
    },
  },
];

export default routes;
