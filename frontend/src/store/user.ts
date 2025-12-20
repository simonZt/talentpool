// frontend/src/store/user.ts
import { defineStore } from 'pinia'

// 定义类型
interface UserInfo {
  username?: string
  name?: string
  role?: string
}

interface LoginResponse {
  access_token: string
  token_type: string
}

// ✅ 使用 defineStore 的标准写法，确保正确导出
export const useUserStore = defineStore('user', {
  // 状态
  state: () => ({
    token: localStorage.getItem('token') || '',
    userInfo: JSON.parse(localStorage.getItem('userInfo') || '{}') as UserInfo
  }),

  // 计算属性
  getters: {
    isAuthenticated: (state) => !!state.token,
    role: (state) => state.userInfo?.role || '',
    info: (state) => state.userInfo
  },

  // 方法
  actions: {
    // 登录
    async handleLogin(username: string, password: string): Promise<void> {
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

        const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ username, password }).toString()
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.detail || '登录失败')
        }

        const data: LoginResponse = await response.json()
        this.token = data.access_token
        localStorage.setItem('token', data.access_token)

        // 获取用户信息
        await this.fetchUserInfo()

        console.log('登录成功！')
      } catch (error) {
        const message = (error as Error).message || '登录失败'
        console.error('登录失败:', message)
        throw error
      }
    },

    // 获取用户信息
    async fetchUserInfo() {
      if (!this.token) {
        throw new Error('No token available')
      }

      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
        const response = await fetch(`${apiBaseUrl}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${this.token}` }
        })

        if (!response.ok) {
          throw new Error(`获取用户信息失败: ${response.status}`)
        }

        const data = await response.json()
        this.userInfo = data
        localStorage.setItem('userInfo', JSON.stringify(data))

        return data
      } catch (error) {
        console.error('获取用户信息失败:', error)
        this.logout()
        throw error
      }
    },

    // 登出
    logout() {
      this.token = ''
      this.userInfo = {}
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
    },

    // 检查登录状态
    isLoggedIn() {
      return !!this.token
    }
  }
})
