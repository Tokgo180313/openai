<template>
  <div class="ai-model-config-container">
    <div class="header">
      <a-form layout="inline" :model="searchForm">
        <a-form-item label="服务商">
          <a-select
            v-model:value="searchForm.provider"
            placeholder="服务商"
            allowClear
            show-search
            :options="providerSearchOptions"
            :filter-option="filterSelectOption"
            style="width: 160px"
          />
        </a-form-item>
        <a-form-item label="模型名">
          <a-select
            v-model:value="searchForm.modelName"
            placeholder="模型名"
            allowClear
            show-search
            :options="modelNameSearchOptions"
            :filter-option="filterSelectOption"
            style="width: 160px"
          />
        </a-form-item>
        <a-form-item label="启用">
          <a-select
            v-model:value="searchForm.isEnabled"
            placeholder="全部"
            allowClear
            style="width: 100px"
          >
            <a-select-option value="1">是</a-select-option>
            <a-select-option value="0">否</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="handleSearch">查询</a-button>
          <a-button style="margin-left: 10px" @click="openAddModal">新增</a-button>
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
      :scroll="{ x: 1200 }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'isEnabled'">
          <a-tag :color="record.isEnabled ? 'green' : 'default'">
            {{ record.isEnabled ? "启用" : "禁用" }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'apiUrl'">
          <a-tooltip :title="record.apiUrl">
            <span class="ellipsis-cell">{{ record.apiUrl }}</span>
          </a-tooltip>
        </template>
        <template v-else-if="column.key === 'action'">
          <a @click="openEditModal(record as AiModelConfigRow)">编辑</a>
          <span class="divider">|</span>
          <a-popconfirm
            title="确认删除该配置吗？"
            ok-text="确认"
            cancel-text="取消"
            @confirm="handleDelete(record as AiModelConfigRow)"
          >
            <a style="color: red">删除</a>
          </a-popconfirm>
        </template>
      </template>
    </a-table>

    <div class="pagination-wrap">
      <a-pagination
        :current="pagination.current"
        :pageSize="pagination.pageSize"
        :total="pagination.total"
        :show-size-changer="true"
        :page-size-options="['10', '20', '30', '50']"
        :show-total="(total: number) => `共 ${total} 条`"
        @change="handlePageChange"
      />
    </div>

    <AddAndUpdateAiModelDialog
      v-model:open="dialogOpen"
      :is-edit-mode="dialogEditMode"
      :initial-record="dialogInitialRecord"
      @success="fetchList"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { message } from "ant-design-vue";
import api from "@/api/apiList";
import { useModelStore } from "@/stores/modelStore";
import { unwrapList, unwrapPagedMeta } from "@/api/response";
import { filterSelectOption } from "@/types/select-filter";
import AddAndUpdateAiModelDialog from "./components/AddAndUpdateAiModelDialog.vue";
import type { AiModelConfigRow } from "./types";

const modelStore = useModelStore();

const {
  findAiModelConfigListInterface,
  findAiModelConfigByIdInterface,
  deleteAiModelConfigByIdInterface,
} = api;

const searchForm = reactive<{
  provider?: string;
  modelName?: string;
  isEnabled?: string;
}>({
  provider: undefined,
  modelName: undefined,
  isEnabled: undefined,
});

const providerSearchOptions = computed(() => {
  const raw = modelStore.providerOptions as string[];
  const list = Array.isArray(raw) ? raw : [];
  const opts = list.map((s) => ({ label: String(s), value: String(s) }));
  const cur = searchForm.provider?.trim();
  if (cur && !opts.some((o) => o.value === cur)) {
    return [...opts, { label: cur, value: cur }];
  }
  return opts;
});

const filterProviderSearchOption = filterSelectOption;
const filterModelNameSearchOption = filterSelectOption;

/** 与 AI 模型管理一致：服务商对应 ai_models.provider */
interface ModelStoreRow {
  apiModelName?: string;
  provider?: string;
  modelType?: string;
}

const modelNameSearchOptions = computed(() => {
  const rows = (modelStore.aiModelList ?? []) as ModelStoreRow[];
  const provider = searchForm.provider?.trim();
  const scoped = provider
    ? rows.filter((row) => row.provider === provider)
    : rows;
  const names = [
    ...new Set(
      scoped
        .map((row) => row.apiModelName)
        .filter((n): n is string => n != null && String(n).trim().length > 0)
        .map((n) => String(n).trim()),
    ),
  ].sort();
  const opts = names.map((s) => ({ label: s, value: s }));
  const cur = searchForm.modelName?.trim();
  if (cur && !opts.some((o) => o.value === cur)) {
    return [...opts, { label: cur, value: cur }];
  }
  return opts;
});

/** 切换服务商后，若当前模型名不属于该服务商则清空 */
watch(
  () => searchForm.provider,
  () => {
    const provider = searchForm.provider?.trim();
    if (!provider) return;
    const rows = (modelStore.aiModelList ?? []) as ModelStoreRow[];
    const allowed = new Set(
      rows
        .filter((row) => row.provider === provider)
        .map((row) => row.apiModelName)
        .filter((n) => n != null && String(n).trim().length > 0)
        .map((n) => String(n).trim()),
    );
    const cur = searchForm.modelName?.trim();
    if (cur && !allowed.has(cur)) {
      searchForm.modelName = undefined;
    }
  },
);

const list = ref<AiModelConfigRow[]>([]);
const tableLoading = ref(false);
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
});

const columns = [
  { title: "展示名称", dataIndex: "displayName", key: "displayName", width: 140, ellipsis: true },
  { title: "模型名", dataIndex: "modelName", key: "modelName", width: 140, ellipsis: true },
  { title: "服务商", dataIndex: "provider", key: "provider", width: 100, ellipsis: true },
  { title: "类型", dataIndex: "modelType", key: "modelType", width: 100, ellipsis: true },
  { title: "API 地址", dataIndex: "apiUrl", key: "apiUrl", ellipsis: true },
  { title: "启用", dataIndex: "isEnabled", key: "isEnabled", width: 80 },
  { title: "排序", dataIndex: "sort", key: "sort", width: 72 },
  { title: "操作", key: "action", width: 120, fixed: "right" as const },
];

const dialogOpen = ref(false);
const dialogEditMode = ref(false);
const dialogInitialRecord = ref<AiModelConfigRow | null>(null);

const trimOrUndefined = (v?: string | null) => {
  const t = v?.trim();
  return t ? t : undefined;
};

const fetchList = async () => {
  tableLoading.value = true;
  try {
    const params = {
      page: pagination.current,
      pageSize: pagination.pageSize,
      provider: trimOrUndefined(searchForm.provider),
      modelName: trimOrUndefined(searchForm.modelName),
      isEnabled:
        searchForm.isEnabled === "1"
          ? true
          : searchForm.isEnabled === "0"
            ? false
            : undefined,
    };
    const res = await findAiModelConfigListInterface(params);
    if (res?.code === 200 || res?.code === 201) {
      list.value = unwrapList<AiModelConfigRow>(res.data);
      pagination.total = unwrapPagedMeta(res.data).total ?? list.value.length;
      return;
    }
    list.value = [];
    pagination.total = 0;
    message.error(res?.message || "获取列表失败");
  } catch (e) {
    console.error(e);
    list.value = [];
    pagination.total = 0;
    message.error("获取列表失败，请稍后重试");
  } finally {
    tableLoading.value = false;
  }
};

const handleSearch = () => {
  pagination.current = 1;
  fetchList();
};

const openAddModal = () => {
  dialogEditMode.value = false;
  dialogInitialRecord.value = null;
  dialogOpen.value = true;
};

const openEditModal = async (record: AiModelConfigRow) => {
  if (!record?.id) {
    message.error("缺少配置 ID");
    return;
  }
  tableLoading.value = true;
  try {
    const res = await findAiModelConfigByIdInterface({ id: record.id });
    if (res?.code === 200 || res?.code === 201) {
      const data = (res?.data || record) as AiModelConfigRow;
      dialogEditMode.value = true;
      dialogInitialRecord.value = data;
      dialogOpen.value = true;
      return;
    }
    message.error(res?.message || "获取详情失败");
  } catch (e) {
    console.error(e);
    message.error("获取详情失败，请稍后重试");
  } finally {
    tableLoading.value = false;
  }
};

const handleDelete = async (record: AiModelConfigRow) => {
  if (!record?.id) return;
  try {
    const res = await deleteAiModelConfigByIdInterface({ id: record.id });
    if (res?.code === 200 || res?.code === 201) {
      message.success(res?.message || "删除成功");
      if (list.value.length === 1 && pagination.current > 1) {
        pagination.current -= 1;
      }
      fetchList();
      return;
    }
    message.error(res?.message || "删除失败");
  } catch (e) {
    console.error(e);
    message.error("删除失败，请稍后重试");
  }
};

const handlePageChange = (page: number, pageSize: number) => {
  pagination.current = page;
  pagination.pageSize = pageSize;
  fetchList();
};

onMounted(() => {
  void modelStore.fetchProviderList();
  void modelStore.fetchAiModelList({ page: 1, pageSize: 500 }, { preserveSelection: true });
  fetchList();
});
</script>

<style scoped lang="scss">
.ai-model-config-container {
  padding: 20px;
}

.header {
  margin-bottom: 12px;
}

.divider {
  display: inline-block;
  margin: 0 8px;
  color: #999;
}

.pagination-wrap {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

.ellipsis-cell {
  display: inline-block;
  max-width: 280px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: bottom;
}
</style>
