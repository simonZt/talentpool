// src/middlewares/ownership.middleware.ts
import { NextFunction, Request, Response } from 'express';

/**
 * 仅允许操作自身资源（如修改密码、查看个人数据）
 */
export const selfOnly = (req: Request, res: Response, next: NextFunction) => {
  const currentUser = (req as any).user;
  const targetUserId = req.params.id || req.body.userId || req.query.userId;

  if (!targetUserId) {
    return res.status(400).json({ code: 400, message: '缺少用户标识' });
  }

  // 超级管理员可操作任意用户
  if (currentUser.role === 'super') {
    return next();
  }

  // 普通用户/管理人员只能操作自己（除非是 manager 且有用户管理权限——但改密码仍限自身）
  if (currentUser.id !== targetUserId) {
    return res.status(403).json({
      code: 403,
      message: '仅可操作自身账户信息'
    });
  }

  next();
};