<template>
  <a-modal
    :open="props.visible"
    title="添加 AI 模型"
    @ok="handleSubmit"
    @cancel="handleClose"
    ok-text="提交"
    cancel-text="取消"
  >
    <a-form :model="submitForm" :rules="formRules" ref="formRef" layout="vertical">
      <a-form-item label="服务商" name="provider">
        <a-select
          v-model:value="submitForm.provider"
          placeholder="请选择或输入服务商"
          show-search
          allow-clear
          :options="providerOptions"
        />
      </a-form-item>
      <a-form-item label="模型编码" name="modelCode">
        <a-input v-model:value="submitForm.modelCode" placeholder="系统内部模型编码" />
      </a-form-item>
      <a-form-item label="API 模型名" name="apiModelName">
        <a-input v-model:value="submitForm.apiModelName" placeholder="传给上游的模型名" />
      </a-form-item>
      <a-form-item label="模型类型" name="modelType">
        <a-select v-model:value="submitForm.modelType" placeholder="请选择模型类型">
          <a-select-option value="text">文本</a-select-option>
          <a-select-option value="image">图片</a-select-option>
          <a-select-option value="vision">视觉</a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item label="Base URL" name="baseUrl">
        <a-input v-model:value="submitForm.baseUrl" placeholder="可选，建议优先使用服务商配置" />
      </a-form-item>
      <a-form-item label="排序" name="sort">
        <a-input-number v-model:value="submitForm.sort" :min="0" style="width: 100%" />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script lang="ts" setup>
import { computed, reactive, ref, watch } from "vue";
import type { FormInstance } from "ant-design-vue";
import api from "@/api/apiList";
import { message } from "ant-design-vue";

const { addAiModelInterface } = api;

interface PropsType {
  visible: boolean;
  providerList: string[];
}

const props = defineProps<PropsType>();
const emits = defineEmits<{ close: [] }>();

const formRef = ref<FormInstance>();

const submitForm = reactive({
  provider: "",
  modelCode: "",
  apiModelName: "",
  modelType: "text",
  baseUrl: "",
  sort: 100,
});

const providerOptions = computed(() =>
  (props.providerList ?? []).map((p) => ({ label: p, value: p })),
);

const formRules = {
  provider: [{ required: true, message: "请选择服务商", trigger: "change" }],
  modelCode: [{ required: true, message: "请输入模型编码", trigger: "blur" }],
  apiModelName: [{ required: true, message: "请输入 API 模型名", trigger: "blur" }],
  modelType: [{ required: true, message: "请选择模型类型", trigger: "change" }],
};

watch(
  () => props.visible,
  (visible) => {
    if (!visible) resetForm();
  },
);

const resetForm = () => {
  submitForm.provider = "";
  submitForm.modelCode = "";
  submitForm.apiModelName = "";
  submitForm.modelType = "text";
  submitForm.baseUrl = "";
  submitForm.sort = 100;
};

const handleClose = () => {
  emits("close");
};

const handleSubmit = async () => {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }
  const res = await addAiModelInterface({
    provider: submitForm.provider.trim(),
    modelCode: submitForm.modelCode.trim(),
    apiModelName: submitForm.apiModelName.trim(),
    modelType: submitForm.modelType,
    baseUrl: submitForm.baseUrl?.trim() || undefined,
    sort: submitForm.sort,
  });
  if (res?.code === 200 || res?.code === 201) {
    message.success(res?.message || "添加成功");
    resetForm();
    handleClose();
  } else {
    message.error(res?.message || "添加失败");
  }
};
</script>
