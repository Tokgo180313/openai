// @ts-nocheck — legacy Quasar boot file, not used in Vite app
// src/utils/tinymce-init.ts
import { boot } from 'quasar/wrappers'
import tinymce from 'tinymce/tinymce'
import 'tinymce/themes/silver'
import 'tinymce/icons/default'

// 导入插件
import 'tinymce/plugins/advlist'
import 'tinymce/plugins/autolink'
import 'tinymce/plugins/lists'
import 'tinymce/plugins/link'
import 'tinymce/plugins/image'
import 'tinymce/plugins/charmap'
import 'tinymce/plugins/preview'
import 'tinymce/plugins/anchor'
import 'tinymce/plugins/searchreplace'
import 'tinymce/plugins/visualblocks'
import 'tinymce/plugins/code'
import 'tinymce/plugins/fullscreen'
import 'tinymce/plugins/insertdatetime'
import 'tinymce/plugins/media'
import 'tinymce/plugins/table'
import 'tinymce/plugins/help'
import 'tinymce/plugins/wordcount'

// 中文语言包
import 'tinymce-i18n/langs/zh-CN'

export default boot(() => {
  // 初始化 TinyMCE
  tinymce.init({
    // 基础配置
    selector: 'textarea', // 默认选择器
    language: 'zh-CN',
    // 这里可以设置全局默认配置
  })
})