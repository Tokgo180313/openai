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
import router, { initManageRoutesFromStore } from './router'

async function bootstrap() {
  const app = createApp(App)
  app.use(pinia)
  app.use(router)
  app.use(clickOutsidePlugin)
  await initManageRoutesFromStore()
  app.mount("#app")
}

bootstrap()
