<template>
  <div class="main">
    <div class="content" ref="scrollRef">
      <div v-for="content in markdownContentList" :key="content.id">
        <MarkdownRenderer :content="content.content" :role="content.role" />
      </div>
      <div class="current-content">
        <MarkdownRenderer
          :content="markdownContent"
          role="assistant"
        ></MarkdownRenderer>
      </div>
      <!-- 预览组件 -->
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
          <!-- <ImagePreview
          :images="previewImages"
          @remove="handleRemovePreviewImage"
          @image-click="handleImageClick"
        ></ImagePreview> -->
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
                    v-model:file-list="fileList"
                    :action="baseUrl"
                    list-type="picture"
                    @preview="previewEvent"
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
              @click="sendMessageEvent"
              :class="{ disabled: disabledSendBtn }"
              class="send-btn-icon"
            >
              <i
                class="iconfont icon-xiangshangjiantouquan-copy"
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
import { FileImageOutlined, FileAddOutlined } from "@ant-design/icons-vue";
import MarkdownViewer from "../../components/MarkdownViewer.vue";
import FileUpload from "../../components/FileUpload.vue";
import ImagePreview from "../../components/ImagePreview.vue";
import MarkdownRenderer from "../../components/MarkdownRenderer.vue";
import {
  ref,
  onMounted,
  onUnmounted,
  useModel,
  watch,
  nextTick,
  computed,
} from "vue";
import { message } from "ant-design-vue";
import api from "@/api/apiList";
import { nanoid } from "nanoid";
import { MessageItem } from "../../types/messageItem.type";
import { MessageType } from "../../types/message.type";
let messageItemList = ref<MessageItem[]>([]);
import { useModelStore } from "@/stores/modelStore";
const modelStore = useModelStore();
const { chatListInterface, streamSaveResponseInterface, chatChatgptInterface } =
  api;
const markdownContent = ref("");
const markdownInputContent = ref("");
const disabledSendBtn = computed(() => {
  return markdownInputContent.value.length === 0;
});
// 只要输入框里存在任何字符（包括换行符）就隐藏 placeholder
const isInputEmpty = computed(() => markdownInputContent.value.length === 0);
const markdownContentList = ref([]);
const fileList = ref([]);
interface PatseOptions {
  stripFormatting?: boolean;
  convertToMarkdown?: boolean;
  maxLength?: number;
}
const messageId = ref("");
onMounted(() => {
  messageId.value = nanoid();
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
  if (event.isComposing || (event as KeyboardEvent & { keyCode?: number }).keyCode === 229) {
    return;
  }
  if (!shiftKey) {
    event.preventDefault();
    sendMessageEvent();
  }
};
const handleEnterEvent = function () {
  const content = document.querySelector("[contenteditable]")?.innerText;
  markdownContent.value = content || "";
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
import { useRequestStore } from "../../stores/requestStore";
const requestStore = useRequestStore();
const clearInputData = () => {
  const inputEl = document.querySelector("[contenteditable]");
  if (inputEl) {
    // 用 innerHTML 清空，避免浏览器残留 <br> 导致 innerText 为 "\n"
    (inputEl as HTMLElement).innerHTML = "";
  }
  markdownInputContent.value = "";
};
const sendMessageEvent = () => {
  if (disabledSendBtn.value) {
    return;
  }
  const content = document.querySelector("[contenteditable]")?.innerText;
  const param = {
    prompt: content,
    model: modelStore.getCurrentModel,
    modelClassify: modelStore.getCurrentModelClassify,
    baseURL: import.meta.env.VITE_APP_BASIC_URL,
    titleId: messageId.value,
    documentId: documentId.value,
  };
  markdownContentList.value.push({
    role: "user",
    content: content,
  });
  clearInputData();
  generateContentStreamImpl(param)
  // if (modelStore.getCurrentModelClassify.toLowerCase() == "deepseek") {
  //   streamChat({
  //     id: documentId.value,
  //     titleId: messageId.value,
  //     question: {
  //       ...param,
  //       useModel: modelStore.getCurrentModel,
  //       modelClassify: modelStore.getCurrentModelClassify,
  //     },
  //     list: [param],
  //   });
  // } else if (modelStore.getCurrentModelClassify.toLowerCase() == "gemini") {
  //   geminichat({
  //     id: documentId.value,
  //     titleId: messageId.value,
  //     question: {
  //       ...param,
  //       useModel: modelStore.getCurrentModel,
  //       modelClassify: modelStore.getCurrentModelClassify,
  //     },
  //     list: [param],
  //   });
  // } else if (modelStore.getCurrentModelClassify.toLowerCase() == "chatgpt") {
  //   chatgptchat({
  //     id: documentId.value,
  //     titleId: messageId.value,
  //     question: {
  //       ...param,
  //     },
  //   });
  // }
};
const generateContentStreamImpl = (param: MessageType) => {
  // 这里直接用 fetch 读取 `text/event-stream`，逐段拼到页面中
  // （axios 的封装通常不会以流式方式暴露数据流）
  const run = async () => {
    try {
      markdownContent.value = "";

      const response = await fetch(
        `${import.meta.env.VITE_APP_BASIC_URL}/stream/generateContentStream`,
        {
          method: "post",
          headers: {
            "Content-Type": "application/json",
            accept: "text/event-stream",
            Authorization: `Bearer ${sessionStorage.getItem("access_token")}`,
          },
          body: JSON.stringify(param),
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

      // SSE frame: data: ... \n\n
      let buffer = "";
      let streamFinished = false;

      const extractContent = (payload: unknown): string | null => {
        if (typeof payload === "string") return payload;
        if (!payload || typeof payload !== "object") return null;

        const p = payload as any;
        const direct = p?.content ?? p?.text ?? p?.data?.content;
        if (typeof direct === "string") return direct;

        const deltaContent =
          p?.delta?.content ??
          p?.delta ??
          p?.choices?.[0]?.delta?.content ??
          p?.choices?.[0]?.text;
        return typeof deltaContent === "string" ? deltaContent : null;
      };

      while (!streamFinished) {
        const { done, value } = await reader.read();
        if (done) break;

        // 兼容服务端使用 `\r\n` 作为 SSE 分隔符
        buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");

        // 以空行分隔 SSE message frame
        let boundaryIndex = buffer.indexOf("\n\n");
        while (boundaryIndex !== -1) {
          const frame = buffer.slice(0, boundaryIndex);
          buffer = buffer.slice(boundaryIndex + 2);

          const lines = frame
            .split("\n")
            .map((l) => l.trim())
            .filter(Boolean);

          const dataLines: string[] = [];
          for (const line of lines) {
            if (line.startsWith("data:")) {
              dataLines.push(line.slice(5).trim());
            }
          }

          if (dataLines.length === 0) {
            boundaryIndex = buffer.indexOf("\n\n");
            continue;
          }

          const dataStr = dataLines.join("\n").trim();
          if (dataStr === "[DONE]") {
            streamFinished = true;
            break;
          }

          try {
            const parsed = JSON.parse(dataStr);
            const piece = extractContent(parsed);
            if (piece) markdownContent.value += piece;
          } catch {
            // 服务端如果不是 JSON，就按纯文本直接拼
            markdownContent.value += dataStr;
          }

          boundaryIndex = buffer.indexOf("\n\n");
        }
      }
    } catch (err) {
      console.error(err);
      message.error("流式响应失败，请稍后重试");
    }
  };

  void run();
};

const chatgptchat = async (param) => {
  chatChatgptInterface(param)
    .then((res) => {
      if (res.code == 200) {
        markdownContentList.value.push({
          role: "assistant",  
          content: res.data.content,
        });
      }
    })
    .catch((err) => {
      console.error(err);
    });
};
const streamChat = async (param) => {
  const response = await fetch(
    `${import.meta.env.VITE_APP_BASIC_URL}/stream/deepseek`,
    {
      method: "post",
      headers: {
        "Content-Type": "application/json",
        accept: "text/event-stream",
        Authorization: `Bearer ${sessionStorage.getItem("access_token")}`,
      },
      body: JSON.stringify(param),
    },
  );
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader?.read();
    if (done) {
      break;
    }
    const chunk = decoder.decode(value);
    const lines = chunk.split("\n\n").filter((line) => line.trim());

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        if (data === "[DONE]") {
          break;
        }
        try {
          const parsed = JSON.parse(data);
          if (parsed.content) {
            markdownContent.value += parsed.content;
          }
        } catch (error) {
          console.error(error);
        }
      }
    }
  }
  nextTick(() => {
    saveResponse();
  });
};
const saveResponse = () => {
  streamSaveResponseInterface({
    documentId: documentId.value,
    useModel: modelStore.getCurrentModel,
    role: "assistant",
    content: markdownContent.value,
  }).then((res) => {
    if (res.code == 201) {
      markdownContentList.value.push({
        role: "assistant",
        content: markdownContent.value,
      });
      markdownContent.value = "";
    }
  });
};
const uploadImageEvent = function () {};
const uploadFileEvent = function () {};
const patseImageEvent = function (event: ClipboardEvent) {
  console.log("粘贴事件出发点");
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
      if (item.type.indexOf("image") !== -1) {
        const file = item.getAsFile();
        handlePastedImage(file);
        event.preventDefault();
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
const handlePastedImage = function (file) {
  if (!file) {
    return;
  }
  const imageUrl = URL.createObjectURL(file);
  const img = document.createElement("img");
  img.src = imageUrl;
  img.setHTMLUnsafe.maxWidth = "300px";
  document.body.appendChild(img);
};

const imageList = ref([]);
const baseUrl = ref(import.meta.env.VITE_APP_BASIC_URL);
const previewEvent = function (p) {
  console.log(p);
};
// 文件上传
import type { ImageItem } from "../../components/ImagePreview.vue";
import { useEventsBus } from "../../stores/event-bus";
import { useChatStore } from "../../stores/chatStore";
const chatStore = useChatStore();
const fileUploadRef = ref();
const eventBus = useEventsBus();
const documentId = ref("");
const chatChageEvent = eventBus.on("chat-change", () => {
  messageId.value = chatStore.getTitleId;
  if (documentId.value != chatStore.getDocumentId) {
    documentId.value = chatStore.getDocumentId;
    refreshChatContnet();
  }
});
const refreshChatContnet = () => {
  chatListInterface(documentId.value).then((res) => {
    if (res.code === 200) {
      markdownContentList.value = res.data;
      scrollToBottom();
    }
  });
};
onUnmounted(() => {
  chatChageEvent();
});
const previewImages = ref<ImageItem[]>([]);
const handleUploadSuccess = (files: any[]) => {
  console.log("上传成功", files);
  files.forEach((file) => {
    if (file.serverid) {
      previewImages.value.push({
        id: file.serverId,
        url: file.serverId,
        name: file.filename,
      });
    }
  });
};
const handleUploadError = (error: Error) => {
  message.error(error.message);
};
const handleFileAdded = (file: any) => {
  console.log("文件添加", file);
};
const handleUpload = () => {
  if (fileUploadRef.value) {
    fileUploadRef.value.uploadFiles();
  }
};
const handleClear = () => {
  if (fileUploadRef.value) {
    fileUploadRef.value.clearFiles();
    previewImages.value = [];
  }
};
const handleRemovePreviewImage = (image: ImageItem) => {
  const index = previewImages.value.findIndex((img) => img.id === image.id);
  if (index > -1) {
    previewImages.value.splice(index, 1);
  }
};
const handleImageClick = (image: ImageItem) => {
  console.log("点击图片", image);
};
const scrollRef = ref<HTMLDivElement | null>(null);
const scrollToBottom = () => {
  nextTick(() => {
    if (scrollRef.value) {
      scrollRef.value.scrollTop = scrollRef.value.scrollHeight;
    }
  });
};
const isAtBottom = () => {
  if (!scrollRef.value) return false;
  const el = scrollRef.value;
  return el.scrollHeight - el.scrollTop - el.clientHeight < 10;
};
onMounted(() => {
  scrollToBottom();
});
watch(markdownContent, () => {
  scrollToBottom();
});
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
  // width: 62.8%;
  width: 90%;
  overflow-anchor: auto;
}
.footer {
  bottom: 0;
  background: #fff;
  margin: 0 auto;
  // width: 62.8%;
  //   height: 120px;
  border: 1px solid lightgray;
  border-radius: 2em;
  button {
    margin: 0 0.3em 0.3em 0;
  }
  display: flex;
  flex-direction: column;
  width: 90%;
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
  padding: 0.5em 1em;
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
</style>
