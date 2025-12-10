import { createApp } from 'vue'
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
app.use(router)
// createApp(App).mount('#app')
app.mount("#app")
console.log("app",router.getRoutes())
