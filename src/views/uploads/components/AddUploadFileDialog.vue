<template>
  <a-modal
    :open="props.visible"
    title="上传文件"
    @ok="handleSubmit"
    @cancel="handleClose"
    ok-text="上传"
    cancel-text="取消"
    :confirm-loading="uploading"
  >
    <a-form :model="submitForm" layout="vertical">
      <a-form-item label="文件" required>
        <a-upload
          :file-list="fileList"
          :before-upload="beforeUpload"
          :max-count="1"
          @remove="handleRemove"
        >
          <a-button type="primary">选择文件</a-button>
        </a-upload>
      </a-form-item>
      <a-form-item label="来源">
        <a-select
          v-model:value="submitForm.source"
          :options="sourceOptions"
          style="width: 100%"
        />
      </a-form-item>
      <a-form-item label="扩展元数据 (JSON)">
        <a-textarea
          v-model:value="submitForm.metadataText"
          placeholder='可选，如 {"remark":"备注"}'
          :rows="4"
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import type { UploadProps } from "ant-design-vue";
import { message } from "ant-design-vue";
import api from "@/api/apiList";
import { UPLOAD_FILE_SOURCE_OPTIONS } from "@/types/upload-file.type";

const { saveUploadFileApi } = api;

interface Props {
  visible: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{ close: [] }>();

const sourceOptions = UPLOAD_FILE_SOURCE_OPTIONS.map((item) => ({
  value: item.value,
  label: item.label,
}));

const submitForm = reactive({
  source: "user_upload",
  metadataText: "",
});
const fileList = ref<NonNullable<UploadProps["fileList"]>>([]);
const pendingFile = ref<File | null>(null);
const uploading = ref(false);

const resetForm = () => {
  submitForm.source = "user_upload";
  submitForm.metadataText = "";
  fileList.value = [];
  pendingFile.value = null;
};

watch(
  () => props.visible,
  (open) => {
    if (open) resetForm();
  },
);

const beforeUpload: UploadProps["beforeUpload"] = (file) => {
  pendingFile.value = file as File;
  fileList.value = [
    {
      uid: String(Date.now()),
      name: file.name,
      status: "done",
    },
  ];
  return false;
};

const handleRemove = () => {
  pendingFile.value = null;
  fileList.value = [];
};

const parseMetadata = (): Record<string, unknown> | undefined => {
  const raw = submitForm.metadataText.trim();
  if (!raw) return undefined;
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
  if (!pendingFile.value) {
    message.warning("请选择要上传的文件");
    return;
  }
  uploading.value = true;
  try {
    const formData = new FormData();
    formData.append("file", pendingFile.value, pendingFile.value.name);
    formData.append("source", submitForm.source);
    const metadata = parseMetadata();
    if (metadata) {
      formData.append("metadata", JSON.stringify(metadata));
    }
    const res = (await saveUploadFileApi(formData)) as {
      code?: number;
      message?: string;
    };
    if (res?.code === 200 || res?.code === 201) {
      message.success(res.message || "上传成功");
      resetForm();
      handleClose();
    } else {
      message.error(res?.message || "上传失败");
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "上传失败，请稍后重试";
    message.error(msg);
  } finally {
    uploading.value = false;
  }
};
</script>
