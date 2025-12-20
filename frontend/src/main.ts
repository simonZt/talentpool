import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { createPinia } from 'pinia'
import { createApp } from 'vue'

import App from './App.vue'
import router from './router'

// 创建应用实例
const app = createApp(App)

// 创建 Pinia 实例
const pinia = createPinia()
app.use(pinia)

// 全局注册 Element Plus
app.use(ElementPlus)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 使用 Router
app.use(router)

// 挂载应用
app.mount('#app')
