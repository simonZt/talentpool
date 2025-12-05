// src/api/position.ts
import type { Position } from '@/types'
import request from './index'

// 获取岗位列表（所有用户可查看）
export function getPositionList(): Promise<Position[]> {
  return request.get('/positions')
}

// 新增岗位（仅 super_admin / 赋权 manager）
export function createPosition(data: Omit<Position, 'id' | 'status' | 'createdAt' | 'budget'> & { budget?: number }): Promise<void> {
  return request.post('/positions', data)
}

// 修改岗位（不可改名称、城市、地点、状态、预算）
export function updatePosition(id: string, data: Partial<{
  description: string
  ageRequirement: string
  duration: string
  headcount: number
  education: string
  salaryRange: string
  experience: string
  skills: string
}>): Promise<void> {
  return request.put(`/positions/${id}`, data)
}

// 下架岗位（招募中 → 已下架）
export function archivePosition(id: string): Promise<void> {
  return request.post(`/positions/${id}/archive`)
}

// 获取岗位详情（普通用户不返回 budget）
export function getPositionDetail(id: string): Promise<Position> {
  return request.get(`/positions/${id}`)
}