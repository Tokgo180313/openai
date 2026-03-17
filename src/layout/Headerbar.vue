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
    :id="id"
    @update-modal="handleUpdateModal"
  ></RemoveChatDialog>
</template>

<script lang="ts" setup>
import { ref, computed } from "vue";
import { useRequestStore } from "../stores/requestStore";
import RemoveChatDialog from "../components/RemoveChatDialog.vue";
import { storeToRefs } from "pinia";
const questionType = ref("deepseek");
const showRemoveDialog = ref(false);
const store = useRequestStore();
const { id } = storeToRefs(store);
import { useModelStore } from "@/stores/modelStore";
const modelStore = useModelStore();
const modelList = computed(() => modelStore.modelList);
console.log(modelList.value);
const handleQuestionTypeChange = function () {
  useRequestStore().updateQuestionTye(questionType.value);
};
const showRemoveEvent = function () {
  showRemoveDialog.value = true;
};
const handleUpdateModal = function (value) {
  showRemoveDialog.value = value;
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
