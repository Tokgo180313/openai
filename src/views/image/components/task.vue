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
            @click="submitBtn2"
          >
            {{ responseLoading ? "生成中" : "开始生成" }}
          </div>
          <div class="break-button button" @click="cancelBtn">中断</div>
          <div class="optimize-copy-button button" @click="optimizeCopyBtn">
            优化文案
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
  fuseImagesApi,
  generateImagesByPromptApi,
  generateImagesByPromptV2Api,
  getImageTaskResultApi,
  linxfoxUploadByBase64Api,
  linkfoxGetImageApi,
  linkfoxGenerateApi,
  qianwenImageApi,
} from "@/api/images";
import { useTaskStore, type HistoryImage } from "@/stores/taskStore";
import {
  fetchImageModelOptions,
  lookupRecommendedSize,
  mapAspectStringsToOptions,
  mapResolutionStringsToOptions,
  ratioOptions,
  recommendedSizeMap,
  sizeOptions,
  type ModelOption,
} from "../js/config";
import { downloadImage } from "@/utils/download";
import HistoryImageItem from "./HistoryItem.vue";

type SubmitParam = {
  modelName: string;
  imageRatio: string;
  imageSize: string;
};

type UploadWithMeta = UploadFile & { base64?: string; mimeType?: string };

const props = defineProps<{
  taskId: number | string;
  param?: Partial<SubmitParam>;
}>();

const textStorageKey = `image-task-text-${props.taskId}`;

const store = useTaskStore();

const uploadSlots = ref<UploadWithMeta[][]>(
  Array.from({ length: 4 }, () => []),
);
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
});

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
  const ratios = showRationOptions.value.map((o) => o.value);
  const sizes = showSizeOptions.value.map((o) => o.value);
  if (
    ratios.length &&
    (!submitForm.value.imageRatio || !ratios.includes(submitForm.value.imageRatio))
  ) {
    submitForm.value.imageRatio = ratios[0];
  }
  if (
    sizes.length &&
    (!submitForm.value.imageSize || !sizes.includes(submitForm.value.imageSize))
  ) {
    submitForm.value.imageSize = sizes[0];
  }
}

watch(
  () => submitForm.value.modelName,
  () => {
    nextTick(syncRatioSizeWithModel);
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

async function handleChange(slotIndex: number, uploadFiles: UploadWithMeta[]) {
  uploadSlots.value[slotIndex] = uploadFiles.length ? [uploadFiles[0]] : [];
  const first = uploadFiles[0];
  const rawFileObj = first?.originFileObj as File | undefined;
  if (rawFileObj) {
    const fileType = rawFileObj.type;
    const allowed = fileType === "image/jpeg" || fileType === "image/png";
    if (!allowed) {
      uploadSlots.value[slotIndex] = [];
      store.setError(String(props.taskId), "仅支持上传 JPG/JPEG 或 PNG 格式图片");
      return;
    }
  }
  if (first && rawFileObj && !first.base64) {
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
  for (const slot of uploadSlots.value) {
    const u = slot[0]?.url;
    if (u?.startsWith("blob:")) URL.revokeObjectURL(u);
  }
  uploadSlots.value = Array.from({ length: 4 }, () => []);
  store.clearTaskImages(String(props.taskId));
}

function clearUploadSlot(slotIndex: number) {
  const u = uploadSlots.value[slotIndex]?.[0]?.url;
  if (u?.startsWith("blob:")) URL.revokeObjectURL(u);
  uploadSlots.value[slotIndex] = [];
}

async function collectImageBase64List() {
  const slots = uploadSlots.value
    .map((slot) => slot[0])
    .filter(Boolean) as UploadWithMeta[];
  const list = await Promise.all(
    slots.map(async (file) => {
      if (file.base64) return file.base64;
      if (file.originFileObj) {
        const dataUrl = await getBase64(file.originFileObj as File);
        const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, "");
        file.base64 = base64;
        file.mimeType = (file.originFileObj as File).type;
        file.url = dataUrl;
        return base64;
      }
      return "";
    }),
  );
  return list.filter((x) => !!x);
}

async function collectImageDataUrlList() {
  const slots = uploadSlots.value
    .map((slot) => slot[0])
    .filter(Boolean) as UploadWithMeta[];

  const list = await Promise.all(
    slots.map(async (file) => {
      if (file.url && /^data:image\/[^;]+;base64,/.test(file.url)) {
        return file.url;
      }
      if (file.originFileObj) {
        const dataUrl = await getBase64(file.originFileObj as File);
        const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, "");
        file.base64 = base64;
        file.mimeType = (file.originFileObj as File).type;
        file.url = dataUrl;
        return dataUrl;
      }
      if (file.base64) {
        const mime = file.mimeType || "image/png";
        return `data:${mime};base64,${file.base64}`;
      }
      return "";
    }),
  );

  return list.filter((x) => !!x);
}

async function collectImageUrlList() {
  const slots = uploadSlots.value
    .map((slot) => slot[0])
    .filter(Boolean) as UploadWithMeta[];

  const list = await Promise.all(
    slots.map(async (file, idx) => {
      if (file.url && isHttpUrl(file.url)) {
        return file.url;
      }

      let fullBase64 = "";
      if (file.url && /^data:image\/[^;]+;base64,/.test(file.url)) {
        fullBase64 = file.url;
      } else if (file.originFileObj) {
        fullBase64 = await getBase64(file.originFileObj as File);
      } else if (file.base64) {
        const mime = file.mimeType || "image/png";
        fullBase64 = `data:${mime};base64,${file.base64}`;
      }

      if (!fullBase64) return "";

      const fileName =
        file.name ||
        (file.originFileObj instanceof File
          ? file.originFileObj.name
          : `upload-${Date.now()}-${idx}.png`);

      const uploadResp = await linxfoxUploadByBase64Api({
        fileName,
        base64: fullBase64,
      });

      const outerCode = String((uploadResp as any)?.code ?? "");
      const innerCode = Number((uploadResp as any)?.data?.code ?? NaN);
      const viewUrl = String((uploadResp as any)?.data?.data?.viewUrl ?? "");
      if (outerCode !== "0" || innerCode !== 200 || !viewUrl) {
        const errMsg = String(
          (uploadResp as any)?.data?.msg ?? (uploadResp as any)?.msg ?? "上传图片失败",
        );
        throw new Error(errMsg);
      }
      return viewUrl;
    }),
  );

  return list.filter((x: string) => !!x);
}

function validateUploadSizeLimit(taskId: string) {
  const maxBytes = 10 * 1024 * 1024;
  const files = uploadSlots.value
    .map((slot) => slot[0])
    .filter(Boolean) as UploadWithMeta[];

  for (const file of files) {
    const raw = file.originFileObj as File | undefined;
    if (!raw) continue;
    if (raw.size > maxBytes) {
      store.setError(taskId, "上传图片大小不能超过10MB");
      return false;
    }
  }

  return true;
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

async function runClassicJimengPipeline(taskId: string) {
  const sizeParam = (() => {
    const sizeRaw = (submitForm.value.imageSize ?? "").toString().trim();
    const sizeLower = sizeRaw.toLowerCase();
    const ratioRaw = (submitForm.value.imageRatio ?? "").toString().trim();

    if (/^\d+\s*x\s*\d+$/.test(sizeLower)) return sizeLower.replace(/\s+/g, "");

    const recommended = lookupRecommendedSize(submitForm.value.imageSize, ratioRaw);
    if (recommended) return recommended;

    const ratioMatch = ratioRaw.match(/^(\d+)\s*:\s*(\d+)$/);
    if (!ratioMatch) {
      if (sizeLower === "2k") return "2048x2048";
      if (sizeLower === "4k") return "4096x4096";
      return "512x512";
    }

    const rw = Number(ratioMatch[1]);
    const rh = Number(ratioMatch[2]);
    if (!rw || !rh) return "512x512";

    const longEdgeBySize: Record<string, number> = {
      "2k": 2560,
      "4k": 4096,
    };
    const longEdge = longEdgeBySize[sizeLower];
    if (!longEdge) return "512x512";

    let width = longEdge;
    let height = longEdge;
    if (rw >= rh) {
      height = Math.max(1, Math.round((longEdge * rh) / rw));
    } else {
      width = Math.max(1, Math.round((longEdge * rw) / rh));
    }
    return `${width}x${height}`;
  })();

  const [widthStr, heightStr] = sizeParam.split("x");
  const width = Number(widthStr) || 512;
  const height = Number(heightStr) || 512;

  const payload = {
    prompt: currentText.value.trim(),
    size: sizeParam,
    width,
    height,
    n: 1,
    extra: { return_url: true },
  };

  try {
    const isFuseModel =
      submitForm.value.modelName === "jimeng_t2i_v40" ||
      submitForm.value.modelName === "jimeng_seedream46_cvtob";
    let firstImageUrl = "";
    let imageCode = "";
    let generatedTaskId = "";

    if (isFuseModel) {
      const imageBase64List = await collectImageBase64List();
      if (imageBase64List.length === 0) {
        store.setError(taskId, "请至少上传一张图片");
        return;
      }

      const fuseResp = (await fuseImagesApi(
        {
          imageBase64List,
          prompt: currentText.value.trim(),
          size: sizeParam,
          width,
          height,
          reqKey: submitForm.value.modelName,
          extra: { return_url: true },
        },
        abortController?.signal,
      )) as any;

      if (fuseResp.code !== 0) {
        store.setError(
          taskId,
          `融合失败：${fuseResp.message ?? "unknown error"}`,
        );
        return;
      }
      generatedTaskId = extractTaskIdFromResp(fuseResp);
    } else {
      const json = (await generateImagesByPromptApi(
        payload,
        abortController?.signal,
      )) as any;

      if (json.code !== 0) {
        store.setError(taskId, `生成失败：${json.message ?? "unknown error"}`);
        return;
      }
      generatedTaskId = extractTaskIdFromResp(json);
    }

    if (!generatedTaskId) {
      store.setError(taskId, "生成失败：未获取到 task_id");
      return;
    }

    for (let i = 0; i < 120; i++) {
      const taskResp = (await getImageTaskResultApi(
        { taskId: generatedTaskId, reqKey: submitForm.value.modelName },
        abortController?.signal,
      )) as any;
      if (taskResp.code !== 0) {
        store.setError(
          taskId,
          `查询结果失败：${taskResp.message ?? "unknown error"}`,
        );
        return;
      }

      const taskStatus = extractTaskStatus(taskResp);
      if (taskStatus === "not_found") {
        store.setError(taskId, "任务未找到，可能已过期（12小时）或不存在");
        return;
      }
      if (taskStatus === "expired") {
        store.setError(taskId, "任务已过期，请重新提交任务");
        return;
      }

      const extracted = extractImageFromTaskResult(taskResp.data);
      firstImageUrl = extracted.url;
      imageCode = extracted.code;

      if (taskStatus === "done") {
        if (firstImageUrl) break;
        store.setError(
          taskId,
          `任务已完成但无图片结果：${taskResp.message ?? "unknown error"}`,
        );
        return;
      }

      if (firstImageUrl) break;
      await waitWithAbort(1500, abortController?.signal);
    }

    if (!firstImageUrl) {
      store.setError(taskId, "生成失败：轮询超时，未获取到 images[0]");
      return;
    }

    store.completeTaskWithPlaceholder(taskId, {
      url: firstImageUrl,
      code: imageCode,
      context: currentText.value,
    });
  } catch (err: any) {
    if (abortRequestedByUser) return;
    const msg = err?.message ?? "生成失败：请求已中断或超时";
    store.setError(taskId, msg);
  }
}

function submitBtn() {
  if (!currentText.value.trim()) {
    return;
  }
  const taskId = String(props.taskId);
  beginGeneration(taskId);
  void runClassicJimengPipeline(taskId);
}

function submitBtn2() {
  if (!currentText.value.trim()) {
    return;
  }

  const taskId = String(props.taskId);
  beginGeneration(taskId);

  const selectedModel = submitForm.value.modelName;
  const isDoubaoModel =
    selectedModel === "doubao-seedream-4-5-251128" ||
    selectedModel === "doubao-seedream-5-0-260128";

  if (isDoubaoModel) {
    void doubaoImageImpl(taskId);
    return;
  }

  const isQianwenModel =
    selectedModel === "qwen-image-2.0-pro" ||
    selectedModel === "wan2.7-image-pro" ||
    selectedModel === "wan2.7-image";

  if (isQianwenModel) {
    void qianwenImageImpl(taskId);
    return;
  }

  const isLinkfoxModel = selectedModel === "BANANA_2" || selectedModel === "BANANA_PRO";

  if (isLinkfoxModel) {
    void linkfoxImageImpl(taskId);
    return;
  }

  void runClassicJimengPipeline(taskId);
}

async function doubaoImageImpl(taskId: string) {
  try {
    if (!validateUploadSizeLimit(taskId)) return;

    const imageDataUrlList = await collectImageDataUrlList();
    const imageField =
      imageDataUrlList.length <= 1 ? imageDataUrlList[0] : imageDataUrlList;
    const sizeHint =
      recommendedSizeMap[submitForm.value.imageSize]?.[submitForm.value.imageRatio] ??
      "";
    const payload = {
      model: submitForm.value.modelName,
      prompt:
        currentText.value.trim() +
        (sizeHint ? `。返回的图片宽高像素值为${sizeHint}。` : ""),
      image: imageField,
      size: submitForm.value.imageSize,
    };
    const resp = (await generateImagesByPromptV2Api(
      payload,
      abortController?.signal,
    )) as any;
    const firstUrl =
      resp?.data?.[0]?.url ??
      (Array.isArray(resp?.data) ? "" : resp?.data?.url) ??
      resp?.url ??
      "";
    if (!firstUrl) {
      store.setError(taskId, "生成失败：V2 接口未返回图片 URL");
      return;
    }

    store.completeTaskWithPlaceholder(taskId, {
      url: firstUrl,
      code: "",
      context: currentText.value,
    });
  } catch (err: any) {
    if (abortRequestedByUser) return;
    const msg = err?.message ?? "V2 生成失败：请求已中断或超时";
    store.setError(taskId, msg);
  }
}

async function qianwenImageImpl(taskId: string) {
  try {
    if (!validateUploadSizeLimit(taskId)) return;

    const imageDataUrlList = await collectImageDataUrlList();
    const size =
      submitForm.value.modelName === "qwen-image-2.0-pro"
        ? recommendedSizeMap[submitForm.value.imageSize]?.[submitForm.value.imageRatio]
        : submitForm.value.imageSize;
    const pxHint =
      recommendedSizeMap[submitForm.value.imageSize]?.[submitForm.value.imageRatio] ??
      "";
    const content: Array<{ text: string } | { image: string }> = [
      {
        text:
          currentText.value.trim() +
          (pxHint ? `。返回的图片宽高像素值为${pxHint}。` : ""),
      },
    ];

    imageDataUrlList.forEach((img) => {
      content.push({ image: img });
    });

    const payload = {
      model: submitForm.value.modelName,
      input: {
        messages: [
          {
            role: "user" as const,
            content,
          },
        ],
      },
      parameters: {
        prompt_extend: true,
        watermark: false,
        n: 1,
        enable_interleave: false,
        size: String(size ?? "").replace("x", "*"),
      },
    };

    const resp = (await qianwenImageApi(payload, abortController?.signal)) as any;
    const firstUrl =
      resp?.output?.choices?.[0]?.message?.content?.find(
        (item: any) => item?.type === "image" && typeof item?.image === "string",
      )?.image ??
      resp?.output?.choices?.[0]?.message?.content?.[0]?.image ??
      "";

    if (!firstUrl) {
      store.setError(taskId, "生成失败：千问接口未返回图片 URL");
      return;
    }

    store.completeTaskWithPlaceholder(taskId, {
      url: firstUrl,
      code: "",
      context: currentText.value,
    });
  } catch (err: any) {
    if (abortRequestedByUser) return;
    const msg = err?.message ?? "千问生成失败：请求已中断或超时";
    store.setError(taskId, msg);
  }
}

async function linkfoxResultImage(taskId: string, id: string): Promise<string> {
  for (let i = 0; i < 120; i++) {
    const queryResp = (await linkfoxGetImageApi(
      { id: String(id) },
      abortController?.signal,
    )) as any;

    const outerCode = String(queryResp?.code ?? "");
    const innerCode = Number(queryResp?.data?.code ?? NaN);
    if (outerCode !== "0" || innerCode !== 200) {
      const errMsg = String(queryResp?.data?.msg ?? queryResp?.msg ?? "unknown error");
      store.setError(taskId, `Linkfox 查询失败：${errMsg}`);
      return "";
    }

    const resultData = queryResp?.data?.data ?? {};
    const firstUrl =
      resultData?.resultList?.find(
        (item: any) => item?.status === 1 && typeof item?.url === "string",
      )?.url ??
      resultData?.resultList?.[0]?.url ??
      "";

    const taskStatus = Number(resultData?.status ?? NaN);
    if (taskStatus === 3 && firstUrl) {
      return firstUrl;
    }

    if (taskStatus === 4) {
      const errMsg =
        resultData?.errorMsg ||
        resultData?.resultList?.[0]?.errorMsg ||
        "任务失败";
      store.setError(taskId, `Linkfox 任务失败：${errMsg}`);
      return "";
    }

    if (taskStatus === 3) {
      store.setError(taskId, "Linkfox 任务完成但未返回图片URL");
      return "";
    }

    if (taskStatus !== 1 && taskStatus !== 2) {
      store.setError(taskId, `Linkfox 任务状态异常：${String(taskStatus || "unknown")}`);
      return "";
    }

    await waitWithAbort(1500, abortController?.signal);
  }

  store.setError(taskId, "Linkfox 查询超时：未获取到图片URL");
  return "";
}

async function linkfoxImageImpl(taskId: string) {
  try {
    if (!validateUploadSizeLimit(taskId)) return;

    const imageList = await collectImageUrlList();
    if (!imageList.length) {
      store.setError(taskId, "请至少上传一张图片");
      return;
    }
    const payload = {
      imageList,
      prompt: currentText.value.trim(),
      provider: submitForm.value.modelName,
      outputNum: 1,
      resolution: submitForm.value.imageSize,
      aspectRatio: submitForm.value.imageRatio,
    };

    const resp = (await linkfoxGenerateApi(payload, abortController?.signal)) as any;
    const outerCode = String(resp?.code ?? "");
    const innerCode = Number(resp?.data?.code ?? NaN);
    if (outerCode !== "0" || innerCode !== 200) {
      store.setError(
        taskId,
        `Linkfox 生成失败：${resp?.data?.msg ?? resp?.msg ?? "unknown error"}`,
      );
      return;
    }

    const id = resp?.data?.data?.id;
    if (!id) {
      store.setError(taskId, "Linkfox 生成失败：未返回任务ID");
      return;
    }

    const firstUrl = await linkfoxResultImage(taskId, String(id));

    if (!firstUrl) {
      return;
    }

    store.completeTaskWithPlaceholder(taskId, {
      url: firstUrl,
      code: "",
      context: currentText.value,
    });
  } catch (err: any) {
    if (abortRequestedByUser) return;
    const msg = err?.message ?? "Linkfox 生成失败：请求已中断或超时";
    store.setError(taskId, msg);
  }
}

defineExpose({
  submitBtn,
  submitBtn2,
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
    modelOptions.value = await fetchImageModelOptions();
    if (!modelOptions.value.length) {
      message.warning("暂无启用的 AI 模型配置，请先在「AI 模型配置」中维护并启用。");
    } else {
      syncModelNameWithList();
      nextTick(syncRatioSizeWithModel);
    }
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
