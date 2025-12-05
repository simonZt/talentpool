// src/api/dashboard.ts
import request from './index';

type TimeRange = 'day' | 'week' | 'month' | 'quarter' | 'year'

// 简历量统计
export function getResumeStats(range: TimeRange) {
  return request.get<{ dates: string[]; values: number[] }>(`/dashboard/resumes/${range}`)
}

// 岗位统计（区分招募中/已下架）
export function getPositionStats(range: TimeRange) {
  return request.get<{
    dates: string[]
    recruiting: number[]
    archived: number[]
  }>(`/dashboard/positions/${range}`)
}

// 面试数据（按状态）
export function getInterviewStats(range: TimeRange) {
  return request.get<{
    dates: string[]
    statuses: {
      '待面试': number[]
      '已面试': number[]
      '通过': number[]
      '未通过': number[]
      '取消面试': number[]
    }
  }>(`/dashboard/interviews/${range}`)
}

// HR 个人简历上传量
export function getHrResumeStats(range: TimeRange) {
  return request.get<Array<{ hrName: string; resumeCount: number }>>(`/dashboard/hr-resumes/${range}`)
}