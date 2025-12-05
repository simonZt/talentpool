// src/stores/user.ts
import {
  assignManagerPermissions,
  changePassword,
  createUser,
  deleteUser,
  getUserList,
  updateUser
} from '@/api/user'
import type { ManagerPermission, User } from '@/types'
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    userList: [] as User[],
    loading: false
  }),

  actions: {
    async fetchUsers() {
      this.loading = true
      try {
        this.userList = await getUserList()
      } finally {
        this.loading = false
      }
    },

    async addUser(userData: Omit<User, 'id'> & { password: string }) {
      await createUser(userData)
      await this.fetchUsers()
    },

    async editUser(id: string, data: Partial<User>) {
      await updateUser(id, data)
      await this.fetchUsers()
    },

    async removeUser(id: string) {
      await deleteUser(id)
      await this.fetchUsers()
    },

    async setManagerPermissions(id: string, permissions: ManagerPermission) {
      await assignManagerPermissions(id, permissions)
      await this.fetchUsers() // 权限变更后刷新
    },

    async updateOwnPassword(oldPassword: string, newPassword: string) {
      await changePassword({ oldPassword, newPassword })
    }
  }
})