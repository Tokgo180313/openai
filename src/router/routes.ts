import type { RouteRecordRaw } from "vue-router";
import AppLayout from "../layout/AppLayout.vue";
const routes: RouteRecordRaw[] = [
  {
    path: "/",
    component: AppLayout,
    name: "Home",
    children: [
      {
        path: "/chat",
        name: "/chat",
        title: "首页",
        component: () => import("@/views/chat/index.vue"),
      },
    ],
    meta: {
      title: "首页",
      requiredAuth: true,
      roleId:['2']
    },
  },
  {
    path: "/login",
    name: "/login",
    title: "登陆",
    component: () => import("@/views/login/index.vue"),
    meta: {
      title: "登录",
      requiredAuth: false,
    },
  },
  {
    path: "/user",
    name: "/user",
    title: "用户管理",
    component: () => import("@/views/user/index.vue"),
    meta: {
      title: "用户管理",
      requiredAuth: true,
      roleId:['1','0']
    },
  },
];

export default routes;
