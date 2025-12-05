// src/controllers/position.controller.ts
import { Request, Response } from 'express';
import { Position, PositionStatus } from '../models/Position';
import { isValidDuration } from '../utils/duration.utils';

/**
 * 获取岗位列表（自动过滤 projectBudget）
 */
export const getPositionList = async (req: Request, res: Response) => {
  const positions = await Position.find().lean();
  const user = (req as any).user;

  const sanitized = positions.map(pos => {
    if (user.role === 'user') {
      const { projectBudget, ...rest } = pos;
      return rest;
    }
    return pos;
  });

  res.json({ code: 200, data: sanitized });
};

/**
 * 新增岗位
 */
export const createPosition = async (req: Request, res: Response) => {
  const {
    name, description, ageRequirement, workCity, address,
    duration, headcount, education, salaryRange, workExperience, skills, projectBudget
  } = req.body;

  // 校验工期格式
  if (!isValidDuration(duration)) {
    return res.status(400).json({ code: 400, message: '工期格式不正确，请输入如“2个月”或“1年”' });
  }

  const position = new Position({
    name, description, ageRequirement, workCity, address,
    duration, headcount, education, salaryRange, workExperience, skills,
    status: 'recruiting' as PositionStatus
  });

  // 仅 super/manager 可设置预算（中间件已校验角色）
  if (projectBudget !== undefined) {
    position.projectBudget = projectBudget;
  }

  await position.save();
  res.json({ code: 201, message: '岗位创建成功' });
};

/**
 * 下架岗位（不可逆）
 */
export const archivePosition = async (req: Request, res: Response) => {
  const { id } = req.params;
  const position = await Position.findById(id);
  if (!position) {
    return res.status(404).json({ code: 404, message: '岗位不存在' });
  }

  if (position.status === 'archived') {
    return res.status(400).json({ code: 400, message: '岗位已下架' });
  }

  await Position.findByIdAndUpdate(id, { status: 'archived' });
  res.json({ code: 200, message: '岗位已下架' });
};