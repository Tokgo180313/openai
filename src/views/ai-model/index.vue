<template>
  <div class="ai-model-container">
    <div class="header">
      <a-form layout="inline" :model="searchForm">
        <a-form-item label="服务商">
          <a-select
            v-model:value="searchForm.provider"
            placeholder="全部"
            style="width: 160px"
            allow-clear
            :options="providerOptions"
          />
        </a-form-item>
        <a-form-item label="模型编码">
          <a-input
            v-model:value="searchForm.modelCode"
            placeholder="可选"
            allow-clear
          />
        </a-form-item>
        <a-form-item label="模型类型">
          <a-select
            v-model:value="searchForm.modelType"
            placeholder="全部"
            style="width: 120px"
            allow-clear
          >
            <a-select-option value="text">文本</a-select-option>
            <a-select-option value="image">图片</a-select-option>
            <a-select-option value="vision">视觉</a-select-option>
          </a-select>
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
            @click="showAddVisible = true"
          >
            新增
          </a-button>
        </a-form-item>
      </a-form>
    </div>

    <div class="content">
      <a-table
        :data-source="aiModelList"
        :columns="columnsList"
        bordered
        striped
        size="small"
        :pagination="false"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'modelType'">
            {{ getModelTypeLabel(record.modelType) }}
          </template>
          <template v-if="column.key === 'enabled'">
            <a-tag :color="String(record.enabled) === '1' ? 'green' : 'red'">
              {{ String(record.enabled) === "1" ? "启用" : "禁用" }}
            </a-tag>
          </template>
          <template v-if="column.key === 'action'">
            <a @click="handleEdit(record as AiModelItem)">编辑</a>
            <span class="divider">|</span>
            <a-popconfirm
              title="确定要删除该模型吗？"
              ok-text="确认"
              cancel-text="取消"
              @confirm="handleDelete(record as AiModelItem)"
            >
              <a style="color: red">删除</a>
            </a-popconfirm>
            <span class="divider">|</span>
            <a-popconfirm
              v-if="String(record.enabled) === '1'"
              title="确定要禁用该模型吗？"
              ok-text="确认"
              cancel-text="取消"
              @confirm="handleDisable(record as AiModelItem)"
            >
              <a style="color: red">禁用</a>
            </a-popconfirm>
            <a-popconfirm
              v-if="String(record.enabled) === '0'"
              title="确定要启用该模型吗？"
              ok-text="确认"
              cancel-text="取消"
              @confirm="handleEnable(record as AiModelItem)"
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

    <add-ai-model-dialog
      :visible="showAddVisible"
      :provider-list="providerList"
      @close="handleAddClose"
    />
    <update-ai-model-dialog
      :visible="showUpdateVisible"
      :row="editRow"
      :provider-list="providerList"
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
import AddAiModelDialog from "./components/AddAiModelDialog.vue";
import UpdateAiModelDialog from "./components/UpdateAiModelDialog.vue";
import type { ColumnsType } from "ant-design-vue/es/table";
import { unwrapList, unwrapPagedMeta } from "@/api/response";
import type { AiModelItem } from "@/types/ai-model.type";
import { getModelTypeLabel } from "@/types/ai-model.type";

const {
  findAiModelListInterface,
  findAiModelByIdInterface,
  deleteAiModelByIdInterface,
  enableAiModelByIdInterface,
  disableAiModelByIdInterface,
  findAiModelProviderListInterface,
} = api;

const { columns } = config;
const columnsList = ref<ColumnsType>(columns as ColumnsType);

const searchForm = reactive({
  provider: undefined as string | undefined,
  modelCode: "",
  modelType: undefined as string | undefined,
  enabled: undefined as string | undefined,
});

const aiModelList = ref<AiModelItem[]>([]);
const providerList = ref<string[]>([]);
const providerOptions = computed(() =>
  providerList.value.map((p) => ({ label: p, value: p })),
);

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
});

const fetchProviderList = async () => {
  const res = await findAiModelProviderListInterface();
  if (res?.code === 200 || res?.code === 201) {
    providerList.value = unwrapList<string>(res.data);
  } else {
    providerList.value = [];
  }
};

const getAiModelList = async () => {
  const dto = {
    provider: searchForm.provider || undefined,
    modelCode: searchForm.modelCode?.trim() || undefined,
    modelType: searchForm.modelType || undefined,
    enabled: searchForm.enabled || undefined,
    page: pagination.current,
    pageSize: pagination.pageSize,
  };
  const res = await findAiModelListInterface(dto);
  if (res?.code === 200 || res?.code === 201) {
    aiModelList.value = unwrapList<AiModelItem>(res.data);
    const meta = unwrapPagedMeta(res.data);
    pagination.total = meta.total ?? aiModelList.value.length;
  } else {
    aiModelList.value = [];
    pagination.total = 0;
    message.error(res?.message || "获取模型列表失败");
  }
};

onMounted(() => {
  void fetchProviderList();
  void getAiModelList();
});

const handleSearch = () => {
  pagination.current = 1;
  void getAiModelList();
};

const handleDelete = async (record: AiModelItem) => {
  const res = await deleteAiModelByIdInterface({ id: String(record.id) });
  if (res?.code === 200 || res?.code === 201) {
    message.success(res?.message || "删除成功");
    void getAiModelList();
  } else {
    message.error(res?.message || "删除失败");
  }
};

const handleEnable = async (record: AiModelItem) => {
  const res = await enableAiModelByIdInterface({ id: String(record.id) });
  if (res?.code === 200 || res?.code === 201) {
    message.success(res?.message || "启用成功");
    void getAiModelList();
  } else {
    message.error(res?.message || "启用失败");
  }
};

const handleDisable = async (record: AiModelItem) => {
  const res = await disableAiModelByIdInterface({ id: String(record.id) });
  if (res?.code === 200 || res?.code === 201) {
    message.success(res?.message || "禁用成功");
    void getAiModelList();
  } else {
    message.error(res?.message || "禁用失败");
  }
};

const showAddVisible = ref(false);
const handleAddClose = () => {
  showAddVisible.value = false;
  void getAiModelList();
  void fetchProviderList();
};

const showUpdateVisible = ref(false);
const editRow = ref<AiModelItem | null>(null);

const handleEdit = async (record: AiModelItem) => {
  const res = await findAiModelByIdInterface({ id: String(record.id) });
  if (res?.code === 200 || res?.code === 201) {
    editRow.value = (res?.data ?? record) as AiModelItem;
    showUpdateVisible.value = true;
  } else {
    message.error(res?.message || "获取模型详情失败");
  }
};

const handleUpdateClose = () => {
  showUpdateVisible.value = false;
  editRow.value = null;
};

const handleUpdateSuccess = () => {
  handleUpdateClose();
  void getAiModelList();
};

const handleChangePage = (page: number) => {
  pagination.current = page;
  void getAiModelList();
};

const handleChangePageSize = (_current: number, pageSize: number) => {
  pagination.pageSize = pageSize;
  pagination.current = 1;
  void getAiModelList();
};

const showTotal = (total: number) => `共 ${total} 条`;
</script>

<style scoped lang="scss">
.ai-model-container {
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
