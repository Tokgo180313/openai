<template>
  <a-modal :open="props.visible" title="添加模型" @ok="handleSubmit" @cancel="handleClose" ok-text="提交" cancel-text="取消">
    <a-form :model="submitForm" :rules="formRules" ref="formRef">
      <a-form-item label="模型名称" name="modelName">
        <a-input v-model:value="submitForm.modelName"></a-input>
      </a-form-item>
      <a-form-item label="模型分类" name="modelClassify">
        <a-input v-model:value="submitForm.modelClassify"></a-input>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script lang="ts" setup>
import { computed, defineProps, reactive, ref } from "vue";
import api from "@/api/apiList";
let { addModelInterface } = api;
import { message } from "ant-design-vue";

const emits = defineEmits(["close"]);
const handleClose = () => {
  emits("close");
};
interface PropsType {
  visible: boolean;
}
const props = defineProps<PropsType>();
interface submitFormType {
  modelName: string;
  modelClassify: string;
}
const submitForm = ref<submitFormType>({
  modelName: null,
  modelClassify: null,
});
const formRules = ref({
  modelName: [{ required: true, message: "请输入模型名称", trigger: "blur" }],
  modelClassify: [
    { required: true, message: "请输入模型分类", trigger: "blur" },
  ],
});
const handleSubmit = () => {
  addModelInterface(submitForm.value).then((res) => {
    if (res.code === 200) {
      handleClose();
      message.success("添加成功");
      resetForm();
    } else {
      message.error(res.message || "添加失败");
    }
  });
};
const resetForm = () => {
  submitForm.value = {
    modelName: null,
    modelClassify: null,
  };
};
</script>
<style scoped lang="scss"></style>
