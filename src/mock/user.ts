// src/mock/user.ts
import { MockMethod } from 'vite-plugin-mock'

const users = [
  { id: '1', loginName: 'admin', username: '超级管理员', realName: '张三', role: 'super_admin' },
  { id: '2', loginName: 'manager1', username: '王经理', realName: '王五', role: 'manager' },
  { id: '3', loginName: 'hr1', username: 'HR小李', realName: '李四', role: 'hr' }
]

export default [
  {
    url: '/api/user/me',
    method: 'get',
    response: () => ({
      code: 200,
      data: users[0]
    })
  },
  {
    url: '/api/admin/users',
    method: 'get',
    response: () => ({
      code: 200,
      data: users
    })
  }
] as MockMethod[]