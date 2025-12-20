// frontend/src/store/user.ts

import type { AxiosError } from 'axios'
import { ElMessage } from 'element-plus'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

// 后端登录响应结构 (来自 /api/auth/login)
interface LoginResponse {
  access_token: string
  token_type: string
}

// 用户信息结构
interface UserInfo {
  username?: string
  name?: string
  role?: string
}

export const useUserStore = defineStore('user', () => {
  // 状态
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref<UserInfo>(JSON.parse(localStorage.getItem('userInfo') || '{}'))

  // 计算属性 (路由守卫需要)
  const isAuthenticated = computed(() => !!token.value)
  const role = computed(() => userInfo.value?.role || '')
  const info = computed(() => userInfo.value)

  // 登录方法 -直接发送请求，绕过 api.login (因为它路径不对)
  async function handleLogin(username: string, password: string): Promise<void> {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

      //直接发送请求，确保路径和格式正确
      const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({ username, password }).toString()
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || '登录失败')
      }

      const data: LoginResponse = await response.json()

      // 保存 token
      token.value = data.access_token
      localStorage.setItem('token', data.access_token)

      // 登录成功后立即获取用户信息
      await fetchUserInfo()

      ElMessage.success('登录成功！')
    } catch (error) {
      const axiosError = error as AxiosError
      let errorMessage = '登录请求出错'

      if (axiosError.response) {
        const errData = axiosError.response.data as any
        errorMessage = errData?.detail || `服务器错误: ${axiosError.response.status}`
      } else if (axiosError.request) {
        errorMessage = '网络错误，请检查您的连接'
      } else {
        errorMessage = axiosError.message
      }

      console.error('登录失败:', errorMessage)
      ElMessage.error(errorMessage)
      throw new Error(errorMessage)
    }
  }

  // 获取用户信息 (供路由守卫调用)
  async function fetchUserInfo() {
    if (!token.value) {
      throw new Error('No token available')
    }

    try {
      // 使用正确的 API 路径
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
      const response = await fetch(`${apiBaseUrl}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token.value}`
        }
      })

      if (!response.ok) {
        throw new Error(`获取用户信息失败: ${response.status}`)
      }

      const data = await response.json()
      userInfo.value = data
      localStorage.setItem('userInfo', JSON.stringify(data))

      return data
    } catch (error) {
      console.error('获取用户信息失败:', error)
      // 获取失败时清除token，避免状态不一致
      logout()
      throw error
    }
  }

  // 登出
  function logout() {
    token.value = ''
    userInfo.value = {}
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
  }

  // 检查登录状态
  const isLoggedIn = () => !!token.value

  return {
    // 状态
    token,
    userInfo,
    // 计算属性
    isAuthenticated,
    role,
    info,
    // 方法
    handleLogin,
    fetchUserInfo,
    logout,
    isLoggedIn
  }
})
