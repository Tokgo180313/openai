import type { RouteRecordRaw } from "vue-router";
import AppLayout from "../layout/AppLayout.vue";
const routes: RouteRecordRaw[] = [
  {
    path: "/",
    component: AppLayout,
    name:"Home",
    children: [
      {
        path: "/chat",
        name: "/chat",
        title: "首页",
        component: () => import("@/views/chat/index.vue"),
      },
    ],
  },
  {
    path: "/login",
    name: "/login",
    title: "登陆",
    component: () => import("@/views/login/index.vue"),
  },
  {
    path:"/user",
    name:"/user",
    title:"用户管理",
    component:()=>import("@/views/user/index.vue")
  }
];
export default routes;
