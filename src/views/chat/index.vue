<template>
  <div class="main">
    <div class="content" ref="scrollRef">
      <div
        v-for="content in markdownContentList"
        :key="content.id"
        class="history-item"
      >
        <MarkdownRenderer
          :content="content.content"
          :role="content.role"
          :type="content.type"
          :file="content.file"
          :name="content.name"
        />
      </div>
      <div class="current-content" v-if="markdownContent != ''">
        <MarkdownRenderer
          :content="markdownContent"
          role="assistant"
        ></MarkdownRenderer>
      </div>
      <div
        class="current-content stream-thinking"
        v-else-if="showStreamThinking"
      >
        <span class="stream-thinking-text">正在思考</span>
      </div>
    </div>
    <div>
      <!-- 上传组件 -->
      <!-- <FileUpload
        ref="fileUploadRef"
        :allow-multiple="true"
        :max-files="10"
        :instant-upload="false"
        :accepted-file-types="['image/jpeg', 'image/png', 'image/gif']"
        server-endpoint="/file/upload"
        @upload-success="handleUploadSuccess"
        @upload-error="handleUploadError"
        @file-added="handleFileAdded"
      />

      <div class="actions">
        <button @click="handleUpload">手动上传</button>
        <button @click="handleClear">清空</button>
      </div> -->
    </div>
    <div class="footer">
      <div class="operate-bar">
        <div class="chat-textbox">
          <ImagePreview
            :items="previewItems"
            v-if="previewItems.length > 0"
            @remove="handleRemovePreviewItem"
          ></ImagePreview>
          <div
            id="markdown-content"
            :class="['markdown-content', { 'is-empty': isInputEmpty }]"
            contenteditable="true"
            placeholder="请输入内容"
            @keydown="submitEvent"
            @input="handleInputEvent"
          ></div>
        </div>
        <div class="footer-actions">
          <div class="upload-file">
            <a-popover placement="topLeft" trigger="hover">
              <template #content>
                <p class="is-button">
                  <a-upload
                    :show-upload-list="false"
                    :before-upload="beforeUploadEvent"
                  >
                    <span class="is-icon">
                      <FileImageOutlined />
                    </span>
                    上传图片和文件
                  </a-upload>
                </p>
              </template>
              <i class="iconfont icon-jiahao-copy"></i>
            </a-popover>
          </div>
          <div class="send-btn">
            <div
              @click="handleSendOrStopEvent"
              :class="{ disabled: isSendDisabled }"
              class="send-btn-icon"
            >
              <i
                class="iconfont"
                :class="
                  isStreamingResponse
                    ? 'icon-tingzhi1'
                    : 'icon-xiangshangjiantouquan-copy'
                "
                style="font-size: 2.5em"
              ></i>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { FileImageOutlined } from "@ant-design/icons-vue";
import ImagePreview from "../../components/ImagePreview.vue";
import type { PreviewItem } from "../../components/ImagePreview.vue";
import MarkdownRenderer from "../../components/MarkdownRenderer.vue";
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from "vue";
import { message } from "ant-design-vue";
import api from "@/api/apiList";
import { nanoid } from "nanoid";
import type { ChatAttachment, SendChatDto } from "../../types/send-chat.type";
import type { UploadFileSaveResult } from "@/types/upload-file.type";
import { useModelStore } from "@/stores/modelStore";
const modelStore = useModelStore();
const {
  chatListInterface,
  saveUploadFileApi,
  deleteUploadFileByIdApi,
  buildUploadFileDownloadUrl,
} = api;
const markdownContent = ref("");
const markdownInputContent = ref("");
const isStreamingResponse = ref(false);
const streamAbortController = ref<AbortController | null>(null);
const previewItems = ref<PreviewItem[]>([]);
const hasReadyAttachments = computed(() =>
  previewItems.value.some((item) => item.uploadedUrl && !item.uploading),
);
const hasUploadingAttachments = computed(() =>
  previewItems.value.some((item) => item.uploading),
);
const disabledSendBtn = computed(() => {
  return (
    markdownInputContent.value.length === 0 && !hasReadyAttachments.value
  );
});
const isSendDisabled = computed(() => {
  if (isStreamingResponse.value) return false;
  if (hasUploadingAttachments.value) return true;
  return disabledSendBtn.value;
});
/** 流式请求已发出、尚未收到首段内容时展示「正在思考」 */
const showStreamThinking = computed(
  () => isStreamingResponse.value && !markdownContent.value.trim(),
);
// 只要输入框里存在任何字符（包括换行符）就隐藏 placeholder
const isInputEmpty = computed(() => markdownInputContent.value.length === 0);
interface ChatMarkdownItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  type?: "input_text" | "input_file" | "input_url";
  file?: string;
  name?: string;
}
const markdownContentList = ref<ChatMarkdownItem[]>([]);
interface PatseOptions {
  stripFormatting?: boolean;
  convertToMarkdown?: boolean;
  maxLength?: number;
}
const messageId = ref("");

const syncTitleIdFromStore = () => {
  messageId.value = chatStore.getTitleId ?? "";
};

/** 流式结束且为新建对话时，用后端返回的 titleId 更新当前会话 */
const applyServerTitleId = (serverTitleId: string) => {
  if (!serverTitleId || messageId.value === serverTitleId) {
    return;
  }
  const isNewChat = !messageId.value;
  messageId.value = serverTitleId;
  chatStore.updateTitleId(serverTitleId);
  if (isNewChat) {
    eventBus.emit("add-chat-title", {
      id: serverTitleId,
      title: "new chat",
      documentId: chatStore.getDocumentId ?? documentId.value ?? "",
    });
  }
};

const tryHandleStreamDonePayload = (payload: unknown): boolean => {
  if (!payload || typeof payload !== "object") return false;
  const p = payload as Record<string, unknown>;
  if (p.done !== true) return false;
  if (typeof p.titleId === "string" && p.titleId) {
    applyServerTitleId(p.titleId);
  }
  return true;
};

onMounted(() => {
  syncTitleIdFromStore();
});
let textContent: HTMLTextAreaElement | null = null;
onMounted(() => {
  try {
    textContent = document.getElementById(
      "markdown-content",
    ) as HTMLTextAreaElement;
    if (textContent) {
      textContent.addEventListener("paste", patseImageEvent);
    }
  } catch (error) {
    console.error(error);
  }
});
onUnmounted(() => {
  if (textContent) {
    textContent.removeEventListener("paste", patseImageEvent);
  }
});
const submitEvent = function (event: KeyboardEvent) {
  const { code, shiftKey } = event;
  if (code !== "Enter") return;
  // 输入法组合态下 Enter 用于上屏，不拦截
  if (
    event.isComposing ||
    (event as KeyboardEvent & { keyCode?: number }).keyCode === 229
  ) {
    return;
  }
  if (!shiftKey) {
    event.preventDefault();
    sendMessageEvent();
  }
};
const handleInputEvent = function (event: Event) {
  const el = event.target as HTMLElement | null;
  if (!el) {
    markdownInputContent.value = "";
    return;
  }

  // contenteditable 在“空内容”时，浏览器常会自动保留一个 <br> 作为光标占位，
  // 这会导致 innerText 变成 "\n"。这里统一把这种情况视为真正的空字符串，并移除占位 <br>。
  const rawText = el.innerText || "";
  const normalizedText = rawText.replace(/\u200B/g, "").replace(/\r\n/g, "\n");
  const isEffectivelyEmpty =
    normalizedText.replace(/\n/g, "").trim().length === 0;
  if (isEffectivelyEmpty) {
    const html = (el.innerHTML || "").trim().toLowerCase();
    if (
      html === "<br>" ||
      html === "<div><br></div>" ||
      html === "<p><br></p>" ||
      html === ""
    ) {
      el.innerHTML = "";
    }
    markdownInputContent.value = "";
    return;
  }

  markdownInputContent.value = normalizedText;
};
const clearInputData = () => {
  const inputEl = document.querySelector("[contenteditable]");
  if (inputEl) {
    // 用 innerHTML 清空，避免浏览器残留 <br> 导致 innerText 为 "\n"
    (inputEl as HTMLElement).innerHTML = "";
  }
  markdownInputContent.value = "";
  previewItems.value = [];
};
const fileToBase64 = (file: File) => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("文件转Base64失败"));
    reader.readAsDataURL(file);
  });
};
const resolveCurrentModelCode = () => {
  const selected = modelStore.chatModelList.find(
    (item) => item.apiModelName === modelStore.currentApiModelName,
  );
  return selected?.modelCode ?? modelStore.currentApiModelName ?? "";
};

const resolveChatAttachmentType = (
  item: PreviewItem,
): ChatAttachment["type"] => {
  const mime =
    item.mimeType || (item.file instanceof File ? item.file.type : "") || "";
  if (item.type === "input_url" || mime.startsWith("image/")) {
    return "image";
  }
  return "file";
};

const buildChatAttachments = (items: PreviewItem[]): ChatAttachment[] => {
  return items
    .filter((item) => item.uploadedUrl && item.fileId)
    .map((item) => ({
      id: String(item.fileId ?? item.gridFsFileId ?? ""),
      type: resolveChatAttachmentType(item),
      name: item.name || "",
      url: item.uploadedUrl!,
      mimeType: item.mimeType,
      size: item.file instanceof File ? item.file.size : undefined,
    }));
};

const sendMessageEvent = async () => {
  if (isSendDisabled.value || isStreamingResponse.value) {
    return;
  }
  if (hasUploadingAttachments.value) {
    message.warning("请等待附件上传完成");
    return;
  }
  const isFirstMessage = markdownContentList.value.length === 0;
  const content =
    (document.querySelector("[contenteditable]") as HTMLElement | null)?.innerText?.trim() ?? "";
  const readyPreviewItems = previewItems.value.filter(
    (item) => item.uploadedUrl && item.fileId,
  );
  const chatAttachments = buildChatAttachments(readyPreviewItems);
  const sendPayload: SendChatDto = {
    titleId: messageId.value || null,
    modelCode: resolveCurrentModelCode(),
    content,
    stream: true,
    clientMessageId: nanoid(),
    ...(chatAttachments.length > 0 ? { attachments: chatAttachments } : {}),
    ...(documentId.value ? { params: { documentId: documentId.value } } : {}),
  };
  const fileContent = await Promise.all(
    readyPreviewItems.map(async (item) => {
      const isImage = item.type === "input_url";
      let displayFile: string | File | undefined = item.uploadedUrl;
      if (isImage && item.file instanceof File) {
        displayFile = await fileToBase64(item.file);
      }
      return {
        id: nanoid(),
        role: "user" as const,
        content: "",
        file: typeof displayFile === "string" ? displayFile : undefined,
        name: item.name,
        type: item.type,
      };
    }),
  );
  markdownContentList.value.push(...fileContent);
  if (content) {
    markdownContentList.value.push({
      id: nanoid(),
      role: "user",
      content,
      type: "input_text",
    });
  }
  if (isFirstMessage && messageId.value) {
    eventBus.emit("add-chat-title", {
      id: messageId.value,
      title: "new chat",
      documentId: chatStore.getDocumentId ?? documentId.value ?? "",
    });
  }
  scrollLatestQuestionToTop();
  clearInputData();
  generateContentStreamImpl(sendPayload);
};
const stopMessageEvent = () => {
  if (!isStreamingResponse.value) {
    return;
  }
  streamAbortController.value?.abort();
};
const handleSendOrStopEvent = () => {
  if (isStreamingResponse.value) {
    stopMessageEvent();
    return;
  }
  sendMessageEvent();
};

/** 流式结束后将当前回复写入历史并清空流式缓冲区 */
const commitStreamingMarkdownToList = () => {
  const text = markdownContent.value.trim();
  if (!text) {
    markdownContent.value = "";
    return;
  }
  markdownContentList.value.push({
    id: nanoid(),
    role: "assistant",
    content: markdownContent.value,
    type: "input_text",
  });
  markdownContent.value = "";
};

const generateContentStreamImpl = (param: SendChatDto) => {
  // 这里直接用 fetch 读取 `text/event-stream`，逐段拼到页面中
  // （axios 的封装通常不会以流式方式暴露数据流）
  const run = async () => {
    const controller = new AbortController();
    streamAbortController.value = controller;
    isStreamingResponse.value = true;
    try {
      markdownContent.value = "";
      console.log("param", JSON.stringify(param));
      const response = await fetch(
        `${import.meta.env.VITE_APP_BASIC_URL}/ai/stream`,
        {
          method: "post",
          headers: {
            "Content-Type": "application/json",
            accept: "text/event-stream",
            Authorization: `Bearer ${sessionStorage.getItem("access_token")}`,
          },
          body: JSON.stringify(param),
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        throw new Error(`Stream request failed: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("Stream response has no body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let buffer = "";
      let streamFinished = false;
      /** 当前 SSE 事件内多行 data: 的片段（空行表示事件结束） */
      const eventDataParts: string[] = [];

      const extractContent = (payload: unknown): string | null => {
        if (typeof payload === "string") return payload;
        if (!payload || typeof payload !== "object") return null;

        const p = payload as Record<string, unknown>;
        const pickFrom = (obj: Record<string, unknown>, ...keys: string[]) => {
          for (const k of keys) {
            const v = obj[k];
            if (typeof v === "string") return v;
          }
          return null;
        };

        const nested = p.data;
        if (nested && typeof nested === "object") {
          const d = nested as Record<string, unknown>;
          const fromData = pickFrom(
            d,
            "content",
            "text",
            "message",
            "answer",
            "result",
          );
          if (fromData) return fromData;
        }

        const direct = pickFrom(
          p,
          "content",
          "text",
          "message",
          "answer",
          "result",
        );
        if (direct) return direct;

        const delta = p.delta as Record<string, unknown> | undefined;
        if (delta) {
          const dc = delta.content ?? delta.text;
          if (typeof dc === "string") return dc;
        }

        const choices = p.choices as unknown[] | undefined;
        const c0 = choices?.[0] as Record<string, unknown> | undefined;
        if (c0) {
          const t = c0.text;
          if (typeof t === "string") return t;
          const d = c0.delta as Record<string, unknown> | undefined;
          if (d) {
            const dc = d.content ?? d.text;
            if (typeof dc === "string") return dc as string;
          }
          const msg = c0.message as Record<string, unknown> | undefined;
          const mc = msg?.content;
          if (typeof mc === "string") return mc;
        }

        return null;
      };

      const flushSseEvent = () => {
        if (eventDataParts.length === 0) return;
        const dataStr = eventDataParts.join("\n").trim();
        eventDataParts.length = 0;
        if (dataStr === "[DONE]") {
          streamFinished = true;
          return;
        }
        try {
          const parsed = JSON.parse(dataStr) as unknown;
          if (tryHandleStreamDonePayload(parsed)) return;
          const piece = extractContent(parsed);
          if (piece) markdownContent.value += piece;
        } catch {
          markdownContent.value += dataStr;
        }
      };

      const processLine = (lineRaw: string) => {
        const line = lineRaw.replace(/\r$/, "");
        if (line === "") {
          flushSseEvent();
          return;
        }
        if (line.startsWith("data:")) {
          const payload = line.slice(5).trimStart();
          if (payload === "[DONE]") {
            streamFinished = true;
            return;
          }
          // 很多后端只发 `data: {...}\n`，没有空行结束事件；能解析则直接当一条消息处理
          try {
            const parsed = JSON.parse(payload) as unknown;
            if (tryHandleStreamDonePayload(parsed)) return;
            const piece = extractContent(parsed);
            if (piece) {
              markdownContent.value += piece;
              return;
            }
          } catch {
            /* 非单行 JSON，等多行拼完或等空行再 flush */
          }
          eventDataParts.push(payload);
        }
      };

      const drainBufferLines = (flushTail: boolean) => {
        while (true) {
          const nl = buffer.indexOf("\n");
          if (nl === -1) break;
          const line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          processLine(line);
        }
        if (flushTail && buffer.length > 0) {
          processLine(buffer);
          buffer = "";
        }
      };

      while (!streamFinished) {
        const { done, value } = await reader.read();
        if (value) {
          buffer += decoder
            .decode(value, { stream: true })
            .replace(/\r\n/g, "\n");
          drainBufferLines(false);
        }
        if (done) {
          buffer += decoder.decode();
          drainBufferLines(true);
          flushSseEvent();
          break;
        }
      }

      // 非 SSE：整段为 JSON 或纯文本时，上面可能未命中 data: 行
      if (!markdownContent.value.trim() && buffer.trim()) {
        const tail = buffer.trim();
        if (tail.startsWith("{") || tail.startsWith("[")) {
          try {
            const parsed = JSON.parse(tail) as unknown;
            if (!tryHandleStreamDonePayload(parsed)) {
              const piece = extractContent(parsed);
              if (piece) markdownContent.value += piece;
            }
          } catch {
            markdownContent.value += tail;
          }
        } else if (tail) {
          markdownContent.value += tail;
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        message.info("已停止生成");
      } else {
        console.error(err);
        message.error("流式响应失败，请稍后重试");
      }
    } finally {
      commitStreamingMarkdownToList();
      isStreamingResponse.value = false;
      streamAbortController.value = null;
    }
  };

  void run();
};

const patseImageEvent = function (event: ClipboardEvent) {
  const options: PatseOptions = {
    stripFormatting: true,
    convertToMarkdown: true,
    maxLength: 10000,
  };
  handlePatse(event, options);
};
const handlePatse = function (
  event: ClipboardEvent,
  options: PatseOptions = {},
): string | null {
  const clipboardData = event.clipboardData;
  if (!clipboardData) {
    return null;
  }
  try {
    // 优先处理图片粘贴
    for (let i = 0; i < clipboardData.items.length; i++) {
      const item = clipboardData.items[i];
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          appendPreviewItem(file);
          event.preventDefault();
          return null;
        }
      }
    }
    // 粘贴文本时只保留纯文本，去除富文本样式和换行符
    const text = clipboardData.getData("text/plain").replace(/\r\n|\r|\n/g, "");
    if (text) {
      event.preventDefault();
      document.execCommand("insertText", false, text);
    }
  } catch (error) {
    console.error(error);
  }
  return null;
};
import { useEventsBus } from "../../stores/event-bus";
import { useChatStore } from "../../stores/chatStore";
const chatStore = useChatStore();
const eventBus = useEventsBus();
const documentId = ref("");
const chatChageEvent = eventBus.on("chat-change", () => {
  syncTitleIdFromStore();
  if (documentId.value != chatStore.getDocumentId) {
    documentId.value = chatStore.getDocumentId;
    refreshChatContnet();
  }
});
const refreshChatContnet = () => {
  chatListInterface(documentId.value).then((res) => {
    if (res.code === 200) {
      markdownContentList.value = (Array.isArray(res.data)
        ? res.data
        : []) as ChatMarkdownItem[];
      scrollToBottom(false);
    }
  });
};
onUnmounted(() => {
  chatChageEvent();
  streamAbortController.value?.abort();
  previewItems.value.forEach((item) => {
    if (item.url?.startsWith("blob:")) {
      URL.revokeObjectURL(item.url);
    }
  });
});
const appendPreviewItem = (file: File) => {
  const isImage = file.type.startsWith("image/");
  const id = `${file.name}-${file.size}-${Date.now()}`;
  previewItems.value.push({
    id,
    name: file.name,
    file,
    type: isImage ? "input_url" : "input_file",
    url: URL.createObjectURL(file),
    uploading: true,
    uploadProgress: 0,
  });
  uploadPreviewFile(id, file);
};
const beforeUploadEvent = (file: File) => {
  appendPreviewItem(file);
  return false;
};
const parseUploadSaveResult = (res: {
  code?: number;
  message?: string;
  data?: unknown;
}): UploadFileSaveResult => {
  if (res?.code != null && res.code !== 200 && res.code !== 201) {
    throw new Error(res.message || "上传失败");
  }
  const data = res?.data as UploadFileSaveResult | undefined;
  if (!data?.fileId) {
    throw new Error("上传成功但未返回 fileId");
  }
  return data;
};

const uploadPreviewFile = async (itemId: string | number, file: File) => {
  const target = previewItems.value.find((item) => item.id === itemId);
  if (target) {
    target.uploadProgress = 0;
  }
  try {
    const formData = new FormData();
    formData.append("file", file, file.name);
    formData.append("source", "user_upload");
    const meta: Record<string, unknown> = {};
    if (messageId.value) meta.titleId = messageId.value;
    if (documentId.value) meta.documentId = documentId.value;
    if (Object.keys(meta).length > 0) {
      formData.append("metadata", JSON.stringify(meta));
    }
    if (target) {
      target.uploadProgress = 30;
    }
    const uploadRes = await saveUploadFileApi(formData);
    if (!target) return;
    const saved = parseUploadSaveResult(uploadRes);
    const fileId = saved.fileId;
    const uploadedUrl =
      saved.url?.trim() || buildUploadFileDownloadUrl(fileId);
    target.fileId = String(fileId);
    target.gridFsFileId = String(fileId);
    target.uploadedUrl = uploadedUrl;
    target.name = saved.record?.originalName || target.name;
    target.mimeType = saved.record?.mimeType || file.type || target.mimeType;
    target.uploading = false;
    target.uploadProgress = 100;
    message.success("上传成功");
  } catch (error: unknown) {
    const failed = previewItems.value.find((item) => item.id === itemId);
    if (failed) {
      failed.uploading = false;
      failed.uploadProgress = 0;
    }
    const errMsg =
      error instanceof Error ? error.message : "上传失败";
    message.error(errMsg);
  }
};

const deleteRemotePreviewFile = async (fileId?: string) => {
  const id = Number(String(fileId ?? "").trim());
  if (!Number.isInteger(id) || id < 1) return;
  try {
    await deleteUploadFileByIdApi(id);
  } catch {
    // 删除失败不阻塞移除预览
  }
};

const handleRemovePreviewItem = async (item: PreviewItem) => {
  const index = previewItems.value.findIndex(
    (current) => current.id === item.id,
  );
  if (index > -1) {
    const target = previewItems.value[index];
    if (target.url?.startsWith("blob:")) {
      URL.revokeObjectURL(target.url);
    }
    if (target.fileId && !target.uploading) {
      await deleteRemotePreviewFile(target.fileId);
    }
    previewItems.value.splice(index, 1);
  }
};
const scrollRef = ref<HTMLDivElement | null>(null);
const getScrollBehavior = () => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return "auto" as const;
  }
  return "smooth" as const;
};
const scrollToBottom = (smooth = true) => {
  nextTick(() => {
    if (scrollRef.value) {
      scrollRef.value.scrollTo({
        top: scrollRef.value.scrollHeight,
        behavior: smooth ? getScrollBehavior() : "auto",
      });
    }
  });
};
const scrollLatestQuestionToTop = () => {
  nextTick(() => {
    if (!scrollRef.value) return;
    const latestQuestion = scrollRef.value.querySelector(
      ".history-item:last-of-type",
    ) as HTMLElement | null;
    if (!latestQuestion) return;
    scrollRef.value.scrollTo({
      top: latestQuestion.offsetTop,
      behavior: getScrollBehavior(),
    });
  });
};
onMounted(() => {
  scrollToBottom(false);
});
watch(markdownContent, () => {
  scrollToBottom(true);
});
watch(showStreamThinking, (visible) => {
  if (visible) scrollToBottom(true);
});
watch(
  () => markdownContentList.value.length,
  () => {
    scrollToBottom(false);
  },
);
</script>

<style scoped lang="scss">
.main {
  height: 100%;
  display: flex;
  justify-content: flex-end;
  flex-direction: column;
}

.content {
  overflow: auto;
  text-align: center;
  margin: auto;
  padding: 0 2em;
  width: 90%;
  max-width: 900px;
  box-sizing: border-box;
  overflow-anchor: auto;
}
.footer {
  bottom: 0;
  background: #fff;
  margin: 0 auto;
  border: 1px solid lightgray;
  border-radius: 2em;
  button {
    margin: 0 0.3em 0.3em 0;
  }
  display: flex;
  flex-direction: column;
  width: 90%;
  max-width: 900px;
  box-sizing: border-box;
  padding: 0.5em;
}
.markdown-content {
  width: 100%;
  font-size: 1rem;
  padding: 5px;
  align-items: center;
  text-align: left;
  position: relative;
  line-height: 30px;
}
.markdown-content.is-empty:before {
  content: attr(placeholder);
  color: #999;
  position: absolute;
  left: 5px;
  top: 5px;
  pointer-events: none;
}
.markdown-content:focus {
  outline: none;
  border: none;
  // box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
}
.set-btn {
  display: flex;
  justify-content: space-between;
}
.operate-bar {
  display: flex;
  flex-direction: column;
  gap: 0.5em;
  width: 100%;
  padding: 0 1em;
}
.footer-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}
.upload-file {
  cursor: pointer;
  padding: 0.5em;
  border-radius: 50%;
  // font-size:3em;
  font-weight: 700;
  text-align: center;
  align-items: center;
}
.upload-file:hover {
  background-color: #f0f0f0;
}
.is-button {
  cursor: pointer;
  padding: 0 0.5em;
}
.is-icon {
  padding: 0 0.5em;
}

.upload-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.actions {
  margin: 20px 0;
  display: flex;
  gap: 10px;
}

.actions button {
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.actions button:hover {
  background: #0056b3;
}
.send-btn {
  flex-shrink: 0;
}
.send-btn-icon {
  cursor: pointer;
}
.send-btn-icon.disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
.chat-textbox {
  width: 100%;
  border: none;
  outline: none;
  white-space: pre-wrap;
  line-height: 30px;
}

.stream-thinking {
  text-align: left;
  padding: 8px 0 16px;
}

.stream-thinking-text {
  display: inline-block;
  font-size: 16px;
  font-weight: 400;
  line-height: 1.5;
  letter-spacing: 0.02em;
  background: linear-gradient(
    90deg,
    #2b2b2b 0%,
    #4a4a4a 22%,
    #9a9a9a 52%,
    #d4d4d4 78%,
    #f0f0f0 100%
  );
  background-size: 220% 100%;
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
  animation: stream-thinking-shimmer 2s ease-in-out infinite;
}

@keyframes stream-thinking-shimmer {
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

@media screen and (max-width: 768px) {
  .content {
    width: 100%;
    padding: 0 0.5em;
  }

  .footer {
    width: 100%;
    border-radius: 1em;
  }

  .operate-bar {
    padding: 0 0.5em;
  }
}
</style>
