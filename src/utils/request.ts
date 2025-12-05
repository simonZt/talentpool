// src/utils/request.ts（最终版）
import { getToken, removeToken } from '@/utils/auth'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const service = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

service.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

service.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      removeToken()
      ElMessage.error('登录已过期，请重新登录')
      // 安全跳转，不依赖 Vue Router 实例
      window.location.href = '/login'
    } else {
      const msg = error.response?.data?.message || '请求失败'
      ElMessage.error(msg)
    }
    return Promise.reject(error)
  }
)

export default service