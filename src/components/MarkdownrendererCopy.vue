<template>
  <div class="markdown-container" :class="roleClass">
    <div class="message-row">
      <div class="message-avatar">
        <i
          class="iconfont"
          :class="role === 'user' ? 'icon-fl-renyuan' : 'icon-gpt'"
        ></i>
      </div>
      <div class="message-body">
        <div
          v-if="currentItem.type === 'input_text'"
          class="markdown-content"
          v-html="processedContent"
        ></div>
        <img
          v-else-if="currentItem.type === 'input_url'"
          class="single-image"
          :src="imageSrc"
          :alt="currentItem.name || '图片'"
          @click="previewImage"
        />
        <div
          v-else-if="currentItem.type === 'input_file'"
          class="attachment-file"
          @click="downloadCurrentFile"
        >
          <div
            class="file-icon-wrap"
            :style="{ backgroundColor: getFileBackgroundColor(currentItem.name) }"
          >
            <i class="iconfont" :class="getFileIcon(currentItem.name)"></i>
          </div>
          <div class="file-meta">
            <a-tooltip :title="currentItem.name || ''" placement="topLeft">
              <span class="file-name">{{ currentItem.name }}</span>
            </a-tooltip>
            <span class="file-type">{{ getFileTypeText(currentItem.name) }}</span>
          </div>
        </div>

        <div
          v-if="
            role === 'assistant' &&
            currentItem.type === 'input_text' &&
            currentItem.content
          "
          class="assistant-actions"
        >
          <span class="action-btn" @click="copyMessageContent">
            <i class="iconfont icon-fuzhi"></i>
          </span>
          <span class="action-btn" @click="downloadMessageContent">
            <i class="iconfont icon-xiazai"></i>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import MarkdownIt from "markdown-it";
import hljs from "highlight.js";
import "highlight.js/styles/github.css";
import { message } from "ant-design-vue";

hljs.configure({
  languages: [
    "javascript",
    "typescript",
    "html",
    "css",
    "java",
    "python",
    "bash",
    "json",
    "xml",
    "markdown",
    "vue",
    "shell",
  ],
  throwUnescapedHTML: true,
});

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  xhtmlOut: true,
  breaks: true,
  highlight: (str, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        const code = hljs.highlight(str, { language: lang }).value;
        const lines = code.split("\n");
        const codeWithLines = lines
          .map((line, index) => {
            return `<div class="code-line">
                      <span class="line-number">${index + 1}</span>
                      <span class="line-content">${line || " "}</span>
                    </div>`;
          })
          .join("");
        return `<div class="code-block-wrapper">
                  <div class="code-header">
                    <span class="language-label">${lang}</span>
                    <span class="copy-btn" onclick="copyCode(this)">
                      <i class="iconfont icon-fuzhi"></i>
                    </span>
                  </div>
                  <div class="code-content">${codeWithLines}</div>
                </div>`;
      } catch (__) {
        /* ignore */
      }
    }
    return "";
  },
});

md.renderer.rules.code_block = (tokens, idx) => {
  const token = tokens[idx];
  return `<pre><code class="hljs">${md.utils.escapeHtml(
    token.content,
  )}</code></pre>`;
};

md.renderer.rules.fence = (tokens, idx) => {
  const token = tokens[idx];
  const lang = token.info.trim();
  const content = token.content;

  if (lang && hljs.getLanguage(lang)) {
    try {
      const highlighted = hljs.highlight(content, { language: lang }).value;
      const lines = highlighted.split("\n");
      const codeWithLines = lines
        .map((line, index) => {
          return `<div class="code-line">
                    <span class="line-number">${index + 1}</span>
                    <span class="line-content">${line || " "}</span>
                  </div>`;
        })
        .join("");
      return `<div class="code-block-wrapper">
                <div class="code-header">
                  <span class="language-label">${lang}</span>
                  <span class="copy-btn" onclick="copyCode(this)">                   
                    <i class="iconfont icon-fuzhi"></i>
                  </span>
                </div>
                <div class="code-content">${codeWithLines}</div>
              </div>`;
    } catch (__) {
      /* ignore */
    }
  }

  return `<pre><code>${md.utils.escapeHtml(content)}</code></pre>`;
};

md.renderer.rules.code_inline = (tokens, idx) => {
  const token = tokens[idx];
  return `<code class="inline-code">${md.utils.escapeHtml(
    token.content,
  )}</code>`;
};

const imageExtSet = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "bmp",
  "svg",
]);

export default {
  name: "MarkdownrendererCopy",
  props: {
    content: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      default: "input_text",
    },
    file: {
      type: [String, Object],
      default: null,
    },
    name: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      default: "assistant",
    },
  },
  data() {
    return {
      processedContent: "",
      imageObjectUrl: "",
    };
  },
  computed: {
    currentItem() {
      const f = this.file;
      return {
        type: this.type || "input_text",
        content: this.content || "",
        file: f === undefined || f === null ? "" : f,
        name: this.name || "",
      };
    },
    imageSrc() {
      const raw = this.currentItem.file;
      if (!raw) return "";
      if (typeof raw === "string") return raw;
      if (typeof File !== "undefined" && raw instanceof File) {
        return this.imageObjectUrl;
      }
      return "";
    },
    roleClass() {
      return {
        "role-user": this.role === "user",
        "role-assistant": this.role === "assistant",
      };
    },
  },
  watch: {
    content: {
      handler: "processContent",
      immediate: true,
    },
    file: {
      handler(val) {
        if (this.imageObjectUrl) {
          URL.revokeObjectURL(this.imageObjectUrl);
          this.imageObjectUrl = "";
        }
        if (val && typeof File !== "undefined" && val instanceof File) {
          this.imageObjectUrl = URL.createObjectURL(val);
        }
      },
      immediate: true,
    },
  },
  mounted() {
    this.addCopyFunction();
  },
  beforeDestroy() {
    if (this.imageObjectUrl) {
      URL.revokeObjectURL(this.imageObjectUrl);
      this.imageObjectUrl = "";
    }
  },
  methods: {
    processContent() {
      if (
        this.currentItem.type !== "input_text" ||
        !this.currentItem.content
      ) {
        this.processedContent = "";
        return;
      }
      try {
        let rendered = md.render(this.currentItem.content);
        rendered = rendered.replace(
          /<pre><code class="hljs">([\s\S]*?)<\/code><\/pre>/g,
          (match, codeContent) => {
            return `<div class="code-block-wrapper">
                  <div class="code-header">
                    <span class="language-label">text</span>
                    <span class="copy-btn" onclick="copyCode(this)">
                      <i class="iconfont icon-fuzhi"></i>
                    </span>
                  </div>
                  <div class="code-content">
                    ${codeContent
                      .split("\n")
                      .map(
                        (line, index) =>
                          `<div class="code-line">
                        <span class="line-number">${index + 1}</span>
                        <span class="line-content">${line || " "}</span>
                      </div>`,
                      )
                      .join("")}
                  </div>
                </div>`;
          },
        );
        this.processedContent = rendered;
      } catch (error) {
        console.error("Markdown渲染错误:", error);
        this.processedContent = this.currentItem.content;
      }
    },

    getFileExt(nameOrUrl) {
      if (!nameOrUrl) return "";
      const pure = nameOrUrl.split("?")[0].split("#")[0];
      if (!pure.includes(".")) return "";
      const parts = pure.split(".");
      return (parts.pop() || "").toLowerCase();
    },

    previewImage() {
      if (!this.imageSrc) return;
      window.open(this.imageSrc, "_blank");
    },

    downloadCurrentFile() {
      const fileUrl = String(this.currentItem.file || "");
      if (!fileUrl) return;
      const link = document.createElement("a");
      link.href = fileUrl;
      link.download = this.currentItem.name || "download";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },

    getFileIcon(name) {
      const ext = this.getFileExt(name);
      if (["pdf"].includes(ext)) return "icon-PDFwenjian";
      if (["doc", "docx"].includes(ext)) return "icon-weibiaoti-2_huaban1";
      if (["xls", "xlsx"].includes(ext)) return "icon-xlswenjian";
      if (["csv"].includes(ext)) return "icon-csv";
      if (["ppt", "pptx"].includes(ext)) return "icon-weibiaoti-2_huaban11";
      if (["zip", "rar", "7z", "tar", "gz"].includes(ext))
        return "icon-yasuobao";
      if (
        ["js", "ts", "tsx", "vue", "json", "md", "py", "java", "go", "txt"].includes(
          ext,
        )
      ) {
        return "icon-s12";
      }
      return "icon-file";
    },

    getFileBackgroundColor(name) {
      const ext = this.getFileExt(name);
      if (["pdf"].includes(ext)) return "#7f1d1d";
      if (["doc", "docx"].includes(ext)) return "#1e3a8a";
      if (["xls", "xlsx", "csv"].includes(ext)) return "#14532d";
      if (["ppt", "pptx"].includes(ext)) return "#9a3412";
      if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "#581c87";
      if (
        ["js", "ts", "tsx", "vue", "json", "md", "py", "java", "go", "txt"].includes(
          ext,
        )
      ) {
        return "#0f3d5e";
      }
      return "#374151";
    },

    getFileTypeText(name) {
      const ext = this.getFileExt(name);
      if (!ext) return "文件";
      if (imageExtSet.has(ext)) return "图片";
      if (["pdf"].includes(ext)) return "PDF 文档";
      if (["doc", "docx", "txt", "md"].includes(ext)) return "文档";
      if (["xls", "xlsx", "csv"].includes(ext)) return "表格";
      if (["ppt", "pptx"].includes(ext)) return "演示文稿";
      if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "压缩包";
      return "文件";
    },

    addCopyFunction() {
      if (typeof window === "undefined") return;
      window.copyCode = function (element) {
        const codeBlock = element.closest(".code-block-wrapper");
        if (codeBlock) {
          const codeContent = codeBlock.querySelector(".code-content");
          if (codeContent) {
            const lines = Array.from(
              codeContent.querySelectorAll(".line-content"),
            );
            const text = lines.map((line) => line.textContent || "").join("\n");
            navigator.clipboard
              .writeText(text)
              .then(() => {
                message.success("代码已复制到剪贴板");
              })
              .catch((err) => {
                console.error("复制失败:", err);
                message.error("复制失败");
              });
          }
        }
      };
    },

    copyMessageContent() {
      if (!this.currentItem.content) return;
      return navigator.clipboard
        .writeText(this.currentItem.content)
        .then(() => {
          message.success("内容已复制");
        })
        .catch((error) => {
          console.error("复制失败:", error);
          message.error("复制失败");
        });
    },

    downloadMessageContent() {
      if (!this.currentItem.content) return;
      try {
        const blob = new Blob([this.currentItem.content], {
          type: "text/markdown;charset=utf-8",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `assistant-${Date.now()}.md`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error("下载失败:", error);
        message.error("下载失败");
      }
    },
  },
};
</script>

<style scoped lang="scss">
.markdown-container {
  display: flex;
  max-width: 100%;
  width: 100%;
  word-wrap: break-word;
  line-height: 1.2;
  margin: 10px 0;

  .message-row {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    width: 100%;
    text-align: left;
  }

  .message-avatar {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .message-body {
    max-width: 100%;
  }
  .single-image {
    width: 120px;
    height: 120px;
    border-radius: 12px;
    object-fit: cover;
    cursor: pointer;
    display: inline-block;
  }
  .attachment-file {
    width: 230px;
    height: 72px;
    padding: 8px 10px;
    display: flex;
    align-items: center;
    gap: 8px;
    background: #f3f3f3;
    cursor: pointer;
  }
  .file-icon-wrap {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .file-icon-wrap .iconfont {
    color: #fff;
    font-size: 1.6rem;
  }
  .file-meta {
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
  .file-name {
    width: 100%;
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .file-type {
    font-size: 10px;
    color: #666;
  }

  &.role-user {
    justify-content: flex-end;
    .message-row {
      justify-content: flex-start;
      flex-direction: row-reverse;
      width: 100%;
    }
    .message-body {
      display: flex;
      justify-content: flex-end;
      width: 100%;
    }
    .message-avatar {
      background-color: #f0f0f0;
      color: #666;
    }
    .message-role {
      display: inline-block;
      background-color: #f0f0f0;
      color: #666;
      font-size: 12px;
      padding: 2px 8px;
      border-radius: 4px;
      margin-bottom: 6px;
      max-width: 100%;
      word-break: break-all;
      white-space: normal;
    }

    .markdown-content {
      background-color: #f7f7f7;
      padding: 0em 1em;
      border-radius: 8px;
      display: inline-block;
      max-width: 60%;
      text-align: left;
      margin-left: auto;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      line-height: 1.4;
      word-break: normal;
      overflow-wrap: anywhere;
      white-space: normal;
    }
  }

  &.role-assistant {
    justify-content: flex-start;
    .message-row {
      justify-content: flex-start;
      flex-direction: row;
    }
    .message-avatar {
      background-color: #e6f7e6;
      color: #2f7d32;
    }
    .markdown-content {
      padding: 0;
      background: none;
      border: none;
      max-width: 100%;
      text-align: left;
    }
    .assistant-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 6px;
    }
    .action-btn {
      width: 24px;
      height: 24px;
      border-radius: 4px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: #666;
      cursor: pointer;
    }
    .action-btn:hover {
      background-color: #f0f0f0;
      color: #333;
    }

    .message-role {
      display: none;
    }
  }
}

.markdown-content {
  ::v-deep {
    line-height: 25px;
    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
      margin-top: 1.5em;
      margin-bottom: 0.5em;
      font-weight: 600;
      line-height: 1.25;
    }

    h1 {
      font-size: 1.8em;
    }
    h2 {
      font-size: 1.5em;
    }
    h3 {
      font-size: 1.3em;
    }
    h4 {
      font-size: 1.1em;
    }

    p {
      margin: 1em 0;
    }

    ul,
    ol {
      padding-left: 1em;
      margin: 1em 0;
    }

    li {
      margin: 0.5em 0;
    }

    blockquote {
      border-left: 4px solid #ddd;
      padding-left: 1em;
      margin: 1em 0;
      color: #666;
    }

    .inline-code {
      background-color: #f0f0f0;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: "Courier New", monospace;
      font-size: 0.9em;
      color: #e01e5a;
    }

    .code-block-wrapper {
      margin: 1.5em 0;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      background: #f6f8fa;

      .code-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background-color: #e8e8e8;
        padding: 8px 12px;
        font-size: 13px;
        border-bottom: 1px solid #ddd;

        .language-label {
          font-weight: 600;
          color: #333;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .copy-btn {
          color: #1890ff;
          cursor: pointer;
          user-select: none;
          font-size: 12px;
          padding: 2px 8px;
          border-radius: 4px;
          transition: background-color 0.2s;

          &:hover {
            background-color: rgba(24, 144, 255, 0.1);
          }

          &:active {
            background-color: rgba(24, 144, 255, 0.2);
          }
        }
      }

      .code-content {
        font-family:
          "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier,
          monospace;
        font-size: 14px;
        line-height: 1.5;
        overflow-x: auto;
        background: #f6f8fa;
        text-align: left;

        .code-line {
          display: flex;
          min-height: 1.5em;

          .line-number {
            width: 55px;
            padding: 0 10px;
            background-color: #e8e8e8;
            color: #999;
            text-align: right;
            user-select: none;
            border-right: 1px solid #ddd;
            flex-shrink: 0;
          }

          .line-content {
            flex: 1;
            padding: 0 12px;
            white-space: pre;
            overflow-x: auto;
          }

          &:hover {
            background-color: rgba(0, 0, 0, 0.02);
          }
        }
      }
    }

    pre:not(.hljs) {
      background-color: #f6f8fa;
      padding: 16px;
      border-radius: 6px;
      overflow: auto;
      margin: 1em 0;
    }

    code.hljs {
      padding: 0;
      background: transparent;
    }

    table {
      border-collapse: collapse;
      margin: 1em 0;
      width: 100%;

      th,
      td {
        border: 1px solid #ddd;
        padding: 8px 12px;
        text-align: left;
      }

      th {
        background-color: #f5f5f5;
        font-weight: 600;
      }

      tr:nth-child(even) {
        background-color: #f9f9f9;
      }
    }

    a {
      color: #1890ff;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }

    img {
      max-width: 100%;
      height: auto;
      border-radius: 4px;
    }

    hr {
      border: none;
      border-top: 1px solid #e8e8e8;
      margin: 2em 0;
    }
  }
}
</style>
