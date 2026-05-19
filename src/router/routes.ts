import type { RouteRecordRaw } from "vue-router";
import AppLayout from "../layout/AppLayout.vue";
import ManageLayout from "../layout/ManageLayout.vue";
import { ROLE } from "@/constants/role";
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
      {
        path: "/image",
        name: "/image",
        title: "图片",
        component: () => import("@/views/image/index.vue"),
      },
      {
        path: "/imageTask",
        name: "/imageTask",
        title: "图片任务",
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
        path: "/usage",
        name: "/usage",
        title: "使用日志",
        component: () => import("@/views/usage/index.vue"),
        meta: {
          title: "使用日志",
          icon: "iconfont icon-yongliang",
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
      {
        path: "/key",
        name: "/key",
        title: "Key管理",
        component: () => import("@/views/key/index.vue"),
        meta: {
          title: "Key管理",
          icon: "iconfont icon-keyguanli",
        },
      },
      {
        path: "/schedule",
        name: "/schedule",
        title: "定时任务",
        component: () => import("@/views/schedule/index.vue"),
        meta: {
          title: "定时任务",
          icon: "iconfont icon-renwujincheng",
        },
      },
      {
        path: "/aiModelConfig",
        name: "/aiModelConfig",
        title: "AI模型配置",
        component: () => import("@/views/aiModelConfig/index.vue"),
        meta: {
          title: "AI模型配置",
          icon: "iconfont icon-model",
        },
      },
      {
        path: "/historyRecord",
        name: "/historyRecord",
        title: "历史记录",
        component: () => import("@/views/history-record/index.vue"),
        meta: {
          title: "历史记录",
          icon: "iconfont icon-lishijilu",
        },
      }
    ],
    meta: {
      title: "用户管理",
      requiredAuth: true,
      roleId: [ROLE.SUPER_ADMIN, ROLE.ADMIN],
    },
  },
];

export default routes;
