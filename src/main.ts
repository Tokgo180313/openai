import { createApp } from 'vue'
import { clickOutsidePlugin } from "./directives/clickOutsidePlugin";
import pinia from './stores/index';
// reset.css
import "./assets/style/reset.css"
// iconfont
import "@/assets/iconfont/iconfont.css"
import './style.css'
// 清除浏览器默认样式
import "reset-css"
// 清除#app默认样式
import "normalize.css"
import App from './App.vue'
import "ant-design-vue/dist/reset.css"
import router from './router'
const app = createApp(App)
// 使用pinia
app.use(pinia)
// 路由
app.use(router)
// 安装指令
app.use(clickOutsidePlugin)
// createApp(App).mount('#app')
app.mount("#app")
