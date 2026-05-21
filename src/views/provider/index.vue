<template>
  <div class="provider-container">
    <div class="header">
      <a-form layout="inline" :model="searchForm">
        <a-form-item label="服务商">
          <a-input
            v-model:value="searchForm.provider"
            placeholder="可选"
            allowClear
          />
        </a-form-item>
        <a-form-item label="BaseURL">
          <a-input
            v-model:value="searchForm.baseURL"
            placeholder="可选"
            allowClear
          />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" size="small" @click="handleSearch"
            >查询</a-button
          >
          <a-button
            type="primary"
            size="small"
            style="margin-left: 10px"
            @click="showAddVisible = true"
            >新增</a-button
          >
        </a-form-item>
      </a-form>
    </div>

    <div class="content">
      <a-table
        :data-source="providerList"
        :columns="columnsList"
        :pagination="true"
        :pageSize="10"
        :current="pagination.current"
        @change="handleChangePage"
        @showSizeChange="handleChangePageSize"
        :pageSizeOptions="['10', '20', '30', '40', '50']"
        :showTotal="showTotal"
        size="small"
        bordered
        striped
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'action'">
            <a @click="handleEdit(record)">编辑</a>
            <span class="divider">|</span>
            <a-popconfirm
              title="确认删除该服务商吗？"
              ok-text="确认"
              cancel-text="取消"
              @confirm="handleDelete(record)"
            >
              <a style="color: red">删除</a>
            </a-popconfirm>
            <span class="divider">|</span>
            <a-popconfirm
              title="确定要更新该模型吗？"
              ok-text="确认"
              cancel-text="取消"
              @confirm="handleUpdateModel(record)"
            >
              <a>更新模型</a>
            </a-popconfirm>
          </template>
        </template>
      </a-table>

    </div>

    <add-provider-dialog
      :visible="showAddVisible"
      @close="handleAddClose"
    />
    <update-provider-dialog
      :visible="showUpdateVisible"
      :row="editRow"
      @close="handleUpdateClose"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import api from "@/api/apiList";
import { message } from "ant-design-vue";
import AddProviderDialog from "./components/AddProviderDialog.vue";
import UpdateProviderDialog from "./components/UpdateProviderDialog.vue";

let {
  findProviderListInterface,
  findByIdInterface,
  deleteByIdInterface,
  syncOpenAIModelsInterface,
} = api;

interface ProviderType {
  id: string;
  provider: string;
  baseURL: string;
  updateAt?: string;
}

const searchForm = reactive<{
  provider?: string;
  baseURL?: string;
}>({
  provider: "",
  baseURL: "",
});

const providerList = ref<ProviderType[]>([]);
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
});
onMounted(() => {
  fetchProviderList();
});
const columnsList = ref([
  {
    title: "服务商",
    dataIndex: "provider",
    key: "provider",
    ellipsis: true,
  },
  {
    title: "地址",
    dataIndex: "baseURL",
    key: "baseURL",
    ellipsis: true,
  },
  {
    title: "更新时间",
    dataIndex: "updatedAt",
    key: "updatedAt",
    ellipsis: true,
  },
  {
    title: "操作",
    key: "action",
  },
]);

const fetchProviderList = async () => {
  const dto = {
    provider: searchForm.provider || undefined,
    baseURL: searchForm.baseURL || undefined,
  };
  const res = await findProviderListInterface(dto);
  if (res?.code === 200 || res?.code === 201) {
    providerList.value = res?.data?.list || res?.data || [];
  } else {
    providerList.value = [];
    message.error(res?.message || "获取服务商列表失败");
  }
};

const handleSearch = () => {
  fetchProviderList();
};

const showAddVisible = ref(false);
const handleAddClose = () => {
  showAddVisible.value = false;
  fetchProviderList();
};

const showUpdateVisible = ref(false);
const editRow = ref<ProviderType | null>(null);

const handleEdit = async (record: ProviderType) => {
  if (!record?.id) {
    message.error("缺少该服务商的 id");
    return;
  }

  const res = await findByIdInterface({ id: record.id });
  if (res?.code === 200 || res?.code === 201) {
    editRow.value = res?.data || record;
    showUpdateVisible.value = true;
  } else {
    message.error(res?.message || "获取服务商详情失败");
  }
};

const handleUpdateClose = () => {
  showUpdateVisible.value = false;
  editRow.value = null;
  fetchProviderList();
};

const handleDelete = (record: ProviderType) => {
  if (!record?.id) return;
  deleteByIdInterface({ id: record.id })
    .then((res: any) => {
      if (res?.code === 200 || res?.code === 201) {
        message.success(res?.message || "删除成功");
        fetchProviderList();
      } else {
        message.error(res?.message || "删除失败");
      }
    })
    .catch((e: any) => {
      console.error(e);
      message.error("删除失败，请稍后重试");
    });
};

const handleUpdateModel = async (record: ProviderType) => {
  const res = await syncOpenAIModelsInterface({
    provider: record.provider,
  });
  if (res?.code === 200 || res?.code === 201) {
    message.success(res?.message || "更新模型成功");
  } else {
    message.error(res?.message || "更新模型失败");
  }
};
const handleChangePage = (page: number) => {
  pagination.current = page;
  fetchProviderList();
};
const handleChangePageSize = (pageSize: number) => {
  pagination.pageSize = pageSize;
  pagination.current = 1;
  fetchProviderList();
};
const showTotal = (total: number) => {
  return `共 ${total} 条`;
};
</script>

<style scoped lang="scss">
.provider-container {
  padding: 20px;
}

.header {
  margin-bottom: 10px;
}

.content {
  width: 100%;
}

.divider {
  display: inline-block;
  margin: 0 8px;
  color: #999;
}
</style>
