// src/controllers/user.controller.ts
import { Request, Response } from 'express';
import { ManagerPermissions, User, UserRole } from '../models/User';
import { hashPassword } from '../utils/auth.utils';

/**
 * 获取用户列表（HR 个人数据用于大看板）
 */
export const getUserList = async (req: Request, res: Response) => {
  const users = await User.find().select('name displayName role createdAt');

  // 可用于大看板：按简历量排序需关联统计（此处简化）
  res.json({ code: 200, data: users });
};

/**
 * 新增用户
 */
export const createUser = async (req: Request, res: Response) => {
  const { username, displayName, name, role, permissions } = req.body;
  const currentUser = (req as any).user;

  // 普通用户不能指定角色
  let finalRole: UserRole = 'user';
  let finalPerms: ManagerPermissions | undefined;

  if (currentUser.role === 'super') {
    finalRole = role || 'user';
    if (finalRole === 'manager') {
      finalPerms = permissions; // 超级管理员可赋权
    }
  } else if (currentUser.role === 'manager') {
    // 管理人员只能创建普通用户
    finalRole = 'user';
  }

  const existing = await User.findOne({ $or: [{ username }, { name }] });
  if (existing) {
    return res.status(400).json({ code: 400, message: '登录名或姓名已存在' });
  }

  const newUser = new User({
    username,
    displayName,
    name,
    role: finalRole,
    permissions: finalPerms,
    password: hashPassword('123456') // 默认密码
  });

  await newUser.save();
  res.json({ code: 201, message: '用户创建成功' });
};

/**
 * 设置管理人员权限（仅 super）
 */
export const setPermissions = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { permissions } = req.body;

  const targetUser = await User.findById(id);
  if (!targetUser || targetUser.role !== 'manager') {
    return res.status(400).json({ code: 400, message: '目标用户不是管理人员' });
  }

  await User.findByIdAndUpdate(id, { permissions });
  res.json({ code: 200, message: '权限更新成功' });
};