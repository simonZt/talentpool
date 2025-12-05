// src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import { User } from '../models/User';
import { generateToken, hashPassword } from '../utils/auth.utils';

/**
 * 用户登录
 */
export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ code: 400, message: '请输入用户名和密码' });
  }

  const user = await User.findOne({ username });
  if (!user) {
    return res.status(401).json({ code: 401, message: '用户名或密码错误' });
  }

  const hashedPassword = hashPassword(password);
  if (hashedPassword !== user.password) {
    return res.status(401).json({ code: 401, message: '用户名或密码错误' });
  }

  const token = generateToken(user.id);
  res.json({
    code: 200,
    data: { token, user: { id: user.id, displayName: user.displayName, role: user.role } },
    message: '登录成功'
  });
};

/**
 * 修改密码（仅自己）
 */
export const changePassword = async (req: Request, res: Response) => {
  const { oldPassword, newPassword } = req.body;
  const user = (req as any).user;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ code: 400, message: '请提供新旧密码' });
  }

  // 验证旧密码
  if (hashPassword(oldPassword) !== user.password) {
    return res.status(400).json({ code: 400, message: '原密码错误' });
  }

  // 更新密码
  await User.findByIdAndUpdate(user.id, { password: hashPassword(newPassword) });

  res.json({ code: 200, message: '密码修改成功' });
};