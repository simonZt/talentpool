// src/router/guards.ts
import { useAuthStore } from '@/stores/auth'

export const requireSuperAdmin = () => {
  const authStore = useAuthStore()
  if (!authStore.isSuperAdmin) {
    ElMessage.error('无权访问')
    return false
  }
  return true
}