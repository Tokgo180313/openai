<template>
  <template v-for="item in menus" :key="item.id">
    <a-sub-menu v-if="isDirectory(item)" :key="`dir-${item.id}`">
      <template #title>
        <span class="menu-title">
          <i v-if="item.icon" :class="item.icon"></i>
          <span>{{ item.name }}</span>
        </span>
      </template>
      <ManageSideMenu :menus="item.children" />
    </a-sub-menu>
    <a-menu-item
      v-else-if="item.type === 1 && item.path"
      :key="normalizeMenuPath(item.path)"
    >
      <template #icon>
        <i v-if="item.icon" :class="item.icon"></i>
      </template>
      <span>{{ item.name }}</span>
    </a-menu-item>
  </template>
</template>

<script setup lang="ts">
import type { LoginMenuItem } from "@/types/auth.type";
import { normalizeMenuPath } from "@/router/menuComponentMap";
import ManageSideMenu from "./ManageSideMenu.vue";

defineOptions({ name: "ManageSideMenu" });

defineProps<{
  menus: LoginMenuItem[];
}>();

function isDirectory(item: LoginMenuItem): boolean {
  return (
    item.type === 0 &&
    Array.isArray(item.children) &&
    item.children.length > 0
  );
}
</script>

<style scoped lang="scss">
.menu-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
</style>
