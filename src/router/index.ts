// src/routes/index.ts
import { Router } from 'express';
import authRoutes from './auth.route';
import interviewRoutes from './interviews.route';
import positionRoutes from './positions.route';
import resumeRoutes from './resumes.route';
import userRoutes from './users.route';

const router = Router();

// 公开路由
router.use('/auth', authRoutes);

// 需认证路由
router.use('/users', userRoutes);
router.use('/positions', positionRoutes);
router.use('/resumes', resumeRoutes);
router.use('/interviews', interviewRoutes);

// 大看板数据（可复用 users/positions/interviews 的统计接口）
// 例如：GET /api/dashboard → 聚合调用各模块统计方法（由前端分别请求）

export default router;