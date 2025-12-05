// src/types/user.d.ts
export type UserRole = 'super_admin' | 'manager' | 'hr'

export interface User {
  id: string
  loginName: string // 登录名（英文/数字）
  username: string  // 显示名（汉字）
  realName: string  // 姓名（关联“归属HR”）
  role: UserRole
  createdAt: string
}

// 权限配置（仅超级管理员可设置）
export interface ManagerPermissions {
  canCreatePosition: boolean
  canEditPosition: boolean
  canDeletePosition: boolean
  canViewBudget: boolean
  canManageHrUsers: boolean // 普通用户增删改
}