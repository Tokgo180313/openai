<template>
  <a-layout style="min-height: 100vh; min-width: 100vw; text-align: left">
    <a-layout-sider v-model:collapsed="collapsed" collapsible>
      <div class="logo"> <i class="iconfont icon-gpt"></i> 后台管理</div>

      <a-menu v-model:selectedKeys="selectedKeys" theme="dark" mode="inline">
        <a-menu-item
          v-for="menu in routerList"
          :key="menu.path"
          @click="selectedKeysChange(menu.path)"
        >
          <template #icon>
            <i :class="menu.meta.icon"></i>
            <!-- 直接使用字符串名称 -->
          </template>
          <span> {{ menu.title }}</span>
        </a-menu-item>
      </a-menu>
    </a-layout-sider>
    <a-layout>
      <a-layout-header style="background: #fff; padding: 0" >
        <ManageHeader />
      </a-layout-header>
      <a-layout-content style="margin: 0 16px">
        <a-breadcrumb style="margin: 16px 0">
          <a-breadcrumb-item>{{
            router.currentRoute.value.meta.title
          }}</a-breadcrumb-item>
        </a-breadcrumb>
        <div
          class="site-layout-background"
          style="
            padding: 24px;
            min-height: 360px;
            width: 100%;
            overflow-x: auto;
          "
        >
          <router-view />
        </div>
      </a-layout-content>
      <a-layout-footer style="text-align: center">
        Ant Design ©2018 Created by Ant UED
      </a-layout-footer>
    </a-layout>
  </a-layout>
</template>
<script lang="ts" setup>
import ManageHeader from "./ManageHeader.vue";
import {
  PieChartOutlined,
  DesktopOutlined,
  UserOutlined,
  TeamOutlined,
  FileOutlined,
} from "@ant-design/icons-vue";
import { ref, h } from "vue";
const collapsed = ref<boolean>(false);
const selectedKeys = ref<string[]>(["/user"]);
import { useRouter } from "vue-router";
const router = useRouter();
const itemName = ref(router.currentRoute.value.meta.title);
const routerList =
  router.getRoutes().find((item) => item.path === "/manage")?.children || [];
console.log(routerList);
const selectedKeysChange = (path: string) => {
  selectedKeys.value = [path];
  router.push(path);
  itemName.value = router.currentRoute.value.meta.title;
};
</script>
<style lang="scss" scoped>
.logo {
  height: 32px;
  margin: 16px;
  background: rgba(255, 255, 255, 0.3);
  line-height: 32px;
  text-align: center;
}
/* 移除或修改现有样式 */
#components-layout-demo-side .logo {
  height: 32px;
  margin: 16px;
  background: rgba(255, 255, 255, 0.3);
}

/* 确保内容区域占满剩余宽度 */
.site-layout {
  width: 100%;
}

.site-layout .site-layout-background {
  background: #fff;
  width: 100%;
  box-sizing: border-box;
  /* 添加溢出处理 */
  overflow-x: auto;
}

/* 让 router-view 容器也占满宽度 */
.site-layout-background > :deep(*) {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

/* 响应式处理 */
@media screen and (max-width: 768px) {
  .site-layout-background {
    padding: 12px; /* 小屏幕减少内边距 */
  }
}
</style>
