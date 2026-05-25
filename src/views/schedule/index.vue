<template>
  <div class="schedule-container">
    <div class="header">
      <a-form layout="inline" :model="searchForm">
        <a-form-item label="任务名">
          <a-input
            v-model:value="searchForm.name"
            placeholder="请输入任务名"
            allowClear
          />
        </a-form-item>
        <a-form-item label="启用状态">
          <a-select
            v-model:value="searchForm.isEnabled"
            placeholder="全部"
            allowClear
            style="width: 120px"
          >
            <a-select-option value="1">启用</a-select-option>
            <a-select-option value="0">禁用</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="执行状态">
          <a-select
            v-model:value="searchForm.status"
            placeholder="全部"
            allowClear
            style="width: 150px"
          >
            <a-select-option
              v-for="item in statusOptions"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="handleSearch">查询</a-button>
          <a-button style="margin-left: 10px" @click="openAddModal">新增</a-button>
        </a-form-item>
      </a-form>
    </div>

    <a-table
      :data-source="scheduleList"
      :columns="columns"
      :pagination="false"
      :loading="tableLoading"
      row-key="id"
      bordered
      size="small"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'isEnabled'">
          <a-tag :color="record.isEnabled ? 'green' : 'default'">
            {{ record.isEnabled ? "启用" : "禁用" }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'lastRunAt'">
          {{ formatDate(record.lastRunAt) }}
        </template>
        <template v-else-if="column.key === 'nextRunAt'">
          {{ formatDate(record.nextRunAt) }}
        </template>
        <template v-else-if="column.key === 'action'">
          <a @click="openEditModal(record as ScheduleItem)">编辑</a>
          <span class="divider">|</span>
          <a-popconfirm
            :title="record.isEnabled ? '确认禁用该任务吗？' : '确认启用该任务吗？'"
            ok-text="确认"
            cancel-text="取消"
            @confirm="handleToggleEnabled(record as ScheduleItem)"
          >
            <a>
              {{ record.isEnabled ? "禁用" : "启用" }}
            </a>
          </a-popconfirm>
          <span class="divider">|</span>
          <a-popconfirm
            title="确认删除该任务吗？"
            ok-text="确认"
            cancel-text="取消"
            @confirm="handleDelete(record as ScheduleItem)"
          >
            <a style="color: red">删除</a>
          </a-popconfirm>
        </template>
      </template>
    </a-table>

    <div class="pagination-wrap">
      <a-pagination
        :current="pagination.current"
        :pageSize="pagination.pageSize"
        :total="pagination.total"
        :show-size-changer="true"
        :page-size-options="['10', '20', '30', '50']"
        :show-total="(total: number) => `共 ${total} 条`"
        @change="handlePageChange"
      />
    </div>

    <a-modal
      :open="modalVisible"
      :title="isEditMode ? '编辑定时任务' : '新增定时任务'"
      ok-text="确认"
      cancel-text="取消"
      :confirm-loading="submitLoading"
      @ok="handleSubmit"
      @cancel="handleCloseModal"
    >
      <a-form ref="formRef" :model="formState" :rules="formRules" layout="vertical">
        <a-form-item label="任务名称" name="name">
          <a-input v-model:value="formState.name" placeholder="请输入任务名称" />
        </a-form-item>
        <a-form-item
          label="Cron表达式"
          name="conExpression"
          extra="示例：*/5 * * * *（每5分钟执行一次）"
        >
          <a-input
            v-model:value="formState.conExpression"
            placeholder="例如: */5 * * * *"
          />
        </a-form-item>
        <a-form-item label="是否启用" name="isEnabled">
          <a-switch v-model:checked="formState.isEnabled" />
        </a-form-item>
        <a-form-item v-if="isEditMode" label="执行状态" name="status">
          <a-select
            v-model:value="formState.status"
            placeholder="请选择执行状态（可选）"
            allowClear
          >
            <a-select-option
              v-for="item in statusOptions"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item v-if="isEditMode" label="最近错误" name="lastError">
          <a-textarea
            v-model:value="formState.lastError"
            :rows="3"
            placeholder="可选"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import type { FormInstance } from "ant-design-vue";
import { message } from "ant-design-vue";
import api from "@/api/apiList";
import { unwrapList, unwrapPagedMeta } from "@/api/response";
import type { FormRulesMap } from "@/types/form-rules";

const {
  addScheduleInterface,
  findScheduleListInterface,
  findScheduleByIdInterface,
  updateScheduleByIdInterface,
  deleteScheduleByIdInterface,
} = api;
const DEFAULT_CRON_EXPRESSION = "0 0 * * *";

interface ScheduleItem {
  id: string;
  name: string;
  conExpression: string;
  isEnabled?: boolean;
  status?: string;
  lastRunAt?: string;
  nextRunAt?: string;
  lastError?: string;
}

const searchForm = reactive<{
  name?: string;
  isEnabled?: string;
  status?: string;
}>({
  name: "",
  isEnabled: undefined,
  status: "",
});

const scheduleList = ref<ScheduleItem[]>([]);
const statusOptions = [
  { label: "待执行", value: "pending" },
  { label: "运行中", value: "running" },
  { label: "成功", value: "success" },
  { label: "失败", value: "failed" },
];
const tableLoading = ref(false);
const submitLoading = ref(false);
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
});

const columns = [
  { title: "任务名称", dataIndex: "name", key: "name", ellipsis: true },
  {
    title: "Cron表达式",
    dataIndex: "conExpression",
    key: "conExpression",
    ellipsis: true,
  },
  { title: "是否启用", dataIndex: "isEnabled", key: "isEnabled" },
  { title: "执行状态", dataIndex: "status", key: "status", ellipsis: true },
  { title: "上次执行", dataIndex: "lastRunAt", key: "lastRunAt" },
  { title: "下次执行", dataIndex: "nextRunAt", key: "nextRunAt" },
  { title: "最近错误", dataIndex: "lastError", key: "lastError", ellipsis: true },
  { title: "操作", key: "action", width: 120 },
];

const modalVisible = ref(false);
const isEditMode = ref(false);
const editId = ref("");
const formRef = ref<FormInstance>();
const formState = reactive({
  name: "",
  conExpression: DEFAULT_CRON_EXPRESSION,
  isEnabled: true,
  status: "",
  lastError: "",
});

const formRules: FormRulesMap = {
  name: [{ required: true, message: "请输入任务名称", trigger: "blur" }],
  conExpression: [
    { required: true, message: "请输入Cron表达式", trigger: "blur" },
    {
      validator: (_rule: unknown, value: string) => {
        if (!value) return Promise.resolve();
        const normalized = value.trim();
        const simpleCronRegex = /^(\S+\s){4}\S+$/;
        if (!simpleCronRegex.test(normalized)) {
          return Promise.reject(new Error("Cron表达式需为 5 段"));
        }
        const parts = normalized.split(/\s+/);
        if (parts.length !== 5) {
          return Promise.reject(new Error("Cron表达式需为 5 段"));
        }
        const allowedCharsRegex = /^[\d*/,\-?LW#A-Za-z\s]+$/;
        if (!allowedCharsRegex.test(normalized)) {
          return Promise.reject(new Error("Cron表达式包含非法字符"));
        }
        return Promise.resolve();
      },
      trigger: "blur",
    },
  ],
};

const resetForm = () => {
  formState.name = "";
  formState.conExpression = DEFAULT_CRON_EXPRESSION;
  formState.isEnabled = true;
  formState.status = "";
  formState.lastError = "";
  editId.value = "";
  isEditMode.value = false;
};

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const fetchScheduleList = async () => {
  tableLoading.value = true;
  try {
    const params = {
      page: pagination.current,
      pageSize: pagination.pageSize,
      name: searchForm.name || undefined,
      isEnabled:
        searchForm.isEnabled === "1"
          ? true
          : searchForm.isEnabled === "0"
            ? false
            : undefined,
      status: searchForm.status || undefined,
    };
    const res = await findScheduleListInterface(params);
    if (res?.code === 200 || res?.code === 201) {
      scheduleList.value = unwrapList<ScheduleItem>(res.data);
      pagination.total = unwrapPagedMeta(res.data).total ?? scheduleList.value.length;
      return;
    }
    scheduleList.value = [];
    pagination.total = 0;
    message.error(res?.message || "获取定时任务列表失败");
  } catch (error) {
    console.error(error);
    scheduleList.value = [];
    pagination.total = 0;
    message.error("获取定时任务列表失败，请稍后重试");
  } finally {
    tableLoading.value = false;
  }
};

const handleSearch = () => {
  pagination.current = 1;
  fetchScheduleList();
};

const openAddModal = () => {
  resetForm();
  modalVisible.value = true;
};

const openEditModal = async (record: ScheduleItem) => {
  if (!record?.id) {
    message.error("缺少任务ID");
    return;
  }
  tableLoading.value = true;
  try {
    const res = await findScheduleByIdInterface({ id: record.id });
    if (res?.code === 200 || res?.code === 201) {
      const data = (res?.data ?? record) as ScheduleItem;
      isEditMode.value = true;
      editId.value = data.id;
      formState.name = data.name || "";
      formState.conExpression = data.conExpression || "";
      formState.isEnabled = data.isEnabled ?? true;
      formState.status = data.status || "";
      formState.lastError = data.lastError || "";
      modalVisible.value = true;
      return;
    }
    message.error(res?.message || "获取任务详情失败");
  } catch (error) {
    console.error(error);
    message.error("获取任务详情失败，请稍后重试");
  } finally {
    tableLoading.value = false;
  }
};

const handleCloseModal = () => {
  modalVisible.value = false;
  formRef.value?.clearValidate();
  resetForm();
};

const handleSubmit = async () => {
  try {
    await formRef.value?.validate();
    submitLoading.value = true;
    const baseDto = {
      name: formState.name,
      conExpression: formState.conExpression,
      isEnabled: formState.isEnabled,
    };
    const editDto = {
      ...baseDto,
      status: formState.status || undefined,
      lastError: formState.lastError || undefined,
    };
    const res = isEditMode.value
      ? await updateScheduleByIdInterface({ id: editId.value, dto: editDto })
      : await addScheduleInterface(baseDto);

    if (res?.code === 200 || res?.code === 201) {
      message.success(res?.message || (isEditMode.value ? "更新成功" : "新增成功"));
      handleCloseModal();
      fetchScheduleList();
      return;
    }
    message.error(res?.message || (isEditMode.value ? "更新失败" : "新增失败"));
  } catch (error) {
    if (error) {
      console.error(error);
    }
  } finally {
    submitLoading.value = false;
  }
};

const handleDelete = async (record: ScheduleItem) => {
  if (!record?.id) return;
  try {
    const res = await deleteScheduleByIdInterface({ id: record.id });
    if (res?.code === 200 || res?.code === 201) {
      message.success(res?.message || "删除成功");
      if (scheduleList.value.length === 1 && pagination.current > 1) {
        pagination.current -= 1;
      }
      fetchScheduleList();
      return;
    }
    message.error(res?.message || "删除失败");
  } catch (error) {
    console.error(error);
    message.error("删除失败，请稍后重试");
  }
};

const handleToggleEnabled = async (record: ScheduleItem) => {
  if (!record?.id) return;
  try {
    const res = await updateScheduleByIdInterface({
      id: record.id,
      dto: { isEnabled: !record.isEnabled },
    });
    if (res?.code === 200 || res?.code === 201) {
      message.success(res?.message || (record.isEnabled ? "已禁用" : "已启用"));
      fetchScheduleList();
      return;
    }
    message.error(res?.message || "操作失败");
  } catch (error) {
    console.error(error);
    message.error("操作失败，请稍后重试");
  }
};

const handlePageChange = (page: number, pageSize: number) => {
  pagination.current = page;
  pagination.pageSize = pageSize;
  fetchScheduleList();
};

onMounted(() => {
  fetchScheduleList();
});
</script>

<style scoped lang="scss">
.schedule-container {
  padding: 20px;
}

.header {
  margin-bottom: 12px;
}

.divider {
  display: inline-block;
  margin: 0 8px;
  color: #999;
}

.pagination-wrap {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}
</style>