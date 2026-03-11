<template>
  <div class="role-container">
    <div class="header">
      <a-form :model="submitForm">
        <a-form-item label="角色名称" name="name">
          <a-input
            v-model:value="submitForm.name"
            allowClear
            placeholder="请输入角色名称"
          />
        </a-form-item>
        <a-form-item label="状态" name="status">
          <a-select
            v-model:value="submitForm.status"
            placeholder="请选择状态"
            allowClear
          >
            <a-select-option value="1">启用</a-select-option>
            <a-select-option value="0">禁用</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="handleSearch">查询</a-button>
          <a-button
            type="primary"
            @click="handleAddRole"
            @close-modal="closeAddRoleModalEvent"
            >添加角色</a-button
          >
        </a-form-item>
      </a-form>
    </div>
    <div class="content">
      <a-table
        :dataSource="tableData"
        :columns="columnsList"
        bordered
        striped
      ></a-table>
    </div>
    <div class="pagination"></div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from "vue";
import api from "@/api/manage/index.ts";
const { getRoleListInterface } = api;
import config from "./config";
const { columns } = config;
interface submitFormType {
  name: string;
  status: string;
}
const submitForm = ref<submitFormType>({
  name: "",
  status: "",
});
interface RoleType {
  id: number;
  roleId?: number;
  name: string;
  status: string;
}
const tableData = ref<RoleType[]>([]);
const columnsList = computed(()=>columns)
onMounted(() => {
  handleSearch();
});
const handleSearch = () => {
  getRoleListInterface(submitForm.value).then((res) => {});
};
const closeAddRoleModalEvent = () => {
  handleSearch();
};
</script>

<style scoped lang="scss">
.pagination {
  text-align: right;
}
</style>
