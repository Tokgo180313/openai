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
        />
      </div>
    </div>
    <div></div>
    <div class="footer">
      <div class="operate-bar">
        <div class="chat-textbox">
          <ImagePreview
            v-if="previewItems.length > 0"
            :items="previewItems"
            @remove="handleRemovePreviewItem"
          />
          <div
            id="markdown-content"
            ref="markdownContentRef"
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
              <template slot="content">
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
              class="send-btn-icon"
              :class="{ disabled: isSendDisabled }"
              @click="handleSendOrStopEvent"
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

<script>
import { FileImageOutlined } from "@ant-design/icons-vue";
import ImagePreview from "../../components/ImagePreview.vue";
import MarkdownRenderer from "../../components/MarkdownRenderer.vue";
import { nanoid } from "nanoid";
import { useModelStore } from "@/stores/modelStore";
import { useChatStore } from "../../stores/chatStore";
import { useEventsBus } from "../../stores/event-bus";

export default {
  name: "ChatIndexCopy",
  components: {
    FileImageOutlined,
    ImagePreview,
    MarkdownRenderer,
  },
  data() {
    return {
      markdownContent: "",
      markdownInputContent: "",
      isStreamingResponse: false,
      streamAbortController: null,
      markdownContentList: [],
      messageId: "",
      documentId: "",
      previewItems: [],
      textContent: null,
      chatChangeOff: null,
      modelStore: null,
      chatStore: null,
      eventBus: null,
    };
  },
  computed: {
    disabledSendBtn() {
      return this.markdownInputContent.length === 0;
    },
    isSendDisabled() {
      return !this.isStreamingResponse && this.disabledSendBtn;
    },
    isInputEmpty() {
      return this.markdownInputContent.length === 0;
    },
  },
  watch: {
    markdownContent() {
      this.scrollToBottom(true);
    },
    "markdownContentList.length"() {
      this.scrollToBottom(false);
    },
  },
  mounted() {
    this.modelStore = useModelStore();
    this.chatStore = useChatStore();
    this.eventBus = useEventsBus();

    this.messageId = nanoid();
    this.bindPasteListener();
    this.chatChangeOff = this.eventBus.on("chat-change", this.onChatChange);
    this.scrollToBottom(false);
  },
  beforeDestroy() {
    if (typeof this.chatChangeOff === "function") {
      this.chatChangeOff();
    }
    if (this.streamAbortController) {
      this.streamAbortController.abort();
    }
    if (this.textContent) {
      this.textContent.removeEventListener("paste", this.patseImageEvent);
    }
    this.previewItems.forEach((item) => {
      if (item.url && item.url.startsWith("blob:")) {
        URL.revokeObjectURL(item.url);
      }
    });
  },
  methods: {
    bindPasteListener() {
      try {
        this.textContent =
          this.$refs.markdownContentRef ||
          document.getElementById("markdown-content");
        if (this.textContent) {
          this.textContent.addEventListener("paste", this.patseImageEvent);
        }
      } catch (error) {
        console.error(error);
      }
    },

    submitEvent(event) {
      const code = event.code;
      const shiftKey = event.shiftKey;
      if (code !== "Enter") return;
      if (event.isComposing || event.keyCode === 229) {
        return;
      }
      if (!shiftKey) {
        event.preventDefault();
        this.sendMessageEvent();
      }
    },

    handleInputEvent(event) {
      const el = event.target;
      if (!el) {
        this.markdownInputContent = "";
        return;
      }
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
        this.markdownInputContent = "";
        return;
      }
      this.markdownInputContent = normalizedText;
    },

    clearInputData() {
      const inputEl = this.$el.querySelector("[contenteditable]");
      if (inputEl) {
        inputEl.innerHTML = "";
      }
      this.markdownInputContent = "";
      this.previewItems = [];
    },

    /** 调用接口：文件转 Base64（仅占位） */
    fileToBase64() {
      return Promise.resolve("");
    },

    /** 发送消息：组装参数、写历史、流式请求等在业务中实现；此处仅串联流程 */
    sendMessageEvent() {
      if (this.disabledSendBtn || this.isStreamingResponse) {
        return;
      }
      this.scrollLatestQuestionToTop();
      this.clearInputData();
      this.generateContentStreamImpl();
    },

    stopMessageEvent() {
      if (!this.isStreamingResponse) {
        return;
      }
      if (this.streamAbortController) {
        this.streamAbortController.abort();
      }
    },

    handleSendOrStopEvent() {
      if (this.isStreamingResponse) {
        this.stopMessageEvent();
        return;
      }
      this.sendMessageEvent();
    },

    /** 调用接口：流式生成内容 */
    generateContentStreamImpl() {},

    patseImageEvent(event) {
      const options = {
        stripFormatting: true,
        convertToMarkdown: true,
        maxLength: 10000,
      };
      this.handlePatse(event, options);
    },

    handlePatse(event, options) {
      const clipboardData = event.clipboardData;
      if (!clipboardData) {
        return null;
      }
      try {
        for (let i = 0; i < clipboardData.items.length; i++) {
          const item = clipboardData.items[i];
          if (item.type.indexOf("image") !== -1) {
            const file = item.getAsFile();
            this.handlePastedImage(file);
            event.preventDefault();
          }
        }
        const text = clipboardData
          .getData("text/plain")
          .replace(/\r\n|\r|\n/g, "");
        if (text) {
          event.preventDefault();
          document.execCommand("insertText", false, text);
        }
      } catch (error) {
        console.error(error);
      }
      return null;
    },

    /** 粘贴图片后的处理（可在此调用上传等接口；此处仅占位） */
    handlePastedImage() {},

    onChatChange() {
      this.messageId = this.chatStore.getTitleId;
      if (this.documentId !== this.chatStore.getDocumentId) {
        this.documentId = this.chatStore.getDocumentId;
        this.refreshChatContnet();
      }
    },

    /** 调用接口：按 documentId 拉取会话列表 */
    refreshChatContnet() {
      this.chatListInterface(this.documentId);
    },

    /** 调用接口：会话历史列表 */
    chatListInterface() {},

    appendPreviewItem(file) {
      const isImage = file.type.startsWith("image/");
      const id = `${file.name}-${file.size}-${Date.now()}`;
      this.previewItems.push({
        id,
        name: file.name,
        file,
        type: isImage ? "input_url" : "input_file",
        url: URL.createObjectURL(file),
        uploading: true,
        uploadProgress: 0,
      });
      this.uploadPreviewFile(id, file);
    },

    beforeUploadEvent(file) {
      this.appendPreviewItem(file);
      return false;
    },

    /** 调用接口：上传预览文件 */
    uploadPreviewFile() {},

    handleRemovePreviewItem(item) {
      const index = this.previewItems.findIndex(
        (current) => current.id === item.id,
      );
      if (index > -1) {
        const target = this.previewItems[index];
        if (target.url && target.url.startsWith("blob:")) {
          URL.revokeObjectURL(target.url);
        }
        this.previewItems.splice(index, 1);
      }
    },

    getScrollBehavior() {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return "auto";
      }
      return "smooth";
    },

    scrollToBottom(smooth) {
      if (smooth === undefined) smooth = true;
      this.$nextTick(() => {
        const el = this.$refs.scrollRef;
        if (el) {
          el.scrollTo({
            top: el.scrollHeight,
            behavior: smooth ? this.getScrollBehavior() : "auto",
          });
        }
      });
    },

    scrollLatestQuestionToTop() {
      this.$nextTick(() => {
        const root = this.$refs.scrollRef;
        if (!root) return;
        const latestQuestion = root.querySelector(".history-item:last-of-type");
        if (!latestQuestion) return;
        root.scrollTo({
          top: latestQuestion.offsetTop,
          behavior: this.getScrollBehavior(),
        });
      });
    },
  },
};
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
