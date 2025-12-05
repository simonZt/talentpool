// src/mock/auth.ts
import { MockMethod } from 'vite-plugin-mock'

export default [
  {
    url: '/api/auth/login',
    method: 'post',
    response: ({ body }: any) => {
      const { loginName, password } = body
      if (loginName === 'admin' && password === '123456') {
        return {
          code: 200,
          data: {
            token: 'mock-token-123',
            user: {
              id: '1',
              loginName: 'admin',
              username: '管理员',
              realName: '张三',
              role: 'super_admin'
            }
          }
        }
      }
      if (password === '123456') {
        return {
          code: 200,
          data: {
            token: 'mock-token-hr',
            user: {
              id: '2',
              loginName: loginName,
              username: 'HR小李',
              realName: '李四',
              role: 'hr'
            }
          }
        }
      }
      return { code: 401, message: '用户名或密码错误' }
    }
  }
] as MockMethod[]