/// <reference types="vite/client" />

// ==================== Vue组件声明 ====================
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// ==================== 路径别名模块声明 ====================
declare module '@/utils/request' {
  const request: any
  export default request
}

declare module '@/store/user' {
  const userStore: any
  export default userStore
}

declare module '@/api' {
  const api: any
  export default api
}

declare module '@/router' {
  const router: any
  export default router
}

// ==================== 修复router/index.ts的逻辑错误 ====================

// 1. 修复 userStore.role 类型问题
// 在 router/index.ts 的 <script> 部分添加类型定义：
declare interface UserStore {
  role: string
  //其他属性...
}

// 2. 修复 next()重载错误
// 在 router/index.ts 顶部添加：

// ==================== 修复其他可能的类型问题 ====================
declare module '*.css'
declare module '*.scss'
declare module '*.png'
declare module '*.jpg'
declare module '*.svg'
