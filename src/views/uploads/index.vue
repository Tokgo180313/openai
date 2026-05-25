<template>
  <div class="uploads-container">
    <div class="header">
      <a-form layout="inline" :model="searchForm">
        <a-form-item label="关键词">
          <a-input
            v-model:value="searchForm.keyword"
            placeholder="文件名"
            allow-clear
            style="width: 180px"
          />
        </a-form-item>
        <a-form-item label="状态">
          <a-select
            v-model:value="searchForm.status"
            placeholder="全部"
            allow-clear
            style="width: 120px"
            :options="statusOptions"
          />
        </a-form-item>
        <a-form-item label="类型">
          <a-select
            v-model:value="searchForm.fileType"
            placeholder="全部"
            allow-clear
            style="width: 120px"
            :options="fileTypeOptions"
          />
        </a-form-item>
        <a-form-item label="来源">
          <a-select
            v-model:value="searchForm.source"
            placeholder="全部"
            allow-clear
            style="width: 140px"
            :options="sourceOptions"
          />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" size="small" @click="handleSearch">
            查询
          </a-button>
          <!-- <a-button
            type="primary"
            size="small"
            style="margin-left: 10px"
            @click="showAddVisible = true"
          >
            上传文件
          </a-button> -->
        </a-form-item>
      </a-form>
    </div>

    <div class="content">
      <a-table
        :data-source="tableData"
        :columns="columnsList"
        :loading="loading"
        bordered
        striped
        size="small"
        row-key="id"
        :pagination="false"
        :scroll="{ x: 1200 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'fileType'">
            {{ getUploadFileTypeLabel(record.fileType) }}
          </template>
          <template v-if="column.key === 'size'">
            {{ formatFileSize(record.size) }}
          </template>
          <template v-if="column.key === 'source'">
            {{ getUploadSourceLabel(record.source) }}
          </template>
          <template v-if="column.key === 'status'">
            <a-tag :color="statusColor(record.status)">
              {{ getUploadStatusLabel(record.status) }}
            </a-tag>
          </template>
          <template v-if="column.key === 'action'">
            <a @click="handleView(record as UploadFileRecord)">详情</a>
            <span class="divider">|</span>
            <a @click="handleEdit(record as UploadFileRecord)">编辑</a>
            <span class="divider">|</span>
            <a @click="handleDownload(record as UploadFileRecord)">下载</a>
            <span class="divider">|</span>
            <a-popconfirm
              v-if="record.status === 'temp'"
              title="确定标记为已使用吗？"
              ok-text="确认"
              cancel-text="取消"
              @confirm="handleMarkUsed(record as UploadFileRecord)"
            >
              <a>标记已用</a>
            </a-popconfirm>
            <span v-if="record.status === 'temp'" class="divider">|</span>
            <a-popconfirm
              title="确定删除该文件吗？"
              ok-text="确认"
              cancel-text="取消"
              @confirm="handleDelete(record as UploadFileRecord)"
            >
              <a style="color: red">删除</a>
            </a-popconfirm>
          </template>
        </template>
      </a-table>
      <a-pagination
        class="pagination"
        :page-size="pagination.pageSize"
        :current="pagination.current"
        :total="pagination.total"
        @change="handleChangePage"
        @show-size-change="handleChangePageSize"
        :page-size-options="['10', '20', '30', '40', '50']"
        :show-total="showTotal"
      />
    </div>

    <add-upload-file-dialog
      :visible="showAddVisible"
      @close="handleAddClose"
    />
    <update-upload-file-dialog
      :visible="showUpdateVisible"
      :file-id="editFileId"
      @close="handleUpdateClose"
      @success="fetchList"
    />
    <upload-file-detail-dialog
      :visible="showDetailVisible"
      :file-id="detailFileId"
      @close="handleDetailClose"
    />
  </div>
</template>

<script lang="ts" setup>
import { onMounted, reactive, ref } from "vue";
import { message } from "ant-design-vue";
import api from "@/api/apiList";
import type { ColumnsType } from "ant-design-vue/es/table";
import config from "./config";
import AddUploadFileDialog from "./components/AddUploadFileDialog.vue";
import UpdateUploadFileDialog from "./components/UpdateUploadFileDialog.vue";
import UploadFileDetailDialog from "./components/UploadFileDetailDialog.vue";
import { downloadUploadFileWithAuth } from "./utils/download";
import type {
  UploadFileRecord,
  UploadFileSource,
  UploadFileStatus,
  UploadFileType,
} from "@/types/upload-file.type";
import {
  UPLOAD_FILE_SOURCE_OPTIONS,
  UPLOAD_FILE_STATUS_OPTIONS,
  UPLOAD_FILE_TYPE_OPTIONS,
  formatFileSize,
  getUploadFileTypeLabel,
  getUploadSourceLabel,
  getUploadStatusLabel,
} from "@/types/upload-file.type";

const {
  findUploadFileListApi,
  deleteUploadFileByIdApi,
  markUploadFileUsedApi,
} = api;

const { columns } = config;
const columnsList = ref<ColumnsType>(columns as ColumnsType);

const statusOptions = UPLOAD_FILE_STATUS_OPTIONS.map((item) => ({
  value: item.value,
  label: item.label,
}));
const fileTypeOptions = UPLOAD_FILE_TYPE_OPTIONS.map((item) => ({
  value: item.value,
  label: item.label,
}));
const sourceOptions = UPLOAD_FILE_SOURCE_OPTIONS.map((item) => ({
  value: item.value,
  label: item.label,
}));

const searchForm = reactive<{
  keyword?: string;
  status?: UploadFileStatus;
  fileType?: UploadFileType;
  source?: UploadFileSource;
}>({
  keyword: "",
  status: undefined,
  fileType: undefined,
  source: undefined,
});

const tableData = ref<UploadFileRecord[]>([]);
const loading = ref(false);
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
});

const statusColor = (status?: UploadFileStatus) => {
  if (status === "used") return "green";
  if (status === "deleted") return "red";
  return "blue";
};

const fetchList = async () => {
  loading.value = true;
  try {
    const res = (await findUploadFileListApi({
      currentPage: pagination.current,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword?.trim() || undefined,
      status: searchForm.status,
      fileType: searchForm.fileType,
      source: searchForm.source,
    })) as {
      code?: number;
      message?: string;
      data?: {
        list?: UploadFileRecord[];
        total?: number;
        currentPage?: number;
      };
    };
    if (res?.code === 200 || res?.code === 201) {
      tableData.value = res.data?.list ?? [];
      pagination.total = res.data?.total ?? 0;
      if (res.data?.currentPage) {
        pagination.current = res.data.currentPage;
      }
    } else {
      tableData.value = [];
      pagination.total = 0;
      message.error(res?.message || "获取文件列表失败");
    }
  } catch {
    tableData.value = [];
    pagination.total = 0;
    message.error("获取文件列表失败");
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchList();
});

const handleSearch = () => {
  pagination.current = 1;
  fetchList();
};

const handleChangePage = (page: number) => {
  pagination.current = page;
  fetchList();
};

const handleChangePageSize = (_current: number, pageSize: number) => {
  pagination.pageSize = pageSize;
  pagination.current = 1;
  fetchList();
};

const showTotal = (total: number) => `共 ${total} 条`;

const showAddVisible = ref(false);
const handleAddClose = () => {
  showAddVisible.value = false;
  fetchList();
};

const showUpdateVisible = ref(false);
const editFileId = ref<number | null>(null);

const handleEdit = (record: UploadFileRecord) => {
  editFileId.value = record.id;
  showUpdateVisible.value = true;
};

const handleUpdateClose = () => {
  showUpdateVisible.value = false;
  editFileId.value = null;
};

const showDetailVisible = ref(false);
const detailFileId = ref<number | null>(null);

const handleView = (record: UploadFileRecord) => {
  detailFileId.value = record.id;
  showDetailVisible.value = true;
};

const handleDetailClose = () => {
  showDetailVisible.value = false;
  detailFileId.value = null;
};

const handleDelete = async (record: UploadFileRecord) => {
  try {
    const res = (await deleteUploadFileByIdApi(record.id)) as {
      code?: number;
      message?: string;
    };
    if (res?.code === 200 || res?.code === 201) {
      message.success(res.message || "删除成功");
      fetchList();
    } else {
      message.error(res?.message || "删除失败");
    }
  } catch {
    message.error("删除失败，请稍后重试");
  }
};

const handleMarkUsed = async (record: UploadFileRecord) => {
  try {
    const res = (await markUploadFileUsedApi(record.id)) as {
      code?: number;
      message?: string;
    };
    if (res?.code === 200 || res?.code === 201) {
      message.success(res.message || "已标记为使用中");
      fetchList();
    } else {
      message.error(res?.message || "操作失败");
    }
  } catch {
    message.error("操作失败，请稍后重试");
  }
};

const handleDownload = async (record: UploadFileRecord) => {
  try {
    await downloadUploadFileWithAuth(record.id, record.originalName);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "下载失败";
    message.error(msg);
  }
};
</script>

<style scoped lang="scss">
.uploads-container {
  padding: 20px;
}

.header {
  margin-bottom: 10px;
}

.content {
  width: 100%;
}

.pagination {
  margin-top: 16px;
  text-align: right;
}

.divider {
  display: inline-block;
  margin: 0 8px;
  color: #999;
}
</style>
