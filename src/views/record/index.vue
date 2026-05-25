<template>
  <div class="record-container">
    <div class="heaer">
      <a-form layout="inline" :model="searchForm">
        <a-form-item label="账号">
          <a-input v-model:value="searchForm.account" placeholder="请输入账号" style="width: 160px" allow-clear />
        </a-form-item>
        <a-form-item label="描述">
          <a-input v-model:value="searchForm.description" placeholder="请输入描述" style="width: 200px" allow-clear />
        </a-form-item>
        <a-form-item label="创建时间">
          <a-range-picker v-model:value="searchForm.createTime" style="width: 260px" />
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
        :pagination="false"
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
import { onMounted, reactive, ref } from "vue";
import dayjs, { type Dayjs } from "dayjs";
import api from "@/api/apiList";
let { findRecordListInterface } = api;
import config from "./config";
import { unwrapList, unwrapPagedMeta } from "@/api/response";
const { columns } = config;

function defaultTodayRange(): [Dayjs, Dayjs] {
  return [dayjs().startOf("day"), dayjs().endOf("day")];
}

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
  account: string | null;
  description: string | null;
  createTime: [Dayjs, Dayjs] | null;
}
const searchForm = ref<searchFormType>({
  account: null,
  description: null,
  createTime: defaultTodayRange(),
});
const handleSearch = () => {
  getRecordList();
};
const getRecordList = async () => {
  const range = searchForm.value.createTime;
  const param = {
    account: searchForm.value.account,
    description: searchForm.value.description,
    createdAtStart: range?.[0]?.startOf("day").format("YYYY-MM-DD HH:mm:ss"),
    createdAtEnd: range?.[1]?.endOf("day").format("YYYY-MM-DD HH:mm:ss"),
    page: pagination.current,
    pageSize: pagination.pageSize,
  };
  const res = await findRecordListInterface(param);
  if (res.code === 201) {
    recordList.value = unwrapList<recordType>(res.data);
    pagination.total = unwrapPagedMeta(res.data).total ?? recordList.value.length;
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
