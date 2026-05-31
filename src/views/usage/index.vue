<template>
    <div class="use-record-container">
        <div class="header">
            <a-form layout="inline" :model="searchForm">
                <a-form-item label="用户账号">
                    <a-input v-model:value="searchForm.account" placeholder="请输入用户账号" allow-clear />
                </a-form-item>
                <a-form-item label="服务商">
                    <a-select
                        v-model:value="searchForm.provider"
                        placeholder="全部"
                        allow-clear
                        show-search
                        :options="providerOptions"
                        :filter-option="filterSelectOption"
                        style="width: 160px"
                    />
                </a-form-item>
                <a-form-item label="模型">
                    <a-select
                        v-model:value="searchForm.modelName"
                        placeholder="全部"
                        allow-clear
                        show-search
                        :options="modelNameOptions"
                        :filter-option="filterSelectOption"
                        style="width: 200px"
                    />
                </a-form-item>
                <a-form-item>
                    <a-button type="primary" @click="handleSearch">查询</a-button>
                </a-form-item>
            </a-form>
        </div>
        <div class="content">
            <a-table :data-source="usageList" :columns="columnsList" :pagination="false" size="small" bordered striped :scroll="{ y: 500 }"></a-table>
        </div>
        <div class="pagination">
            <a-pagination :current="pagination.current" :pageSize="pagination.pageSize" :total="pagination.total" @change="paginationChangeEvent"></a-pagination>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue';
import type { ColumnsType } from 'ant-design-vue/es/table';
import { PaginationType } from '@/types/pagination';
import { unwrapList, unwrapPagedMeta } from '@/api/response';
import { filterSelectOption } from '@/types/select-filter';
import { useModelStore } from '@/stores/modelStore';
import api from '@/api/apiList';
import config from './config';
const { columns } = config;
const { findUsageListInterface, findAiModelProviderListInterface } = api;
const modelStore = useModelStore();
interface searchFormType {
  account: string;
  provider?: string;
  modelName?: string;
}
const searchForm = ref<searchFormType>({
  account: "",
  provider: undefined,
  modelName: undefined,
});
const providerList = ref<string[]>([]);
const providerOptions = computed(() =>
  providerList.value.map((p) => ({ label: p, value: p })),
);

interface ModelStoreRow {
  apiModelName?: string;
  provider?: string;
}

const modelNameOptions = computed(() => {
  const rows = (modelStore.aiModelList ?? []) as ModelStoreRow[];
  const provider = searchForm.value.provider?.trim();
  const scoped = provider
    ? rows.filter((row) => row.provider === provider)
    : rows;
  const names = [
    ...new Set(
      scoped
        .map((row) => row.apiModelName)
        .filter((n): n is string => n != null && String(n).trim().length > 0)
        .map((n) => String(n).trim()),
    ),
  ].sort();
  const opts = names.map((s) => ({ label: s, value: s }));
  const cur = searchForm.value.modelName?.trim();
  if (cur && !opts.some((o) => o.value === cur)) {
    return [...opts, { label: cur, value: cur }];
  }
  return opts;
});

watch(
  () => searchForm.value.provider,
  () => {
    const provider = searchForm.value.provider?.trim();
    if (!provider) return;
    const rows = (modelStore.aiModelList ?? []) as ModelStoreRow[];
    const allowed = new Set(
      rows
        .filter((row) => row.provider === provider)
        .map((row) => row.apiModelName)
        .filter((n) => n != null && String(n).trim().length > 0)
        .map((n) => String(n).trim()),
    );
    const cur = searchForm.value.modelName?.trim();
    if (cur && !allowed.has(cur)) {
      searchForm.value.modelName = undefined;
    }
  },
);
interface UsageType {
  id: string;
  nickName: string;
  account: string;
  modelName: string;
  provider: string;
  promptTokens: number;
  completionTokens: number;
}
const usageList = ref<UsageType[]>([]);
const columnsList = ref<ColumnsType>([]);
const fetchProviderList = async () => {
  const res = await findAiModelProviderListInterface();
  if (res?.code === 200 || res?.code === 201) {
    providerList.value = unwrapList<string>(res.data);
  } else {
    providerList.value = [];
  }
};

onMounted(() => {
  void fetchProviderList();
  void modelStore.fetchAiModelList({ page: 1, pageSize: 500 }, { preserveSelection: true });
  getUsageList();
  columnsList.value = columns as ColumnsType;
});

const handleSearch = () => {
  pagination.value.current = 1;
  getUsageList();
};
const pagination = ref<PaginationType>({
  current: 1,
  pageSize: 10,
  total: 0,
});
const paginationChangeEvent = (page: number) => {
  pagination.value.current = page;
  getUsageList();
};
const trimOrUndefined = (v?: string | null) => {
  const t = v?.trim();
  return t ? t : undefined;
};

const getUsageList = async () => {
  const requestParam = {
    page: pagination.value.current,
    pageSize: pagination.value.pageSize,
    account: trimOrUndefined(searchForm.value.account),
    provider: trimOrUndefined(searchForm.value.provider),
    modelName: trimOrUndefined(searchForm.value.modelName),
  };
  const res = await findUsageListInterface(requestParam);
  if (res.code === 201) {
    usageList.value = unwrapList<UsageType>(res.data);
    pagination.value.total = unwrapPagedMeta(res.data).total ?? usageList.value.length;
  }
};
</script>

<style lang="scss" scoped>
.use-record-container {
    padding: 20px;
}
</style>