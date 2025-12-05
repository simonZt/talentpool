// src/api/auth.ts
import request from './index'

export interface LoginParams {
  loginName: string
  password: string
}

export interface LoginResponse {
  token: string
  user: import('@/types').User
}

export function loginAPI(data: LoginParams): Promise<LoginResponse> {
  return request.post('/auth/login', data)
}