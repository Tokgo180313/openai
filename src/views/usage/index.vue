<template>
    <div class="use-record-container">
        <div class="header">
            <a-form layout="inline" :model="searchForm">
                <a-form-item label="用户账号">
                    <a-input v-model:value="searchForm.account" placeholder="请输入用户账号" />
                </a-form-item>
                <a-form-item>
                    <a-button type="primary" @click="getUsageList">查询</a-button>
                </a-form-item>
            </a-form>
        </div>
        <div class="content">
            <a-table :data-source="usageList" :columns="columnsList" :pagination="false" size="small" bordered striped scroll="max-height: 500px"></a-table>
        </div>
        <div class="pagination">
            <a-pagination :current="pagination.current" :pageSize="pagination.pageSize" :total="pagination.total" @change="paginationChangeEvent"></a-pagination>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { PaginationType } from '@/types/pagination';
import api from '@/api/apiList';
import config from './config';
const { columns } = config;
let { findUsageListInterface } = api;
interface searchFormType {
  account: string;
}
const searchForm = ref<searchFormType>({
  account: "",
});
interface UsageType {
  id: string;
  nickName: string;
  account: string;
  modelName: string;
  modelClassify: string;
  promptTokens: number;
  completionTokens: number;
}
const usageList = ref<UsageType[]>([]);
const columnsList = ref<TableColumnType[]>([]);
onMounted(() => {
  getUsageList();
  columnsList.value = columns;
});
const pagination = ref<PaginationType>({
  current: 1,
  pageSize: 10,
  total: 0,
});
const paginationChangeEvent = (page: number) => {
  pagination.value.current = page;
  getUsageList();
};
const getUsageList = async () => {
  const requestParam = {
    page: pagination.value.current,
    pageSize: pagination.value.pageSize,
    account: searchForm.value.account,
  };
  const res = await findUsageListInterface(requestParam);
  if (res.code === 201) {
    usageList.value = res.data.list ||res.data|| [];
    pagination.value.total = res.data.total;
  }
};
</script>

<style lang="scss" scoped>
.use-record-container {
    padding: 20px;
}
</style>