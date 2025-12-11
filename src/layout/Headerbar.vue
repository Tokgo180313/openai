<template>
  <div class="main-container">
    <div class="system-setting">
      <a-select v-model:value="questionType" :bordered="false" @change="handleQuestionTypeChange">
        <a-select-option value="deepseek" title="DeepSeek" >
          <div class="option-item">
            <div class="item-icon">
              <i class="iconfont icon-deepseek"></i>
            </div>
            <div class="item-text">DeepSeek</div>
          </div>
        </a-select-option>
        <a-select-option value="chatgpt" title="ChatGpt">
          <div class="option-item">
            <div class="item-icon">
              <i class="iconfont icon-chatgpt"></i>
            </div>
            <div class="item-text">ChatGpt</div>
          </div>
        </a-select-option>
      </a-select>
    </div>
    <div class="system-operation">
        <a-tooltip title="分享" placement="bottom">
            <i style="margin:0 1em;cursor: pointer;" class="iconfont icon-daochu"></i>
        </a-tooltip>
        <a-tooltip title="删除" placement="bottom">
            <i style="margin:0 1em;cursor: pointer;" class="iconfont icon-shanchu"></i>
        </a-tooltip>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { useRequestStore } from "../stores/requestStore";
const questionType = ref("chatgpt");
const handleQuestionTypeChange = function(){
    useRequestStore().updateQuestionTye(questionType.value)
}
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
