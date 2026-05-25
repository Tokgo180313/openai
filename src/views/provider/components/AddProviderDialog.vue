<template>
  <a-modal
    :open="props.visible"
    title="新增服务商"
    @ok="handleSubmit"
    @cancel="handleClose"
    ok-text="提交"
    cancel-text="取消"
  >
    <a-form :model="submitForm" :rules="formRules" ref="formRef">
      <a-form-item label="服务商" name="provider">
        <a-input v-model:value="submitForm.provider" />
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

let { addProviderInterface } = api;

interface PropsType {
  visible: boolean;
}

const props = defineProps<PropsType>();
const emits = defineEmits(["close"]);

const formRef = ref();

interface SubmitFormType {
  provider: string;
  baseURL: string;
  apiKey: string;
}

import type { FormRulesMap } from "@/types/form-rules";

const submitForm = reactive<SubmitFormType>({
  provider: "",
  baseURL: "",
  apiKey: "",
});

const formRules: FormRulesMap = {
  provider: [{ required: true, message: "请输入服务商", trigger: "blur" }],
  baseURL: [{ required: true, message: "请输入BaseURL", trigger: "blur" }],
  apiKey: [{ required: true, message: "请输入ApiKey", trigger: "blur" }],
};

const resetForm = () => {
  submitForm.provider = "";
  submitForm.baseURL = "";
  submitForm.apiKey = "";
};

const handleClose = () => {
  emits("close");
};

const handleSubmit = () => {
  addProviderInterface(submitForm)
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
