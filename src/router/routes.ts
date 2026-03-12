import type { RouteRecordRaw } from "vue-router";
import AppLayout from "../layout/AppLayout.vue";
import ManageLayout from "../layout/ManageLayout.vue";
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
      roleId: ["2"],
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
    path: "/manage",
    name: "/manage",
    title: "管理",
    component: ManageLayout,
    children: [
      {
        path: "/user",
        name: "/user",
        title: "用户管理",
        component: () => import("@/views/user/index.vue"),
        meta: {
          title: "用户管理",
          icon: "iconfont icon-yonghuguanli",
        },
      },
      {
        path: "/model",
        name: "/model",
        title: "模型管理",
        component: () => import("@/views/model/index.vue"),
        meta: {
          title: "模型管理",
          icon: "iconfont icon-shujumoxingguanli",
        },
      },
      {
        path: "/record",
        name: "/record",
        title: "操作日志",
        component: () => import("@/views/record/index.vue"),
        meta: {
          title: "操作日志",
          icon: "iconfont icon-keyguanli",
        },
      },
      {
        path: "/role",
        name: "/role",
        title: "角色管理",
        component: () => import("@/views/role/index.vue"),
        meta: {
          title: "角色管理",
          icon: "iconfont icon-role",
        },
      },
    ],
    meta: {
      title: "用户管理",
      requiredAuth: true,
      roleId: ["1", "0"],
    },
  },
];

export default routes;
