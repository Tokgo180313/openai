<template>
  <div class="model-container">
    <div class="header">
      <a-form layout="inline" :model="searchForm">
        <a-form-item label="模型名称">
          <a-input
            v-model:value="searchForm.modelName"
            placeholder="请输入模型名称"
            allowClear
          />
        </a-form-item>
        <a-form-item label="模型类型">
          <a-select
            v-model:value="searchForm.modelClassify"
            placeholder="请选择模型类型"
            style="width: 200px"
            allowClear
          >
            <a-select-option v-for="item in modelClassifyList" :key="item">
              {{ item }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="创建时间">
          <a-range-picker v-model:value="searchForm.createTime" />
        </a-form-item>
        <a-form-item label="状态">
          <a-select
            v-model:value="searchForm.status"
            placeholder="请选择状态"
            style="width: 100px"
          >
            <a-select-option value="">全部</a-select-option>
            <a-select-option value="1">启用</a-select-option>
            <a-select-option value="0">禁用</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="handleSearch" size="small"
            >查询</a-button
          >
          <a-button
            @click="handleAdd"
            type="primary"
            size="small"
            style="margin-left: 10px"
            >新增</a-button
          >
        </a-form-item>
      </a-form>
    </div>
    <div class="content">
      <a-table
        :data-source="modelList"
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
          <template v-if="column.key === 'status'">
            <a-tag :color="record.status === '1' ? 'green' : 'red'">{{
              record.status === "1" ? "启用" : "禁用"
            }}</a-tag>
          </template>
          <template v-if="column.key === 'action'">
            <a @click="handleEdit(record)">编辑</a>
            <span class="divider">|</span>
            <a @click="handleDelete(record)">删除</a>
            <span class="divider">|</span>
            <a-popconfirm
              title="确定要停用该模型吗？"
              ok-text="确认"
              cancel-text="取消"
              @confirm="handleStop(record)"
            >
              <a v-if="record.status === '1'" style="color: red">停用</a>
            </a-popconfirm>
            <a-popconfirm
              title="确定要启用该模型吗？"
              ok-text="确认"
              cancel-text="取消"
              @confirm="handleEnable(record)"
            >
              <a v-if="record.status === '0'" style="color: green">启用</a>
            </a-popconfirm>
          </template>
        </template>
      </a-table>
      <a-pagination
        class="pagination"
        :pageSize="pagination.pageSize"
        :current="pagination.current"
        :total="pagination.total"
        @change="handleChangePage"
        @showSizeChange="handleChangePageSize"
        :pageSizeOptions="['10', '20', '30', '40', '50']"
        :showTotal="showTotal"
      >
      </a-pagination>
    </div>
    <add-model-dialog :visible="showAddVisible" @close="handleSuccess" />
    <edit-model-dialog
      :visible="showEditVisible"
      :record="editRecord"
      @close="showEditVisible = false"
      @success="handleEditSuccess"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from "vue";
import AddModelDialog from "./components/AddModelDialog.vue";
import EditModelDialog from "./components/EditModelDialog.vue";
import type { EditModelRecord } from "./components/EditModelDialog.vue";
import api from "@/api/apiList";
let {
  findModelListInterface,
  deleteModelInterface,
  enableModelInterface,
  disableModelInterface,
} = api;
import { Modal } from "ant-design-vue";
import config from "./config";
const { columns } = config;
import { useModelStore } from "@/stores/modelStore";
import { message } from "ant-design-vue";
import type { ModelItem } from "@/types/model.type";
import { getModelTypeLabel } from "@/types/model.type";
const modelStore = useModelStore();
const modelClassifyList = computed(() => modelStore.modelClassifyList);
interface searchFormType {
  modelName: string;
  modelClassify: string;
  createTime: Date[];
  status: string;
}

const searchForm = reactive<searchFormType>({
  modelName: "",
  modelClassify: null,
  createTime: [],
  status: "",
});
const modelList = ref<ModelItem[]>();
const columnsList = ref(columns);
const handleSearch = () => {
  getModelList();
};
const getModelList = async () => {
  const dto = {
    modelName: searchForm.modelName || undefined,
    modelClassify: searchForm.modelClassify || undefined,
    status: searchForm.status || undefined,
    page: pagination.current,
    pageSize: pagination.pageSize,
  };
  const res = await findModelListInterface(dto);
  if (res.code === 201) {
    modelList.value = res.data.list || res.data || [];
    pagination.total = res.data.total;
  } else {
    modelList.value = [];
    pagination.total = 0;
  }
};
onMounted(() => {
  modelStore.fetchModelClassifyList();
  getModelList();
});

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
});
const handleDelete = (record: ModelItem) => {
  Modal.confirm({
    title: "删除模型",
    content: "确定要删除该模型吗？",
    okText: "确认",
    cancelText: "取消",
    onOk() {
      deleteModelInterface({ id: record.id }).then((res) => {
        if (res.code === 200) {
          getModelList();
          message.success("删除成功");
        }
      });
    },
    onCancel() {
      console.log("取消删除");
    },
  });
};
const showAddVisible = ref(false);
const showEditVisible = ref(false);
const editRecord = ref<EditModelRecord | null>(null);
const handleAdd = () => {
  showAddVisible.value = true;
};
const handleEdit = (record: ModelItem) => {
  editRecord.value = {
    id: record.id,
    modelName: record.modelName,
    status: record.status,
    modelType: record.modelType,
  };
  showEditVisible.value = true;
};
const handleEditSuccess = () => {
  showEditVisible.value = false;
  editRecord.value = null;
  getModelList();
};
const handleSuccess = () => {
  showAddVisible.value = false;
  getModelList();
};
const handleEnable = (record: ModelItem) => {
  enableModelInterface({ id: record.id }).then((res) => {
    if (res.code === 200) {
      getModelList();
      message.success("启用成功");
    } else {
      message.error(res.message || "启用失败");
    }
  });
};
const handleStop = (record: ModelItem) => {
  disableModelInterface({ id: record.id }).then((res) => {
    if (res.code === 200) {
      getModelList();
      message.success("停用成功");
    } else {
      message.error(res.message || "停用失败");
    }
  });
};
const handleChangePage = (page: number) => {
  pagination.current = page;
  getModelList();
};
const handleChangePageSize = (pageSize: number) => {
  pagination.pageSize = pageSize;
  pagination.current = 1;
  getModelList();
};
const showTotal = (total: number) => {
  return `共 ${total} 条`;
};
</script>

<style scoped lang="scss">
.pagination {
  text-align: right;
}
.divider {
  display: inline-block;
  margin: 0 8px;
  color: #999;
}
</style>
