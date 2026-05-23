<template>
  <a-modal
    :open="open"
    :title="isEditMode ? '编辑 AI 模型配置' : '新增 AI 模型配置'"
    ok-text="确认"
    cancel-text="取消"
    :confirm-loading="submitLoading"
    width="880px"
    :body-style="{ maxHeight: '72vh', overflowY: 'auto' }"
    @ok="handleSubmit"
    @cancel="handleCloseModal"
  >
    <a-form ref="formRef" :model="formState" :rules="formRules" layout="vertical">
      <a-divider orientation="left">基础信息</a-divider>
      <a-row :gutter="16">
        <a-col :span="12">
          <a-form-item label="服务商" name="provider">
            <a-select
              v-model:value="formState.provider"
              placeholder="请选择服务商"
              allowClear
              show-search
              :options="providerSelectOptions"
              :filter-option="filterProviderOption"
              style="width: 100%"
            />
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="模型名" name="modelName">
            <a-select
              v-model:value="formState.modelName"
              placeholder="请选择模型名"
              allowClear
              show-search
              :options="modelNameSelectOptions"
              :filter-option="filterModelNameOption"
              style="width: 100%"
            />
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="展示名称" name="displayName">
            <a-input v-model:value="formState.displayName" placeholder="displayName" />
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="模型类型" name="modelType">
            <a-input v-model:value="formState.modelType" placeholder="modelType" />
          </a-form-item>
        </a-col>
        <a-col :span="24">
          <a-form-item label="API 地址" name="apiUrl">
            <a-input v-model:value="formState.apiUrl" placeholder="https://..." />
          </a-form-item>
        </a-col>
        <a-col :span="8">
          <a-form-item label="最大图片数" name="maxImageCount">
            <a-input-number
              v-model:value="formState.maxImageCount"
              :min="0"
              style="width: 100%"
              placeholder="可选"
            />
          </a-form-item>
        </a-col>
        <a-col :span="8">
          <a-form-item label="排序" name="sort">
            <a-input-number v-model:value="formState.sort" style="width: 100%" placeholder="可选" />
          </a-form-item>
        </a-col>
        <a-col :span="8">
          <a-form-item label="启用" name="isEnabled">
            <a-switch v-model:checked="formState.isEnabled" />
          </a-form-item>
        </a-col>
        <a-col :span="24">
          <a-form-item label="是否兼容 OpenAI" name="compatibleWithOpenAi">
            <a-switch v-model:checked="formState.compatibleWithOpenAi" />
            <span class="form-item-hint">开启后按 OpenAI 约定传参，无需配置下方字段映射</span>
          </a-form-item>
        </a-col>
      </a-row>

      <a-divider orientation="left">能力与默认值</a-divider>
      <a-row :gutter="16">
        <a-col :span="12">
          <a-form-item label="支持宽高比（多选）" name="supportedAspectRatio">
            <a-select
              v-model:value="formState.supportedAspectRatio"
              mode="multiple"
              placeholder="请选择宽高比"
              allowClear
              show-search
              :options="supportedAspectRatioSelectOptions"
              :filter-option="filterAspectRatioOption"
              style="width: 100%"
            />
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="默认宽高比" name="defaultAspectRatio">
            <a-input v-model:value="formState.defaultAspectRatio" placeholder="可选" />
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="支持分辨率（多选）" name="supportedResolutions">
            <a-select
              v-model:value="formState.supportedResolutions"
              mode="multiple"
              placeholder="请选择分辨率档位"
              allowClear
              show-search
              :options="supportedResolutionsSelectOptions"
              :filter-option="filterResolutionPresetOption"
              style="width: 100%"
            />
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="默认分辨率" name="defaultResolution">
            <a-select
              v-model:value="formState.defaultResolution"
              placeholder="可选"
              allowClear
              show-search
              :options="defaultResolutionSelectOptions"
              :filter-option="filterResolutionPresetOption"
              style="width: 100%"
            />
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="支持格式（多选）" name="supportedFormats">
            <a-select
              v-model:value="formState.supportedFormats"
              mode="multiple"
              placeholder="请选择格式"
              allowClear
              show-search
              :options="supportedFormatsSelectOptions"
              :filter-option="filterResolutionPresetOption"
              style="width: 100%"
            />
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="最大分辨率" name="maxResolution">
            <a-select
              v-model:value="formState.maxResolution"
              placeholder="可选"
              allowClear
              show-search
              :options="maxResolutionSelectOptions"
              :filter-option="filterResolutionPresetOption"
              style="width: 100%"
            />
          </a-form-item>
        </a-col>
      </a-row>

      <template v-if="!formState.compatibleWithOpenAi">
        <a-divider orientation="left">字段映射（请求参数字段名）</a-divider>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="prompt">
              <a-input v-model:value="formState.fieldMappings.prompt" placeholder="可选" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="imageList">
              <a-input v-model:value="formState.fieldMappings.imageList" placeholder="可选" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="model">
              <a-input v-model:value="formState.fieldMappings.model" placeholder="可选" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="imageSize">
              <a-input v-model:value="formState.fieldMappings.imageSize" placeholder="可选" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="ImageRatio">
              <a-input v-model:value="formState.fieldMappings.ImageRatio" placeholder="可选" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="imageNum">
              <a-input v-model:value="formState.fieldMappings.imageNum" placeholder="可选" />
            </a-form-item>
          </a-col>
        </a-row>
      </template>

      <a-divider orientation="left">默认参数（JSON）</a-divider>
      <a-form-item label="defaultParams" name="defaultParamsJson" :rules="defaultParamsJsonRules">
        <a-textarea
          v-model:value="formState.defaultParamsJson"
          :rows="6"
          placeholder='例如：{ "temperature": 0.7 }'
          class="mono-textarea"
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from "vue";
import type { FormInstance, Rule } from "ant-design-vue/es/form";
import { message } from "ant-design-vue";
import api from "@/api/apiList";
import { useModelStore } from "@/stores/modelStore";
import type {
  AiModelConfigCreateDto,
  AiModelConfigUpdateDto,
  FieldMappingsDto,
} from "@/api/manage/aiModelConfig";
import type { AiModelConfigRow } from "../types";

const open = defineModel<boolean>("open", { required: true });

const props = defineProps<{
  isEditMode: boolean;
  /** 编辑模式下传入详情；新增时为 null */
  initialRecord: AiModelConfigRow | null;
}>();

const emit = defineEmits<{
  success: [];
}>();

const { addAiModelConfigInterface, updateAiModelConfigByIdInterface } = api;

const modelStore = useModelStore();

interface FieldMappingsForm {
  prompt: string;
  imageList: string;
  model: string;
  imageSize: string;
  ImageRatio: string;
  imageNum: string;
}

interface FormState {
  /** Select 空态须用 undefined，勿用 ""，否则 placeholder 不显示 */
  provider: string | undefined;
  modelName: string | undefined;
  displayName: string;
  modelType: string;
  apiUrl: string;
  maxImageCount?: number | null;
  supportedAspectRatio: string[];
  defaultAspectRatio: string;
  supportedResolutions: string[];
  defaultResolution: string | undefined;
  supportedFormats: string[];
  maxResolution: string | undefined;
  fieldMappings: FieldMappingsForm;
  /** 默认 false：显示字段映射；true 时隐藏且不提交 fieldMappings */
  compatibleWithOpenAi: boolean;
  defaultParamsJson: string;
  isEnabled: boolean;
  sort?: number | null;
}

const emptyFieldMappings = (): FieldMappingsForm => ({
  prompt: "",
  imageList: "",
  model: "",
  imageSize: "",
  ImageRatio: "",
  imageNum: "",
});

const createEmptyForm = (): FormState => ({
  provider: undefined,
  modelName: undefined,
  displayName: "",
  modelType: "image_edit",
  apiUrl: "",
  maxImageCount: 10,
  supportedAspectRatio: [],
  defaultAspectRatio: "",
  supportedResolutions: [],
  defaultResolution: undefined,
  supportedFormats: [],
  maxResolution: undefined,
  fieldMappings: emptyFieldMappings(),
  compatibleWithOpenAi: false,
  defaultParamsJson: "{}",
  isEnabled: true,
  sort: undefined,
});

const formRef = ref<FormInstance>();
const formState = reactive<FormState>(createEmptyForm());
const submitLoading = ref(false);
const editId = ref("");

/** 与 AI 模型管理一致：服务商列表来自 store */
const providerClassifyList = computed(() => modelStore.providerOptions as string[]);

const providerSelectOptions = computed(() => {
  const list = Array.isArray(providerClassifyList.value) ? providerClassifyList.value : [];
  const opts = list.map((s) => ({ label: String(s), value: String(s) }));
  const cur = formState.provider?.trim();
  if (cur && !opts.some((o) => o.value === cur)) {
    return [...opts, { label: cur, value: cur }];
  }
  return opts;
});

const filterProviderOption = (input: string, option: { label?: string; value?: string }) => {
  const text = String(option?.value ?? option?.label ?? "");
  return text.toLowerCase().includes(input.trim().toLowerCase());
};

/** 来自 store：API 模型名列表（依赖 fetchAiModelList 填充 aiModelList） */
const modelNameFromStore = computed(() => modelStore.apiModelNameList as string[]);

const modelNameSelectOptions = computed(() => {
  const list = Array.isArray(modelNameFromStore.value) ? modelNameFromStore.value : [];
  const opts = list.map((s) => ({ label: String(s), value: String(s) }));
  const cur = formState.modelName?.trim();
  if (cur && !opts.some((o) => o.value === cur)) {
    return [...opts, { label: cur, value: cur }];
  }
  return opts;
});

const filterModelNameOption = (input: string, option: { label?: string; value?: string }) => {
  const text = String(option?.value ?? option?.label ?? "");
  return text.toLowerCase().includes(input.trim().toLowerCase());
};

/** 预设宽高比（展示层统一半角冒号） */
const ASPECT_RATIO_PRESET = [
  "1:1",
  "2:3",
  "3:2",
  "3:4",
  "4:3",
  "1:4",
  "4:1",
  "1:8",
  "8:1",
  "4:5",
  "5:4",
  "16:9",
  "9:16",
  "21:9",
] as const;

const presetAspectRatioSet = new Set<string>(ASPECT_RATIO_PRESET);

const supportedAspectRatioSelectOptions = computed(() => {
  const base = ASPECT_RATIO_PRESET.map((r) => ({ label: r, value: r }));
  const selected = formState.supportedAspectRatio ?? [];
  const orphans = selected.filter((s) => s && !presetAspectRatioSet.has(s));
  const extra = orphans.map((r) => ({ label: r, value: r }));
  return [...base, ...extra];
});

const filterAspectRatioOption = (input: string, option: { label?: string; value?: string }) => {
  const text = String(option?.value ?? option?.label ?? "");
  return text.toLowerCase().includes(input.trim().toLowerCase());
};

/** 分辨率档位（可选值） */
const RESOLUTION_PRESET = ["1K", "2K", "3K", "4K", "8K"] as const;
const presetResolutionSet = new Set<string>(RESOLUTION_PRESET);

const supportedResolutionsSelectOptions = computed(() => {
  const base = RESOLUTION_PRESET.map((r) => ({ label: r, value: r }));
  const selected = formState.supportedResolutions ?? [];
  const orphans = selected.filter((s) => s && !presetResolutionSet.has(s));
  return [...base, ...orphans.map((r) => ({ label: r, value: r }))];
});

const defaultResolutionSelectOptions = computed(() => {
  const base = RESOLUTION_PRESET.map((r) => ({ label: r, value: r }));
  const cur = formState.defaultResolution?.trim();
  if (cur && !presetResolutionSet.has(cur)) {
    return [...base, { label: cur, value: cur }];
  }
  return base;
});

const maxResolutionSelectOptions = computed(() => {
  const base = RESOLUTION_PRESET.map((r) => ({ label: r, value: r }));
  const cur = formState.maxResolution?.trim();
  if (cur && !presetResolutionSet.has(cur)) {
    return [...base, { label: cur, value: cur }];
  }
  return base;
});

const filterResolutionPresetOption = (input: string, option: { label?: string; value?: string }) => {
  const text = String(option?.value ?? option?.label ?? "");
  return text.toLowerCase().includes(input.trim().toLowerCase());
};

const FORMAT_PRESET = ["jpeg", "png"] as const;
const presetFormatSet = new Set<string>(FORMAT_PRESET);

const supportedFormatsSelectOptions = computed(() => {
  const base = FORMAT_PRESET.map((r) => ({ label: r, value: r }));
  const selected = formState.supportedFormats ?? [];
  const orphans = selected.filter((s) => s && !presetFormatSet.has(s));
  return [...base, ...orphans.map((r) => ({ label: r, value: r }))];
});

const formRules = {
  provider: [{ required: true, message: "请选择服务商", trigger: "change" }],
  modelName: [{ required: true, message: "请选择模型名", trigger: "change" }],
  displayName: [{ required: true, message: "请输入展示名称", trigger: "blur" }],
  modelType: [{ required: true, message: "请输入模型类型", trigger: "blur" }],
  apiUrl: [{ required: true, message: "请输入 API 地址", trigger: "blur" }],
};

const defaultParamsJsonRules: Rule[] = [
  {
    validator: (_rule, value: string) => {
      if (!value || !value.trim()) return Promise.resolve();
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

const trimOrUndefined = (v?: string | null) => {
  const t = v?.trim();
  return t ? t : undefined;
};

/** 宽高比字符串统一为半角冒号，兼容历史「9：16」等 */
const normalizeAspectRatioToken = (raw: string) => raw.replace(/\uFF1A/g, ":").trim();

const buildFieldMappingsPayload = (fm: FieldMappingsForm): FieldMappingsDto | undefined => {
  const out: FieldMappingsDto = {};
  const p = trimOrUndefined(fm.prompt);
  const il = trimOrUndefined(fm.imageList);
  const m = trimOrUndefined(fm.model);
  const isz = trimOrUndefined(fm.imageSize);
  const ir = trimOrUndefined(fm.ImageRatio);
  const inum = trimOrUndefined(fm.imageNum);
  if (p) out.prompt = p;
  if (il) out.imageList = il;
  if (m) out.model = m;
  if (isz) out.imageSize = isz;
  if (ir) out.ImageRatio = ir;
  if (inum) out.imageNum = inum;
  return Object.keys(out).length ? out : undefined;
};

const parseDefaultParams = (): Record<string, unknown> | undefined => {
  const raw = formState.defaultParamsJson?.trim();
  if (!raw) return undefined;
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    return Object.keys(parsed).length ? parsed : undefined;
  }
  return undefined;
};

const applyDetailToForm = (data: AiModelConfigRow) => {
  editId.value = data.id ?? "";
  formState.provider = data.provider?.trim() || undefined;
  formState.modelName = data.modelName?.trim() || undefined;
  formState.displayName = data.displayName ?? "";
  formState.modelType = data.modelType ?? "";
  formState.apiUrl = data.apiUrl ?? "";
  formState.maxImageCount = data.maxImageCount ?? undefined;
  formState.supportedAspectRatio = Array.isArray(data.supportedAspectRatio)
    ? data.supportedAspectRatio
        .map((s) => normalizeAspectRatioToken(String(s)))
        .filter((s) => s.length > 0)
    : [];
  formState.defaultAspectRatio = data.defaultAspectRatio
    ? normalizeAspectRatioToken(String(data.defaultAspectRatio))
    : "";
  formState.supportedResolutions = Array.isArray(data.supportedResolutions)
    ? data.supportedResolutions.map((s) => String(s).trim()).filter((s) => s.length > 0)
    : [];
  formState.defaultResolution = trimOrUndefined(data.defaultResolution);
  formState.supportedFormats = Array.isArray(data.supportedFormats)
    ? data.supportedFormats
        .map((s) => String(s).trim().toLowerCase())
        .filter((s) => s.length > 0)
    : [];
  formState.maxResolution = trimOrUndefined(data.maxResolution);
  const fm = data.fieldMappings;
  formState.fieldMappings = {
    prompt: fm?.prompt ?? "",
    imageList: fm?.imageList ?? "",
    model: fm?.model ?? "",
    imageSize: fm?.imageSize ?? "",
    ImageRatio: fm?.ImageRatio ?? "",
    imageNum: fm?.imageNum ?? "",
  };
  try {
    formState.defaultParamsJson = JSON.stringify(data.defaultParams ?? {}, null, 2);
  } catch {
    formState.defaultParamsJson = "{}";
  }
  formState.isEnabled = data.isEnabled ?? true;
  formState.sort = data.sort ?? undefined;
  formState.compatibleWithOpenAi = data.compatibleWithOpenAi ?? false;
};

const resetForm = () => {
  Object.assign(formState, createEmptyForm());
  editId.value = "";
};

const buildCreateDto = (): AiModelConfigCreateDto => {
  const dto: AiModelConfigCreateDto = {
    provider: (formState.provider ?? "").trim(),
    modelName: (formState.modelName ?? "").trim(),
    displayName: formState.displayName.trim(),
    modelType: formState.modelType.trim(),
    apiUrl: formState.apiUrl.trim(),
    isEnabled: formState.isEnabled,
    compatibleWithOpenAi: formState.compatibleWithOpenAi,
  };
  if (formState.maxImageCount !== null && formState.maxImageCount !== undefined) {
    dto.maxImageCount = formState.maxImageCount;
  }
  if (formState.sort !== null && formState.sort !== undefined) dto.sort = formState.sort;
  if (formState.supportedAspectRatio?.length) dto.supportedAspectRatio = formState.supportedAspectRatio;
  const dar = trimOrUndefined(formState.defaultAspectRatio);
  if (dar) dto.defaultAspectRatio = dar;
  if (formState.supportedResolutions?.length) dto.supportedResolutions = formState.supportedResolutions;
  const dr = trimOrUndefined(formState.defaultResolution);
  if (dr) dto.defaultResolution = dr;
  if (formState.supportedFormats?.length) dto.supportedFormats = formState.supportedFormats;
  const mr = trimOrUndefined(formState.maxResolution);
  if (mr) dto.maxResolution = mr;
  if (!formState.compatibleWithOpenAi) {
    const fm = buildFieldMappingsPayload(formState.fieldMappings);
    if (fm) dto.fieldMappings = fm;
  }
  const dp = parseDefaultParams();
  if (dp) dto.defaultParams = dp;
  return dto;
};

const buildUpdateDto = (): AiModelConfigUpdateDto => buildCreateDto();

const syncFormWhenOpened = () => {
  if (props.isEditMode && props.initialRecord) {
    applyDetailToForm(props.initialRecord);
  } else {
    resetForm();
  }
};

watch(open, (visible) => {
  if (visible) {
    void modelStore.fetchProviderList();
    void modelStore.fetchAiModelList(
      { page: 1, pageSize: 500 },
      { preserveSelection: true },
    );
  }
  if (!visible) return;
  nextTick(() => syncFormWhenOpened());
});

const handleCloseModal = () => {
  open.value = false;
  formRef.value?.clearValidate();
  resetForm();
};

const handleSubmit = async () => {
  try {
    await formRef.value?.validate();
    submitLoading.value = true;
    if (props.isEditMode) {
      const res = await updateAiModelConfigByIdInterface({
        id: editId.value || props.initialRecord?.id || "",
        dto: buildUpdateDto(),
      });
      if (res?.code === 200 || res?.code === 201) {
        message.success(res?.message || "更新成功");
        handleCloseModal();
        emit("success");
        return;
      }
      message.error(res?.message || "更新失败");
    } else {
      const res = await addAiModelConfigInterface(buildCreateDto());
      if (res?.code === 200 || res?.code === 201) {
        message.success(res?.message || "新增成功");
        handleCloseModal();
        emit("success");
        return;
      }
      message.error(res?.message || "新增失败");
    }
  } catch (e) {
    if (e) console.error(e);
  } finally {
    submitLoading.value = false;
  }
};
</script>

<style scoped lang="scss">
.form-item-hint {
  margin-left: 12px;
  color: rgba(0, 0, 0, 0.45);
  font-size: 12px;
}

.mono-textarea {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
    "Courier New", monospace;
  font-size: 12px;
}
</style>
