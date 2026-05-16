<template>
  <a-modal
    :open="props.visible"
    title="编辑模型"
    @ok="handleSubmit"
    @cancel="handleClose"
    ok-text="保存"
    cancel-text="取消"
    :confirm-loading="submitting"
  >
    <a-form :model="submitForm" :rules="formRules" ref="formRef" layout="vertical">
      <a-form-item label="模型名称" name="modelName">
        <a-input v-model:value="submitForm.modelName" placeholder="请输入模型名称" />
      </a-form-item>
      <a-form-item label="状态" name="status">
        <a-select v-model:value="submitForm.status" placeholder="请选择状态" style="width: 100%">
          <a-select-option value="1">启用</a-select-option>
          <a-select-option value="0">禁用</a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item label="模型类型" name="modelType">
        <a-select
          v-model:value="submitForm.modelType"
          placeholder="请选择模型类型"
          style="width: 100%"
        >
          <a-select-option value="chat">聊天</a-select-option>
          <a-select-option value="image_edit">图片编辑</a-select-option>
        </a-select>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script lang="ts">
export interface EditModelRecord {
  id: string;
  modelName: string;
  status: string;
  modelType?: string;
}
</script>

<script lang="ts" setup>
import { reactive, ref, watch } from "vue";
import type { FormInstance } from "ant-design-vue";
import api from "@/api/apiList";
const { updateModelInterface } = api;
import { message } from "ant-design-vue";

const emits = defineEmits<{ close: []; success: [] }>();

interface PropsType {
  visible: boolean;
  record: EditModelRecord | null;
}
const props = defineProps<PropsType>();

const formRef = ref<FormInstance>();
const submitting = ref(false);

const submitForm = reactive({
  id: "",
  modelName: "",
  status: "1",
  modelType: "",
});

const formRules = {
  modelName: [{ required: true, message: "请输入模型名称", trigger: "blur" }],
  status: [{ required: true, message: "请选择状态", trigger: "change" }],
};

watch(
  () => [props.visible, props.record] as const,
  ([visible, record]) => {
    if (visible && record) {
      submitForm.id = record.id;
      submitForm.modelName = record.modelName ?? "";
      submitForm.status = record.status ?? "1";
      submitForm.modelType = record.modelType ?? "";
    }
  },
  { immediate: true }
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
    const res = await updateModelInterface({
      id: submitForm.id,
      modelName: submitForm.modelName,
      status: submitForm.status,
      modelType: submitForm.modelType,
    });
    if (res.code === 200) {
      message.success("保存成功");
      emits("success");
      handleClose();
    } else {
      message.error(res.message || "保存失败");
    }
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped lang="scss"></style>
