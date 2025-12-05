// src/types/position.d.ts
export type PositionStatus = 'recruiting' | 'archived' // 招募中 / 已下架

export interface Position {
  id: string
  title: string
  description: string
  ageRequirement: string // 如 "25-35岁"
  workCity: string       // 如 "浙江省 - 杭州市"
  specificLocation: string // 如 "西湖区XX大厦15层"
  duration: string       // ⭐工期手动输入：如 "3个月", "1年", "6个月"
  headcount: number      // 招聘人数
  education: '大专' | '本科' | '硕士' | '博士' | '不限'
  salaryRange: string    // 如 "15k-20k/月"
  experience: '1年以内' | '1-3年' | '3-5年' | '5年以上' | '不限'
  skills: string         // 其他技能要求
  status: PositionStatus
  budget?: number        // 项目预算（仅 super_admin/赋权 manager 可见）
  createdBy: string      // 创建人（realName）
  createdAt: string
}