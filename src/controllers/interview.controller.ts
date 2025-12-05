// src/controllers/interview.controller.ts
import { Request, Response } from 'express';
import { Interview, InterviewStatus } from '../models/Interview';
import { Resume } from '../models/Resume';

/**
 * 创建面试邀约
 */
export const createInterview = async (req: Request, res: Response) => {
  const {
    candidateId, positionId, interviewers, scheduledTime,
    locationType, offlineAddress, onlineLink, meetingCode, type
  } = req.body;

  // 验证候选人和岗位存在
  const resume = await Resume.findById(candidateId);
  if (!resume) return res.status(404).json({ code: 404, message: '候选人不存在' });

  // 创建面试
  const interview = new Interview({
    candidateId,
    positionId: resume.recommendedPositionId, // 或使用传入的 positionId
    interviewers,
    scheduledTime,
    locationType,
    ...(locationType === 'offline' && { offlineAddress }),
    ...(locationType === 'online' && { onlineLink, meetingCode }),
    type,
    status: 'pending' as InterviewStatus
  });

  await interview.save();
  res.json({ code: 201, message: '面试邀约创建成功' });
};

/**
 * 提交面试评价
 */
export const submitEvaluation = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { professional, communication, fit, learning, comment } = req.body;
  const interviewer = (req as any).user.id;

  const interview = await Interview.findById(id);
  if (!interview) {
    return res.status(404).json({ code: 404, message: '面试记录不存在' });
  }

  // 检查当前用户是否为面试官
  if (!interview.interviewers.includes(interviewer)) {
    return res.status(403).json({ code: 403, message: '您不是本次面试官，无法提交评价' });
  }

  // 检查是否已评价
  const existingEval = interview.evaluations.find(e => e.interviewer.toString() === interviewer);
  if (existingEval) {
    return res.status(400).json({ code: 400, message: '您已提交过评价' });
  }

  interview.evaluations.push({
    interviewer,
    professional,
    communication,
    fit,
    learning,
    comment
  });

  // 自动标记为“已面试”
  interview.status = 'completed';
  await interview.save();

  res.json({ code: 200, message: '评价提交成功' });
};