// src/routes/interviews.route.ts
import { Router } from 'express';
import * as interviewController from '../controllers/interview.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();
router.use(authenticate);

/**
 * POST /api/interviews
 * 发起面试邀约（所有用户均可）
 */
router.post('/', interviewController.createInterview);

/**
 * POST /api/interviews/:id/evaluate
 * 提交面试评价（仅被指定的面试官）
 */
router.post('/:id/evaluate', interviewController.submitEvaluation);

// 状态变更（如取消面试）可通过 PATCH 实现（此处省略）

export default router;