// markdownRenderer.ts
import MarkdownIt from 'markdown-it'
import Prism from 'prismjs'

// 引入需要的语言支持
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-css'
import 'prismjs/components/prism-markup'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-bash'

// 创建 MarkdownIt 实例
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: (code: string, lang: string) => {
    // 检查语言是否被 Prism 支持
    if (lang && Prism.languages[lang]) {
      try {
        return `<pre class="language-${lang}"><code class="language-${lang}">${Prism.highlight(code, Prism.languages[lang], lang)}</code></pre>`
      } catch (err) {
        console.warn(`Error highlighting language: ${lang}`, err)
      }
    }
    
    // 默认处理：转义 HTML 并使用当前语言类名
    return `<pre class="language-${lang}"><code class="language-${lang}">${md.utils.escapeHtml(code)}</code></pre>`
  }
})

// 导出渲染函数
export const markdownRenderer = md;