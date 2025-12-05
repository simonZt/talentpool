// src/types/position.types.ts

export type PositionStatus = 'recruiting' | 'archived';
export type EducationLevel = '大专' | '本科' | '硕士' | '博士' | '其他';
export type WorkExperience = 
  | '1年以内'
  | '1-3年'
  | '3-5年'
  | '5-10年'
  | '10年以上';

/**
 * 岗位创建请求体
 */
export interface CreatePositionRequest {
  name: string;                   // 岗位名称
  description: string;            // 岗位说明
  ageRequirement?: string;        // 年龄要求
  workCity: string;               // 工作城市（如 "浙江省 - 杭州市"）
  address: string;                // 具体地点
  duration: string;               // 工期（如 "2个月", "1年"）
  headcount: number;              // 招聘人数

  education: EducationLevel;      // 学历要求
  salaryRange: string;            // 薪资范围（如 "15k-20k/月"）
  workExperience: WorkExperience; // 工作年限
  skills?: string;                // 其他技能

  projectBudget?: number;         // 项目预算（仅 super/manager 可传）
}

/**
 * 岗位列表响应项（对普通用户隐藏 budget）
 */
export interface PositionListItem {
  id: string;
  name: string;
  workCity: string;
  address: string;
  duration: string;
  status: PositionStatus;
  // 注意：projectBudget 不在此接口中（由控制器过滤）
}