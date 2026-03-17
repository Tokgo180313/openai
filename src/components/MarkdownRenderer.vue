<template>
  <div class="markdown-container" :class="roleClass">
    <div class="markdown-content" v-html="processedContent"></div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import MarkdownIt from "markdown-it";
import hljs from "highlight.js";
import "highlight.js/styles/github.css";
import { message } from "ant-design-vue";

interface Props {
  content: string;
  role?: "user" | "assistant";
}

const props = withDefaults(defineProps<Props>(), {
  role: "assistant",
});

const processedContent = ref("");

// 配置 highlight.js
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

// 创建 markdown-it 实例
const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  xhtmlOut: true, // 使用 / 闭合单标签
  breaks: true, // 将换行符转换为 <br>
  highlight: (str: string, lang: string) => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        // 生成带行号的代码
        const code = hljs.highlight(str, { language: lang }).value;
        const lines = code.split("\n");

        // 添加行号
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
      } catch (__) {}
    }
    return ""; // 使用默认的转义
  },
});

// 添加自定义渲染规则处理代码块和文本的嵌套问题
md.renderer.rules.code_block = (tokens, idx) => {
  const token = tokens[idx];
  return `<pre><code class="hljs">${md.utils.escapeHtml(
    token.content
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
    } catch (__) {}
  }

  return `<pre><code>${md.utils.escapeHtml(content)}</code></pre>`;
};

// 处理内联代码和文本的混合
md.renderer.rules.code_inline = (tokens, idx) => {
  const token = tokens[idx];
  return `<code class="inline-code">${md.utils.escapeHtml(
    token.content
  )}</code>`;
};

// 角色样式类
const roleClass = computed(() => ({
  "role-user": props.role === "user",
  "role-assistant": props.role === "assistant",
}));

// 处理内容
const processContent = () => {
  if (!props.content) {
    processedContent.value = "";
    return;
  }

  try {
    // 先渲染Markdown
    let rendered = md.render(props.content);

    // 处理可能的嵌套问题
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
                        (line: string, index: number) =>
                          `<div class="code-line">
                        <span class="line-number">${index + 1}</span>
                        <span class="line-content">${line || " "}</span>
                      </div>`
                      )
                      .join("")}
                  </div>
                </div>`;
      }
    );

    processedContent.value = rendered;
  } catch (error) {
    console.error("Markdown渲染错误:", error);
    processedContent.value = props.content;
  }
};

// 添加复制功能到全局
const addCopyFunction = () => {
  if (typeof window !== "undefined") {
    (window as any).copyCode = (element: HTMLElement) => {
      const codeBlock = element.closest(".code-block-wrapper");
      if (codeBlock) {
        const codeContent = codeBlock.querySelector(".code-content");
        if (codeContent) {
          // 提取纯文本内容（去掉行号）
          const lines = Array.from(
            codeContent.querySelectorAll(".line-content")
          );
          const text = lines.map((line) => line.textContent || "").join("\n");

          navigator.clipboard
            .writeText(text)
            .then(() => {
              // const originalText = element.textContent;
              // element.textContent = "已复制!";
              message.success("代码已复制到剪贴板");

              // setTimeout(() => {
                // element.textContent = originalText;
              // }, 2000);
            })
            .catch((err) => {
              console.error("复制失败:", err);
              message.error("复制失败");
            });
        }
      }
    };
  }
};

// 监听内容变化
watch(() => props.content, processContent, { immediate: true });

onMounted(() => {
  addCopyFunction();
});
</script>

<style scoped lang="scss">
.markdown-container {
  max-width: 100%;
  word-wrap: break-word;
  line-height: 1.2;

  &.role-user {
    text-align: right;
    margin-left: auto;
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
      max-width: 85%;
      text-align: left;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      line-height: 1.4;
      word-break: break-all; // 纯文本连续字符自动换行
      white-space: normal; // 按正常规则换行显示
    }
  }

  &.role-assistant {
    text-align: left;
    .markdown-content {
      padding: 0;
      background: none;
      border: none;
      max-width: 100%;
    }

    .message-role {
      display: none;
    }
  }
}

.markdown-content {
  :deep() {
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
      padding-left: 2em;
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
        font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo,
          Courier, monospace;
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
