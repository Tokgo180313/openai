<template>
  <a-modal
    :open="props.visible"
    title="文件详情"
    :footer="null"
    width="720px"
    @cancel="handleClose"
  >
    <a-spin :spinning="loading">
      <a-descriptions v-if="detail" bordered :column="2" size="small">
        <a-descriptions-item label="ID">{{ detail.id }}</a-descriptions-item>
        <a-descriptions-item label="状态">
          <a-tag :color="statusColor(detail.status)">
            {{ getUploadStatusLabel(detail.status) }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="文件名" :span="2">
          {{ detail.originalName }}
        </a-descriptions-item>
        <a-descriptions-item label="类型">
          {{ getUploadFileTypeLabel(detail.fileType) }}
        </a-descriptions-item>
        <a-descriptions-item label="来源">
          {{ getUploadSourceLabel(detail.source) }}
        </a-descriptions-item>
        <a-descriptions-item label="MIME">{{ detail.mimeType }}</a-descriptions-item>
        <a-descriptions-item label="扩展名">{{ detail.ext || "-" }}</a-descriptions-item>
        <a-descriptions-item label="大小">
          {{ formatFileSize(detail.size) }}
        </a-descriptions-item>
        <a-descriptions-item label="尺寸">
          {{
            detail.width && detail.height
              ? `${detail.width} × ${detail.height}`
              : "-"
          }}
        </a-descriptions-item>
        <a-descriptions-item label="时长">
          {{ detail.duration != null ? `${detail.duration} 秒` : "-" }}
        </a-descriptions-item>
        <a-descriptions-item label="哈希" :span="2">
          {{ detail.hash || "-" }}
        </a-descriptions-item>
        <a-descriptions-item label="存储路径" :span="2">
          {{ detail.storagePath }}
        </a-descriptions-item>
        <a-descriptions-item label="访问 URL" :span="2">
          {{ detail.url || buildUploadFileDownloadUrl(detail.id) }}
        </a-descriptions-item>
        <a-descriptions-item label="创建时间">
          {{ detail.createdAt || "-" }}
        </a-descriptions-item>
        <a-descriptions-item label="更新时间">
          {{ detail.updatedAt || "-" }}
        </a-descriptions-item>
        <a-descriptions-item label="元数据" :span="2">
          <pre class="metadata-block">{{
            detail.metadata ? JSON.stringify(detail.metadata, null, 2) : "-"
          }}</pre>
        </a-descriptions-item>
      </a-descriptions>
    </a-spin>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { message } from "ant-design-vue";
import api from "@/api/apiList";
import type { UploadFileRecord, UploadFileStatus } from "@/types/upload-file.type";
import {
  formatFileSize,
  getUploadFileTypeLabel,
  getUploadSourceLabel,
  getUploadStatusLabel,
} from "@/types/upload-file.type";

const { findUploadFileByIdApi, buildUploadFileDownloadUrl } = api;

interface Props {
  visible: boolean;
  fileId?: number | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{ close: [] }>();

const detail = ref<UploadFileRecord | null>(null);
const loading = ref(false);

const statusColor = (status?: UploadFileStatus) => {
  if (status === "used") return "green";
  if (status === "deleted") return "red";
  return "blue";
};

const loadDetail = async (id: number) => {
  loading.value = true;
  detail.value = null;
  try {
    const res = (await findUploadFileByIdApi(id)) as {
      code?: number;
      message?: string;
      data?: UploadFileRecord;
    };
    if (res?.code === 200 || res?.code === 201) {
      detail.value = res.data ?? null;
    } else {
      message.error(res?.message || "获取详情失败");
    }
  } catch {
    message.error("获取详情失败");
  } finally {
    loading.value = false;
  }
};

watch(
  () => [props.visible, props.fileId] as const,
  ([visible, fileId]) => {
    if (visible && fileId) {
      void loadDetail(fileId);
    } else {
      detail.value = null;
    }
  },
);

const handleClose = () => {
  emit("close");
};
</script>

<style scoped lang="scss">
.metadata-block {
  margin: 0;
  max-height: 200px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
  font-size: 12px;
}
</style>
