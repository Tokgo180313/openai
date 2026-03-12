<template>
  <div class="record-container">
    <div class="heaer">
      <a-form layout="inline" :model="searchForm">
        <a-form-item label="用户账号">
          <a-input v-model:value="searchForm.account" placeholder="请输入用户账号" style="width: 120px" />
        </a-form-item>
        <a-form-item label="模型名称">
          <a-select v-model:value="searchForm.modelName" placeholder="请选择模型名称" style="width: 200px">
            <a-select-option v-for="item in modelList" :key="item">{{ item }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="模型类型">
          <a-select v-model:value="searchForm.modelClassify" placeholder="请选择模型类型" style="width: 120px">
            <a-select-option v-for="item in modelClassifyList" :key="item">{{ item }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="创建时间">
          <a-range-picker v-model:value="searchForm.createTime" />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="handleSearch" size="small">查询</a-button>
        </a-form-item>
      </a-form>
    </div>
    <div class="content">
      <a-table
        :data-source="recordList"
        :columns="columnsList"
        bordered
        striped
        size="small"
      ></a-table>
    </div>
    <div class="pagination">
      <a-pagination
        :pageSize="pagination.pageSize"
        :current="pagination.current"
        :total="pagination.total"
        @change="handleChangePage"
        @showSizeChange="handleChangePageSize"
        :pageSizeOptions="['10', '20', '30', '40', '50']"
        :showTotal="showTotal"
      ></a-pagination>
    </div>
  </div>
</template>

<script lang="ts" setup>
// 操作日志
import { computed, onMounted, reactive, ref } from "vue";
import api from "@/api/apiList";
let { findRecordListInterface } = api;
import config from "./config";
const { columns } = config;
import { useModelStore } from "@/stores/modelStore";
const modelStore = useModelStore();
const modelClassifyList = computed(() => modelStore.getModelClassifyList);
const modelList = computed(() => modelStore.getModelList);
interface recordType {
  id: string;
  userId: string;
  userName: string;
  account: string;
  modelName: string;
  classify: string;
  recordType: string;
  createTime: Date;
}
interface searchFormType {
  nickName: string | null;
  account: string | null;
  modelName: string | null;
  modelClassify: string | null;
  createTime: Date[] | null;
}
const searchForm = ref<searchFormType>({
  nickName: null,
  account: null,
  modelName: null,
  modelClassify: null,
  createTime: null,
});
const handleSearch = () => {
  getRecordList();
};
const getRecordList = async () => {
  const param = {
    nickName: searchForm.value.nickName,
    account: searchForm.value.account,
    modelName: searchForm.value.modelName,
    modelClassify: searchForm.value.modelClassify,
    createTime: searchForm.value.createTime,
    page: pagination.current,
    pageSize: pagination.pageSize,
  };
  const res = await findRecordListInterface(param);
  if (res.code === 200) {
    recordList.value = res.data.list;
    pagination.total = res.data.total;
  }
};
const columnsList = ref(columns);
const recordList = ref<recordType[]>([]);
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
});
onMounted(() => {
  getRecordList();
});
const handleChangePage = (page: number) => {
  pagination.current = page;
  getRecordList();
};
const handleChangePageSize = (pageSize: number) => {
  pagination.current = 1;
  pagination.pageSize = pageSize;
  getRecordList();
};
const showTotal = (total: number) => {
  return `共 ${total} 条`;
};
</script>

<style scoped lang="scss">
.pagination {
  text-align: right;
}
</style>
