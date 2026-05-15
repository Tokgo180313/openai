<template>
  <a-popover
    placement="left"
    trigger="click"
    title="历史记录"
    :disabled="historyImageList.length === 0"
    :overlay-style="{ width: `${popoverWidth}px`, maxWidth: '90vw' }"
  >
    <template #content>
      <div class="history-list-wrap">
        <div v-if="historyImageList.length === 0" class="empty-history">暂无历史</div>
        <div v-for="image in historyImageList" :key="image.uid" class="history-item">
          <a-image
            class="history-img"
            :width="40"
            :height="40"
            :src="resolveImageSrc(image.url, image.code)"
            :preview="{ src: resolveImageSrc(image.url, image.code) }"
          />
          <div class="history-content">
            <div class="history-prompt" :title="image.context || ''">
              {{ image.context || "（无文案）" }}
            </div>
            <div class="history-actions">
              <a-button type="link" size="small" @click="emit('view', image)">查看</a-button>
              <a-button type="link" size="small" @click="emit('download', image)">
                下载
              </a-button>
              <a-button type="link" danger size="small" @click="emit('delete', image)">
                删除
              </a-button>
            </div>
          </div>
        </div>
      </div>
    </template>
    <div
      class="output-history-btn"
      :class="historyImageList.length ? '' : 'disabled-history'"
    >
      历史记录
    </div>
  </a-popover>
</template>

<script setup lang="ts">
import { nanoid } from "nanoid";
import { onMounted } from "vue";
import { message } from "ant-design-vue";
import { taskImageHistoryByTaskIdApi, fetchInputImageByLocalPathApi } from "@/api/images";
import { useTaskStore, type HistoryImage } from "@/stores/taskStore";

const props = defineProps<{
  /** 与父级图片任务卡片一致，用于拉取历史 */
  taskId: number | string;
  historyImageList: HistoryImage[];
  resolveImageSrc: (urlOrBase64: string, code: string) => string;
  popoverWidth: number;
}>();

const emit = defineEmits<{
  view: [image: HistoryImage];
  download: [image: HistoryImage];
  delete: [image: HistoryImage];
}>();

const store = useTaskStore();

function isHistoryApiOk(code: unknown) {
  return code === 200 || code === 201 || code === 0;
}

function isHttpUrlString(s: string) {
  return /^https?:\/\//i.test(s);
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("readAsDataURL failed"));
    reader.readAsDataURL(blob);
  });
}

/**
 * 优先使用 resultImages[0] 本地路径，通过 GET 拉取文件后转为 data URL；
 * 若下标 0 为空则回退 coverImage / url；已是 http(s) 或 data: 则原样返回。
 */
async function resolveHistoryRowPreviewUrl(row: Record<string, unknown>): Promise<string> {
  const ri = row.resultImages ?? row.result_images;
  let path = "";
  if (Array.isArray(ri) && ri.length > 0 && typeof ri[0] === "string") {
    path = ri[0].trim();
  }
  if (!path) {
    const c = row.coverImage ?? row.cover_image;
    if (typeof c === "string") path = c.trim();
  }
  if (!path) {
    const u = row.url ?? row.imageUrl ?? row.image_url;
    if (typeof u === "string") path = u.trim();
  }
  if (!path) return "";
  if (isHttpUrlString(path) || path.startsWith("data:")) return path;
  try {
    const blob = (await fetchInputImageByLocalPathApi(path)) as unknown;
    if (!(blob instanceof Blob) || blob.size === 0) return "";
    return await blobToDataUrl(blob);
  } catch (e) {
    console.error(e);
    return "";
  }
}

async function mapRemoteRowsToHistoryImages(rows: unknown[]): Promise<HistoryImage[]> {
  if (!Array.isArray(rows)) return [];
  const mapped = await Promise.all(
    rows.map(async (raw) => {
      if (!raw || typeof raw !== "object") return null;
      const row = raw as Record<string, unknown>;
      const url = await resolveHistoryRowPreviewUrl(row);
      const context = String(
        row.inputText ?? row.input_text ?? row.prompt ?? row.context ?? "",
      ).trim();
      const idRaw = row.id ?? row._id;
      const uid =
        idRaw != null && String(idRaw).length > 0 ? String(idRaw) : nanoid();
      const codeRaw = row.mimeType ?? row.mime_type ?? row.imageCode ?? row.code;
      const code = typeof codeRaw === "string" ? codeRaw.trim() : "";
      if (url.length === 0 && context.length === 0) return null;
      return {
        uid,
        url,
        code: url.startsWith("data:") ? "" : code,
        context,
      } as HistoryImage;
    }),
  );
  return mapped.filter((x): x is HistoryImage => x != null);
}

async function loadHistoryFromServer() {
  const id = props.taskId != null ? String(props.taskId).trim() : "";
  if (!id) return;
  try {
    const res = (await taskImageHistoryByTaskIdApi({ taskId: id })) as {
      code?: number;
      message?: string;
      data?: unknown;
    };
    if (!isHistoryApiOk(res?.code)) {
      if (res?.message) message.warning(res.message);
      return;
    }
    const d = res?.data;
    const rows = Array.isArray(d)
      ? d
      : d && typeof d === "object" && Array.isArray((d as { list?: unknown[] }).list)
        ? (d as { list: unknown[] }).list
        : d && typeof d === "object" && Array.isArray((d as { records?: unknown[] }).records)
          ? (d as { records: unknown[] }).records
          : [];
    const list = await mapRemoteRowsToHistoryImages(rows);
    store.setRemoteHistoryList(id, list);
  } catch (e) {
    console.error(e);
  }
}

onMounted(() => {
  void loadHistoryFromServer();
});
</script>

<style scoped>
.output-history-btn {
  cursor: pointer;
  text-align: center;
  border: 1px solid #4f46e5;
  border-radius: 5px;
  margin: 0.5em 0;
  line-height: 32px;
  height: 32px;
  user-select: none;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.history-list-wrap {
  width: 100%;
  max-height: 360px;
  overflow-y: auto;
}

.history-img {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border: 1px solid #eee;
  border-radius: 4px;
  background: #fafafa;
  overflow: hidden;
}

:deep(.history-img.ant-image) {
  width: 40px;
  height: 40px;
  line-height: 0;
}

:deep(.history-img .ant-image-img) {
  width: 40px;
  height: 40px;
  object-fit: cover;
}

.history-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.history-content {
  flex: 1;
  min-width: 0;
}

.history-prompt {
  font-size: 12px;
  color: #606266;
  line-height: 1.4;
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  word-break: break-word;
  white-space: normal;
}

.disabled-history {
  opacity: 0.55;
  pointer-events: none;
}

.empty-history {
  padding: 6px 0;
  color: #999;
  font-size: 12px;
  text-align: center;
}
</style>
