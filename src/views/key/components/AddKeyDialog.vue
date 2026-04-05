<template>
  <a-modal
    :open="props.visible"
    title="新增Key"
    @ok="handleSubmit"
    @cancel="handleClose"
    ok-text="提交"
    cancel-text="取消"
  >
    <a-form :model="submitForm" :rules="formRules" ref="formRef">
      <a-form-item label="模型分类" name="modelClassify">
        <a-input v-model:value="submitForm.modelClassify" />
      </a-form-item>
      <a-form-item label="BaseURL" name="baseURL">
        <a-input v-model:value="submitForm.baseURL" />
      </a-form-item>
      <a-form-item label="ApiKey" name="apiKey">
        <a-input v-model:value="submitForm.apiKey" />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { defineEmits, defineProps, reactive, ref } from "vue";
import api from "@/api/apiList";
import { message } from "ant-design-vue";

let { addKeyInterface } = api;

interface PropsType {
  visible: boolean;
}

const props = defineProps<PropsType>();
const emits = defineEmits(["close"]);

const formRef = ref();

interface SubmitFormType {
  modelClassify: string;
  baseURL: string;
  apiKey: string;
}

const submitForm = reactive<SubmitFormType>({
  modelClassify: "",
  baseURL: "",
  apiKey: "",
});

const formRules = {
  modelClassify: [
    { required: true, message: "请输入模型分类", trigger: "blur" },
  ],
  // baseURL 允许为空（后端按空值处理）
  apiKey: [{ required: true, message: "请输入ApiKey", trigger: "blur" }],
};

const resetForm = () => {
  submitForm.modelClassify = "";
  submitForm.baseURL = "";
  submitForm.apiKey = "";
};

const handleClose = () => {
  emits("close");
};

const handleSubmit = () => {
  addKeyInterface(submitForm)
    .then((res: any) => {
      if (res?.code === 200 || res?.code === 201) {
        message.success(res?.message || "添加成功");
        resetForm();
        handleClose();
      } else {
        message.error(res?.message || "添加失败");
      }
    })
    .catch((e) => {
      console.error(e);
      message.error("添加失败，请稍后重试");
    });
};
</script>

<style scoped lang="scss"></style>

