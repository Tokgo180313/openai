<template>
  <a-modal
    :open="open"
    title="添加优化文案"
    ok-text="确认"
    cancel-text="取消"
    :confirm-loading="submitLoading"
    width="640px"
    @ok="handleSubmit"
    @cancel="handleClose"
  >
    <a-form ref="formRef" :model="formState" :rules="formRules" layout="vertical">
      <a-form-item label="类型" name="type">
        <a-select
          v-model:value="formState.type"
          placeholder="请选择业务类型"
          style="width: 100%"
        >
          <a-select-option
            v-for="item in typeOptions"
            :key="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item label="文案内容" name="content">
        <a-textarea
          v-model:value="formState.content"
          placeholder="请输入优化文案内容"
          :rows="6"
          show-count
          :maxlength="4000"
        />
      </a-form-item>
      <a-form-item label="状态" name="status">
        <a-select v-model:value="formState.status" placeholder="请选择状态" style="width: 100%">
          <a-select-option
            v-for="item in statusOptions"
            :key="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </a-select-option>
        </a-select>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import type { FormInstance } from "ant-design-vue";
import { message } from "ant-design-vue";
import api from "@/api/apiList";
import config from "../config";

const { addOptimizationInterface } = api;
const typeOptions = config.typeOptions;
const statusOptions = config.statusOptions;

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  (e: "update:open", value: boolean): void;
  (e: "success"): void;
}>();

const formRef = ref<FormInstance>();
const submitLoading = ref(false);

import type { FormRulesMap } from "@/types/form-rules";

const defaultFormState = () => ({
  type: "image_edit",
  content: "",
  status: "1",
});

const formState = reactive(defaultFormState());

const formRules: FormRulesMap = {
  type: [{ required: true, message: "请选择类型", trigger: "change" }],
  content: [{ required: true, message: "请输入文案内容", trigger: "blur" }],
  status: [{ required: true, message: "请选择状态", trigger: "change" }],
};

const resetForm = () => {
  Object.assign(formState, defaultFormState());
  formRef.value?.clearValidate();
};

watch(
  () => props.open,
  (visible) => {
    if (visible) {
      resetForm();
    }
  },
);

const handleClose = () => {
  emit("update:open", false);
};

const handleSubmit = async () => {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }

  submitLoading.value = true;
  try {
    const res = await addOptimizationInterface({
      type: formState.type.trim(),
      content: formState.content.trim(),
      status: formState.status,
    });
    if (res?.code === 200 || res?.code === 201) {
      message.success(res?.message || "添加成功");
      emit("update:open", false);
      emit("success");
      return;
    }
    message.error(res?.message || "添加失败");
  } catch (e) {
    console.error(e);
    message.error("添加失败，请稍后重试");
  } finally {
    submitLoading.value = false;
  }
};
</script>
