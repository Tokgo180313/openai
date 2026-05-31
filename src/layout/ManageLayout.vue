<template>
  <a-layout class="manage-layout">
    <a-layout-sider
      v-model:collapsed="collapsed"
      collapsible
      class="manage-sider"
    >
      <div class="logo" :class="{ 'logo-collapsed': collapsed }">
        <i class="iconfont icon-gpt"></i>
        <span v-if="!collapsed" class="logo-text">后台管理</span>
      </div>

      <div class="sider-menu-scroll">
        <a-menu
          v-model:selectedKeys="selectedKeys"
          v-model:openKeys="openKeys"
          theme="dark"
          mode="inline"
          :inline-collapsed="collapsed"
          @click="handleMenuClick"
        >
          <ManageSideMenu v-if="menus.length" :menus="menus" />
          <a-menu-item v-else disabled key="empty">暂无菜单权限</a-menu-item>
        </a-menu>
      </div>
    </a-layout-sider>
    <a-layout class="manage-main">
      <a-layout-header style="background: #fff; padding: 0">
        <ManageHeader />
      </a-layout-header>
      <a-layout-content class="manage-content">
        <a-breadcrumb style="margin: 16px 0">
          <a-breadcrumb-item>{{
            (route.meta.title as string) || "管理"
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
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { MenuProps } from "ant-design-vue";
import ManageHeader from "./ManageHeader.vue";
import ManageSideMenu from "./components/ManageSideMenu.vue";
import { useAuthStore } from "@/stores/authStore";
import type { LoginMenuItem } from "@/types/auth.type";

const collapsed = ref<boolean>(false);
const selectedKeys = ref<string[]>([]);
const expandedOpenKeys = ref<string[]>([]);
const openKeys = computed({
  get: () => (collapsed.value ? [] : expandedOpenKeys.value),
  set: (keys) => {
    if (!collapsed.value) {
      expandedOpenKeys.value = keys;
    }
  },
});

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const menus = computed(() => authStore.getMenus);

function collectDirectoryOpenKeys(
  items: LoginMenuItem[],
  keys: string[] = [],
): string[] {
  for (const item of items) {
    if (item.type === 0 && item.children?.length) {
      keys.push(`dir-${item.id}`);
      collectDirectoryOpenKeys(item.children, keys);
    }
  }
  return keys;
}

function syncMenuState(path: string) {
  selectedKeys.value = path ? [path] : [];
  if (
    !collapsed.value &&
    !expandedOpenKeys.value.length &&
    menus.value.length
  ) {
    expandedOpenKeys.value = collectDirectoryOpenKeys(menus.value);
  }
}

watch(
  () => route.path,
  (path) => {
    syncMenuState(path);
  },
  { immediate: true },
);

watch(menus, (list) => {
  if (list.length && !collapsed.value) {
    expandedOpenKeys.value = collectDirectoryOpenKeys(list);
  }
});

watch(collapsed, (isCollapsed) => {
  if (!isCollapsed && menus.value.length) {
    expandedOpenKeys.value = collectDirectoryOpenKeys(menus.value);
  }
});

const handleMenuClick: MenuProps["onClick"] = ({ key }) => {
  const path = String(key);
  if (!path.startsWith("/")) {
    return;
  }
  router.push(path);
};
</script>

<style lang="scss" scoped>
.manage-layout {
  height: 100vh;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  text-align: left;
}

.manage-sider {
  height: 100vh;
  overflow: hidden;

  :deep(.ant-layout-sider-children) {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  &.ant-layout-sider-collapsed {
    :deep(.ant-menu-inline .ant-menu-sub.ant-menu-inline) {
      display: none !important;
    }
  }
}

.sider-menu-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.manage-main {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.manage-content {
  flex: 1;
  min-height: 0;
  margin: 0 16px;
  overflow-y: auto;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 32px;
  margin: 16px;
  background: rgba(255, 255, 255, 0.3);
  line-height: 32px;
  text-align: center;
  overflow: hidden;
  white-space: nowrap;

  &.logo-collapsed {
    padding: 0;
  }

  .logo-text {
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.site-layout-background {
  background: #fff;
  width: 100%;
  box-sizing: border-box;
  overflow-x: auto;
}

.site-layout-background > :deep(*) {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

@media screen and (max-width: 768px) {
  .site-layout-background {
    padding: 12px;
  }
}
</style>
