<template>
  <a-modal
    v-model:open="openModal"
    title="永久删除聊天"
    cancle-text="取消"
    ok-text="确认"
    @ok="confirmRemoveEvent"
    @cancel="closeModelEvent"
  >
    <p>删除后，该对话将永久不再恢复，确认删除吗？</p>
  </a-modal>
</template>

<script lang="ts" setup>
import { computed } from "vue";

const props = defineProps({ visible: boolean, id: string });
const openModal = computed(() => props.visible);
const emit = defineEmits(["update-modal"]);
const closeModelEvent = function () {
  emit("update-modal", false);
};
const confirmRemoveEvent = function () {
  console.log(props.id);
  emit("update-modal", false);
};
</script>

<style scoped lang="scss"></style>
