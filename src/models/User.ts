// src/models/User.ts
import { Document, Schema, model } from 'mongoose';

export type UserRole = 'super' | 'manager' | 'user';

// 管理人员细粒度权限结构
export interface ManagerPermissions {
  position?: {
    create?: boolean;
    edit?: boolean;
    delete?: boolean;      // 下架岗位
    viewBudget?: boolean;
  };
  user?: {
    create?: boolean;
    edit?: boolean;
    delete?: boolean;
  };
}

export interface IUser extends Document {
  // 登录信息
  username: string;       // 登录名（英文/字母+数字，唯一）
  password: string;       // SHA-256 加密存储
  displayName: string;    // 用户名（显示用，支持汉字）

  // 关联信息
  name: string;           // 姓名（与简历“归属HR”关联，唯一）

  // 角色与权限
  role: UserRole;
  permissions?: ManagerPermissions; // 仅 role === 'manager' 时有效
}

const userSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true, match: /^[a-zA-Z0-9]+$/ },
  password: { type: String, required: true },
  displayName: { type: String, required: true },
  name: { type: String, required: true, unique: true }, // 姓名不可重复
  role: { 
    type: String, 
    enum: ['super', 'manager', 'user'], 
    default: 'user' 
  },
  permissions: {
    position: {
      create: Boolean,
      edit: Boolean,
      delete: Boolean,
      viewBudget: Boolean
    },
    user: {
      create: Boolean,
      edit: Boolean,
      delete: Boolean
    }
  }
}, { timestamps: true });

export const User = model<IUser>('User', userSchema);