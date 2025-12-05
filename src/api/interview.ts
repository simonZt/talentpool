// src/api/interview.ts
import type { Interview } from '@/types'
import request from './index'

// 发起面试邀约
export function createInterview(data: {
  resumeId: string
  positionId: string
  interviewTime: string
  locationType: 'offline' | 'online'
  offlineAddress?: string
  onlineLink?: string
  meetingCode?: string
  interviewers: string[] // user.id 列表
  type: '初面' | '复面' | '终面'
}): Promise<void> {
  return request.post('/interviews', data)
}

// 获取面试列表
export function getInterviewList(): Promise<Interview[]> {
  return request.get('/interviews')
}

// 更新面试状态
export function updateInterviewStatus(id: string, status: 'pending' | 'completed' | 'passed' | 'failed' | 'cancelled'): Promise<void> {
  return request.patch(`/interviews/${id}/status`, { status })
}

// 提交面试评价（仅面试官可提交）
export function submitInterviewFeedback(id: string, feedback: {
  professional: number
  communication: number
  match: number
  learning: number
  comment: string
}): Promise<void> {
  return request.post(`/interviews/${id}/feedback`, feedback)
}

// 获取面试详情（含评价）
export function getInterviewDetail(id: string): Promise<Interview> {
  return request.get(`/interviews/${id}`)
}