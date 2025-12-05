// src/routes/resumes.route.ts
import { Router } from 'express';
import multer from 'multer'; // 用于文件上传
import * as resumeController from '../controllers/resume.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();
router.use(authenticate);

// 配置 multer（简化版，实际应配置存储路径）
const upload = multer({ dest: 'uploads/resumes/' });

/**
 * POST /api/resumes
 * 上传简历（所有用户均可）
 */
router.post(
  '/',
  upload.single('file'), // 前端字段名应为 file
  resumeController.uploadResume
);

/**
 * POST /api/resumes/:id/follow-up
 * 添加回访记录（所有用户均可编辑）
 */
router.post('/:id/follow-up', resumeController.addFollowUp);

// 注意：需求规定“无删除权限”，故不提供 DELETE 接口
// 编辑字段（如推荐岗位）可通过单独 PATCH 接口实现（此处省略）

export default router;