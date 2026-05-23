<template>
  <div class="history-record-page">
    <div class="toolbar">
      <a-form layout="inline" :model="searchForm">
        <a-form-item label="模型">
          <a-select
            v-model:value="searchForm.modelName"
            placeholder="全部"
            allow-clear
            show-search
            :options="modelNameOptions"
            :filter-option="filterModelOption"
            style="width: 200px"
          />
        </a-form-item>
        <a-form-item label="状态">
          <a-select
            v-model:value="searchForm.status"
            placeholder="全部"
            allow-clear
            style="width: 140px"
            :options="statusFilterOptions"
          />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="handleSearch">查询</a-button>
        </a-form-item>
      </a-form>
    </div>

    <a-table
      :data-source="list"
      :columns="columns"
      :pagination="false"
      :loading="tableLoading"
      row-key="id"
      bordered
      size="small"
      :scroll="{ x: 1500 }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'inputText'">
          <a-tooltip :title="String(record.inputText ?? '')">
            <span class="ellipsis-cell wide">{{ record.inputText || "—" }}</span>
          </a-tooltip>
        </template>
        <template v-else-if="column.key === 'sourceImages'">
          <span v-if="!record.sourceImages?.length"></span>
          <a-spin v-else-if="!record._imagesHydrated" size="small" />
          <div v-else class="thumb-row">
            <a-image
              v-for="(src, i) in record.sourceImageDisplayUrls"
              :key="`in-${record.id}-${i}`"
              :width="44"
              :height="44"
              :src="src"
              :preview="{ src }"
              class="history-thumb"
            />
          </div>
        </template>
        <template v-else-if="column.key === 'resultImages'">
          <span v-if="!record.resultImages?.length"></span>
          <a-spin v-else-if="!record._imagesHydrated" size="small" />
          <div v-else class="thumb-row">
            <a-image
              v-for="(src, i) in record.resultImageDisplayUrls"
              :key="`out-${record.id}-${i}`"
              :width="44"
              :height="44"
              :src="src"
              :preview="{ src }"
              class="history-thumb"
            />
          </div>
        </template>
        <template v-else-if="column.key === 'status'">
          <a-tag :color="statusTagColor(record.status)">{{ statusLabel(record.status) }}</a-tag>
        </template>
        <template v-else-if="column.key === 'createdAt'">
          {{ formatTime(record.createdAt) }}
        </template>
      </template>
    </a-table>

    <div class="pagination-wrap">
      <a-pagination
        :current="pagination.current"
        :page-size="pagination.pageSize"
        :total="pagination.total"
        :show-size-changer="true"
        :page-size-options="['10', '20', '30', '50']"
        :show-total="(total: number) => `共 ${total} 条`"
        @change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { message } from "ant-design-vue";
import dayjs from "dayjs";
import { fetchInputImageByLocalPathApi, taskImageHistoryRecordApi } from "@/api/images";
import { useAuthStore } from "@/stores/authStore";
import { useModelStore } from "@/stores/modelStore";

/** 与接口 / 实体字段对齐（兼容 snake_case） */
export interface TaskImageHistoryRow {
  id: number;
  userId?: string;
  taskId: string;
  modelName: string;
  inputText: string;
  sourceImages?: string[];
  resultImages?: string[];
  /** 本地路径经接口拉取后转成的 data URL / 已是 http(s) 的直链 */
  sourceImageDisplayUrls?: string[];
  resultImageDisplayUrls?: string[];
  /** 是否存在待加载的参考图或结果图（用于单元格 loading） */
  _imagesHydrated?: boolean;
  imageCount?: number;
  aspectRatio?: string | null;
  imageSize?: string | null;
  status: number;
  createdAt?: string | Date;
}

const modelStore = useModelStore();
const authStore = useAuthStore();

const searchForm = reactive<{
  modelName?: string;
  status?: number;
}>({
  modelName: undefined,
  status: undefined,
});

const statusFilterOptions = [
  { label: "已过期", value: 0 },
  { label: "使用中", value: 1 },
];

interface ModelStoreRow {
  apiModelName?: string;
  modelType?: string;
}

const modelNameOptions = computed(() => {
  const rows = (modelStore.aiModelList ?? []) as ModelStoreRow[];
  const names = [
    ...new Set(
      rows
        .map((r) => r.apiModelName)
        .filter((n): n is string => n != null && String(n).trim().length > 0)
        .map((n) => String(n).trim()),
    ),
  ].sort();
  return names.map((s) => ({ label: s, value: s }));
});

const filterModelOption = (input: string, option: { label?: string; value?: string }) => {
  const text = String(option?.value ?? option?.label ?? "");
  return text.toLowerCase().includes(input.trim().toLowerCase());
};

const list = ref<TaskImageHistoryRow[]>([]);
const tableLoading = ref(false);
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
});

const columns = [
  { title: "ID", dataIndex: "id", key: "id", width: 72 },
  { title: "任务 ID", dataIndex: "taskId", key: "taskId", width: 120, ellipsis: true },
  { title: "模型", dataIndex: "modelName", key: "modelName", width: 140, ellipsis: true },
  { title: "输入文案", key: "inputText", width: 220, ellipsis: true },
  { title: "输入图片", key: "sourceImages", width: 200 },
  { title: "输出图片", key: "resultImages", width: 200 },
  { title: "张数", dataIndex: "imageCount", key: "imageCount", width: 64 },
  { title: "比例", dataIndex: "aspectRatio", key: "aspectRatio", width: 88, ellipsis: true },
  { title: "尺寸", dataIndex: "imageSize", key: "imageSize", width: 100, ellipsis: true },
  { title: "状态", key: "status", width: 96 },
  { title: "创建时间", key: "createdAt", width: 168 },
];

function isApiOk(code: unknown) {
  return code === 200 || code === 201 || code === 0;
}

function pickStr(obj: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = obj[k];
    if (v != null && String(v).trim()) return String(v).trim();
  }
  return "";
}

function asStringArray(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const list = v
    .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    .map((s) => s.trim());
  return list.length ? list : undefined;
}

function isHttpOrDataUrl(path: string) {
  const p = path.trim();
  return /^https?:\/\//i.test(p) || p.startsWith("data:");
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("readAsDataURL failed"));
    reader.readAsDataURL(blob);
  });
}

/** 单张：本地路径走 GET 转 base64；已是 http(s)/data 则原样 */
async function resolveImagePathToDataUrl(path: string): Promise<string> {
  const p = path.trim();
  if (!p) return "";
  if (isHttpOrDataUrl(p)) return p;
  try {
    const blob = (await fetchInputImageByLocalPathApi(p)) as unknown;
    if (!(blob instanceof Blob) || blob.size === 0) return "";
    return await blobToDataUrl(blob);
  } catch (e) {
    console.error(e);
    return "";
  }
}

async function resolvePathsToDataUrls(paths?: string[] | null): Promise<string[]> {
  if (!paths?.length) return [];
  const urls = await Promise.all(paths.map((x) => resolveImagePathToDataUrl(String(x))));
  return urls.filter((u) => u.length > 0);
}

async function hydrateRowImages(rows: TaskImageHistoryRow[]) {
  const need = rows.filter(
    (r) => (r.sourceImages?.length ?? 0) > 0 || (r.resultImages?.length ?? 0) > 0,
  );
  await Promise.all(
    need.map(async (row) => {
      const [sourceUrls, resultUrls] = await Promise.all([
        resolvePathsToDataUrls(row.sourceImages),
        resolvePathsToDataUrls(row.resultImages),
      ]);
      const t = list.value.find((x) => x.id === row.id);
      if (t) {
        t.sourceImageDisplayUrls = sourceUrls;
        t.resultImageDisplayUrls = resultUrls;
        t._imagesHydrated = true;
      }
    }),
  );
}

function normalizeHistoryRow(raw: unknown): TaskImageHistoryRow | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const idRaw = o.id;
  const id = typeof idRaw === "number" ? idRaw : Number(idRaw);
  if (!Number.isFinite(id)) return null;
  const taskId = pickStr(o, "taskId", "task_id");
  const modelName = pickStr(o, "modelName", "model_name");
  const inputText = pickStr(o, "inputText", "input_text");
  const statusRaw = o.status ?? o.Status;
  const status = typeof statusRaw === "number" ? statusRaw : Number(statusRaw);
  const imageCountRaw = o.imageCount ?? o.image_count;
  const imageCount =
    typeof imageCountRaw === "number" ? imageCountRaw : Number(imageCountRaw || 0);
  return {
    id,
    userId: pickStr(o, "userId", "user_id") || undefined,
    taskId: taskId || String(o.task_id ?? ""),
    modelName: modelName || "—",
    inputText: inputText || "—",
    sourceImages: asStringArray(o.sourceImages ?? o.source_images),
    resultImages: asStringArray(o.resultImages ?? o.result_images),
    imageCount: Number.isFinite(imageCount) ? imageCount : 0,
    aspectRatio: pickStr(o, "aspectRatio", "aspect_ratio") || null,
    imageSize: pickStr(o, "imageSize", "image_size") || null,
    status: Number.isFinite(status) ? status : 0,
    createdAt: (o.createdAt ?? o.created_at) as string | Date | undefined,
  };
}

function extractRowsAndTotal(data: unknown): { rows: TaskImageHistoryRow[]; total: number } {
  if (data == null) return { rows: [], total: 0 };
  if (Array.isArray(data)) {
    const rows = data.map(normalizeHistoryRow).filter((x): x is TaskImageHistoryRow => x != null);
    return { rows, total: rows.length };
  }
  if (typeof data !== "object") return { rows: [], total: 0 };
  const d = data as Record<string, unknown>;
  const rawList =
    (Array.isArray(d.list) && d.list) ||
    (Array.isArray(d.records) && d.records) ||
    (Array.isArray(d.rows) && d.rows) ||
    (Array.isArray(d.data) && d.data) ||
    [];
  const rows = (rawList as unknown[])
    .map(normalizeHistoryRow)
    .filter((x): x is TaskImageHistoryRow => x != null);
  const totalRaw = d.total ?? d.Total ?? d.count ?? d.totalCount;
  const total =
    typeof totalRaw === "number" && Number.isFinite(totalRaw)
      ? totalRaw
      : totalRaw != null
        ? Number(totalRaw)
        : rows.length;
  return { rows, total: Number.isFinite(total) ? total : 0 };
}

const trimOrUndefined = (v?: string | null) => {
  const t = v?.trim();
  return t ? t : undefined;
};

const fetchList = async () => {
  tableLoading.value = true;
  try {
    const body: {
      current: number;
      pageSize: number;
      roleId?: string | null;
      status?: number;
      modelName?: string;
    } = {
      current: pagination.current,
      pageSize: pagination.pageSize,
      roleId: authStore.getRoleId,
    };
    const mn = trimOrUndefined(searchForm.modelName);
    if (mn) body.modelName = mn;
    if (searchForm.status !== undefined && searchForm.status !== null) {
      body.status = searchForm.status;
    }

    const res = (await taskImageHistoryRecordApi(body)) as {
      code?: number;
      message?: string;
      data?: unknown;
    };

    if (!isApiOk(res?.code)) {
      list.value = [];
      pagination.total = 0;
      message.error(res?.message || "获取历史记录失败");
      return;
    }

    const { rows, total } = extractRowsAndTotal(res?.data);
    for (const row of rows) {
      row.sourceImageDisplayUrls = [];
      row.resultImageDisplayUrls = [];
      row._imagesHydrated = !(
        (row.sourceImages?.length ?? 0) > 0 || (row.resultImages?.length ?? 0) > 0
      );
    }
    list.value = rows;
    pagination.total = total;
    void hydrateRowImages(rows);
  } catch (e) {
    console.error(e);
    list.value = [];
    pagination.total = 0;
    message.error("获取历史记录失败，请稍后重试");
  } finally {
    tableLoading.value = false;
  }
};

const handleSearch = () => {
  pagination.current = 1;
  void fetchList();
};

const handlePageChange = (page: number, pageSize: number) => {
  pagination.current = page;
  pagination.pageSize = pageSize;
  void fetchList();
};

function statusLabel(status: number) {
  if (status === 0) return "已过期";
  if (status === 1) return "使用中";
  if (status === 2) return "已完成";
  if (status === 3) return "失败";
  return `状态 ${status}`;
}

function statusTagColor(status: number) {
  if (status === 0) return "default";
  if (status === 1) return "processing";
  if (status === 2) return "success";
  if (status === 3) return "error";
  return "default";
}

function formatTime(v: string | Date | undefined) {
  if (v == null || v === "") return "—";
  const d = dayjs(v);
  return d.isValid() ? d.format("YYYY-MM-DD HH:mm:ss") : "—";
}

onMounted(() => {
  void modelStore.fetchAiModelList({ page: 1, pageSize: 500 }, { preserveSelection: true });
  void fetchList();
});
</script>

<style scoped lang="scss">
.history-record-page {
  padding: 20px;
}

.toolbar {
  margin-bottom: 12px;
}

.pagination-wrap {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

.ellipsis-cell {
  display: inline-block;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: bottom;

  &.wide {
    max-width: 320px;
  }
}

.thumb-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.history-thumb {
  border-radius: 4px;
  object-fit: cover;
}
</style>
