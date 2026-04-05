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
        <a-form-item>
          <a-button type="primary" @click="handleSearch" size="small">查询</a-button>
          <a-button @click="handleAdd" type="primary" size="small" style="margin-left: 10px">新增</a-button>
          <a-button @click="handleUpdateApiKey" type="primary" size="small" style="margin-left: 10px">更新ApiKey</a-button>
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
          <template v-if="column.key === 'action'">
            <a @click="handleDelete(record)">删除</a>
          </template>
        </template>
      </a-table>
    </div>
    <div class="pagination">
      <a-pagination
        :pageSize="pagination.pageSize"
        :current="pagination.current"
        :total="pagination.total"
      ></a-pagination>
    </div>
    <add-model-dialog :visible="showAddVisible" @close="handleSuccess" />
    <update-api-key-dialog :visible="showUpdateApiKeyVisible" @close="handleUpdateApiKeySuccess" />
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from "vue";
import AddModelDialog from "./components/AddModelDialog.vue";
import UpdateApiKeyDialog from "./components/UpdateApiKeyDialog.vue";
import api from "@/api/apiList";
let { findModelListInterface, deleteModelInterface} = api;
import { Modal } from "ant-design-vue";
import config from "./config";
const { columns } = config;
import { useModelStore } from "@/stores/modelStore";
import { message } from "ant-design-vue";
const modelStore = useModelStore();
const modelClassifyList = computed(() => modelStore.modelClassifyList);
interface searchFormType {
  modelName: string;
  modelClassify: string;
  createTime: Date[];
}

const searchForm = reactive<searchFormType>({
  modelName: "",
  modelClassify: null,
  createTime: [],
});
interface modelType {
  id: string;
  modelName: string;
  modelClassify: string;
  createdAt: Date;
}

const modelList = ref<modelType[]>();
const columnsList = ref(columns);
const handleSearch = () => {
  getModelList();
};
const getModelList = async () => {
  const dto = {
    modelName: searchForm.modelName || undefined,
    modelClassify: searchForm.modelClassify || undefined,
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
const handleDelete = (record: modelType) => {
  Modal.confirm({
    title: "删除模型",
    content: "确定要删除该模型吗？",
    okText: "确认",
    cancelText: "取消",
    onOk() {
      deleteModelInterface({id: record.id}).then((res) => {
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
const handleAdd = () => {
  showAddVisible.value = true;
};
const handleSuccess = () => {
  showAddVisible.value = false;
  getModelList();
};  
const showUpdateApiKeyVisible = ref(false);
const handleUpdateApiKey = () => {
  showUpdateApiKeyVisible.value = true;
};
const handleUpdateApiKeySuccess = () => {
  showUpdateApiKeyVisible.value = false;
  getModelList();
};
</script>

<style scoped lang="scss">
.pagination {
  text-align: right;
}
</style>
