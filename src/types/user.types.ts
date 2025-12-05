// src/types/user.types.ts
import { ManagerPermissions, UserRole } from '../models/User';

/**
 * 用户角色枚举（与模型一致）
 */
export type { UserRole };

/**
 * 管理人员权限结构（与模型一致）
 */
    export type { ManagerPermissions };

/**
 * 登录请求体
 */
export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * 修改密码请求体
 */
export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

/**
 * 创建用户请求体
 */
export interface CreateUserRequest {
  username: string;           // 登录名（英文/数字）
  displayName: string;        // 显示名称（汉字）
  name: string;               // 姓名（唯一，用于归属HR）
  role?: 'super' | 'manager' | 'user';
  permissions?: ManagerPermissions;
}