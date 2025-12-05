// src/models/Position.ts
import { Document, Schema, model } from 'mongoose';

export type PositionStatus = 'recruiting' | 'archived';

export interface IPosition extends Document {
  name: string;                   // 岗位名称
  description: string;            // 岗位说明
  ageRequirement?: string;        // 年龄要求
  workCity: string;               // 工作城市（如 "浙江省 - 杭州市"）
  address: string;                // 具体地点（如 "西湖区XX大厦15层"）
  duration: string;               // 工期时间（手动输入，如 "2个月"、"1年"）
  headcount: number;              // 招聘人数

  // 任职要求
  education: string;              // 学历要求（大专/本科/硕士）
  salaryRange: string;            // 薪资范围（如 "15k-20k/月"）
  workExperience: string;         // 工作年限（1年以内/1-3年等）
  skills?: string;                // 其他技能要求

  // 权限敏感字段
  projectBudget?: number;         // 项目预算（仅 super/manager 可见）

  status: PositionStatus;         // 状态：招募中 / 已下架
}

const positionSchema = new Schema<IPosition>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  ageRequirement: String,
  workCity: { type: String, required: true },     // 二级城市选择
  address: { type: String, required: true },       // 手动输入详细地址
  duration: { type: String, required: true },      // 手动输入工期
  headcount: { type: Number, required: true, min: 1 },

  education: { type: String, required: true },
  salaryRange: { type: String, required: true },
  workExperience: { type: String, required: true },
  skills: String,

  projectBudget: Number, // 可为空，普通用户不可见

  status: { 
    type: String, 
    enum: ['recruiting', 'archived'], 
    default: 'recruiting' 
  }
}, { timestamps: true });

export const Position = model<IPosition>('Position', positionSchema);