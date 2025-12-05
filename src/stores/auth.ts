// src/stores/auth.ts (更新版)
import { loginAPI } from '@/api/auth'
import { getCurrentUser } from '@/api/user'; // 新增 API：获取当前用户（含权限）
import type { ManagerPermission, User } from '@/types'
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    user: null as (User & { permissions?: ManagerPermission }) | null // 扩展类型
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    role: (state) => state.user?.role || 'hr',
    isSuperAdmin: (state) => state.user?.role === 'super_admin',
    isManager: (state) => state.user?.role === 'manager',
    // 新增：当前用户权限（用于前端判断）
    currentUserPermissions: (state) => {
      if (state.user?.role === 'super_admin') {
        return {
          canCreatePosition: true,
          canEditPosition: true,
          canDeletePosition: true,
          canViewBudget: true,
          canManageHrUsers: true
        }
      }
      return state.user?.permissions || {}
    }
  },

  actions: {
    async login(loginName: string, password: string) {
      const res = await loginAPI({ loginName, password })
      this.token = res.token
      localStorage.setItem('token', res.token)
      // 登录后立即加载带权限的用户信息
      await this.fetchCurrentUser()
    },

    async fetchCurrentUser() {
      if (this.isAuthenticated) {
        this.user = await getCurrentUser() // 此接口返回当前用户 + 权限
      }
    },

    logout() {
      this.token = ''
      this.user = null
      localStorage.removeItem('token')
    }
  }
})