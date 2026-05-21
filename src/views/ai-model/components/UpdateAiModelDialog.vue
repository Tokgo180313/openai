<template>
  <a-modal
    :open="props.visible"
    title="编辑 AI 模型"
    @ok="handleSubmit"
    @cancel="handleClose"
    ok-text="保存"
    cancel-text="取消"
    :confirm-loading="submitting"
  >
    <a-form :model="submitForm" :rules="formRules" ref="formRef" layout="vertical">
      <a-form-item label="服务商" name="provider">
        <a-select
          v-model:value="submitForm.provider"
          placeholder="请选择服务商"
          show-search
          allow-clear
          :options="providerOptions"
        />
      </a-form-item>
      <a-form-item label="模型编码" name="modelCode">
        <a-input v-model:value="submitForm.modelCode" />
      </a-form-item>
      <a-form-item label="API 模型名" name="apiModelName">
        <a-input v-model:value="submitForm.apiModelName" />
      </a-form-item>
      <a-form-item label="模型类型" name="modelType">
        <a-select v-model:value="submitForm.modelType" style="width: 100%">
          <a-select-option value="text">文本</a-select-option>
          <a-select-option value="image">图片</a-select-option>
          <a-select-option value="vision">视觉</a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item label="Base URL" name="baseUrl">
        <a-input v-model:value="submitForm.baseUrl" />
      </a-form-item>
      <a-form-item label="排序" name="sort">
        <a-input-number v-model:value="submitForm.sort" :min="0" style="width: 100%" />
      </a-form-item>
      <a-form-item label="状态" name="enabled">
        <a-select v-model:value="submitForm.enabled" style="width: 100%">
          <a-select-option value="1">启用</a-select-option>
          <a-select-option value="0">禁用</a-select-option>
        </a-select>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script lang="ts" setup>
import { computed, reactive, ref, watch } from "vue";
import type { FormInstance } from "ant-design-vue";
import api from "@/api/apiList";
import { message } from "ant-design-vue";
import type { AiModelItem } from "@/types/ai-model.type";

const { updateAiModelInterface } = api;

interface PropsType {
  visible: boolean;
  row: AiModelItem | null;
  providerList: string[];
}

const props = defineProps<PropsType>();
const emits = defineEmits<{ close: []; success: [] }>();

const formRef = ref<FormInstance>();
const submitting = ref(false);

const submitForm = reactive({
  id: "",
  provider: "",
  modelCode: "",
  apiModelName: "",
  modelType: "text",
  baseUrl: "",
  sort: 100,
  enabled: "1",
});

const providerOptions = computed(() =>
  (props.providerList ?? []).map((p) => ({ label: p, value: p })),
);

const formRules = {
  provider: [{ required: true, message: "请选择服务商", trigger: "change" }],
  modelCode: [{ required: true, message: "请输入模型编码", trigger: "blur" }],
  apiModelName: [{ required: true, message: "请输入 API 模型名", trigger: "blur" }],
  modelType: [{ required: true, message: "请选择模型类型", trigger: "change" }],
  enabled: [{ required: true, message: "请选择状态", trigger: "change" }],
};

watch(
  () => [props.visible, props.row] as const,
  ([visible, row]) => {
    if (visible && row) {
      submitForm.id = String(row.id);
      submitForm.provider = row.provider ?? "";
      submitForm.modelCode = row.modelCode ?? "";
      submitForm.apiModelName = row.apiModelName ?? "";
      submitForm.modelType = row.modelType ?? "text";
      submitForm.baseUrl = row.baseUrl ?? "";
      submitForm.sort = row.sort ?? 100;
      submitForm.enabled = String(row.enabled ?? "1");
    }
  },
  { immediate: true },
);

const handleClose = () => {
  emits("close");
};

const handleSubmit = async () => {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }
  submitting.value = true;
  try {
    const res = await updateAiModelInterface({
      id: submitForm.id,
      provider: submitForm.provider.trim(),
      modelCode: submitForm.modelCode.trim(),
      apiModelName: submitForm.apiModelName.trim(),
      modelType: submitForm.modelType,
      baseUrl: submitForm.baseUrl?.trim() || undefined,
      sort: submitForm.sort,
      enabled: submitForm.enabled,
    });
    if (res?.code === 200 || res?.code === 201) {
      message.success(res?.message || "保存成功");
      emits("success");
      handleClose();
    } else {
      message.error(res?.message || "保存失败");
    }
  } finally {
    submitting.value = false;
  }
};
</script>
