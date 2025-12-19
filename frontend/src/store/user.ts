// D:\兰花花\talentpool\frontend\src\store\user.ts

import * as api from '@/api';
import type { AxiosError } from 'axios';
import { defineStore } from 'pinia';
import { ref } from 'vue';

// 定义后端返回的登录响应结构
interface LoginResponse {
  code: number;
  message: string;
  data: {
    token: string;
    username: string;
    role: string;
  };
}

// 定义用户信息的类型
interface UserInfo {
  username?: string;
  token?: string;
  role?: string;
}

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref<UserInfo>(JSON.parse(localStorage.getItem('userInfo') || '{}'))

  // 修正后的 handleLogin Action
  async function handleLogin(formData: any): Promise<void> {
    try {
      // 1. 调用 api.login，它返回一个 AxiosResponse 对象
      const response = await api.login(formData)

      // 2. 从 response 中提取 data，并对 data 进行类型断言
      // 这是最关键的修改！
      const res = response.data as LoginResponse

      // 现在 TypeScript 知道 res 是 LoginResponse 类型，可以安全地访问 code, message, data
      if (res.code === 200) {
        // 3. 直接调用 login 函数 (无需使用 this)
        login(res.data)
        console.log('登录成功！')
      } else {
        const errorMessage = res.message || '未知错误'
        console.error('登录失败:', errorMessage)
        throw new Error(errorMessage)
      }
    } catch (error) {
      // 统一错误处理
      const axiosError = error as AxiosError
      let errorMessage = '登录请求出错'

      if (axiosError.response) {
        // 尝试从后端错误响应中解析 message
        const errData = axiosError.response.data as LoginResponse
        errorMessage = errData.message || `服务器错误: ${axiosError.response.status}`
      } else if (axiosError.request) {
        errorMessage = '网络错误，请检查您的连接'
      } else {
        errorMessage = axiosError.message
      }

      console.error('登录请求出错:', errorMessage)
      throw new Error(errorMessage)
    }
  }

  // --- 以下是 store 内部的状态管理方法 (保持不变) ---
  function login(userData: UserInfo) {
    if (userData.token) {
      token.value = userData.token
      localStorage.setItem('token', userData.token)
    }
    if (userData) {
      userInfo.value = userData
      localStorage.setItem('userInfo', JSON.stringify(userData))
    }
  }

  function logout() {
    token.value = ''
    userInfo.value = {}
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
  }

  const isLoggedIn = () => !!token.value

  return {
    token,
    userInfo,
    handleLogin,
    login,
    logout,
    isLoggedIn
  }
})
