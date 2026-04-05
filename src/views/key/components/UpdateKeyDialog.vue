<template>
  <a-modal
    :open="props.visible"
    title="编辑Key"
    @ok="handleSubmit"
    @cancel="handleClose"
    ok-text="确认"
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
import { defineEmits, defineProps, reactive, ref, watch } from "vue";
import api from "@/api/apiList";
import { message } from "ant-design-vue";

let { updateByIdInterface } = api;

interface KeyType {
  id: string;
  modelClassify: string;
  baseURL: string;
  updatedAt?: string;
  apiKey: string;
}

interface PropsType {
  visible: boolean;
  row: KeyType | null;
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
};

const resetForm = () => {
  submitForm.modelClassify = "";
  submitForm.baseURL = "";
  submitForm.apiKey = "";
};

watch(
  () => props.row,
  (val) => {
    if (!val) return;
    submitForm.modelClassify = val.modelClassify || "";
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
    message.error("缺少要编辑的Key id");
    return;
  }

  const dto = {
    modelClassify: submitForm.modelClassify,
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

