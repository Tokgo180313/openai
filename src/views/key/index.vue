<template>
  <div class="key-container">
    <div class="header">
      <a-form layout="inline" :model="searchForm">
        <a-form-item label="模型分类">
          <a-input
            v-model:value="searchForm.modelClassify"
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
        :data-source="keyList"
        :columns="columnsList"
        :pagination="false"
        size="small"
        bordered
        striped
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'action'">
            <a @click="handleEdit(record)">编辑</a>
            <span class="divider">|</span>
            <a-popconfirm
              title="确认删除该Key吗？"
              ok-text="确认"
              cancel-text="取消"
              @confirm="handleDelete(record)"
            >
              <a style="color: red">删除</a>
            </a-popconfirm>
          </template>
        </template>
      </a-table>
    </div>

    <add-key-dialog
      :visible="showAddVisible"
      @close="handleAddClose"
    />
    <update-key-dialog
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
import AddKeyDialog from "./components/AddKeyDialog.vue";
import UpdateKeyDialog from "./components/UpdateKeyDialog.vue";

let {
  findKeyListInterface,
  findByIdInterface,
  deleteByIdInterface,
} = api;

interface KeyType {
  id: string;
  modelClassify: string;
  baseURL: string;
  updateAt?: string;
}

const searchForm = reactive<{
  modelClassify?: string;
  baseURL?: string;
}>({
  modelClassify: "",
  baseURL: "",
});

const keyList = ref<KeyType[]>([]);

const columnsList = ref([
  {
    title: "模型分类",
    dataIndex: "modelClassify",
    key: "modelClassify",
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

const fetchKeyList = async () => {
  const dto = {
    modelClassify: searchForm.modelClassify || undefined,
    baseURL: searchForm.baseURL || undefined,
  };
  const res = await findKeyListInterface(dto);
  if (res?.code === 200 || res?.code === 201) {
    keyList.value = res?.data?.list || res?.data || [];
  } else {
    keyList.value = [];
    message.error(res?.message || "获取Key列表失败");
  }
};

const handleSearch = () => {
  fetchKeyList();
};

const showAddVisible = ref(false);
const handleAddClose = () => {
  showAddVisible.value = false;
  fetchKeyList();
};

const showUpdateVisible = ref(false);
const editRow = ref<KeyType | null>(null);

const handleEdit = async (record: KeyType) => {
  if (!record?.id) {
    message.error("缺少该Key的 id");
    return;
  }

  const res = await findByIdInterface({ id: record.id });
  if (res?.code === 200 || res?.code === 201) {
    editRow.value = res?.data || record;
    showUpdateVisible.value = true;
  } else {
    message.error(res?.message || "获取Key详情失败");
  }
};

const handleUpdateClose = () => {
  showUpdateVisible.value = false;
  editRow.value = null;
  fetchKeyList();
};

const handleDelete = (record: KeyType) => {
  if (!record?.id) return;
  deleteByIdInterface({ id: record.id })
    .then((res: any) => {
      if (res?.code === 200 || res?.code === 201) {
        message.success(res?.message || "删除成功");
        fetchKeyList();
      } else {
        message.error(res?.message || "删除失败");
      }
    })
    .catch((e: any) => {
      console.error(e);
      message.error("删除失败，请稍后重试");
    });
};

onMounted(() => {
  fetchKeyList();
});
</script>

<style scoped lang="scss">
.key-container {
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

