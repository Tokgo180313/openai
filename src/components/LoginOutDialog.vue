<template>
  <a-modal
    @ok="confirmEvent"
    @cancel="cancelEvent"
    ok-text="确认"
    cancel="取消"
    v-model:open="openModal"
    title="退出登录"
  >
    <div class="content">是否确认退出登录？</div>
  </a-modal>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/authStore";
interface Props {
  visible: boolean;
}
const router = useRouter();
const userStore = useAuthStore();
const props = defineProps<Props>();
const emits = defineEmits(["close-modal"]);

let openModal = computed(() => props.visible);
const confirmEvent = function () {
  userStore.clearToken();
  router.replace("/login");
};
const cancelEvent = function () {
  emits("close-modal");
};
</script>

<style scoped lang="scss"></style>
