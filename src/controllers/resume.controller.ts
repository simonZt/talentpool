// src/controllers/resume.controller.ts
import { Request, Response } from 'express';
import { Position } from '../models/Position';
import { Resume } from '../models/Resume';

/**
 * 上传简历（含查重）
 */
export const uploadResume = async (req: Request, res: Response) => {
  // 假设文件已通过 multer 解析到 req.file
  const { candidateName, phone, recommendedPositionId } = req.body;
  const uploadedBy = (req as any).user.id;

  // 检查岗位是否存在且为“招募中”
  const position = await Position.findById(recommendedPositionId);
  if (!position || position.status !== 'recruiting') {
    return res.status(400).json({ code: 400, message: '请选择有效的招募中岗位' });
  }

  // 查重：姓名 + 电话
  const existing = await Resume.findOne({ candidateName, phone });
  if (existing) {
    return res.status(409).json({
      code: 409,
      message: '该候选人简历已存在',
      data: { resumeId: existing.id }
    });
  }

  // 生成文件 URL（假设已上传到 OSS）
  const fileUrl = `/resumes/${req.file?.filename}`;

  const resume = new Resume({
    candidateName,
    phone,
    recommendedPositionId,
    uploadedBy,
    fileUrl,
    resumeSource: req.body.resumeSource || '其他'
  });

  await resume.save();
  res.json({ code: 201, message: '简历上传成功', data: { id: resume.id } });
};

/**
 * 添加回访记录
 */
export const addFollowUp = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { content } = req.body;
  const operator = (req as any).user.id;

  await Resume.findByIdAndUpdate(id, {
    $push: {
      followUps: { operator, content, timestamp: new Date() }
    }
  });

  res.json({ code: 200, message: '回访记录添加成功' });
};