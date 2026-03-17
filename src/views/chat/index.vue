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
      <!-- <ImagePreview
        :images="previewImages"
        @remove="handleRemovePreviewImage"
        @image-click="handleImageClick"
      ></ImagePreview> -->
      <div
        id="markdown-content"
        class="markdown-content"
        contenteditable="true"
        placeholder="请输入内容"
        @keydown="submitEvent"
      ></div>
      <div class="operate-bar">
        <!-- <div class="upload-file">
          <a-popover placement="topLeft" trigger="hover">
            <template #content>
              <p class="is-button">
                <a-upload
                  v-model:file-list="imageList"
                  :action="baseUrl"
                  list-type="picture"
                  @preview="previewEvent"
                >
                  <span class="is-icon">
                    <FileImageOutlined />
                  </span>
                  上传图片
                </a-upload>
              </p>
              <p class="is-button">
                <span class="is-icon">
                  <FileAddOutlined />
                </span>
                上传文件
              </p>
            </template>
            <i class="iconfont icon-jiahao"></i>
          </a-popover>
        </div> -->
        <div class="send-btn">
          <a-button type="primary" @click="sendMessageEvent">发送</a-button>
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
import { ref, onMounted, onUnmounted, useModel, watch, nextTick } from "vue";
import { message } from "ant-design-vue";
import api from "@/api/apiList";
import { nanoid } from "nanoid";
import { MessageItem } from "../../types/messageItem.type";
let messageItemList = ref<MessageItem[]>([]);
import { useModelStore } from "@/stores/modelStore";
const modelStore = useModelStore();
const {
  chatDeepSeekInterface,
  chatListInterface,
  streamSaveResponseInterface,
  chatGeminiInterface,
} = api;
const markdownContent = ref("");
const markdownContentList = ref([]);
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
const submitEvent = function (event) {
  const { code, isComposing, shiftKey } = event;
  if (code === "Enter") {
    if (!shiftKey) {
      // enter 事件
      sendMessageEvent();
    }
  }
};
const handleEnterEvent = function () {
  const content = document.querySelector("[contenteditable]")?.innerHTML;
  markdownContent.value = content || "";
};
import { useRequestStore } from "../../stores/requestStore";
const requestStore = useRequestStore();
const clearInputData = () => {
  const inputEl = document.querySelector("[contenteditable]");
  inputEl.textContent = "";
};
const sendMessageEvent = () => {
  const content = document.querySelector("[contenteditable]")?.innerText;
  const param = {
    role: "user",
    content: content,
  };
  markdownContentList.value.push(param);
  clearInputData();
  if (modelStore.getCurrentModelClassify.toLowerCase() == "deepseek") {
    streamChat({
      id: documentId.value,
      titleId: messageId.value,
      question: { ...param, useModel: modelStore.getCurrentModel },
      list: [param],
    });
  } else if (modelStore.getCurrentModelClassify.toLowerCase() == "gemini") {
    geminichat({
      id: documentId.value,
      titleId: messageId.value,
      question: { ...param, useModel: modelStore.getCurrentModel },
      list: [param],
    });
  }
};
const geminichat = async (param) => {
  chatGeminiInterface(param)
    .then((res) => {
      if (res.code == 200) {
        markdownContentList.value.push({
          role: "assistant",
          content: res.data.answer,
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
  console.log(markdownContent.value);
  nextTick(() => {
    saveResponse();
  });
};
const saveResponse = (value: string) => {
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
    for (let i = 0; i < clipboardData.items.length; i++) {
      const item = clipboardData.items[i];
      if (item.type.indexOf("image") !== -1) {
        const file = item.getAsFile();
        handlePastedImage(file);
        event.preventDefault();
      }
    }
  } catch (error) {
    console.error(error);
  }
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
  const isAtBottom = () => {
  if (!scrollRef.value) return false;
  const el = scrollRef.value;
  return el.scrollHeight - el.scrollTop - el.clientHeight < 10;
};
watch(
  () => markdownContentList.value.length,
  async () => {
    await nextTick();
    console.log(isAtBottom());
    if (scrollRef.value && isAtBottom()) {
      scrollRef.value.scrollTop = scrollRef.value.scrollHeight;
    }
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
  padding: 0 1em;
  width: 62.8%;
  overflow-anchor: auto;
}
.footer {
  text-align: right;
  bottom: 0;
  background: #fff;
  margin: 0 auto;
  width: 62.8%;
  //   height: 120px;
  border: 1px solid lightgray;
  border-radius: 0.5em;
  button {
    margin: 0 0.3em 0.3em 0;
  }
}
.markdown-content {
  min-height: 10vh;
  max-height: 30vh;
  padding: 0.5rem;
  text-align: left;
}
.markdown-content:empty:before {
  content: attr(placeholder);
  color: #999;
}
.markdown-content:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
}
.set-btn {
  display: flex;
  justify-content: space-between;
}
.operate-bar {
  display: flex;
  justify-content: flex-start;
}
.upload-file {
  cursor: pointer;
  padding: 0.5em 1em;
  border: 1px solid lightgray;
  border-radius: 30%;
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
  text-align: right;
}
</style>
