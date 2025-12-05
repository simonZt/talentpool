// src/routes/auth.route.ts
import { Router } from 'express';
import * as authController from '../controllers/auth.controller';

const router = Router();

/**
 * POST /api/auth/login
 * 公开接口：登录
 */
router.post('/login', authController.login);

export default router;