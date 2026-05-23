<template>
  <a-modal
    :open="open"
    :title="isEditMode ? '编辑菜单' : '添加菜单'"
    ok-text="确认"
    cancel-text="取消"
    :confirm-loading="submitLoading"
    width="560px"
    @ok="handleSubmit"
    @cancel="handleClose"
  >
    <a-form ref="formRef" :model="formState" :rules="formRules" layout="vertical">
      <a-form-item label="上级菜单" name="parentId">
        <a-tree-select
          v-model:value="formState.parentId"
          :tree-data="parentTreeData"
          placeholder="不选则为根级菜单"
          allow-clear
          tree-default-expand-all
          style="width: 100%"
        />
      </a-form-item>
      <a-form-item label="菜单编码" name="code">
        <a-input
          v-model:value="formState.code"
          placeholder="如 system.user"
          allow-clear
        />
      </a-form-item>
      <a-form-item label="菜单名称" name="name">
        <a-input v-model:value="formState.name" placeholder="请输入菜单名称" allow-clear />
      </a-form-item>
      <a-form-item label="路由路径" name="path">
        <a-input v-model:value="formState.path" placeholder="如 /user" allow-clear />
      </a-form-item>
      <a-form-item label="图标" name="icon">
        <a-input
          v-model:value="formState.icon"
          placeholder="如 iconfont icon-yonghuguanli"
          allow-clear
        />
      </a-form-item>
      <a-row :gutter="16">
        <a-col :span="12">
          <a-form-item label="类型" name="type">
            <a-select v-model:value="formState.type" style="width: 100%">
              <a-select-option :value="0">目录</a-select-option>
              <a-select-option :value="1">菜单</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="排序" name="sort">
            <a-input-number
              v-model:value="formState.sort"
              :min="0"
              style="width: 100%"
            />
          </a-form-item>
        </a-col>
      </a-row>
      <a-form-item label="状态" name="status">
        <a-select v-model:value="formState.status" style="width: 100%">
          <a-select-option value="1">启用</a-select-option>
          <a-select-option value="0">停用</a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item label="菜单权限" name="roleIds">
        <a-select
          v-model:value="formState.roleIds"
          mode="multiple"
          placeholder="请选择可访问该菜单的角色"
          allow-clear
          :options="roleOptions"
          :loading="roleListLoading"
          style="width: 100%"
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import type { FormInstance } from "ant-design-vue";
import { message } from "ant-design-vue";
import api from "@/api/apiList";
import { useModelStore } from "@/stores/modelStore";
import type { CreateMenuDto, MenuRow, ParentTreeOption, UpdateMenuDto } from "../types";

const { addMenuInterface, updateMenuInterface } = api;
const modelStore = useModelStore();

const props = defineProps<{
  open: boolean;
  isEditMode: boolean;
  initialRecord?: MenuRow | null;
  parentTreeOptions: ParentTreeOption[];
  defaultParentId?: number | null;
}>();

const emit = defineEmits<{
  (e: "update:open", value: boolean): void;
  (e: "success"): void;
}>();

const formRef = ref<FormInstance>();
const submitLoading = ref(false);
const roleListLoading = ref(false);

const roleOptions = computed(() => modelStore.roleOptions);
const defaultFormState = () => ({
  parentId: undefined as number | undefined,
  code: "",
  name: "",
  path: "",
  icon: "",
  type: 1,
  sort: 0,
  status: "1",
  roleIds: [] as string[],
});

const formState = reactive(defaultFormState());

const parentTreeData = computed(() => props.parentTreeOptions);

const formRules = {
  code: [{ required: true, message: "请输入菜单编码", trigger: "blur" }],
  name: [{ required: true, message: "请输入菜单名称", trigger: "blur" }],
  type: [{ required: true, message: "请选择类型", trigger: "change" }],
  status: [{ required: true, message: "请选择状态", trigger: "change" }],
};

const resetForm = () => {
  Object.assign(formState, defaultFormState());
  formRef.value?.clearValidate();
};

const fillForm = (record?: MenuRow | null) => {
  resetForm();
  if (!record) {
    if (props.defaultParentId != null) {
      formState.parentId = props.defaultParentId;
    }
    return;
  }
  formState.parentId = record.parentId ?? undefined;
  formState.code = record.code;
  formState.name = record.name;
  formState.path = record.path ?? "";
  formState.icon = record.icon ?? "";
  formState.type = record.type ?? 1;
  formState.sort = record.sort ?? 0;
  formState.status = record.status ?? "1";
  formState.roleIds = normalizeRoleIds(record.roleIds);
};

function normalizeRoleIds(
  roleIds: (number | string)[] | null | undefined,
): string[] {
  if (!roleIds?.length) {
    return [];
  }
  return roleIds.map((id) => String(id));
}

const loadRoleList = async () => {
  roleListLoading.value = true;
  try {
    await modelStore.fetchRoleList({});
  } finally {
    roleListLoading.value = false;
  }
};

watch(
  () => props.open,
  async (visible) => {
    if (visible) {
      await loadRoleList();
      fillForm(props.isEditMode ? props.initialRecord : null);
    }
  },
);

const handleClose = () => {
  emit("update:open", false);
};

const buildPayload = (): CreateMenuDto | UpdateMenuDto => {
  const base = {
    parentId: formState.parentId ?? null,
    code: formState.code.trim(),
    name: formState.name.trim(),
    path: formState.path?.trim() || undefined,
    icon: formState.icon?.trim() || undefined,
    type: formState.type,
    sort: formState.sort,
    status: formState.status,
    roleIds: formState.roleIds
      .map((id) => Number(id))
      .filter((id) => !Number.isNaN(id)),
  };

  if (props.isEditMode && props.initialRecord) {
    return {
      id: props.initialRecord.id,
      ...base,
    };
  }

  return base;
};

const handleSubmit = async () => {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }

  submitLoading.value = true;
  try {
    const payload = buildPayload();
    const res = props.isEditMode
      ? await updateMenuInterface(payload as UpdateMenuDto)
      : await addMenuInterface(payload as CreateMenuDto);

    if (res?.code === 200 || res?.code === 201) {
      message.success(res?.message || (props.isEditMode ? "编辑成功" : "添加成功"));
      emit("update:open", false);
      emit("success");
      return;
    }
    message.error(res?.message || (props.isEditMode ? "编辑失败" : "添加失败"));
  } finally {
    submitLoading.value = false;
  }
};
</script>
