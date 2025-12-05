// src/types/resume.types.ts

export type ResumeSource = 'BOSS直聘' | '智联招聘' | '内部推荐' | '其他';

/**
 * 简历上传请求体（配合 multipart/form-data）
 */
export interface UploadResumeRequest {
  candidateName: string;
  phone: string;
  workYears?: string;
  educationLevel?: string;
  resumeSource: ResumeSource;
  recommendedPositionId: string; // 岗位 ID
  // file: File; // 由 multer 处理，不在 JSON body 中
}

/**
 * 回访记录
 */
export interface FollowUpRecord {
  operatorId: string;
  operatorName: string; // 前端显示用
  content: string;
  timestamp: Date;
}

/**
 * 简历详情响应
 */
export interface ResumeDetail {
  id: string;
  candidateName: string;
  phone: string;
  workYears?: string;
  educationLevel?: string;
  resumeSource: ResumeSource;
  school?: string;
  major?: string;
  graduationTime?: Date;
  recommendedPosition: {
    id: string;
    name: string;
  };
  uploadedBy: {
    id: string;
    name: string; // 归属 HR 姓名
  };
  fileUrl: string;
  followUps: FollowUpRecord[];
}