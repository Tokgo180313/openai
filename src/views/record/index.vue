<template>
  <div class="record-container">
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
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
});
onMounted(() => {
  getRecordList();
});
const columnsList = ref(columns);
const recordList = ref<recordType[]>([]);
const getRecordList = () => {
  findRecordListInterface().then((res) => {
    recordList.value = res.data;
  });
};
</script>

<style scoped lang="scss">
.pagination {
  text-align: right;
}
</style>
