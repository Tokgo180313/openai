<template>
  <div class="main-container">
    <div class="system-setting">
      <a-select
        v-model:value="questionType"
        :bordered="false"
        @change="handleQuestionTypeChange"
        style="min-width: 300px"
      >
        <a-select-option
          v-for="item in modelList"
          :key="item.id"
          :title="item.modelName"
          :value="item.modelName"
        >
        </a-select-option>
      </a-select>
    </div>
    <div class="system-operation">
      <a-tooltip title="分享" placement="bottom">
        <i
          style="margin: 0 1em; cursor: pointer"
          class="iconfont icon-daochu"
        ></i>
      </a-tooltip>
      <a-tooltip title="删除" placement="bottom">
        <i
          style="margin: 0 1em; cursor: pointer"
          class="iconfont icon-shanchu"
          @click="showRemoveEvent"
        ></i>
      </a-tooltip>
    </div>
  </div>
  <RemoveChatDialog
    :visible="showRemoveDialog"
    :titleId="removeChatTitleId"
    @close-modal="handleCloseModal"
    @update-list="handleUpdateList"
  ></RemoveChatDialog>
</template>

<script lang="ts" setup>
import { ref, computed } from "vue";
import { useRequestStore } from "../stores/requestStore";
import RemoveChatDialog from "../components/RemoveChatDialog.vue";
import { storeToRefs } from "pinia";
import {useModelStore} from "@/stores/modelStore";
const modelStore = useModelStore();
import { useChatStore } from "@/stores/chatStore";
import { useEventsBus } from "@/stores/event-bus";
const eventBus = useEventsBus();
const chatStore = useChatStore();
const questionType = ref(modelStore.getCurrentModel|| null);
const showRemoveDialog = ref(false);
const store = useRequestStore();
const { id } = storeToRefs(store);
const modelList = computed(() => modelStore.getChatModelList);
const handleQuestionTypeChange = function () {
  useRequestStore().updateQuestionTye(questionType.value);
  modelStore.setCurrentModel(questionType.value);
  const model = modelList.value.find(
    (item) => item.modelName === questionType.value,
  );
  modelStore.setCurrentModelClassify(model?.modelClassify ?? null);
};
const removeChatTitleId = ref(null);
const showRemoveEvent = function () {
  showRemoveDialog.value = true;
  removeChatTitleId.value = chatStore.getTitleId;
};
const handleCloseModal = function () {
  showRemoveDialog.value = false;
  removeChatTitleId.value = null;
};
const handleUpdateList = function () {
  chatStore.updateTitleId(null);
  eventBus.emit("update-chat-list");
};
</script>

<style scoped lang="scss">
.iconfont {
  font-size: 0.8rem;
}
.main-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1em;
}
.system-operation {
  text-align: right;
  margin-right: 1em;
}
.system-setting {
  text-align: left;
}
.option-item {
  display: flex;
  justify-content: flex-start;
  width: 120px;
  .item-icon {
    margin: 0 1em;
  }
}
</style>
