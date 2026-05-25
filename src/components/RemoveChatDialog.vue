<template>
  <a-modal
    v-model:open="openModal"
    title="永久删除聊天"
    cancel-text="取消"
    ok-text="确认"
    @ok="confirmRemoveEvent"
    @cancel="closeModelEvent"
  >
    <p>删除后，该对话将永久不再恢复，确认删除吗？</p>
  </a-modal>
</template>
<script lang="ts" setup>
import { computed } from "vue";
import apiList from "@/api/apiList";
import { message } from "ant-design-vue";
const { removeChatInterface } = apiList;
interface Props {
  visible:boolean,
  titleId:string,
}
const props = defineProps<Props>();
const openModal = computed(() => props.visible);
const emit = defineEmits(["close-modal", "update-list"]);
const closeModelEvent = function () {
  emit("close-modal");
};
const confirmRemoveEvent = function () {
  removeChatInterface({ titleId: props.titleId }).then((res:any) => {
    if (res.code === 200) {
      message.success(res.message);
      closeModelEvent();
      emit("update-list");
    } else {
      message.error(res.message);
    }
  });
};
</script>

<style scoped lang="scss"></style>
