// src/types/auth.d.ts
export interface LoginRequest {
  username: string
  password: string
}

export interface AuthResponse {
  token: string
  user: {
    id: string
    username: string
    role: 'super_admin' | 'manager' | 'hr' | 'user'
  }
}