<template>
  <a-modal
    @ok="confirmEvent"
    @cancel="cancelEvent"
    v-model:open="openModal"
    title="退出登录"
    cancel-text="取消"
    ok-text="确认"
  >
    <div class="content">是否确认退出登录？</div>
  </a-modal>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/authStore";
import { resetManageRoutes } from "@/router/dynamicRoutes";
interface Props {
  visible: boolean;
}
const router = useRouter();
const userStore = useAuthStore();
const props = defineProps<Props>();
const emits = defineEmits(["close-modal"]);

let openModal = computed(() => props.visible);
const confirmEvent = function () {
  sessionStorage.clear();
  userStore.clearToken();
  resetManageRoutes(router);
  router.replace("/login");
};
const cancelEvent = function () {
  emits("close-modal");
};
</script>

<style scoped lang="scss"></style>
