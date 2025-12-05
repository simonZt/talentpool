import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'

export function usePermission() {
  const authStore = useAuthStore()
  const { userRole } = storeToRefs(authStore)

  const isSuperAdmin = () => userRole.value === 'super_admin'
  const isManager = () => userRole.value === 'manager'
  const isNormalUser = () => userRole.value === 'normal_user'

  // 示例：是否可编辑岗位
  const canEditPosition = () => isSuperAdmin() || isManager()

  return {
    isSuperAdmin,
    isManager,
    isNormalUser,
    canEditPosition,
  }
}

// 是否可创建/安排面试（超级管理员或经理）
const canManageInterview = () => isSuperAdmin() || isManager()

// 是否是面试官（用于判断是否能填写评价）
const isInterviewerOf = (interview: InterviewItem): boolean => {
  const authStore = useAuthStore()
  return interview.interviewers.some(
    (i) => i.id === authStore.userId
  )
}