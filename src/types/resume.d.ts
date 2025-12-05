// src/types/resume.d.ts
export type ResumeSource = 'BOSS直聘' | '智联招聘' | '前程无忧' | '内部推荐' | '其他'

export interface ParsedResumeData {
  name: string
  phone: string
  email?: string
  education: string      // 学历信息（文本）
  university?: string    // 毕业院校
  major?: string         // 专业
  workExperience?: string // 工作经历（文本）
  yearsOfExperience?: number // 工作年限（解析得出）
}

export interface Resume extends ParsedResumeData {
  id: string
  source: ResumeSource
  recommendedPositionId: string // 关联岗位ID（仅招募中）
  hrOwner: string               // 归属HR（realName）
  fileUrl: string               // PDF/Word 预览链接
  uploadedAt: string
  // 编辑留痕用
  editHistory: EditRecord[]
  followUpRecords: FollowUpRecord[]
}

export interface EditRecord {
  operator: string    // 操作人 realName
  timestamp: string
  field: string       // 如 "phone", "recommendedPositionId"
  oldValue: string
  newValue: string
}

export interface FollowUpRecord {
  operator: string
  timestamp: string
  content: string
}