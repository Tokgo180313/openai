// markdownRenderer.ts
import MarkdownIt from "markdown-it";
import Prism from "prismjs";
import "prismjs/themes/prism.css"; // 可根据需要替换成其他主题

// 按需引入常用语言高亮，避免一次性全量引入体积过大
import "prismjs/components/prism-markup";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-json";
import "prismjs/components/prism-css";
import "prismjs/components/prism-scss";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-python";
import "prismjs/components/prism-java";
import "prismjs/components/prism-sql";


// 统一处理语言名称，支持常见别名（如 js/ts）
const normalizeLang = (lang: string) => {
  if (!lang) return "";
  const lower = lang.trim().toLowerCase();
  if (lower === "js") return "javascript";
  if (lower === "ts") return "typescript";
  if (lower === "html") return "markup";
  return lower;
};

// 创建 MarkdownIt 实例（开启 markdown 风格渲染 + 代码高亮）
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  xhtmlOut: true, // 使用 / 闭合单标签
  breaks: true, // 将换行符转换为 <br>
  highlight: (code: string, lang: string) => {
    const normalized = normalizeLang(lang);

    // 优先使用 Prism 对指定语言高亮
    if (normalized && Prism.languages[normalized]) {
      try {
        const highlighted = Prism.highlight(
          code,
          Prism.languages[normalized],
          normalized,
        );
        return `<pre class="language-${normalized}"><code class="language-${normalized}">${highlighted}</code></pre>`;
      } catch (err) {
        console.warn(`Error highlighting language: ${normalized}`, err);
      }
    }

    // 未指定语言或不支持时，按纯文本处理，并加上通用类名便于样式控制
    const escaped = md.utils.escapeHtml(code);
    return `<pre class="language-plaintext"><code class="language-plaintext">${escaped}</code></pre>`;
  },
});

// 导出渲染函数
export const markdownRenderer = md;