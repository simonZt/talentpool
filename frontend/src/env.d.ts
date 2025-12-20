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

// ==================== 关键：修正 Pinia Store 类型 ====================
declare module '@/store/user' {
  import type { Pinia } from 'pinia'

  // 定义 Store 的完整类型
  interface UserStore {
    // State
    token: string
    userInfo: any

    // Getters (作为属性)
    readonly isAuthenticated: boolean
    readonly role: string
    readonly info: any

    // Actions
    handleLogin: (username: string, password: string) => Promise<void>
    fetchUserInfo: () => Promise<any>
    logout: () => void
    isLoggedIn: () => boolean
  }

  // 导出构造函数
  export function useUserStore(pinia?: Pinia): UserStore

  //同时支持两种导入方式
  export default useUserStore
  export { useUserStore }
}

declare module '@/api' {
  const api: any
  export default api
}

declare module '@/router' {
  const router: any
  export default router
}

// ==================== 其他声明 ====================
declare module '*.css'
declare module '*.scss'
declare module '*.png'
declare module '*.jpg'
declare module '*.svg'
