<template>
  <a-modal
    :open="props.visible"
    title="编辑文件"
    @ok="handleSubmit"
    @cancel="handleClose"
    ok-text="保存"
    cancel-text="取消"
    :confirm-loading="submitting"
  >
    <a-spin :spinning="loading">
      <a-form :model="submitForm" layout="vertical">
        <a-form-item label="文件名">
          <a-input :value="detail?.originalName" disabled />
        </a-form-item>
        <a-form-item label="状态">
          <a-select
            v-model:value="submitForm.status"
            :options="statusOptions"
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item label="来源">
          <a-select
            v-model:value="submitForm.source"
            :options="sourceOptions"
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item label="文件类型">
          <a-select
            v-model:value="submitForm.fileType"
            :options="fileTypeOptions"
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item label="时长 (秒)">
          <a-input-number
            v-model:value="submitForm.duration"
            :min="0"
            style="width: 100%"
            placeholder="音频/视频可选"
          />
        </a-form-item>
        <a-form-item label="扩展元数据 (JSON)">
          <a-textarea v-model:value="submitForm.metadataText" :rows="5" />
        </a-form-item>
      </a-form>
    </a-spin>
  </a-modal>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import { message } from "ant-design-vue";
import api from "@/api/apiList";
import type { UploadFileRecord, UploadFileUpdateDto } from "@/types/upload-file.type";
import {
  UPLOAD_FILE_SOURCE_OPTIONS,
  UPLOAD_FILE_STATUS_OPTIONS,
  UPLOAD_FILE_TYPE_OPTIONS,
} from "@/types/upload-file.type";

const { findUploadFileByIdApi, updateUploadFileApi } = api;

interface Props {
  visible: boolean;
  fileId?: number | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{ close: []; success: [] }>();

const statusOptions = UPLOAD_FILE_STATUS_OPTIONS.map((item) => ({
  value: item.value,
  label: item.label,
}));
const sourceOptions = UPLOAD_FILE_SOURCE_OPTIONS.map((item) => ({
  value: item.value,
  label: item.label,
}));
const fileTypeOptions = UPLOAD_FILE_TYPE_OPTIONS.map((item) => ({
  value: item.value,
  label: item.label,
}));

const detail = ref<UploadFileRecord | null>(null);
const loading = ref(false);
const submitting = ref(false);

const submitForm = reactive({
  status: "temp",
  source: "user_upload",
  fileType: "file",
  duration: undefined as number | undefined,
  metadataText: "",
});

const resetForm = () => {
  detail.value = null;
  submitForm.status = "temp";
  submitForm.source = "user_upload";
  submitForm.fileType = "file";
  submitForm.duration = undefined;
  submitForm.metadataText = "";
};

const fillForm = (row: UploadFileRecord) => {
  detail.value = row;
  submitForm.status = row.status;
  submitForm.source = row.source;
  submitForm.fileType = row.fileType;
  submitForm.duration = row.duration ?? undefined;
  submitForm.metadataText = row.metadata
    ? JSON.stringify(row.metadata, null, 2)
    : "";
};

const loadDetail = async (id: number) => {
  loading.value = true;
  try {
    const res = (await findUploadFileByIdApi(id)) as {
      code?: number;
      message?: string;
      data?: UploadFileRecord;
    };
    if (res?.code === 200 || res?.code === 201) {
      if (res.data) fillForm(res.data);
    } else {
      message.error(res?.message || "获取文件详情失败");
    }
  } catch {
    message.error("获取文件详情失败");
  } finally {
    loading.value = false;
  }
};

watch(
  () => [props.visible, props.fileId] as const,
  ([visible, fileId]) => {
    if (!visible) {
      resetForm();
      return;
    }
    if (fileId) {
      void loadDetail(fileId);
    }
  },
);

const parseMetadata = (): Record<string, unknown> | null | undefined => {
  const raw = submitForm.metadataText.trim();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    throw new Error("metadata 必须是 JSON 对象");
  } catch (error) {
    const msg = error instanceof Error ? error.message : "metadata JSON 格式错误";
    throw new Error(msg);
  }
};

const handleClose = () => {
  emit("close");
};

const handleSubmit = async () => {
  if (!props.fileId) {
    message.error("缺少文件 ID");
    return;
  }
  submitting.value = true;
  try {
    const metadata = parseMetadata();
    const dto = {
      id: String(props.fileId),
      status: submitForm.status,
      source: submitForm.source,
      fileType: submitForm.fileType,
      ...(submitForm.duration != null ? { duration: submitForm.duration } : {}),
      ...(metadata !== undefined ? { metadata } : {}),
    };
    const res = (await updateUploadFileApi(dto as UploadFileUpdateDto)) as {
      code?: number;
      message?: string;
    };
    if (res?.code === 200 || res?.code === 201) {
      message.success(res.message || "更新成功");
      emit("success");
      handleClose();
    } else {
      message.error(res?.message || "更新失败");
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "更新失败，请稍后重试";
    message.error(msg);
  } finally {
    submitting.value = false;
  }
};
</script>
