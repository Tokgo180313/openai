<template>
  <a-modal
    :open="props.visible"
    title="编辑服务商"
    @ok="handleSubmit"
    @cancel="handleClose"
    ok-text="确认"
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
import { defineEmits, defineProps, reactive, ref, watch } from "vue";
import api from "@/api/apiList";
import { message } from "ant-design-vue";

let { updateByIdInterface } = api;

interface ProviderType {
  id: string;
  provider: string;
  baseURL: string;
  updatedAt?: string;
  apiKey?: string;
}

interface PropsType {
  visible: boolean;
  row: ProviderType | null;
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
};

const resetForm = () => {
  submitForm.provider = "";
  submitForm.baseURL = "";
  submitForm.apiKey = "";
};

watch(
  () => props.row,
  (val) => {
    if (!val) return;
    submitForm.provider = val.provider || "";
    submitForm.baseURL = val.baseURL || "";
    submitForm.apiKey = val.apiKey || "";
  },
  { immediate: true },
);

const handleClose = () => {
  emits("close");
};

const handleSubmit = () => {
  if (!props.row?.id) {
    message.error("缺少要编辑的服务商 id");
    return;
  }

  const dto = {
    provider: submitForm.provider,
    baseURL: submitForm.baseURL,
  };

  updateByIdInterface({ id: props.row.id, dto })
    .then((res: any) => {
      if (res?.code === 200 || res?.code === 201) {
        message.success(res?.message || "更新成功");
        resetForm();
        handleClose();
      } else {
        message.error(res?.message || "更新失败");
      }
    })
    .catch((e: any) => {
      console.error(e);
      message.error("更新失败，请稍后重试");
    });
};
</script>

<style scoped lang="scss"></style>
