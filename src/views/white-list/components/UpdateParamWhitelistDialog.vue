<template>
  <a-modal
    :open="props.visible"
    title="编辑参数白名单"
    width="680px"
    :body-style="{ maxHeight: '72vh', overflowY: 'auto' }"
    @ok="handleSubmit"
    @cancel="handleClose"
    ok-text="保存"
    cancel-text="取消"
    :confirm-loading="submitting"
  >
    <a-form :model="submitForm" :rules="formRules" ref="formRef" layout="vertical">
      <a-form-item label="关联模型" name="modelId">
        <a-select
          v-model:value="submitForm.modelId"
          placeholder="请选择模型"
          show-search
          :filter-option="filterModelOption"
          :options="modelOptions"
        />
      </a-form-item>
      <a-form-item label="参数路径">
        <a-input :value="submitForm.paramPath" disabled />
      </a-form-item>
      <a-form-item label="API 路径">
        <a-input :value="submitForm.apiParamPath" disabled />
      </a-form-item>
      <a-form-item label="段名 (paramKey)" name="paramKey">
        <a-input v-model:value="submitForm.paramKey" />
      </a-form-item>
      <a-form-item label="API 段名 (apiParamKey)" name="apiParamKey">
        <a-input v-model:value="submitForm.apiParamKey" />
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
          allow-clear
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
          placeholder="可选，合法 JSON；留空表示不修改，输入 null 表示清空"
          :rows="2"
        />
      </a-form-item>
      <a-form-item v-if="showMinMax" label="最小值" name="minValue">
        <a-input
          v-model:value="submitForm.minValue"
          placeholder="留空不修改；仅空格表示清空"
        />
      </a-form-item>
      <a-form-item v-if="showMinMax" label="最大值" name="maxValue">
        <a-input
          v-model:value="submitForm.maxValue"
          placeholder="留空不修改；仅空格表示清空"
        />
      </a-form-item>
      <a-form-item v-if="showEnumValues" label="枚举值" name="enumValuesJson">
        <a-textarea
          v-model:value="submitForm.enumValuesJson"
          placeholder='JSON 数组；留空不修改，输入 null 表示清空'
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
        <a-textarea v-model:value="submitForm.remark" :rows="2" />
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
import type { ParamWhitelistItem } from "@/types/param-whitelist.type";
import {
  ARRAY_ITEM_PARAM_TYPES,
  PARAM_TYPES,
  getArrayItemParamTypeLabel,
  getParamTypeLabel,
  isContainerParamType,
  needsEnumValues,
  needsItemParamType,
  needsMinMax,
  parseOptionalJson,
  parseOptionalJsonArray,
  stringifyJsonField,
} from "@/types/param-whitelist.type";

const { updateParamWhitelistInterface } = api;

interface PropsType {
  visible: boolean;
  row: ParamWhitelistItem | null;
  modelList: AiModelItem[];
}

const props = defineProps<PropsType>();
const emits = defineEmits<{ close: []; success: [] }>();

const formRef = ref<FormInstance>();
const submitting = ref(false);
const defaultValueTouched = ref(false);
const enumValuesTouched = ref(false);

const submitForm = reactive({
  id: "",
  modelId: undefined as string | undefined,
  paramPath: "",
  apiParamPath: "",
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
  defaultValueJson: jsonFieldRules,
  enumValuesJson: [
    {
      validator: (_rule: Rule, value: string) => {
        if (!showEnumValues.value) return Promise.resolve();
        if (!value?.trim()) return Promise.resolve();
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
    defaultValueTouched.value = true;
    enumValuesTouched.value = true;
  }
};

const onItemParamTypeChange = () => {
  if (isContainerParamType(submitForm.paramType, submitForm.itemParamType)) {
    clearNonContainerFields();
    defaultValueTouched.value = true;
    enumValuesTouched.value = true;
  }
};

watch(
  () => submitForm.defaultValueJson,
  () => {
    defaultValueTouched.value = true;
  },
);

watch(
  () => submitForm.enumValuesJson,
  () => {
    enumValuesTouched.value = true;
  },
);

watch(
  () => [props.visible, props.row] as const,
  ([visible, row]) => {
    if (visible && row) {
      submitForm.id = String(row.id);
      submitForm.modelId = String(row.modelId ?? "");
      submitForm.paramPath = row.paramPath ?? "";
      submitForm.apiParamPath = row.apiParamPath ?? "";
      submitForm.paramKey = row.paramKey ?? "";
      submitForm.apiParamKey = row.apiParamKey ?? "";
      submitForm.paramType = row.paramType ?? "string";
      submitForm.itemParamType = row.itemParamType ?? undefined;
      submitForm.defaultValueJson = stringifyJsonField(row.defaultValue);
      submitForm.minValue = row.minValue ?? "";
      submitForm.maxValue = row.maxValue ?? "";
      submitForm.enumValuesJson = stringifyJsonField(row.enumValues);
      submitForm.sort = Number(row.sort ?? 0);
      submitForm.remark = row.remark ?? "";
      requiredChecked.value = String(row.required) === "1";
      enabledChecked.value = String(row.enabled ?? "1") === "1";
      defaultValueTouched.value = false;
      enumValuesTouched.value = false;
    }
  },
  { immediate: true },
);

const handleClose = () => {
  emits("close");
};

const resolveOptionalStringField = (
  value: string,
  original: string | null | undefined,
): string | null | undefined => {
  if (value === original) return undefined;
  const trimmed = value.trim();
  if (trimmed === "" && value.length > 0) return null;
  if (trimmed === "") return undefined;
  return trimmed;
};

const handleSubmit = async () => {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }

  const payload: Parameters<typeof updateParamWhitelistInterface>[0] = {
    id: submitForm.id,
    modelId: String(submitForm.modelId),
    paramKey: submitForm.paramKey.trim(),
    apiParamKey: submitForm.apiParamKey.trim(),
    paramType: submitForm.paramType,
    itemParamType: needsItemParamType(submitForm.paramType)
      ? submitForm.itemParamType ?? null
      : null,
    required: requiredChecked.value ? 1 : 0,
    enabled: enabledChecked.value ? 1 : 0,
    sort: submitForm.sort ?? 0,
    remark: submitForm.remark?.trim() || null,
  };

  if (
    !isContainerParamType(submitForm.paramType, submitForm.itemParamType) &&
    defaultValueTouched.value
  ) {
    const raw = submitForm.defaultValueJson.trim();
    if (raw === "null") {
      payload.defaultValue = null;
    } else if (!raw) {
      // 不修改
    } else {
      try {
        payload.defaultValue = parseOptionalJson(submitForm.defaultValueJson);
      } catch {
        message.error("默认值 JSON 格式错误");
        return;
      }
    }
  }

  if (showMinMax.value) {
    const min = resolveOptionalStringField(
      submitForm.minValue,
      props.row?.minValue ?? undefined,
    );
    if (min !== undefined) payload.minValue = min;
    const max = resolveOptionalStringField(
      submitForm.maxValue,
      props.row?.maxValue ?? undefined,
    );
    if (max !== undefined) payload.maxValue = max;
  }

  if (showEnumValues.value && enumValuesTouched.value) {
    const raw = submitForm.enumValuesJson.trim();
    if (raw === "null") {
      payload.enumValues = null;
    } else if (!raw) {
      // 不修改
    } else {
      try {
        payload.enumValues = parseOptionalJsonArray(submitForm.enumValuesJson);
      } catch (e) {
        message.error(e instanceof Error ? e.message : "枚举值 JSON 格式错误");
        return;
      }
    }
  }

  submitting.value = true;
  try {
    const res = await updateParamWhitelistInterface(payload);
    if (res?.code === 200 || res?.code === 201) {
      message.success(res?.message || "保存成功");
      emits("success");
      handleClose();
    } else {
      message.error(res?.message || "保存失败");
    }
  } finally {
    submitting.value = false;
  }
};
</script>
