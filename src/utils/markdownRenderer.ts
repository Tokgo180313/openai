// markdownRenderer.ts
import MarkdownIt from 'markdown-it'
import Prism from 'prismjs'
import 'prismjs/themes/prism.css'; // 你可以选择不同的 Prism 样式
import 'prismjs'; // 导入 Prism 代码高亮库
// 引入需要的语言支持
// 导入所需的语言高亮
// import 'prismjs/components/prism-javascript'
// import 'prismjs/components/prism-typescript'
// import 'prismjs/components/prism-jsx'
// import 'prismjs/components/prism-tsx'
// import 'prismjs/components/prism-css'
// import 'prismjs/components/prism-scss'
// import 'prismjs/components/prism-html'
// import 'prismjs/components/prism-json'
// import 'prismjs/components/prism-bash'
// import 'prismjs/components/prism-python'
// import 'prismjs/components/prism-java'
// import 'prismjs/components/prism-sql'
// import 'prismjs/components/prism-markdown'


// 创建 MarkdownIt 实例
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  xhtmlOut: true, // 使用 / 闭合单标签
  breaks: true, // 将换行符转换为 <br>
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