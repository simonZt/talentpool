// src/api/resume.ts
import type { Resume } from '@/types';
import request from './index';

// 上传简历（支持 PDF/Word）
export function uploadResume(formData: FormData): Promise<{ id: string; parsed: Partial<Resume> }> {
  return request.post('/resumes/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

// 获取简历列表（所有用户可查看全部）
export function getResumeList(): Promise<Resume[]> {
  return request.get('/resumes')
}

// 获取简历详情（含编辑历史、回访记录）
export interface ResumeDetail extends Resume {
  editHistory: Array<{
    operator: string
    time: string
    field: string
    oldValue: string
    newValue: string
  }>
  followUps: Array<{
    operator: string
    time: string
    content: string
  }>
}

export function getResumeDetail(id: string): Promise<ResumeDetail> {
  return request.get(`/resumes/${id}`)
}

// 编辑简历（仅限指定字段）
export function updateResume(id: string, data: Partial<{
  education: string
  workYears: string
  source: string
  phone: string
  recommendedPositionId: string
}>): Promise<void> {
  return request.put(`/resumes/${id}`, data)
}

// 添加回访记录
export function addFollowUp(id: string, content: string): Promise<void> {
  return request.post(`/resumes/${id}/follow-up`, { content })
}

// 查重检查（前端也可做，但后端必须校验）
export function checkDuplicateResume(name: string, phone: string): Promise<{ exists: boolean; id?: string }> {
  return request.get('/resumes/check-duplicate', { params: { name, phone } })
}