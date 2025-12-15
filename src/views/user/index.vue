<template>
  <div class="container">
    <div class="header">
      <div class="search-item">
        <a-input :value="searchForm.name" placeholder="请输入帐号"></a-input>
      </div>
      <div class="search-item">
        <a-button type="primary" @click="searchEvent"> 搜索 </a-button>
        <a-button @click="showAddUserDialog">新增</a-button>
      </div>
    </div>
    <a-table :dataSource="dataSource" :columns="columns" :pagination="false">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key == 'action'">
          <a-popconfirm title="此操作将重置用户密码，是否确认重置" @confirm="resetEvent(record)">
            <a-button type="text" >重置</a-button>
          </a-popconfirm>
          <a-popconfirm title="此操作将永久删除该用户，是否确认删除？" @confirm="removeEvent(record)">
            <template #icon> <QestionCircleOutlined  style="color:red;"/> </template>
            <a-button type="text" v-show="record.roleId!=='0'">删除</a-button>
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
      @close-modal="closeModalEvent"
    ></UserAddDialog>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import UserAddDialog from "@/components/UserAddDialog.vue";
import { UserType, columnType, searchFormType } from "./types/UserType";
import { PaginationType } from "@/types/pagination";
import api from "@/api/apiList";
import { message } from "ant-design-vue";
let {
  updateUserInfoInterface,
  findAllUserInfoInterface,
  removeUserInfoInterface,
  resetUserInfoInterface,
} = api;
const searchForm = ref<searchFormType>({
  name: "",
});
const showAddUserVisible = ref<boolean>(false);
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
const resetEvent = function (row: UserType) {
  resetUserInfoInterface({id:row._id}).then(res=>{
    if(res.code ===200){
      message.success(res.message)
    }
  })
};
const removeEvent = function (row: UserType) {
  console.log({id:row._id})
  removeUserInfoInterface({id:row._id}).then((res) => {
    if(res.code ===200){
      message.success(res.message)
      findAllUserInfoImpl()
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
      dataSource.value = res.data;
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
  width: 100vw;
  height: 100vh;
}
.header {
  display: flex;
  justify-content: flex-start;
  .search-item {
    line-height: 2rem;
    height: 2rem;
    margin: 0 1rem;
  }
  padding: 1em 0;
}
.pagination {
  text-align: right;
  margin-right: 1em;
}
</style>
