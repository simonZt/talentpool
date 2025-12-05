// src/types/interview.d.ts
export type InterviewStatus = 'pending' | 'completed' | 'passed' | 'failed' | 'cancelled'
export type InterviewType = '初面' | '复面' | '终面'

export interface Interview {
  id: string
  resumeId: string
  candidateName: string
  positionId: string
  positionTitle: string
  interviewTime: string // ISO 8601: "2025-12-10T14:00:00"
  endTime: string       // 自动计算 = interviewTime + duration
  locationType: 'offline' | 'online'
  offlineAddress?: string
  onlineLink?: string
  onlineCode?: string
  interviewers: string[] // 面试官 realName 列表
  type: InterviewType
  status: InterviewStatus
  feedbacks: InterviewFeedback[]
  createdAt: string
  updatedAt: string
}

export interface InterviewFeedback {
  interviewer: string
  timestamp: string
  professionalSkill: number // 1-5
  communication: number     // 1-5
  jobFit: number            // 1-5
  learningAbility: number   // 1-5
  comment: string
}