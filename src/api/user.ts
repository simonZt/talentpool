// src/api/user.ts
import type { ManagerPermission, User } from '@/types'
import request from './index'

// 获取当前用户信息
export function getUserInfo(): Promise<User> {
  return request.get('/user/me')
}

// 获取当前登录用户（含权限）
export const getCurrentUser = (): Promise<User & { permissions?: ManagerPermission }> => {
  return request({
    url: '/api/users/me',
    method: 'GET'
  })
}

// 修改密码
export function changePassword(data: { oldPassword: string; newPassword: string }) {
  return request.put('/user/password', data)
}

// 系统管理 - 用户相关
export function getUserList(): Promise<User[]> {
  return request.get('/admin/users')
}

export function createUser(data: Omit<User, 'id'> & { password: string }): Promise<void> {
  return request.post('/admin/users', data)
}

export function updateUser(id: string, data: Partial<User>): Promise<void> {
  return request.put(`/admin/users/${id}`, data)
}

export function deleteUser(id: string): Promise<void> {
  return request.delete(`/admin/users/${id}`)
}

export function assignManagerPermissions(id: string, permissions: ManagerPermission): Promise<void> {
  return request.put(`/admin/users/${id}/permissions`, permissions)
}