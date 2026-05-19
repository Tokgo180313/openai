<template>
  <div class="container">
    <div class="header">
      <div class="search-item">
        <a-input
          v-model:value="searchForm.name"
          placeholder="请输入帐号"
          allowClear
        ></a-input>
      </div>
      <div class="search-item">
        <a-button type="primary" @click="searchEvent"> 搜索 </a-button>
        <a-button @click="showAddUserDialog" style="margin-left: 1em"
          >新增</a-button
        >
      </div>
    </div>
    <a-table :dataSource="dataSource" :columns="columns" :pagination="false" size="small" bordered height="500px">
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex == 'roleId'">
          <span>{{ getRoleName(record.roleId) }}</span>
        </template>
        <template v-if="column.key == 'action'">
          <a-popconfirm
            title="此操作将重置用户密码，是否确认重置"
            @confirm="resetEvent(record)"
          >
            <a-button type="text" v-if="showRemoveIcon">重置</a-button>
          </a-popconfirm>
          <a-popconfirm
            title="此操作将永久删除该用户，是否确认删除？"
            @confirm="removeEvent(record)"
          >
            <template #icon>
              <QestionCircleOutlined style="color: red" />
            </template>
            <a-button type="text" style="color: red" v-if="showRemoveIcon"
              >删除</a-button
            >
          </a-popconfirm>
        </template>
      </template>
    </a-table>
    <div class="pagination">
      <a-pagination
        :current="pagination.current"
        :pageSize="pagination.pageSize"
        :total="pagination.total"
        @change="paginationChangeEvent"
      ></a-pagination>
    </div>
    <UserAddDialog
      :visible="showAddUserVisible"
      :default-parent-id="currentParentId"
      @close-modal="closeModalEvent"
    ></UserAddDialog>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from "vue";
import UserAddDialog from "@/components/UserAddDialog.vue";
import { useAuthStore } from "@/stores/authStore";
import { UserType, columnType, searchFormType } from "./types/UserType";
import { PaginationType } from "@/types/pagination";
import api from "@/api/apiList";
import { message } from "ant-design-vue";
import { getRoleName, isNormalUser } from "@/constants/role";
let {
  updateUserInfoInterface,
  findAllUserInfoInterface,
  removeUserInfoInterface,
  resetUserInfoInterface,
} = api;
const authStore = useAuthStore();
/** 新增用户时的上级 id，默认当前登录用户 */
const currentParentId = computed(() => authStore.getUserId ?? "");

const searchForm = ref<searchFormType>({
  name: "",
});
const showAddUserVisible = ref<boolean>(false);
const showRemoveIcon = computed(() => {
  const roleId = authStore.getRoleId ?? sessionStorage.getItem("role_id");
  return !isNormalUser(roleId);
});
const pagination = ref<PaginationType>({
  current: 1,
  pageSize: 20,
  total: 0,
});
const requestParam = computed(() => {
  return {
    name: searchForm.value.name,
    current: pagination.value.current,
    pageSize: pagination.value.pageSize,
  };
});
const dataSource = ref<UserType[]>([]);
const columns = ref<columnType[]>([
  {
    title: "账号",
    dataIndex: "account",
  },
  {
    title: "角色",
    dataIndex: "roleId",
  },
  {
    title: "操作",
    key: "action",
  },
]);
onMounted(() => {
  findAllUserInfoImpl();
});
const resetEvent = function (row: UserType) {
  resetUserInfoInterface({ id: row.id }).then((res) => {
    if (res.code === 201) {
      message.success(res.message);
    }
  });
};
const removeEvent = function (row: UserType) {
  console.log({ id: row.id });
  removeUserInfoInterface({ id: row.id }).then((res) => {
    if (res.code === 200) {
      message.success(res.message);
      findAllUserInfoImpl();
    }
  });
};
const searchEvent = function () {
  findAllUserInfoImpl();
};
const paginationChangeEvent = function (page, pageSize) {
  pagination.value.current = page;
  pagination.vlaue.pageSize = pageSize;
  findAllUserInfoImpl();
};
const findAllUserInfoImpl = function () {
  findAllUserInfoInterface(requestParam.value).then((res) => {
    if (res.code === 201) {
      dataSource.value = res.data.list || [];
      pagination.value.total = res.data.total;
    } else {
      dataSource.vlaue = [];
    }
  });
};
const showAddUserDialog = function () {
  showAddUserVisible.value = true;
};
const closeModalEvent = function (value) {
  showAddUserVisible.value = false;
  if (value) {
    findAllUserInfoImpl();
  }
};
</script>

<style scoped lang="scss">
.container {
  height: 100%;
  width: 100%;
}
.header {
  display: flex;
  justify-content: flex-start;
  .search-item {
    line-height: 2rem;
    height: 2rem;
    margin: 0 0.5em;
  }
  padding: 1em 0;
}
.pagination {
  text-align: right;
  margin: 0.3em 0.5em;
}
</style>
