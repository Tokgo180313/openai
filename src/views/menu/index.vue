<template>
  <div class="menu-container">
    <div class="header">
      <a-form :model="searchForm" layout="inline">
        <a-form-item label="编码" name="code">
          <a-input
            v-model:value="searchForm.code"
            allow-clear
            placeholder="请输入菜单编码"
          />
        </a-form-item>
        <a-form-item label="名称" name="name">
          <a-input
            v-model:value="searchForm.name"
            allow-clear
            placeholder="请输入菜单名称"
          />
        </a-form-item>
        <a-form-item label="路径" name="path">
          <a-input
            v-model:value="searchForm.path"
            allow-clear
            placeholder="请输入路由路径"
          />
        </a-form-item>
        <a-form-item label="状态" name="status">
          <a-select
            v-model:value="searchForm.status"
            placeholder="请选择状态"
            allow-clear
            style="width: 120px"
          >
            <a-select-option value="1">启用</a-select-option>
            <a-select-option value="0">停用</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-button type="primary" size="small" @click="handleSearch">
            查询
          </a-button>
          <a-button size="small" style="margin-left: 10px" @click="handleReset">
            重置
          </a-button>
          <a-button
            type="primary"
            size="small"
            style="margin-left: 10px"
            @click="openAddDialog"
          >
            添加菜单
          </a-button>
        </a-form-item>
      </a-form>
    </div>

    <a-table
      :data-source="tableData"
      :columns="columnsList"
      :loading="tableLoading"
      :pagination="false"
      :scroll="{ x: 1100 }"
      row-key="id"
      bordered
      size="small"
      default-expand-all-rows
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'path'">
          {{ record.path || "-" }}
        </template>
        <template v-else-if="column.key === 'icon'">
          <span v-if="record.icon" class="menu-icon-cell">
            <i :class="record.icon"></i>
            <span class="menu-icon-text">{{ record.icon }}</span>
          </span>
          <span v-else>-</span>
        </template>
        <template v-else-if="column.key === 'type'">
          <a-tag :color="record.type === 0 ? 'blue' : 'green'">
            {{ record.type === 0 ? "目录" : "菜单" }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'status'">
          <a-tag :color="record.status === '1' ? 'green' : 'red'">
            {{ record.status === "1" ? "启用" : "停用" }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'updatedAt'">
          {{ formatDate(record.updatedAt) }}
        </template>
        <template v-else-if="column.key === 'action'">
          <a @click="openEditDialog(record as MenuRow)">编辑</a>
          <span class="action-divider">|</span>
          <a @click="openAddChildDialog(record as MenuRow)">添加子菜单</a>
          <span class="action-divider">|</span>
          <a-popconfirm
            title="确认删除该菜单吗？若有子菜单请先删除子菜单。"
            ok-text="确认"
            cancel-text="取消"
            @confirm="handleDelete(record as MenuRow)"
          >
            <a class="danger-link">删除</a>
          </a-popconfirm>
        </template>
      </template>
    </a-table>

    <MenuFormDialog
      v-model:open="dialogOpen"
      :is-edit-mode="dialogEditMode"
      :initial-record="dialogRecord"
      :parent-tree-options="parentTreeOptions"
      :default-parent-id="dialogDefaultParentId"
      @success="handleSearch"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { message } from "ant-design-vue";
import api from "@/api/apiList";
import config from "./config";
import MenuFormDialog from "./components/MenuFormDialog.vue";
import type { ColumnsType } from "ant-design-vue/es/table";
import type { MenuQueryForm, MenuRow } from "./types";
import { buildParentTreeOptions } from "./utils/parentTree";
import { hasNestedChildren, listToMenuTree } from "./utils/tree";

const { findMenuListInterface, deleteMenuByIdInterface } = api;
const { columns } = config;

const defaultSearchForm = (): MenuQueryForm => ({
  code: undefined,
  name: undefined,
  path: undefined,
  status: undefined,
});

const searchForm = reactive<MenuQueryForm>(defaultSearchForm());
const rawList = ref<MenuRow[]>([]);
const tableLoading = ref(false);

const dialogOpen = ref(false);
const dialogEditMode = ref(false);
const dialogRecord = ref<MenuRow | null>(null);
const dialogDefaultParentId = ref<number | null | undefined>(undefined);

const columnsList = computed<ColumnsType>(() => columns as ColumnsType);

const parentTreeOptions = computed(() =>
  buildParentTreeOptions(rawList.value, dialogRecord.value?.id),
);

const tableData = computed(() => {
  if (!rawList.value.length) {
    return [];
  }
  if (hasNestedChildren(rawList.value)) {
    return rawList.value;
  }
  return listToMenuTree(rawList.value);
});

const buildQueryParams = (): MenuQueryForm => {
  const params: MenuQueryForm = {};
  if (searchForm.id != null) params.id = searchForm.id;
  if (searchForm.parentId != null) params.parentId = searchForm.parentId;
  if (searchForm.code?.trim()) params.code = searchForm.code.trim();
  if (searchForm.name?.trim()) params.name = searchForm.name.trim();
  if (searchForm.path?.trim()) params.path = searchForm.path.trim();
  if (searchForm.status) params.status = searchForm.status;
  return params;
};

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const handleSearch = async () => {
  tableLoading.value = true;
  try {
    const res = await findMenuListInterface(
      buildQueryParams() as unknown as Record<string, unknown>,
    );
    if (res?.code === 200 || res?.code === 201) {
      const data = res?.data;
      rawList.value = Array.isArray(data) ? data : [];
      return;
    }
    rawList.value = [];
    message.error(res?.message || "获取菜单列表失败");
  } catch {
    rawList.value = [];
  } finally {
    tableLoading.value = false;
  }
};

const handleReset = () => {
  Object.assign(searchForm, defaultSearchForm());
  handleSearch();
};

const openAddDialog = () => {
  dialogEditMode.value = false;
  dialogRecord.value = null;
  dialogDefaultParentId.value = undefined;
  dialogOpen.value = true;
};

const openAddChildDialog = (record: MenuRow) => {
  dialogEditMode.value = false;
  dialogRecord.value = null;
  dialogDefaultParentId.value = record.id;
  dialogOpen.value = true;
};

const openEditDialog = (record: MenuRow) => {
  dialogEditMode.value = true;
  dialogRecord.value = { ...record };
  dialogDefaultParentId.value = undefined;
  dialogOpen.value = true;
};

const handleDelete = async (record: MenuRow) => {
  try {
    const res = await deleteMenuByIdInterface({ id: record.id });
    if (res?.code === 200 || res?.code === 201) {
      message.success(res?.message || "删除成功");
      handleSearch();
      return;
    }
    message.error(res?.message || "删除失败");
  } catch {
    // 错误由请求拦截器提示
  }
};

onMounted(() => {
  handleSearch();
});
</script>

<style scoped lang="scss">
.menu-container {
  width: 100%;
}

.header {
  margin-bottom: 16px;
}

.menu-icon-cell {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
}

.menu-icon-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.action-divider {
  margin: 0 6px;
  color: #d9d9d9;
}

.danger-link {
  color: #ff4d4f;
}
</style>
