<template>
  <a-modal
    :open="props.visible"
    :title="modalTitle"
    width="680px"
    :body-style="{ maxHeight: '72vh', overflowY: 'auto' }"
    @ok="handleSubmit"
    @cancel="handleClose"
    ok-text="提交"
    cancel-text="取消"
    :confirm-loading="submitting"
  >
    <a-form :model="submitForm" :rules="formRules" ref="formRef" layout="vertical">
      <a-form-item label="关联模型" name="modelId">
        <a-select
          v-model:value="submitForm.modelId"
          placeholder="请选择模型"
          show-search
          :disabled="!!props.initialParentId"
          :filter-option="filterModelOption"
          :options="modelOptions"
        />
      </a-form-item>
      <a-form-item v-if="!props.initialParentId" label="父参数" name="parentId">
        <a-select
          v-model:value="submitForm.parentId"
          placeholder="不选则为根参数"
          allow-clear
          show-search
          :filter-option="filterParentOption"
          :options="parentOptions"
        />
      </a-form-item>
      <a-alert
        v-else-if="parentPathHint"
        type="info"
        show-icon
        :message="`将在「${parentPathHint}」下添加子参数`"
        style="margin-bottom: 12px"
      />
      <a-form-item label="段名 (paramKey)" name="paramKey">
        <a-input
          v-model:value="submitForm.paramKey"
          placeholder="当前层级段名，如 temperature、messages、role"
        />
      </a-form-item>
      <a-form-item label="API 段名 (apiParamKey)" name="apiParamKey">
        <a-input
          v-model:value="submitForm.apiParamKey"
          placeholder="上游接口当前层级字段名"
        />
      </a-form-item>
      <a-form-item label="参数类型" name="paramType">
        <a-select
          v-model:value="submitForm.paramType"
          :options="paramTypeOptions"
          @change="onParamTypeChange"
        />
      </a-form-item>
      <a-form-item
        v-if="needsItemParamType(submitForm.paramType)"
        label="数组元素类型"
        name="itemParamType"
      >
        <a-select
          v-model:value="submitForm.itemParamType"
          placeholder="array 类型必填"
          :options="arrayItemTypeOptions"
          @change="onItemParamTypeChange"
        />
      </a-form-item>
      <a-form-item label="是否必填" name="required">
        <a-switch
          v-model:checked="requiredChecked"
          checked-children="是"
          un-checked-children="否"
        />
      </a-form-item>
      <a-form-item
        v-if="!isContainerParamType(submitForm.paramType, submitForm.itemParamType)"
        label="默认值"
        name="defaultValueJson"
      >
        <a-textarea
          v-model:value="submitForm.defaultValueJson"
          placeholder="可选，合法 JSON"
          :rows="2"
        />
      </a-form-item>
      <a-form-item
        v-if="showMinMax"
        label="最小值"
        name="minValue"
      >
        <a-input v-model:value="submitForm.minValue" placeholder="可选" />
      </a-form-item>
      <a-form-item
        v-if="showMinMax"
        label="最大值"
        name="maxValue"
      >
        <a-input v-model:value="submitForm.maxValue" placeholder="可选" />
      </a-form-item>
      <a-form-item
        v-if="showEnumValues"
        label="枚举值"
        name="enumValuesJson"
      >
        <a-textarea
          v-model:value="submitForm.enumValuesJson"
          placeholder='JSON 数组，如 ["auto","high"]'
          :rows="3"
        />
      </a-form-item>
      <a-form-item label="排序" name="sort">
        <a-input-number v-model:value="submitForm.sort" :min="0" style="width: 100%" />
      </a-form-item>
      <a-form-item label="启用" name="enabled">
        <a-switch
          v-model:checked="enabledChecked"
          checked-children="启用"
          un-checked-children="禁用"
        />
      </a-form-item>
      <a-form-item label="备注" name="remark">
        <a-textarea v-model:value="submitForm.remark" :rows="2" placeholder="可选" />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script lang="ts" setup>
import { computed, reactive, ref, watch } from "vue";
import type { FormInstance, Rule } from "ant-design-vue";
import api from "@/api/apiList";
import { message } from "ant-design-vue";
import type { AiModelItem } from "@/types/ai-model.type";
import {
  ARRAY_ITEM_PARAM_TYPES,
  PARAM_TYPES,
  collectContainerNodes,
  getArrayItemParamTypeLabel,
  getParamTypeLabel,
  isContainerParamType,
  needsEnumValues,
  needsItemParamType,
  needsMinMax,
  parseOptionalJson,
  parseOptionalJsonArray,
} from "@/types/param-whitelist.type";
import type { WhitelistTreeNode } from "@/types/param-whitelist.type";

const { addParamWhitelistInterface } = api;

interface PropsType {
  visible: boolean;
  modelList: AiModelItem[];
  whitelistTree: WhitelistTreeNode[];
  initialModelId?: string;
  initialParentId?: string | null;
}

const props = defineProps<PropsType>();
const emits = defineEmits<{ close: [] }>();

const formRef = ref<FormInstance>();
const submitting = ref(false);

const submitForm = reactive({
  modelId: undefined as string | undefined,
  parentId: undefined as string | undefined,
  paramKey: "",
  apiParamKey: "",
  paramType: "string" as string,
  itemParamType: undefined as string | undefined,
  defaultValueJson: "",
  minValue: "",
  maxValue: "",
  enumValuesJson: "",
  sort: 0,
  remark: "",
});

const requiredChecked = ref(false);
const enabledChecked = ref(true);

const modalTitle = computed(() =>
  props.initialParentId ? "添加子参数" : "新增参数白名单",
);

const parentPathHint = computed(() => {
  if (!props.initialParentId) return "";
  const find = (nodes: WhitelistTreeNode[]): string | undefined => {
    for (const n of nodes) {
      if (String(n.id) === String(props.initialParentId)) return n.paramPath;
      const child = n.children?.length ? find(n.children) : undefined;
      if (child) return child;
    }
    return undefined;
  };
  return find(props.whitelistTree ?? []) ?? props.initialParentId;
});

const paramTypeOptions = PARAM_TYPES.map((t) => ({
  label: getParamTypeLabel(t),
  value: t,
}));

const arrayItemTypeOptions = ARRAY_ITEM_PARAM_TYPES.map((t) => ({
  label: getArrayItemParamTypeLabel(t),
  value: t,
}));

const modelOptions = computed(() =>
  (props.modelList ?? []).map((m) => ({
    label: `${m.provider} / ${m.modelCode} (${m.id})`,
    value: String(m.id),
  })),
);

const parentOptions = computed(() => {
  const containers = collectContainerNodes(
    props.whitelistTree ?? [],
    submitForm.modelId,
  );
  return containers.map((n) => ({
    label: `${n.paramPath} (${getParamTypeLabel(n.paramType)})`,
    value: String(n.id),
  }));
});

const showMinMax = computed(() =>
  needsMinMax(submitForm.paramType, submitForm.itemParamType),
);

const showEnumValues = computed(() =>
  needsEnumValues(submitForm.paramType, submitForm.itemParamType),
);

const filterModelOption = (input: string, option?: { label?: string; value?: string }) => {
  const text = String(option?.label ?? option?.value ?? "");
  return text.toLowerCase().includes(input.trim().toLowerCase());
};

const filterParentOption = (input: string, option?: { label?: string; value?: string }) => {
  const text = String(option?.label ?? option?.value ?? "");
  return text.toLowerCase().includes(input.trim().toLowerCase());
};

const jsonFieldRules: Rule[] = [
  {
    validator: (_rule, value: string) => {
      if (!value?.trim()) return Promise.resolve();
      try {
        JSON.parse(value);
        return Promise.resolve();
      } catch {
        return Promise.reject(new Error("请输入合法 JSON"));
      }
    },
    trigger: "blur",
  },
];

const formRules = computed(() => ({
  modelId: [{ required: true, message: "请选择模型", trigger: "change" }],
  paramKey: [{ required: true, message: "请输入段名", trigger: "blur" }],
  apiParamKey: [{ required: true, message: "请输入 API 段名", trigger: "blur" }],
  paramType: [{ required: true, message: "请选择参数类型", trigger: "change" }],
  itemParamType: needsItemParamType(submitForm.paramType)
    ? [{ required: true, message: "请选择数组元素类型", trigger: "change" }]
    : [],
  defaultValueJson: jsonFieldRules,
  enumValuesJson: [
    {
      validator: (_rule: Rule, value: string) => {
        if (!showEnumValues.value) return Promise.resolve();
        if (!value?.trim()) {
          return Promise.reject(new Error("枚举类型需填写枚举值"));
        }
        try {
          parseOptionalJsonArray(value);
          return Promise.resolve();
        } catch (e) {
          return Promise.reject(
            new Error(e instanceof Error ? e.message : "请输入合法 JSON 数组"),
          );
        }
      },
      trigger: "blur",
    },
  ],
}));

const clearNonContainerFields = () => {
  submitForm.defaultValueJson = "";
  submitForm.minValue = "";
  submitForm.maxValue = "";
  submitForm.enumValuesJson = "";
};

const onParamTypeChange = () => {
  if (!needsItemParamType(submitForm.paramType)) {
    submitForm.itemParamType = undefined;
  }
  if (isContainerParamType(submitForm.paramType, submitForm.itemParamType)) {
    clearNonContainerFields();
  }
};

const onItemParamTypeChange = () => {
  if (isContainerParamType(submitForm.paramType, submitForm.itemParamType)) {
    clearNonContainerFields();
  }
};

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      submitForm.modelId = props.initialModelId
        ? String(props.initialModelId)
        : undefined;
      submitForm.parentId = props.initialParentId
        ? String(props.initialParentId)
        : undefined;
    } else {
      resetForm();
    }
  },
);

watch(
  () => submitForm.modelId,
  () => {
    if (!props.initialParentId && submitForm.parentId) {
      const allowed = new Set(parentOptions.value.map((o) => o.value));
      if (!allowed.has(submitForm.parentId)) {
        submitForm.parentId = undefined;
      }
    }
  },
);

const resetForm = () => {
  submitForm.modelId = undefined;
  submitForm.parentId = undefined;
  submitForm.paramKey = "";
  submitForm.apiParamKey = "";
  submitForm.paramType = "string";
  submitForm.itemParamType = undefined;
  submitForm.defaultValueJson = "";
  submitForm.minValue = "";
  submitForm.maxValue = "";
  submitForm.enumValuesJson = "";
  submitForm.sort = 0;
  submitForm.remark = "";
  requiredChecked.value = false;
  enabledChecked.value = true;
};

const handleClose = () => {
  emits("close");
};

const handleSubmit = async () => {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }

  let defaultValue: unknown;
  let enumValues: unknown[] | undefined;
  try {
    if (!isContainerParamType(submitForm.paramType, submitForm.itemParamType)) {
      defaultValue = parseOptionalJson(submitForm.defaultValueJson);
    }
    if (showEnumValues.value) {
      enumValues = parseOptionalJsonArray(submitForm.enumValuesJson);
    }
  } catch (e) {
    message.error(e instanceof Error ? e.message : "JSON 格式错误");
    return;
  }

  const parentId = props.initialParentId
    ? String(props.initialParentId)
    : submitForm.parentId || null;

  submitting.value = true;
  try {
    const res = await addParamWhitelistInterface({
      modelId: String(submitForm.modelId),
      parentId,
      paramKey: submitForm.paramKey.trim(),
      apiParamKey: submitForm.apiParamKey.trim(),
      paramType: submitForm.paramType,
      itemParamType: needsItemParamType(submitForm.paramType)
        ? submitForm.itemParamType
        : undefined,
      required: requiredChecked.value ? 1 : 0,
      defaultValue,
      minValue: showMinMax.value ? submitForm.minValue?.trim() || undefined : undefined,
      maxValue: showMinMax.value ? submitForm.maxValue?.trim() || undefined : undefined,
      enumValues,
      enabled: enabledChecked.value ? 1 : 0,
      sort: submitForm.sort ?? 0,
      remark: submitForm.remark?.trim() || undefined,
    });
    if (res?.code === 200 || res?.code === 201) {
      message.success(res?.message || "添加成功");
      resetForm();
      handleClose();
    } else {
      message.error(res?.message || "添加失败");
    }
  } finally {
    submitting.value = false;
  }
};
</script>
