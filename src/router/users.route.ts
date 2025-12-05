// src/routes/users.route.ts
import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import {
  authenticate,
  roleGuard
} from '../middlewares/auth.middleware';
import { selfOnly } from '../middlewares/ownership.middleware';
import {
  managerPermissionGuard
} from '../middlewares/permission.middleware';

const router = Router();
router.use(authenticate); // 所有接口需登录

/**
 * GET /api/users
 * 查看用户列表（用于大看板 HR 数据）
 */
router.get('/', userController.getUserList);

/**
 * POST /api/users
 * 新增用户
 * - super: 可创建任意角色
 * - manager: 仅可创建普通用户（需赋权）
 */
router.post(
  '/',
  roleGuard(['super', 'manager']),
  managerPermissionGuard('user', 'create'),
  userController.createUser
);

/**
 * PATCH /api/users/:id/password
 * 修改密码（仅自己）
 */
router.patch('/:id/password', selfOnly, userController.changePassword);

/**
 * PUT /api/users/:id/permissions
 * 设置管理人员权限（仅 super）
 */
router.put(
  '/:id/permissions',
  roleGuard(['super']),
  userController.setPermissions
);

export default router;