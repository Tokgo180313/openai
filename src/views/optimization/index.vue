<template>
  <div class="optimization-container">
    <div class="header">
      <a-form layout="inline" :model="searchForm">
        <a-form-item label="类型">
          <a-select
            v-model:value="searchForm.type"
            placeholder="全部"
            allow-clear
            style="width: 140px"
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
        <a-form-item label="文案内容">
          <a-input
            v-model:value="searchForm.content"
            placeholder="模糊匹配"
            allow-clear
            style="width: 200px"
          />
        </a-form-item>
        <a-form-item label="状态">
          <a-select
            v-model:value="searchForm.status"
            placeholder="请选择状态"
            style="width: 120px"
          >
            <a-select-option
              v-for="item in statusOptions"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-button type="primary" size="small" @click="handleSearch">查询</a-button>
          <a-button size="small" style="margin-left: 10px" @click="handleReset">重置</a-button>
          <a-button
            type="primary"
            size="small"
            style="margin-left: 10px"
            @click="openAddModal"
          >
            添加文案
          </a-button>
        </a-form-item>
      </a-form>
    </div>

    <a-table
      :data-source="tableData"
      :columns="columnsList"
      :pagination="false"
      :loading="tableLoading"
      row-key="id"
      bordered
      size="small"
      :scroll="{ x: 900 }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'type'">
          {{ typeLabelMap[record.type] ?? record.type ?? "-" }}
        </template>
        <template v-else-if="column.key === 'content'">
          <a-tooltip v-if="record.content" :title="record.content">
            <span class="ellipsis-cell">{{ record.content }}</span>
          </a-tooltip>
          <span v-else>-</span>
        </template>
        <template v-else-if="column.key === 'status'">
          <a-tag :color="record.status === '1' ? 'green' : 'red'">
            {{ record.status === "1" ? "启用" : "停用" }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'createdAt'">
          {{ formatDate(record.createdAt) }}
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

    <AddOptimizationDialog v-model:open="dialogOpen" @success="fetchList" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { message } from "ant-design-vue";
import api from "@/api/apiList";
import config from "./config";
import AddOptimizationDialog from "./components/AddOptimizationDialog.vue";

const { findOptimizationListInterface } = api;

interface OptimizationRow {
  id: string | number;
  type: string;
  content: string;
  status: string;
  createdAt?: string;
}

const searchForm = reactive<{
  type?: string;
  status: string;
  content?: string;
}>({
  type: undefined,
  status: "1",
  content: undefined,
});

const tableData = ref<OptimizationRow[]>([]);
const tableLoading = ref(false);
const dialogOpen = ref(false);
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
});

const typeOptions = config.typeOptions;
const statusOptions = config.statusOptions;
const typeLabelMap = Object.fromEntries(
  typeOptions.map((item) => [item.value, item.label]),
);
const columnsList = computed(() => config.columns);

const trimOrUndefined = (v?: string | null) => {
  const t = v?.trim();
  return t ? t : undefined;
};

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const buildQueryParams = () => ({
  page: pagination.current,
  pageSize: pagination.pageSize,
  type: trimOrUndefined(searchForm.type),
  content: trimOrUndefined(searchForm.content),
  status: searchForm.status,
});

const fetchList = async () => {
  tableLoading.value = true;
  try {
    const res = await findOptimizationListInterface(buildQueryParams());
    if (res?.code === 200 || res?.code === 201) {
      tableData.value = res?.data?.list ?? res?.data ?? [];
      pagination.total = res?.data?.total ?? tableData.value.length;
      return;
    }
    tableData.value = [];
    pagination.total = 0;
    message.error(res?.message || "获取列表失败");
  } catch (e) {
    console.error(e);
    tableData.value = [];
    pagination.total = 0;
    message.error("获取列表失败，请稍后重试");
  } finally {
    tableLoading.value = false;
  }
};

const handleSearch = () => {
  pagination.current = 1;
  void fetchList();
};

const handleReset = () => {
  searchForm.type = undefined;
  searchForm.status = "1";
  searchForm.content = undefined;
  handleSearch();
};

const handlePageChange = (page: number, pageSize: number) => {
  pagination.current = page;
  pagination.pageSize = pageSize;
  void fetchList();
};

const openAddModal = () => {
  dialogOpen.value = true;
};

onMounted(() => {
  void fetchList();
});
</script>

<style scoped lang="scss">
.optimization-container {
  padding: 20px;
}

.header {
  margin-bottom: 12px;
}

.pagination-wrap {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

.ellipsis-cell {
  display: inline-block;
  max-width: 420px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: bottom;
}
</style>
