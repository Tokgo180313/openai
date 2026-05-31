<template>
  <a-layout class="layout-container">
    <a-layout-sider
      v-if="!isMobile"
      :width="asideWidth"
      class="aside-container"
    >
      <div class="main-sider">
        <SideBar @collapsed-change="handleCollapsedChange"></SideBar>
      </div>
    </a-layout-sider>
    <a-layout class="main-layout">
      <a-layout-header class="layout-header">
        <Headerbar
          :show-menu-button="isMobile"
          @toggle-menu="toggleMobileDrawer"
        ></Headerbar>
      </a-layout-header>
      <a-layout-content class="content-area">
        <router-view></router-view>
      </a-layout-content>
    </a-layout>
    <a-drawer
      v-if="isMobile"
      v-model:open="mobileDrawerVisible"
      placement="left"
      :width="280"
      :closable="true"
      :body-style="{ padding: 0, overflow: 'hidden' }"
      class="mobile-sider-drawer"
    >
      <SideBar embedded @navigate="closeMobileDrawer"></SideBar>
    </a-drawer>
  </a-layout>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import SideBar from "./SideBar.vue";
import Headerbar from "./Headerbar.vue";
import { useBreakpoint } from "@/hooks/useBreakpoint";

const { isMobile } = useBreakpoint();
const route = useRoute();
const isCollapsed = ref(false);
const mobileDrawerVisible = ref(false);

const handleCollapsedChange = function (value: boolean) {
  isCollapsed.value = value;
};

const asideWidth = computed(() => {
  return isCollapsed.value ? "60px" : "200px";
});

const toggleMobileDrawer = () => {
  mobileDrawerVisible.value = !mobileDrawerVisible.value;
};

const closeMobileDrawer = () => {
  mobileDrawerVisible.value = false;
};

watch(
  () => route.path,
  () => {
    mobileDrawerVisible.value = false;
  },
);

watch(isMobile, (mobile) => {
  if (!mobile) {
    mobileDrawerVisible.value = false;
  }
});
</script>

<style scoped lang="scss">
.layout-container {
  height: 100vh;
  display: flex;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
}

.aside-container {
  background: #f9f9f9;
  color: #000;
  height: 100vh;
  overflow: hidden;
  flex-shrink: 0;

  :deep(.ant-layout-sider-children) {
    height: 100%;
    overflow: hidden;
  }
}

.main-sider {
  height: 100%;
  overflow: hidden;
}

.main-layout {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.layout-header {
  background: #fff;
  padding: 0 2px;
  border-bottom: 1px solid lightgray;
  flex-shrink: 0;
  line-height: normal;
  height: auto;
}

.content-area {
  flex: 1;
  min-height: 0;
  min-width: 0;
  padding: 20px;
  overflow: auto;
  background: #fff;
}

@media screen and (max-width: 768px) {
  .content-area {
    padding: 12px 8px;
  }
}

:deep(.mobile-sider-drawer .ant-drawer-body) {
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
