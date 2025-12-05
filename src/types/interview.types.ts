// src/types/interview.types.ts

export type InterviewStatus = 'pending' | 'completed' | 'passed' | 'failed' | 'cancelled';
export type InterviewType = 'initial' | 'second' | 'final';

/**
 * 面试评价
 */
export interface Evaluation {
  interviewerId: string;
  interviewerName: string;
  professional: number;     // 1-5
  communication: number;
  fit: number;
  learning: number;
  comment: string;
  timestamp: Date;
}

/**
 * 创建面试请求体
 */
export interface CreateInterviewRequest {
  candidateId: string;              // 简历 ID
  positionId: string;               // 岗位 ID
  interviewers: string[];           // 面试官用户 ID 列表
  scheduledTime: string;            // ISO 8601 时间串
  locationType: 'offline' | 'online';
  offlineAddress?: string;
  onlineLink?: string;
  meetingCode?: string;
  type: InterviewType;
}

/**
 * 提交评价请求体
 */
export interface SubmitEvaluationRequest {
  professional: number;
  communication: number;
  fit: number;
  learning: number;
  comment: string;
}