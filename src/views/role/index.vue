<template>
  <div class="role-container">
    <div class="header">
      <a-form :model="submitForm" layout="inline">
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
            style="width: 200px"
          >
            <a-select-option value="1">启用</a-select-option>
            <a-select-option value="0">禁用</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="handleSearch" size="small">查询</a-button>
          <a-button
            size="small"
            style="margin-left: 10px"
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
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="record.status === '1' ? 'green' : 'red'">{{
              record.status === "1" ? "启用" : "禁用"
            }}</a-tag>
          </template>
          <template v-if="column.key === 'action' && String(record.roleId) !== ROLE.SUPER_ADMIN">
            <a-button
              type="primary"
              danger
              v-if="record.status === '1'"
              @click="handleStop(record)"
              size="small"
              >停用</a-button
            >
            <a-button
              type="primary"
              v-if="record.status === '0'"
              @click="handleStart(record)"
              size="small"
              >启用</a-button
            >
          </template>
        </template>
      </a-table>
    </div>
    <div class="pagination"></div>
    <AddRoleDialog
      :visible="showAddRoleModal"
      @close-modal="closeAddRoleModalEvent"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from "vue";
import { message } from "ant-design-vue";
import AddRoleDialog from "./components/AddRoleDialog.vue";
import api from "@/api/manage/index.ts";
const { getRoleListInterface, stopRoleInterface, startRoleInterface } = api;
import config from "./config";
const { columns } = config;
import { Modal } from "ant-design-vue";
import { ROLE } from "@/constants/role";
interface submitFormType {
  name: string;
  status: string;
}
const submitForm = ref<submitFormType>({
  name: null,
  status: null,
});
interface RoleType {
  id: number;
  roleId?: number;
  name: string;
  status: string;
}
const tableData = ref<RoleType[]>([]);
const columnsList = computed(() => columns);
onMounted(() => {
  handleSearch();
});
const handleSearch = () => {
  getRoleListInterface(submitForm.value).then((res) => {
    if (res.code === 201) {
      tableData.value = res.data;
    } else {
      message.error(res.message);
      tableData.value = [];
    }
  });
};
const closeAddRoleModalEvent = () => {
  showAddRoleModal.value = false;
  handleSearch();
};
let showAddRoleModal = ref(false);
const handleAddRole = () => {
  showAddRoleModal.value = true;
};
const handleStop = (record: RoleType) => {
  Modal.confirm({
    title: "停用角色",
    content: "确定要停用该角色吗？",
    okText: "确认",
    cancelText: "取消",
    onOk() {
      stopRoleInterface({ id: record.id }).then((res) => {
        if (res.code === 201) {
          message.success(res.message);
          handleSearch();
        }
      });
    },
    onCancel() {
      console.log("取消");
    },
  });
};
const handleStart = (record: RoleType) => {
  Modal.confirm({
    title: "启用角色",
    content: "确定要启用该角色吗？",
    okText: "确认",
    cancelText: "取消",
    onOk() {
      startRoleInterface({ id: record.id }).then((res) => {
        if (res.code === 201) {
          message.success(res.message);
          handleSearch();
        }
      });
    },
    onCancel() {
      console.log("取消");
    },
  });
};
</script>

<style scoped lang="scss">
.pagination {
  text-align: right;
}
</style>
