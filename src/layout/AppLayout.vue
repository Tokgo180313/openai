<template>
  <a-layout class="layout-container">
    <a-layout-sider :width="asideWidth" class="aside-container">
      <div class="main-sider">
        <SideBar @collapsed-change="handleCollapsedChange"></SideBar>
      </div>
    </a-layout-sider>
    <a-layout class="main-layout">
      <a-layout-header
        style="
          background: #fff;
          padding: 0 2px;
          border-bottom: 1px solid lightgray;
        "
        >header</a-layout-header
      >
      <a-layout-content class="content-area">
        <!-- 子路由出口 -->
        <router-view></router-view>
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import SideBar from "./SideBar.vue";
const isCollapsed = ref(false);
const handleCollapsedChange = function(value){
  isCollapsed.value = value
}
const asideWidth = computed(() => {
  return isCollapsed.value ? "60px" : "200px";
});
</script>

<style scoped lang="scss">
.layout-container {
  height: 100vh;
  display: flex;
  width: 100vw;
}
.aside-container {
  background: #f9f9f9;
  color: #000;
}
.main-layout {
  flex: 1;
  display: flex;
  flex-direction: column;
  // min-height: 0;
}
.content-area {
  flex: 1;
  padding: 20px;
  height: 100%;
  overflow: auto;
  // min-height: 0;
  background: #fff;
}

</style>
