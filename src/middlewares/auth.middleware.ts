// middlewares/auth.middleware.ts
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User, UserRole } from '../models/User';
import { PermissionService } from '../services/permission.service';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 1. 身份认证中间件
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ code: 401, message: '未登录' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({ code: 401, message: '用户不存在' });
    }
    (req as any).user = user; // 挂载用户对象
    next();
  } catch (err) {
    return res.status(401).json({ code: 401, message: 'Token无效' });
  }
};

// 2. 角色权限校验中间件
interface RoleGuardOptions {
  roles: UserRole[]; // 允许的角色
  checkManagerPermission?: 'position' | 'user'; // 是否需额外检查管理人员权限
}

export const roleGuard = (options: RoleGuardOptions) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    // 超级管理员无条件通过
    if (user.role === 'super') {
      return next();
    }

    // 检查是否在允许角色中
    if (!options.roles.includes(user.role)) {
      return res.status(403).json({ code: 403, message: '无权限操作' });
    }

    // 如果是管理人员，且需要检查细粒度权限
    if (user.role === 'manager' && options.checkManagerPermission) {
      const hasPerm = await PermissionService.hasPermission(
        user.id,
        options.checkManagerPermission,
        'create' // 可扩展为动态 action
      );
      if (!hasPerm) {
        return res.status(403).json({ code: 403, message: '无权限操作' });
      }
    }

    next();
  };
};

// 3. 资源所有权校验（如：只能修改自己的密码）
export const selfOnly = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  const targetUserId = req.params.id || req.body.userId;

  if (user.id !== targetUserId && user.role !== 'super') {
    return res.status(403).json({ code: 403, message: '仅可操作自身账户' });
  }
  next();
};