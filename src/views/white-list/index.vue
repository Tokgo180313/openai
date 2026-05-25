<template>
  <div class="white-list-container">
    <div class="header">
      <a-form layout="inline" :model="searchForm">
        <a-form-item label="模型">
          <a-select
            v-model:value="searchForm.modelId"
            placeholder="全部"
            style="width: 220px"
            allow-clear
            show-search
            :filter-option="filterSelectOption"
            :options="modelOptions"
          />
        </a-form-item>
        <a-form-item label="参数路径">
          <a-input
            v-model:value="searchForm.paramPath"
            placeholder="可选，如 messages[].role"
            allow-clear
          />
        </a-form-item>
        <a-form-item label="段名">
          <a-input
            v-model:value="searchForm.paramKey"
            placeholder="可选"
            allow-clear
          />
        </a-form-item>
        <a-form-item label="参数类型">
          <a-select
            v-model:value="searchForm.paramType"
            placeholder="全部"
            style="width: 120px"
            allow-clear
            :options="paramTypeOptions"
          />
        </a-form-item>
        <a-form-item label="状态">
          <a-select
            v-model:value="searchForm.enabled"
            placeholder="全部"
            style="width: 100px"
            allow-clear
          >
            <a-select-option value="1">启用</a-select-option>
            <a-select-option value="0">禁用</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-button type="primary" size="small" @click="handleSearch">查询</a-button>
          <a-button
            type="primary"
            size="small"
            style="margin-left: 10px"
            @click="openAddRoot"
          >
            新增根参数
          </a-button>
        </a-form-item>
      </a-form>
    </div>

    <div class="content">
      <a-table
        :data-source="tableData"
        :columns="columnsList"
        bordered
        striped
        size="small"
        row-key="id"
        :pagination="false"
        :default-expand-all-rows="true"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'modelLabel'">
            {{ getModelLabel(record.modelId) }}
          </template>
          <template v-if="column.key === 'paramType'">
            {{ getParamTypeLabel(record.paramType) }}
          </template>
          <template v-if="column.key === 'itemParamType'">
            {{ getArrayItemParamTypeLabel(record.itemParamType) }}
          </template>
          <template v-if="column.key === 'required'">
            {{ String(record.required) === "1" ? "是" : "否" }}
          </template>
          <template v-if="column.key === 'defaultValue'">
            {{ formatDefaultValue(record.defaultValue) }}
          </template>
          <template v-if="column.key === 'enabled'">
            <a-tag :color="String(record.enabled) === '1' ? 'green' : 'red'">
              {{ String(record.enabled) === "1" ? "启用" : "禁用" }}
            </a-tag>
          </template>
          <template v-if="column.key === 'action'">
            <a
              v-if="isContainerParamType(record.paramType, record.itemParamType)"
              @click="openAddChild(record as ParamWhitelistItem)"
            >
              添加子参数
            </a>
            <span
              v-if="isContainerParamType(record.paramType, record.itemParamType)"
              class="divider"
            >|</span>
            <a @click="handleEdit(record as ParamWhitelistItem)">编辑</a>
            <span class="divider">|</span>
            <a-popconfirm
              title="确定要删除该参数吗？子参数需先删除。"
              ok-text="确认"
              cancel-text="取消"
              @confirm="handleDelete(record as ParamWhitelistItem)"
            >
              <a style="color: red">删除</a>
            </a-popconfirm>
            <span class="divider">|</span>
            <a-popconfirm
              v-if="String(record.enabled) === '1'"
              title="确定要禁用吗？"
              ok-text="确认"
              cancel-text="取消"
              @confirm="handleDisable(record as ParamWhitelistItem)"
            >
              <a style="color: red">禁用</a>
            </a-popconfirm>
            <a-popconfirm
              v-if="String(record.enabled) === '0'"
              title="确定要启用吗？"
              ok-text="确认"
              cancel-text="取消"
              @confirm="handleEnable(record as ParamWhitelistItem)"
            >
              <a style="color: green">启用</a>
            </a-popconfirm>
          </template>
        </template>
      </a-table>
      <a-pagination
        class="pagination"
        :page-size="pagination.pageSize"
        :current="pagination.current"
        :total="pagination.total"
        @change="handleChangePage"
        @show-size-change="handleChangePageSize"
        :page-size-options="['10', '20', '30', '40', '50']"
        :show-total="showTotal"
      />
    </div>

    <add-param-whitelist-dialog
      :visible="showAddVisible"
      :model-list="modelList"
      :whitelist-tree="whitelistTree"
      :initial-model-id="addContext.modelId"
      :initial-parent-id="addContext.parentId"
      @close="handleAddClose"
    />
    <update-param-whitelist-dialog
      :visible="showUpdateVisible"
      :row="editRow"
      :model-list="modelList"
      @close="handleUpdateClose"
      @success="handleUpdateSuccess"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from "vue";
import { message } from "ant-design-vue";
import api from "@/api/apiList";
import config from "./config";
import AddParamWhitelistDialog from "./components/AddParamWhitelistDialog.vue";
import UpdateParamWhitelistDialog from "./components/UpdateParamWhitelistDialog.vue";
import type { AiModelItem } from "@/types/ai-model.type";
import type { ColumnsType } from "ant-design-vue/es/table";
import { unwrapList, unwrapPagedMeta } from "@/api/response";
import { filterSelectOption } from "@/types/select-filter";
import type {
  ParamWhitelistItem,
  WhitelistTreeNode,
} from "@/types/param-whitelist.type";
import {
  PARAM_TYPES,
  formatDefaultValue,
  getArrayItemParamTypeLabel,
  getParamTypeLabel,
  isContainerParamType,
  normalizeWhitelistTree,
} from "@/types/param-whitelist.type";

const {
  findParamWhitelistListInterface,
  findParamWhitelistByIdInterface,
  deleteParamWhitelistByIdInterface,
  enableParamWhitelistByIdInterface,
  disableParamWhitelistByIdInterface,
  findAiModelListInterface,
} = api;

const { columns } = config;
const columnsList = ref<ColumnsType>(columns as ColumnsType);

const searchForm = reactive({
  modelId: undefined as string | undefined,
  paramPath: "",
  paramKey: "",
  paramType: undefined as string | undefined,
  enabled: undefined as string | undefined,
});

const whitelistTree = ref<WhitelistTreeNode[]>([]);
const modelList = ref<AiModelItem[]>([]);

const modelMap = computed(() => {
  const map = new Map<string, AiModelItem>();
  for (const m of modelList.value) {
    map.set(String(m.id), m);
  }
  return map;
});

const modelOptions = computed(() =>
  modelList.value.map((m) => ({
    label: `${m.provider} / ${m.modelCode}`,
    value: String(m.id),
  })),
);

const paramTypeOptions = PARAM_TYPES.map((t) => ({
  label: getParamTypeLabel(t),
  value: t,
}));

const tableData = computed(() =>
  attachModelLabel(whitelistTree.value),
);

function attachModelLabel(nodes: WhitelistTreeNode[]): WhitelistTreeNode[] {
  return nodes.map((node) => ({
    ...node,
    modelLabel: getModelLabel(node.modelId),
    children: node.children?.length ? attachModelLabel(node.children) : [],
  }));
}

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
});

const filterModelOption = filterSelectOption;

const getModelLabel = (modelId?: string) => {
  if (!modelId) return "-";
  const m = modelMap.value.get(String(modelId));
  if (!m) return modelId;
  return `${m.provider} / ${m.modelCode}`;
};

const fetchModelList = async () => {
  const res = await findAiModelListInterface({ page: 1, pageSize: 500 });
  if (res?.code === 200 || res?.code === 201) {
    modelList.value = unwrapList<AiModelItem>(res.data);
  } else {
    modelList.value = [];
  }
};

const fetchList = async () => {
  const dto = {
    modelId: searchForm.modelId || undefined,
    paramPath: searchForm.paramPath?.trim() || undefined,
    paramKey: searchForm.paramKey?.trim() || undefined,
    paramType: searchForm.paramType || undefined,
    enabled: searchForm.enabled || undefined,
    page: pagination.current,
    pageSize: pagination.pageSize,
  };
  const res = await findParamWhitelistListInterface(dto);
  if (res?.code === 200 || res?.code === 201) {
    const raw = unwrapList<ParamWhitelistItem>(res.data);
    whitelistTree.value = normalizeWhitelistTree(raw);
    pagination.total = unwrapPagedMeta(res.data).total ?? raw.length;
  } else {
    whitelistTree.value = [];
    pagination.total = 0;
    message.error(res?.message || "获取参数白名单列表失败");
  }
};

onMounted(() => {
  void fetchModelList();
  void fetchList();
});

const handleSearch = () => {
  pagination.current = 1;
  void fetchList();
};

const handleDelete = async (record: ParamWhitelistItem) => {
  const res = await deleteParamWhitelistByIdInterface({ id: String(record.id) });
  if (res?.code === 200 || res?.code === 201) {
    message.success(res?.message || "删除成功");
    void fetchList();
  } else {
    message.error(res?.message || "删除失败");
  }
};

const handleEnable = async (record: ParamWhitelistItem) => {
  const res = await enableParamWhitelistByIdInterface({ id: String(record.id) });
  if (res?.code === 200 || res?.code === 201) {
    message.success(res?.message || "启用成功");
    void fetchList();
  } else {
    message.error(res?.message || "启用失败");
  }
};

const handleDisable = async (record: ParamWhitelistItem) => {
  const res = await disableParamWhitelistByIdInterface({ id: String(record.id) });
  if (res?.code === 200 || res?.code === 201) {
    message.success(res?.message || "禁用成功");
    void fetchList();
  } else {
    message.error(res?.message || "禁用失败");
  }
};

const showAddVisible = ref(false);
const addContext = reactive({
  modelId: undefined as string | undefined,
  parentId: undefined as string | null | undefined,
});

const openAddRoot = () => {
  addContext.modelId = searchForm.modelId;
  addContext.parentId = null;
  showAddVisible.value = true;
};

const openAddChild = (parent: ParamWhitelistItem) => {
  addContext.modelId = String(parent.modelId);
  addContext.parentId = String(parent.id);
  showAddVisible.value = true;
};

const handleAddClose = () => {
  showAddVisible.value = false;
  addContext.modelId = undefined;
  addContext.parentId = undefined;
  void fetchList();
};

const showUpdateVisible = ref(false);
const editRow = ref<ParamWhitelistItem | null>(null);

const handleEdit = async (record: ParamWhitelistItem) => {
  const res = await findParamWhitelistByIdInterface({ id: String(record.id) });
  if (res?.code === 200 || res?.code === 201) {
    editRow.value = (res?.data ?? record) as ParamWhitelistItem;
    showUpdateVisible.value = true;
  } else {
    message.error(res?.message || "获取详情失败");
  }
};

const handleUpdateClose = () => {
  showUpdateVisible.value = false;
  editRow.value = null;
};

const handleUpdateSuccess = () => {
  handleUpdateClose();
  void fetchList();
};

const handleChangePage = (page: number) => {
  pagination.current = page;
  void fetchList();
};

const handleChangePageSize = (_current: number, pageSize: number) => {
  pagination.pageSize = pageSize;
  pagination.current = 1;
  void fetchList();
};

const showTotal = (total: number) => `共 ${total} 条`;
</script>

<style scoped lang="scss">
.white-list-container {
  padding: 20px;
}

.header {
  margin-bottom: 10px;
}

.pagination {
  margin-top: 12px;
  text-align: right;
}

.divider {
  display: inline-block;
  margin: 0 8px;
  color: #999;
}
</style>
