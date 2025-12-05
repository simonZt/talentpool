// src/routes/positions.route.ts
import { Router } from 'express';
import * as positionController from '../controllers/position.controller';
import {
    authenticate,
    roleGuard
} from '../middlewares/auth.middleware';
import {
    managerPermissionGuard
} from '../middlewares/permission.middleware';

const router = Router();
router.use(authenticate);

/**
 * GET /api/positions
 * 查看岗位列表（普通用户不可见 projectBudget）
 */
router.get('/', positionController.getPositionList);

/**
 * POST /api/positions
 * 新增岗位（super / 赋权 manager）
 */
router.post(
  '/',
  roleGuard(['super', 'manager']),
  managerPermissionGuard('position', 'create'),
  positionController.createPosition
);

/**
 * PUT /api/positions/:id/archive
 * 下架岗位（不可逆）
 */
router.put(
  '/:id/archive',
  roleGuard(['super', 'manager']),
  managerPermissionGuard('position', 'delete'),
  positionController.archivePosition
);

// 注意：需求规定“不可修改岗位名称/城市/地点”，故无通用 PUT /:id 接口

export default router;