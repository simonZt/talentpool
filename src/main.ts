// src/main.ts
import '@/styles/global.css'; // 可选全局样式
import 'element-plus/dist/index.css';
import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')