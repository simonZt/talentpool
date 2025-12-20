// frontend/src/utils/request.ts

import router from '@/router'
import { useUserStore } from '@/store/user'
import axios, { type AxiosError, type AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'

const service = axios.create({
  baseURL: '/api',
  timeout: 10000
})

// 请求拦截器：在发送请求前添加认证头
service.interceptors.request.use(
  (config) => {
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器：统一处理响应和错误
service.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  (error: AxiosError<any>) => {
    const { response } = error

    if (response) {
      const { status, data } = response

      //处理不同状态码
      if (status === 401) {
        ElMessage.error('登录已过期，请重新登录')
        const userStore = useUserStore()
        userStore.logout()
        router.push('/login')
      } else if (status === 403) {
        ElMessage.error('权限不足，无法访问')
      } else {
        // 优先使用后端返回的错误信息
        const errorMessage = data?.detail || data?.message || `请求失败: ${status}`
        ElMessage.error(errorMessage)
      }
    } else {
      ElMessage.error('网络错误，请检查连接')
    }

    return Promise.reject(error)
  }
)

export default service
