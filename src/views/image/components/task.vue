<template>
  <div class="task-root" @paste.capture="onClipboardPaste">
    <div class="task-card box-card">
      <header class="task-card-header box-header">
        <div>任务 {{ taskId }}</div>
        <div class="result-status">
          <div v-if="showStatus === '0'" class="is-not-start status">未开始</div>
          <div v-else-if="showStatus === '1'" class="is-pending status">生成中</div>
          <div v-else-if="showStatus === '2'" class="is-finish status">已完成</div>
          <a-tooltip v-else-if="responseErrorText" placement="top">
            <template #title>{{ responseErrorText }}</template>
            <div class="is-error status">失败</div>
          </a-tooltip>
          <div v-else class="is-error status">失败</div>
        </div>
      </header>

      <div class="container">
        <div class="input-content">
          <div class="condition">
            <a-select
              v-model:value="submitForm.modelName"
              placeholder="模型"
              size="small"
              class="cond-select cond-model"
            >
              <a-select-option
                v-for="item in modelOptions"
                :key="item.value"
                :value="item.value"
              >
                {{ item.label }}
              </a-select-option>
            </a-select>
            <a-select
              v-model:value="submitForm.imageRatio"
              placeholder="比例"
              size="small"
              class="cond-select cond-ratio"
            >
              <a-select-option
                v-for="item in showRationOptions"
                :key="item.value"
                :value="item.value"
              >
                {{ item.label }}
              </a-select-option>
            </a-select>
            <a-select
              v-if="!isBasicBanana"
              v-model:value="submitForm.imageSize"
              placeholder="分辨率"
              size="small"
              class="cond-select cond-size"
            >
              <a-select-option
                v-for="item in showSizeOptions"
                :key="item.value"
                :value="item.value"
              >
                {{ item.label }}
              </a-select-option>
            </a-select>
          </div>

          <div class="upload-grid">
            <div
              v-for="(_slotFiles, slotIndex) in uploadSlots"
              :key="`upload-slot-${slotIndex}`"
              class="upload-area"
              :style="{
                borderColor: draggingSlot === slotIndex ? '#409eff' : 'transparent',
              }"
              @click="focusedUploadSlot = slotIndex"
              @dragover.prevent="draggingSlot = slotIndex"
              @dragleave.prevent="
                draggingSlot = draggingSlot === slotIndex ? null : draggingSlot
              "
              @drop.prevent="onUploadAreaDrop(slotIndex, $event)"
            >
              <a-upload
                v-if="uploadSlots[slotIndex].length === 0"
                list-type="picture-card"
                :max-count="1"
                :file-list="uploadSlots[slotIndex]"
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                :before-upload="beforeUploadNoop"
                class="picture-wall"
                @change="(info) => onUploadChange(slotIndex, info)"
              >
                <div v-if="uploadSlots[slotIndex].length < 1" class="upload-plus">
                  <div class="upload-plus-inner">+</div>
                </div>
              </a-upload>

              <div v-else class="uploaded-thumb-wrap">
                <div
                  class="uploaded-thumb-drag"
                  draggable="true"
                  @dragstart="onThumbDragStart(slotIndex, $event)"
                  @dragend="onThumbDragEnd"
                >
                  <a-image
                    class="uploaded-thumb"
                    :src="uploadSlots[slotIndex][0]?.url || ''"
                    :preview="false"
                    @click="previewUploadedSlot(slotIndex)"
                  />
                </div>
                <button
                  class="uploaded-delete-btn"
                  type="button"
                  title="删除图片"
                  @click.stop="clearUploadSlot(slotIndex)"
                >
                  ×
                </button>
              </div>
            </div>
          </div>

          <div ref="textContentRef" class="text-content">
            <a-textarea
              v-model:value="currentText"
              :rows="12"
              placeholder="请输入图片生成描述词..."
            />
          </div>
        </div>

        <div class="output-content">
          <div
            class="submit-button button"
            :class="responseLoading ? 'diabled-use' : ''"
            @click="submitBtn"
          >
            {{ responseLoading ? "生成中" : "开始生成" }}
          </div>
          <div class="break-button button" @click="cancelBtn">中断</div>
          <div class="optimize-copy-button button" @click="optimizeCopyBtn">
            AI优化文案
          </div>

          <div
            class="output-image border"
            :class="responseLoading ? 'diabled-image' : ''"
          >
            <a-image
              v-if="currentUrl"
              :src="resolveImageSrc(currentUrl, currentUrlCode)"
              class="result-img"
              :preview="{
                src: resolveImageSrc(currentUrl, currentUrlCode),
              }"
            />
            <div v-else class="error-text">生成结果将展示在这里....</div>
            <div v-show="responseLoading" class="loading-inner">
              <div class="spinner" />
              <span class="loading-text">生成中...</span>
            </div>
          </div>

          <div class="download-button button" @click="downloadBtn">下载</div>

          <HistoryImageItem
            :task-id="taskId"
            :history-image-list="historyImageList"
            :resolve-image-src="resolveImageSrc"
            :popover-width="historyPopoverWidth"
            @view="viewHistoryEvent"
            @download="downloadHistoryEvent"
            @delete="deleteHistoryEvent"
          />
        </div>
      </div>
    </div>

    <!-- 官方推荐：display:none 仅隐藏占位图，全屏预览仍由 preview 受控打开（页面中不占位、不露出缩略图） -->
    <Teleport to="body">
      <a-image
        v-if="previewBridgeSrc"
        :src="previewBridgeSrc"
        alt=""
        :style="{ display: 'none' }"
        :preview="bridgePreviewOpts"
      />
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import imageCompression from "browser-image-compression";
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { message } from "ant-design-vue";
import type { UploadChangeParam, UploadFile } from "ant-design-vue/es/upload/interface";
import {
  addTaskImageApi,
  deleteInputImageApi,
  fetchInputImageByLocalPathApi,
  findTaskImageByTaskIdApi,
  getImageTaskResultApi,
  taskImageGenerateApi,
  updateTaskImageSourceImagesApi,
  uploadImagesApi,
} from "@/api/images";
import { useTaskStore, type HistoryImage } from "@/stores/taskStore";
import {
  fetchImageModelOptions,
  mapAspectStringsToOptions,
  mapResolutionStringsToOptions,
  normalizeAspectRatioToken,
  ratioOptions,
  sizeOptions,
  type ModelOption,
} from "../js/config";
import { downloadImage } from "@/utils/download";
import HistoryImageItem from "./HistoryItem.vue";

type SubmitParam = {
  modelName: string;
  imageRatio: string;
  imageSize: string;
  /** 当前模型对应的服务商，与模型列表同步 */
  provider?: string;
};

type UploadWithMeta = UploadFile & { base64?: string; mimeType?: string };

type TaskImageCommonResp = {
  code?: number;
  message?: string;
  data?: unknown;
  timestamp?: number;
  path?: string;
};

function isTaskImageApiSuccess(code: unknown): boolean {
  return code === 200 || code === 0 || code === 201;
}

/** 根据 findTaskImageByTaskId 返回的 data 判断是否已有任务记录 */
function taskImageRecordExists(data: unknown): boolean {
  if (data == null) return false;
  if (typeof data === "boolean") return data;
  if (typeof data === "number") return Number.isFinite(data);
  if (typeof data === "string") return data.trim().length > 0;
  if (Array.isArray(data)) return data.length > 0;
  if (typeof data === "object") {
    const o = data as Record<string, unknown>;
    if ("exists" in o && typeof o.exists === "boolean") return o.exists;
    if (o.id != null && o.id !== "") return true;
    return Object.keys(o).length > 0;
  }
  return false;
}

const props = defineProps<{
  taskId: number | string;
  param?: Partial<SubmitParam>;
  /**
   * 父页使用本地 taskId 渲染卡片；
   * 为 true 时，在本组件内模型列表就绪并完成 submitForm 初始化后，先按 taskId 查询任务是否存在，
   * 不存在再 POST /taskImage/addTaskImage（含 modelName、imageRatio、imageSize）。
   */
  shouldRegisterTaskImage?: boolean;
}>();

const textStorageKey = `image-task-text-${props.taskId}`;

const store = useTaskStore();

const uploadSlots = ref<UploadWithMeta[][]>(
  Array.from({ length: 4 }, () => []),
);

/** 与 uploadSlots 下标对齐，服务端保存的图片路径/URL；空字符串表示该槽无图 */
const sourceImages = ref<string[]>(["", "", "", ""]);
const draggingSlot = ref<number | null>(null);
/** 点击过的上传格，粘贴无空位时写入该格 */
const focusedUploadSlot = ref<number | null>(null);
/** 槽位缩略图拖拽换位：起点槽索引 */
const internalDragSlotIndex = ref<number | null>(null);

const modelOptions = ref<ModelOption[]>([]);

const submitForm = ref<SubmitParam>({
  modelName: "",
  imageRatio: ratioOptions[0]?.value ?? "3.4",
  imageSize: sizeOptions[0]?.value ?? "3K",
  provider: "",
});

/** 与当前选中模型一致的服务商，用于登记任务与生成请求 */
function syncProviderWithSelectedModel() {
  const row = modelOptions.value.find((m) => m.value === submitForm.value.modelName);
  const p = (row?.provider ?? "").trim();
  submitForm.value.provider = p;
}

function syncModelNameWithList() {
  const opts = modelOptions.value;
  if (!opts.length) return;
  const cur = submitForm.value.modelName;
  if (!cur || !opts.some((o) => o.value === cur)) {
    submitForm.value.modelName = opts[0].value;
  }
}

watch(
  () => props.param,
  (newVal) => {
    if (!newVal) return;
    submitForm.value = {
      ...submitForm.value,
      modelName: newVal.modelName ?? submitForm.value.modelName,
      imageRatio: newVal.imageRatio ?? submitForm.value.imageRatio,
      imageSize: newVal.imageSize ?? submitForm.value.imageSize,
      provider: newVal.provider ?? submitForm.value.provider,
    };
  },
  { deep: true, immediate: true },
);

const currentText = ref<string>(localStorage.getItem(textStorageKey) || "");
watch(currentText, (v) => localStorage.setItem(textStorageKey, v));

const responseLoading = computed(
  () => store.tasks[String(props.taskId)]?.responseLoading ?? false,
);
const showStatus = computed(
  () => store.tasks[String(props.taskId)]?.showStatus ?? "0",
);
const responseErrorText = computed(
  () => store.tasks[String(props.taskId)]?.responseErrorText ?? "",
);
const currentUrlCode = computed(
  () => store.tasks[String(props.taskId)]?.currentUrlCode ?? "",
);
const currentUrl = computed(
  () => store.tasks[String(props.taskId)]?.currentUrl ?? "",
);
const historyImageList = computed<HistoryImage[]>(
  () => store.tasks[String(props.taskId)]?.historyImageList ?? [],
);

const isBasicBanana = computed(() => false);

const showRationOptions = computed(() => {
  const row = modelOptions.value.find((m) => m.value === submitForm.value.modelName);
  if (row?.supportedAspectRatio?.length) {
    return mapAspectStringsToOptions(row.supportedAspectRatio);
  }
  return ratioOptions;
});

const showSizeOptions = computed(() => {
  const row = modelOptions.value.find((m) => m.value === submitForm.value.modelName);
  if (row?.supportedResolutions?.length) {
    return mapResolutionStringsToOptions(row.supportedResolutions);
  }
  return sizeOptions;
});

function syncRatioSizeWithModel() {
  const row = modelOptions.value.find((m) => m.value === submitForm.value.modelName);
  const ratios = showRationOptions.value.map((o) => o.value);
  const sizes = showSizeOptions.value.map((o) => o.value);

  let nextRatio: string | undefined;
  if (ratios.length) {
    const want = row?.defaultAspectRatio?.trim();
    if (want) {
      const nw = normalizeAspectRatioToken(want);
      const picked =
        ratios.find((r) => r === want) ??
        ratios.find((r) => normalizeAspectRatioToken(r) === nw);
      if (picked) nextRatio = picked;
    }
    if (nextRatio === undefined) {
      nextRatio =
        submitForm.value.imageRatio && ratios.includes(submitForm.value.imageRatio)
          ? submitForm.value.imageRatio
          : ratios[0];
    }
    submitForm.value.imageRatio = nextRatio;
  }

  let nextSize: string | undefined;
  if (sizes.length) {
    const want = row?.defaultResolution?.trim();
    if (want) {
      const wl = want.toLowerCase();
      const picked = sizes.find((s) => s.toLowerCase() === wl);
      if (picked) nextSize = picked;
    }
    if (nextSize === undefined) {
      nextSize =
        submitForm.value.imageSize && sizes.includes(submitForm.value.imageSize)
          ? submitForm.value.imageSize
          : sizes[0];
    }
    submitForm.value.imageSize = nextSize;
  }
}

/** 仅将比例、分辨率限制在当前模型支持项内，不覆盖为模型配置里的默认值（用于回填持久化任务） */
function clampSubmitFormRatioSizeToModelSupported() {
  const ratios = showRationOptions.value.map((o) => o.value);
  const sizes = showSizeOptions.value.map((o) => o.value);
  if (ratios.length && !ratios.includes(submitForm.value.imageRatio)) {
    submitForm.value.imageRatio = ratios[0];
  }
  if (sizes.length && !sizes.includes(submitForm.value.imageSize)) {
    submitForm.value.imageSize = sizes[0];
  }
}

/** 将 findTaskImageByTaskId 的 data 规范为一条任务对象（兼容嵌套、数组首项） */
function taskImageRecordAsObject(raw: unknown): Record<string, unknown> | null {
  if (raw == null) return null;
  if (Array.isArray(raw)) {
    const first = raw[0];
    if (first && typeof first === "object" && !Array.isArray(first)) {
      return first as Record<string, unknown>;
    }
    return null;
  }
  if (typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const inner =
    o.data ??
    o.taskImage ??
    o.task_image ??
    o.task ??
    o.record ??
    o.result ??
    o.payload;
  if (inner && typeof inner === "object" && !Array.isArray(inner)) {
    return inner as Record<string, unknown>;
  }
  return o;
}

function strField(v: unknown): string {
  return v != null ? String(v).trim() : "";
}

function isHttpUrlString(s: string) {
  return /^https?:\/\//i.test(s);
}

/** 将接口 sourceImages 单项转为 UploadWithMeta，供 uploadSlots 展示 */
function uploadFileFromSourceImageEntry(item: unknown, index: number): UploadWithMeta | null {
  const uid = `persisted-${props.taskId}-${index}-${Date.now()}`;
  if (item == null) return null;
  if (typeof item === "string") {
    const s = item.trim();
    if (!s) return null;
    if (isHttpUrlString(s)) {
      return {
        uid,
        name: `ref-${index}.png`,
        status: "done",
        url: s,
        thumbUrl: s,
      } as UploadWithMeta;
    }
    const m = /^data:([^;]+);base64,(.+)$/i.exec(s);
    if (m) {
      const mime = m[1] || "image/png";
      const b64 = m[2];
      return {
        uid,
        name: `ref-${index}`,
        status: "done",
        url: s,
        thumbUrl: s,
        base64: b64,
        mimeType: mime,
      } as UploadWithMeta;
    }
    const mime = "image/png";
    const dataUrl = `data:${mime};base64,${s}`;
    return {
      uid,
      name: `ref-${index}.png`,
      status: "done",
      url: dataUrl,
      thumbUrl: dataUrl,
      base64: s,
      mimeType: mime,
    } as UploadWithMeta;
  }
  if (typeof item === "object" && !Array.isArray(item)) {
    const ob = item as Record<string, unknown>;
    const urlRaw = ob.url ?? ob.viewUrl ?? ob.imageUrl ?? ob.image_url;
    if (typeof urlRaw === "string" && urlRaw.trim()) {
      const u = urlRaw.trim();
      if (isHttpUrlString(u)) {
        return {
          uid,
          name: String(ob.name ?? `ref-${index}`),
          status: "done",
          url: u,
          thumbUrl: u,
        } as UploadWithMeta;
      }
      const m = /^data:([^;]+);base64,(.+)$/i.exec(u);
      if (m) {
        const mime = m[1] || "image/png";
        const b64 = m[2];
        return {
          uid,
          name: String(ob.name ?? `ref-${index}`),
          status: "done",
          url: u,
          thumbUrl: u,
          base64: b64,
          mimeType: mime,
        } as UploadWithMeta;
      }
    }
    let b64Raw: string | undefined;
    if (typeof ob.base64 === "string" && ob.base64.trim()) b64Raw = ob.base64.trim();
    else if (typeof ob.binary_data_base64 === "string" && ob.binary_data_base64.trim()) {
      b64Raw = ob.binary_data_base64.trim();
    } else if (typeof ob.data === "string" && ob.data.trim()) {
      b64Raw = ob.data.trim();
    }
    if (b64Raw) {
      const mime = String(ob.mimeType ?? ob.contentType ?? ob.mime ?? "image/png");
      const dataUrl = `data:${mime};base64,${b64Raw}`;
      return {
        uid,
        name: String(ob.name ?? `ref-${index}`),
        status: "done",
        url: dataUrl,
        thumbUrl: dataUrl,
        base64: b64Raw,
        mimeType: mime,
      } as UploadWithMeta;
    }
  }
  return null;
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("readAsDataURL failed"));
    reader.readAsDataURL(blob);
  });
}

/** 将 GET 返回的图片 Blob 转为带 base64 的 UploadWithMeta，供 uploadSlots 展示 */
async function uploadFileMetaFromImageBlob(
  blob: Blob,
  index: number,
  pathHint: string,
): Promise<UploadWithMeta> {
  const dataUrl = await blobToDataUrl(blob);
  const comma = dataUrl.indexOf(",");
  const b64 = comma >= 0 ? dataUrl.slice(comma + 1) : "";
  const mimeMatch = /^data:([^;]+)/.exec(comma >= 0 ? dataUrl.slice(0, comma) : "");
  const mimeType = (blob.type && blob.type !== "application/octet-stream"
    ? blob.type
    : mimeMatch?.[1]) || "image/jpeg";
  const name = pathHint.split(/[/\\]/).pop() || `ref-${index}.jpg`;
  return {
    uid: `fetched-${props.taskId}-${index}-${Date.now()}`,
    name,
    status: "done",
    url: dataUrl,
    thumbUrl: dataUrl,
    base64: b64,
    mimeType,
  } as UploadWithMeta;
}

/** 已存在任务记录时，用接口返回填充表单与上传槽 */
async function applyPersistedTaskImageFromApiData(raw: unknown) {
  const o = taskImageRecordAsObject(raw);
  if (!o) return;

  for (const slot of uploadSlots.value) {
    const u = slot[0]?.url;
    if (u?.startsWith("blob:")) URL.revokeObjectURL(u);
  }

  const mn = strField(o.modelName ?? o.model_name);
  if (mn) submitForm.value.modelName = mn;

  const prov = strField(o.provider ?? o.provider_name);
  if (prov) submitForm.value.provider = prov;
  else syncProviderWithSelectedModel();

  const aspect = strField(
    o.aspectRatio ?? o.aspect_ratio ?? o.imageRatio ?? o.image_ratio,
  );
  if (aspect) submitForm.value.imageRatio = normalizeAspectRatioToken(aspect);

  const sz = strField(o.imageSize ?? o.image_size);
  if (sz) submitForm.value.imageSize = sz;

  const input = o.inputText ?? o.input_text ?? o.prompt;
  if (input != null) {
    const t = String(input);
    currentText.value = t;
    localStorage.setItem(textStorageKey, t);
  }

  const arr = o.sourceImages ?? o.source_images;
  const paths = ["", "", "", ""];
  if (Array.isArray(arr) && arr.length) {
    for (let i = 0; i < Math.min(4, arr.length); i++) {
      const el = arr[i];
      if (typeof el === "string") paths[i] = el.trim();
      else if (el && typeof el === "object") {
        const ob = el as Record<string, unknown>;
        paths[i] = strField(ob.url ?? ob.path ?? ob.fileUrl ?? ob.src);
      }
    }
  }
  sourceImages.value = paths;

  const slots: UploadWithMeta[][] = Array.from({ length: 4 }, () => []);
  for (let i = 0; i < 4; i++) {
    const lp = (paths[i] ?? "").trim();
    if (!lp) continue;
    if (isHttpUrlString(lp) || lp.startsWith("data:")) {
      const f = uploadFileFromSourceImageEntry(lp, i);
      if (f) slots[i] = [f];
      continue;
    }
    try {
      const blob = (await fetchInputImageByLocalPathApi(lp)) as unknown;
      if (!(blob instanceof Blob) || blob.size === 0) continue;
      slots[i] = [await uploadFileMetaFromImageBlob(blob, i, lp)];
    } catch (e) {
      console.error(e);
      message.warning(`加载参考图失败（槽位 ${i + 1}）`);
    }
  }
  uploadSlots.value = slots;

  const resultArr = o.resultImages ?? o.result_images;
  if (Array.isArray(resultArr) && resultArr.length > 0) {
    const first = resultArr[0];
    let localPath = "";
    if (typeof first === "string") localPath = first.trim();
    else if (first && typeof first === "object") {
      const ob = first as Record<string, unknown>;
      localPath = strField(ob.url ?? ob.path ?? ob.localPath ?? ob.local_path);
    }
    if (localPath && !isHttpUrlString(localPath) && !localPath.startsWith("data:")) {
      try {
        const blob = (await fetchInputImageByLocalPathApi(localPath)) as unknown;
        if (blob instanceof Blob && blob.size > 0) {
          const dataUrl = await blobToDataUrl(blob);
          store.setPersistedResultPreview(String(props.taskId), {
            url: dataUrl,
            code: "",
          });
        }
      } catch (e) {
        console.error(e);
        message.warning("加载已生成结果图失败");
      }
    } else if (localPath) {
      store.setPersistedResultPreview(String(props.taskId), {
        url: localPath,
        code: "",
      });
    }
  }

  void nextTick(() => {
    clampSubmitFormRatioSizeToModelSupported();
  });
}

/**
 * 时机：findAiModelConfigList 已通过 fetchImageModelOptions 拿到列表（含 defaultAspectRatio / defaultResolution），
 * 且 syncModelNameWithList + syncRatioSizeWithModel 已按模型默认值或支持项写入 submitForm。
 * 先 GET 按 taskId 查询是否已有记录；已存在则用返回数据回填 submitForm、描述词与 uploadSlots 后返回；
 * 不存在再 POST /taskImage/addTaskImage。
 */
async function registerTaskImageWithServer() {
  if (!props.shouldRegisterTaskImage) return;
  if (!submitForm.value.modelName?.trim()) return;

  const payload: Record<string, unknown> = {
    taskId: props.taskId,
    modelName: submitForm.value.modelName,
    imageRatio: submitForm.value.imageRatio,
    imageSize: submitForm.value.imageSize,
  };
  const pv = (submitForm.value.provider ?? "").trim();
  if (pv) payload.provider = pv;

  try {
    let alreadyExists = false;
    let findPayload: unknown;
    try {
      const findResp = (await findTaskImageByTaskIdApi(props.taskId)) as TaskImageCommonResp;
      findPayload = findResp.data;
      if (isTaskImageApiSuccess(findResp.code)) {
        alreadyExists = taskImageRecordExists(findResp.data);
      } else {
        message.warning(findResp.message ?? "查询图片任务失败，已跳过登记");
        return;
      }
    } catch (findErr: unknown) {
      const status = (findErr as { response?: { status?: number } })?.response?.status;
      // 常见：HTTP 404 表示尚无记录 → 继续走新增
      if (status !== 404) {
        console.error(findErr);
        message.warning("查询图片任务失败，已跳过登记");
        return;
      }
    }

    if (alreadyExists) {
      await applyPersistedTaskImageFromApiData(findPayload);
      return;
    }

    const addResp = (await addTaskImageApi(payload)) as TaskImageCommonResp;
    if (!isTaskImageApiSuccess(addResp.code)) {
      message.warning(addResp.message ?? "登记图片任务失败");
    }
  } catch (e) {
    console.error(e);
    message.error("登记图片任务请求失败");
  }
}

watch(
  () => submitForm.value.modelName,
  () => {
    nextTick(() => {
      syncRatioSizeWithModel();
      syncProviderWithSelectedModel();
    });
  },
);
const textContentRef = ref<HTMLElement | null>(null);
const historyPopoverWidth = ref(400);

const previewBridgeSrc = ref("");

/** 受控预览配置：稳定对象引用 + 不在 preview 里重复 src，避免重复挂载/叠两层 */
const bridgePreviewOpts = reactive({
  visible: false,
  mask: false,
  onVisibleChange(visible: boolean) {
    bridgePreviewOpts.visible = visible;
    if (!visible) previewBridgeSrc.value = "";
  },
});

function syncHistoryPopoverWidth() {
  const width = textContentRef.value?.clientWidth;
  if (width && width > 0) historyPopoverWidth.value = width;
}

let abortController: AbortController | null = null;
let abortRequestedByUser = false;

function beforeUploadNoop() {
  return false;
}

function isHttpUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function resolveImageSrc(urlOrBase64: string, code: string) {
  if (!urlOrBase64) return "";
  if (isHttpUrl(urlOrBase64)) return urlOrBase64;
  if (!code) return urlOrBase64;
  return `data:${code};base64,${urlOrBase64}`;
}

async function getBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = (err) => reject(err);
  });
}

function downloadFilenameSuffix() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}-${p(d.getMinutes())}-${p(d.getSeconds())}`;
}

function ensureFourSourceImageSlots(paths: string[]): string[] {
  const out = paths.slice(0, 4);
  while (out.length < 4) out.push("");
  return out;
}

function patchSourceImageAt(slotIndex: number, path: string) {
  const next = ensureFourSourceImageSlots([...sourceImages.value]);
  next[slotIndex] = path ?? "";
  sourceImages.value = next;
}

/** 解析 /file/uploadImages 返回中的本地路径（写入 sourceImages）。
 * 成功示例：{ code: 201, data: { localPath, fileName, mimeType }, ... } */
function extractUrlsFromUploadImagesResponse(resp: unknown): string[] {
  if (resp == null) return [];
  if (Array.isArray(resp)) {
    return resp
      .filter((x): x is string => typeof x === "string" && x.trim() !== "")
      .map((s) => s.trim());
  }
  if (typeof resp !== "object") return [];
  const r = resp as Record<string, unknown>;
  const code = r.code;
  if (code != null && code !== 200 && code !== 0 && code !== 201) return [];
  const d = r.data ?? r.result;
  if (Array.isArray(d)) {
    return d
      .filter((x): x is string => typeof x === "string" && x.trim() !== "")
      .map((s) => s.trim());
  }
  if (typeof d === "string" && d.trim()) return [d.trim()];
  if (d && typeof d === "object" && !Array.isArray(d)) {
    const o = d as Record<string, unknown>;
    const localPath = o.localPath;
    if (typeof localPath === "string" && localPath.trim()) {
      return [localPath.trim()];
    }
    const arr = o.urls ?? o.list ?? o.paths ?? o.sourceImages ?? o.data;
    if (Array.isArray(arr)) {
      return arr
        .filter((x): x is string => typeof x === "string" && x.trim() !== "")
        .map((s) => s.trim());
    }
    const single = o.url ?? o.path ?? o.fileUrl ?? o.file_url;
    if (typeof single === "string" && single.trim()) return [single.trim()];
  }
  return [];
}

async function persistSourceImagesToServer(status = 1) {
  if (!props.shouldRegisterTaskImage) return;
  try {
    const res = (await updateTaskImageSourceImagesApi({
      taskId: props.taskId,
      sourceImages: ensureFourSourceImageSlots([...sourceImages.value]),
      status,
    })) as TaskImageCommonResp;
    if (!isTaskImageApiSuccess(res?.code)) {
      message.warning(res?.message ?? "更新参考图记录失败");
    }
  } catch (e) {
    console.error(e);
    message.error("更新参考图记录失败");
  }
}

/** 按槽位删除服务端文件（若有）、清空 sourceImages 该位并 POST updateSourceImages */
async function removeSlotImageAndSyncServer(slotIndex: number) {
  const paths = ensureFourSourceImageSlots([...sourceImages.value]);
  const localPath = (paths[slotIndex] ?? "").trim();
  const u = uploadSlots.value[slotIndex]?.[0]?.url;
  if (u?.startsWith("blob:")) URL.revokeObjectURL(u);
  uploadSlots.value[slotIndex] = [];
  if (!props.shouldRegisterTaskImage) {
    patchSourceImageAt(slotIndex, "");
    return;
  }
  if (localPath) {
    try {
      await deleteInputImageApi({ localPath });
    } catch (e) {
      console.error(e);
      message.warning("删除服务端图片失败");
    }
  }
  patchSourceImageAt(slotIndex, "");
  await persistSourceImagesToServer();
}

async function uploadProcessedFileAndSyncServer(
  slotIndex: number,
  file: File,
  previousLocalPath?: string,
) {
  if (!props.shouldRegisterTaskImage) return;
  const formData = new FormData();
  formData.append("file", file, file.name);
  const resp = await uploadImagesApi(formData);
  const urls = extractUrlsFromUploadImagesResponse(resp);
  const path = urls[0]?.trim();
  if (!path) {
    throw new Error(
      (resp as TaskImageCommonResp)?.message ||
        (typeof resp === "object" && resp && "message" in resp
          ? String((resp as { message?: string }).message)
          : "") ||
        "上传成功但未返回图片地址",
    );
  }
  patchSourceImageAt(slotIndex, path);
  await persistSourceImagesToServer();
  const prev = (previousLocalPath ?? "").trim();
  if (prev && prev !== path && props.shouldRegisterTaskImage) {
    try {
      await deleteInputImageApi({ localPath: prev });
    } catch (e) {
      console.error(e);
      message.warning("新图已保存，但删除旧参考图文件失败");
    }
  }
}

async function handleChange(slotIndex: number, uploadFiles: UploadWithMeta[]) {
  uploadSlots.value[slotIndex] = uploadFiles.length ? [uploadFiles[0]] : [];
  const first = uploadFiles[0];
  if (!first || !uploadFiles.length) {
    await removeSlotImageAndSyncServer(slotIndex);
    return;
  }
  const rawFileObj = first?.originFileObj as File | undefined;
  if (rawFileObj) {
    const fileType = rawFileObj.type;
    const allowed = fileType === "image/jpeg" || fileType === "image/png";
    if (!allowed) {
      const bu = first.url;
      if (typeof bu === "string" && bu.startsWith("blob:")) URL.revokeObjectURL(bu);
      uploadSlots.value[slotIndex] = [];
      await removeSlotImageAndSyncServer(slotIndex);
      store.setError(String(props.taskId), "仅支持上传 JPG/JPEG 或 PNG 格式图片");
      return;
    }
  }
  if (first && rawFileObj && !first.base64) {
    const previousLocalPath = (
      ensureFourSourceImageSlots([...sourceImages.value])[slotIndex] ?? ""
    ).trim();

    const maxBytes = 1 * 1024 * 1024;

    let rawFile = rawFileObj as File;
    const shouldConvertToJpeg =
      rawFile.type === "image/jpeg" || rawFile.type === "image/png";

    if (shouldConvertToJpeg && !/\.jpeg$/i.test(rawFile.name)) {
      const jpegName = rawFile.name.replace(/\.[^./\\]+$/, ".jpeg");
      rawFile = new File([rawFile], jpegName, {
        type: "image/jpeg",
        lastModified: rawFile.lastModified,
      });
      first.name = jpegName;
    }

    let tempObjectUrl: string | null = null;
    if (!first.url) {
      tempObjectUrl = URL.createObjectURL(rawFile);
      first.url = tempObjectUrl;
      first.thumbUrl = tempObjectUrl;
    } else if (first.url.startsWith("blob:")) {
      URL.revokeObjectURL(first.url);
      tempObjectUrl = URL.createObjectURL(rawFile);
      first.url = tempObjectUrl;
      first.thumbUrl = tempObjectUrl;
    }

    if (rawFile.size > maxBytes) {
      rawFile = (await imageCompression(rawFile, {
        maxSizeMB: 1,
        initialQuality: 1,
        maxIteration: 10,
        useWebWorker: true,
        ...(shouldConvertToJpeg ? { fileType: "image/jpeg" } : {}),
        alwaysKeepResolution: true,
      })) as File;
    } else if (shouldConvertToJpeg) {
      rawFile = (await imageCompression(rawFile, {
        maxSizeMB: 1,
        initialQuality: 1,
        maxIteration: 1,
        useWebWorker: true,
        fileType: "image/jpeg",
        alwaysKeepResolution: true,
      })) as File;
    }

    if (shouldConvertToJpeg && !/\.jpeg$/i.test(rawFile.name)) {
      const jpegName = rawFile.name.replace(/\.[^./\\]+$/, ".jpeg");
      rawFile = new File([rawFile], jpegName, {
        type: "image/jpeg",
        lastModified: rawFile.lastModified,
      });
      first.name = jpegName;
    }

    first.originFileObj = rawFile as any;
    first.mimeType = rawFile.type || first.mimeType;

    const dataUrl = await getBase64(rawFile);
    first.base64 = dataUrl.replace(/^data:image\/\w+;base64,/, "");
    first.url = dataUrl;
    first.thumbUrl = dataUrl;

    if (tempObjectUrl) URL.revokeObjectURL(tempObjectUrl);

    try {
      await uploadProcessedFileAndSyncServer(slotIndex, rawFile, previousLocalPath);
    } catch (e: unknown) {
      console.error(e);
      await removeSlotImageAndSyncServer(slotIndex);
      message.error((e as Error)?.message || "图片上传失败");
    }
  }
}

async function onUploadChange(slotIndex: number, info: UploadChangeParam) {
  const list = info.fileList as UploadWithMeta[];
  await handleChange(slotIndex, list);
}

function isAllowedImageFile(file: File) {
  if (file.type === "image/jpeg" || file.type === "image/png") return true;
  return /\.(jpe?g|png)$/i.test(file.name);
}

function swapUploadSlots(from: number, to: number) {
  if (from === to) return;
  const next = uploadSlots.value.map((row) => [...row]);
  const a = next[from];
  next[from] = next[to];
  next[to] = a;
  uploadSlots.value = next;
  const si = ensureFourSourceImageSlots([...sourceImages.value]);
  const t = si[from];
  si[from] = si[to];
  si[to] = t;
  sourceImages.value = si;
  void persistSourceImagesToServer();
}

async function applyImageFileToSlot(slotIndex: number, imageFile: File) {
  const prevUrl = uploadSlots.value[slotIndex]?.[0]?.url;
  if (prevUrl?.startsWith("blob:")) URL.revokeObjectURL(prevUrl);
  const uploadFile = {
    uid: `${Date.now()}-${slotIndex}`,
    name: imageFile.name,
    status: "done",
    originFileObj: imageFile,
  } as UploadWithMeta;
  await handleChange(slotIndex, [uploadFile]);
}

/** 外部文件拖入；无文件时若为槽位拖拽则交换两格图片 */
async function onUploadAreaDrop(slotIndex: number, e: DragEvent) {
  draggingSlot.value = null;
  const dt = e.dataTransfer;
  const files = dt?.files?.length ? Array.from(dt.files) : [];

  if (files.length > 0) {
    internalDragSlotIndex.value = null;
    const imageFile = files.find((f) => isAllowedImageFile(f));
    if (!imageFile) {
      store.setError(String(props.taskId), "仅支持上传 JPG/JPEG 或 PNG 格式图片");
      return;
    }
    await applyImageFileToSlot(slotIndex, imageFile);
    return;
  }

  const from = internalDragSlotIndex.value;
  if (from !== null && from !== slotIndex && uploadSlots.value[from]?.length) {
    swapUploadSlots(from, slotIndex);
  }
  internalDragSlotIndex.value = null;
}

function onThumbDragStart(slotIndex: number, e: DragEvent) {
  if (!uploadSlots.value[slotIndex]?.length) return;
  internalDragSlotIndex.value = slotIndex;
  const t = e.dataTransfer;
  if (t) {
    t.effectAllowed = "move";
    t.setData("text/plain", `upload-slot:${slotIndex}`);
  }
}

function onThumbDragEnd() {
  internalDragSlotIndex.value = null;
  draggingSlot.value = null;
}

function pickPasteTargetSlot(): number {
  const empty = uploadSlots.value.findIndex((s) => s.length === 0);
  if (empty >= 0) return empty;
  const f = focusedUploadSlot.value;
  return f !== null && f >= 0 ? f : 0;
}

function onClipboardPaste(e: ClipboardEvent) {
  const items = e.clipboardData?.items;
  if (!items?.length) return;

  let imageFile: File | null = null;
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (it.kind !== "file") continue;
    const f = it.getAsFile();
    if (f && isAllowedImageFile(f)) {
      imageFile = f;
      break;
    }
  }
  if (!imageFile) return;

  e.preventDefault();
  const slotIndex = pickPasteTargetSlot();
  void applyImageFileToSlot(slotIndex, imageFile);
}

/** 已上传缩略图点击：走与 Upload 预览相同的桥接 Image 全屏逻辑（有文件后 v-if 会换掉 Upload，Upload 的 @preview 不会触发） */
async function previewUploadedSlot(slotIndex: number) {
  const file = uploadSlots.value[slotIndex]?.[0];
  if (file) await handlePictureCardPreview(file);
}

async function handlePictureCardPreview(file: UploadWithMeta) {
  const code = file.mimeType ?? file.originFileObj?.type ?? "image/png";
  let src = file.url ?? file.thumbUrl ?? "";
  if (file.base64) {
    src = `data:${code};base64,${file.base64}`;
  } else if (file.originFileObj) {
    const dataUrl = await getBase64(file.originFileObj as File);
    const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, "");
    file.base64 = base64;
    file.mimeType = (file.originFileObj as File).type;
    file.url = dataUrl;
    src = `data:${file.mimeType};base64,${base64}`;
  }
  if (!src) return;
  previewBridgeSrc.value = src;
  await nextTick();
  bridgePreviewOpts.visible = true;
}

function cancelBtn() {
  abortRequestedByUser = true;
  abortController?.abort();
  abortController = null;
  store.cancelTask(String(props.taskId));
}

function optimizeCopyBtn() {
  if (!currentText.value.trim()) {
    message.warning("请先输入描述词");
    return;
  }
}

function clearTextBtn() {
  currentText.value = "";
  localStorage.removeItem(textStorageKey);
}

function clearImagesBtn() {
  void clearAllSlotImagesAndSyncServer();
}

async function clearAllSlotImagesAndSyncServer() {
  for (const slot of uploadSlots.value) {
    const u = slot[0]?.url;
    if (u?.startsWith("blob:")) URL.revokeObjectURL(u);
  }
  uploadSlots.value = Array.from({ length: 4 }, () => []);
  if (props.shouldRegisterTaskImage) {
    const paths = ensureFourSourceImageSlots([...sourceImages.value]);
    for (let i = 0; i < 4; i++) {
      const t = (paths[i] ?? "").trim();
      if (!t) continue;
      try {
        await deleteInputImageApi({ localPath: t });
      } catch (e) {
        console.error(e);
      }
    }
  }
  sourceImages.value = ["", "", "", ""];
  store.clearTaskImages(String(props.taskId));
  await persistSourceImagesToServer();
}

function clearUploadSlot(slotIndex: number) {
  void removeSlotImageAndSyncServer(slotIndex);
}

function extractTaskIdFromResp(resp: any) {
  return (
    resp?.data?.taskId ??
    resp?.taskId ??
    resp?.data?.task_id ??
    resp?.task_id ??
    ""
  );
}

function extractTaskStatus(resp: any): string {
  return (
    resp?.data?.status ??
    resp?.status ??
    resp?.raw?.status ??
    resp?.data?.resp_data?.status ??
    ""
  );
}

function extractImageFromTaskResult(data: any): { url: string; code: string } {
  if (!data || typeof data !== "object") return { url: "", code: "" };

  const imageUrl =
    data?.image_urls?.[0] ??
    data?.images?.[0] ??
    data?.resp_data?.image_urls?.[0] ??
    data?.resp_data?.images?.[0] ??
    "";
  if (typeof imageUrl === "string" && imageUrl) {
    return { url: imageUrl, code: "" };
  }

  const base64 =
    data?.binary_data_base64?.[0] ??
    data?.b64_images?.[0] ??
    data?.resp_data?.binary_data_base64?.[0] ??
    data?.resp_data?.b64_images?.[0] ??
    "";
  if (typeof base64 === "string" && base64) {
    return { url: base64, code: "image/png" };
  }

  return { url: "", code: "" };
}

function waitWithAbort(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const timer = window.setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      window.clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal?.addEventListener("abort", onAbort);
  });
}

function downloadBtn() {
  if (!currentUrl.value) return;
  const src = resolveImageSrc(currentUrl.value, currentUrlCode.value);
  downloadImage(src, `task-${props.taskId}-${downloadFilenameSuffix()}.png`);
}

function downloadHistoryEvent(item: HistoryImage) {
  const src = resolveImageSrc(item.url, item.code);
  downloadImage(src, `task-${props.taskId}-${downloadFilenameSuffix()}.png`);
}

function deleteHistoryEvent(item: HistoryImage) {
  store.deleteHistoryItem(String(props.taskId), item.uid);
}

function viewHistoryEvent(item: HistoryImage) {
  currentText.value = item.context;
  store.viewHistoryItem(String(props.taskId), item);
}

function beginGeneration(taskId: string) {
  store.ensureTask(taskId);
  abortRequestedByUser = false;
  abortController?.abort();
  abortController = new AbortController();
  store.startTask(taskId);
  const timeoutId = window.setTimeout(() => {
    abortController?.abort();
  }, 1200000);
  store.setRequestTimerId(taskId, timeoutId);
}

function extractFirstUrlFromUnifiedResp(resp: any): string {
  const d = resp?.data;
  if (d == null) return "";
  if (typeof d === "string") {
    const s = d.trim();
    if (s.startsWith("http") || s.startsWith("data:image")) return s;
    return "";
  }
  if (typeof d !== "object") return "";

  const direct =
    d.url ??
    d.imageUrl ??
    d.image_url ??
    d.viewUrl ??
    "";
  if (typeof direct === "string" && direct) return direct;

  const nested = d.data;
  if (nested && typeof nested === "object") {
    const u = (nested as any).url ?? (nested as any).imageUrl;
    if (typeof u === "string" && u) return u;
  }

  const arr = d.images ?? d.image_urls ?? d.imageUrls ?? d.resultList;
  if (Array.isArray(arr)) {
    const first = arr[0];
    if (typeof first === "string") return first;
    if (first && typeof (first as any).url === "string") return (first as any).url;
  }

  if (Array.isArray(d) && d[0]) {
    const first = d[0];
    if (typeof first === "string") return first;
    if (typeof (first as any)?.url === "string") return (first as any).url;
  }

  const legacy =
    resp?.data?.[0]?.url ??
    (Array.isArray(resp?.data) ? "" : resp?.data?.url) ??
    resp?.url ??
    "";
  return typeof legacy === "string" ? legacy : "";
}

async function pollRemoteTaskUntilImage(uiTaskId: string, remoteTaskId: string) {
  let firstImageUrl = "";
  let imageCode = "";

  for (let i = 0; i < 120; i++) {
    const taskResp = (await getImageTaskResultApi(
      { taskId: remoteTaskId, reqKey: submitForm.value.modelName },
      abortController?.signal,
    )) as any;
    if (taskResp.code !== 0) {
      store.setError(
        uiTaskId,
        `查询结果失败：${taskResp.message ?? "unknown error"}`,
      );
      return;
    }

    const taskStatus = extractTaskStatus(taskResp);
    if (taskStatus === "not_found") {
      store.setError(uiTaskId, "任务未找到，可能已过期（12小时）或不存在");
      return;
    }
    if (taskStatus === "expired") {
      store.setError(uiTaskId, "任务已过期，请重新提交任务");
      return;
    }

    const extracted = extractImageFromTaskResult(taskResp.data);
    firstImageUrl = extracted.url;
    imageCode = extracted.code;

    if (taskStatus === "done") {
      if (firstImageUrl) break;
      store.setError(
        uiTaskId,
        `任务已完成但无图片结果：${taskResp.message ?? "unknown error"}`,
      );
      return;
    }

    if (firstImageUrl) break;
    await waitWithAbort(1500, abortController?.signal);
  }

  if (!firstImageUrl) {
    store.setError(uiTaskId, "生成失败：轮询超时，未获取到图片结果");
    return;
  }

  store.completeTaskWithPlaceholder(uiTaskId, {
    url: firstImageUrl,
    code: imageCode,
    context: currentText.value,
  });
}

/** 生成接口返回 data.resultImages 时：取下标 0 的本地路径，拉取文件转 data URL 后完成展示 */
async function completeTaskFromGenerateRespResultImages(
  uiTaskId: string,
  resp: any,
): Promise<boolean> {
  const data = resp?.data;
  if (!data || typeof data !== "object") return false;
  const arr = data.resultImages ?? data.result_images;
  if (!Array.isArray(arr) || arr.length === 0) return false;
  const first = arr[0];
  let localPath = "";
  if (typeof first === "string") localPath = first.trim();
  else if (first && typeof first === "object") {
    const ob = first as Record<string, unknown>;
    localPath = strField(ob.url ?? ob.path ?? ob.localPath ?? ob.local_path);
  }
  if (!localPath) return false;

  try {
    let previewUrl = localPath;
    if (!isHttpUrlString(localPath) && !localPath.startsWith("data:")) {
      const blob = (await fetchInputImageByLocalPathApi(localPath)) as unknown;
      if (!(blob instanceof Blob) || blob.size === 0) return false;
      previewUrl = await blobToDataUrl(blob);
    }
    store.completeTaskWithPlaceholder(uiTaskId, {
      url: previewUrl,
      code: "",
      context: currentText.value,
    });
    return true;
  } catch (e) {
    console.error(e);
    message.warning("加载生成结果图失败");
    return false;
  }
}

async function taskImageUnifiedGenerate(uiTaskId: string) {
  try {
    const text = currentText.value.trim();

    const payload: Record<string, unknown> = {
      taskId: uiTaskId,
      inputText: text,
      modelName: submitForm.value.modelName,
      prompt: text,
    };
    const ratio = (submitForm.value.imageRatio ?? "").toString().trim();
    const size = (submitForm.value.imageSize ?? "").toString().trim();
    if (ratio) payload.imageRatio = ratio;
    if (size) payload.imageSize = size;
    const genPv = (submitForm.value.provider ?? "").trim();
    if (genPv) payload.provider = genPv;

    const resp = (await taskImageGenerateApi(
      payload,
      abortController?.signal,
    )) as any;

    const okCode = resp?.code;
    if (okCode !== 200 && okCode !== 201 && okCode !== 0) {
      store.setError(uiTaskId, `生成失败：${resp.message ?? "unknown error"}`);
      return;
    }

    const ri = resp?.data?.resultImages ?? resp?.data?.result_images;
    const expectsResultImage =
      Array.isArray(ri) &&
      ri.length > 0 &&
      (typeof ri[0] === "string"
        ? ri[0].trim().length > 0
        : ri[0] != null && typeof ri[0] === "object");

    if (expectsResultImage) {
      if (await completeTaskFromGenerateRespResultImages(uiTaskId, resp)) {
        return;
      }
      store.setError(uiTaskId, "生成失败：结果图加载失败");
      return;
    }

    const directUrl = extractFirstUrlFromUnifiedResp(resp);
    if (directUrl) {
      store.completeTaskWithPlaceholder(uiTaskId, {
        url: directUrl,
        code: "",
        context: currentText.value,
      });
      return;
    }

    const remoteTaskId = extractTaskIdFromResp(resp);
    if (remoteTaskId) {
      await pollRemoteTaskUntilImage(uiTaskId, remoteTaskId);
      return;
    }

    store.setError(uiTaskId, "生成失败：未返回图片地址或任务 ID");
  } catch (err: any) {
    if (abortRequestedByUser) return;
    const msg = err?.message ?? "生成失败：请求已中断或超时";
    store.setError(uiTaskId, msg);
  }
}

function submitBtn() {
  if (!currentText.value.trim()) {
    return;
  }
  const taskId = String(props.taskId);
  beginGeneration(taskId);
  void taskImageUnifiedGenerate(taskId);
}


defineExpose({
  submitBtn,
  downloadBtn,
  clearTextBtn,
  clearImagesBtn,
  cancelBtn,
  optimizeCopyBtn,
});

onMounted(async () => {
  store.ensureTask(String(props.taskId));
  nextTick(syncHistoryPopoverWidth);
  window.addEventListener("resize", syncHistoryPopoverWidth);
  try {
    // findAiModelConfigList（封装在 fetchImageModelOptions）→ 模型下拉与比例/分辨率约束
    modelOptions.value = await fetchImageModelOptions();
    if (!modelOptions.value.length) {
      message.warning("暂无启用的 AI 模型配置，请先在「AI 模型配置」中维护并启用。");
      return;
    }
    syncModelNameWithList();
    await nextTick();
    syncRatioSizeWithModel();
    syncProviderWithSelectedModel();
    await nextTick();

    await registerTaskImageWithServer();
  } catch (e) {
    console.error(e);
    message.error("加载模型列表失败，请稍后重试");
  }
});

onUnmounted(() => {
  window.removeEventListener("resize", syncHistoryPopoverWidth);
});
</script>

<style scoped>
.box-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.task-card-header {
  padding: 0.6em 16px;
  border-bottom: 1px solid #f0f0f0;
}

.border {
  border: 1px dotted rgb(144, 147, 153);
}

.button {
  cursor: pointer;
  text-align: center;
  border: 1px solid #4f46e5;
  border-radius: 5px;
  margin: 0.5em 0;
  line-height: 32px;
  height: 32px;
  user-select: none;
}

.break-button {
  color: rgb(246, 108, 145);
  border-color: rgb(246, 108, 145);
}

.optimize-copy-button {
  color: #52c41a;
  border-color: #52c41a;
  background: #fff;
}

.optimize-copy-button:hover {
  color: #389e0d;
  border-color: #73d13d;
}

.submit-button {
  color: #fff;
  background: #4f46e5;
}

.container {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px 16px;
}

.input-content {
  width: 62%;
}

.output-content {
  width: 38%;
}

.cond-select {
  width: 100%;
}

.condition {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  margin-bottom: 0.75em;
  flex-wrap: nowrap;
}

.condition .cond-select {
  width: auto;
  min-width: 0;
}

.condition .cond-model {
  flex: 2.4 1 0;
}

.condition .cond-ratio,
.condition .cond-size {
  flex: 1 1 0;
}

.upload-grid {
  --upload-slot: 82px;
  display: grid;
  grid-template-columns: repeat(4, var(--upload-slot));
  justify-content: space-between;
  gap: 4px;
  width: 100%;
  max-width: 100%;
  margin-bottom: 0.6em;
  box-sizing: border-box;
}

.upload-area {
  width: var(--upload-slot);
  height: var(--upload-slot);
  border-radius: 10px;
  padding: 0;
  overflow: hidden;
  border: 1px solid transparent;
  box-sizing: content-box;
}

:deep(.upload-grid .ant-upload-select-picture-card) {
  width: var(--upload-slot) !important;
  height: var(--upload-slot) !important;
  margin: 0 !important;
}

:deep(.upload-grid .ant-upload-list-picture-card-container) {
  width: var(--upload-slot) !important;
  height: var(--upload-slot) !important;
}

.picture-wall {
  width: 100%;
}

.upload-plus {
  width: var(--upload-slot);
  height: var(--upload-slot);
  border-radius: 10px;
  border: 1px solid #dcdfe6;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
}

.upload-plus-inner {
  color: #4b73ff;
  font-size: 32px;
  line-height: 1;
}

.uploaded-thumb {
  width: var(--upload-slot);
  height: var(--upload-slot);
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
}

.uploaded-thumb-wrap {
  position: relative;
  width: var(--upload-slot);
  height: var(--upload-slot);
}

.uploaded-thumb-drag {
  width: var(--upload-slot);
  height: var(--upload-slot);
  cursor: grab;
}

.uploaded-thumb-drag:active {
  cursor: grabbing;
}

.uploaded-delete-btn {
  position: absolute;
  right: 2px;
  top: 2px;
  width: 16px;
  height: 16px;
  border: none;
  border-radius: 50%;
  padding: 0;
  line-height: 16px;
  text-align: center;
  font-size: 12px;
  color: #fff;
  background: rgba(0, 0, 0, 0.55);
  cursor: pointer;
}

.uploaded-delete-btn:hover {
  background: rgba(0, 0, 0, 0.75);
}

.output-image {
  width: 100%;
  background: #fff;
  aspect-ratio: 1 / 1;
  text-align: center;
  font-size: 0.8rem;
  border-radius: 0.5em;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.result-img {
  max-height: 85%;
  max-width: 85%;
  cursor: pointer;
  min-height: 8.5vw;
  border-radius: 0.5em;
}

.status {
  font-size: 0.8rem;
  border-radius: 0.5em;
  padding: 0.2em 0.6em;
  text-align: center;
  user-select: none;
  white-space: nowrap;
}

.is-not-start {
  border: 1px solid rgb(144, 147, 153);
  color: rgb(144, 147, 153);
  background: rgb(233, 233, 235);
}

.is-pending {
  border: 1px solid rgb(64, 158, 255);
  color: rgb(64, 158, 255);
  background: rgb(217, 236, 255);
}

.is-finish {
  border: 1px solid rgb(103, 194, 58);
  color: rgb(103, 194, 58);
  background: rgb(225, 243, 216);
}

.is-error {
  border: 1px solid rgb(245, 108, 108);
  color: rgb(245, 108, 108);
  background: rgb(253, 226, 226);
}

.diabled-use {
  background: rgba(79, 70, 229, 0.6);
  border-color: rgba(79, 70, 229, 0.6);
  pointer-events: none;
  cursor: not-allowed;
}

.diabled-image {
  opacity: 0.7;
}

.error-text {
  opacity: 0.7;
  font-size: 0.7rem;
}

.loading-inner {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  border-radius: 8px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 2px solid #e0e0e0;
  border-top: 2px solid rgb(79, 70, 229);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-text {
  color: #666;
  font-size: 14px;
}

.task-card.box-card {
  border: 1px solid var(--border-color-split, #f0f0f0);
  border-radius: 10px;
  background: var(--component-background, #fff);
  overflow: hidden;
}

@media (max-width: 992px) {
  .container {
    flex-direction: column;
  }

  .input-content,
  .output-content {
    width: 100%;
  }
}
</style>
