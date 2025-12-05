// src/models/Resume.ts
import { Document, Schema, model } from 'mongoose';

export interface IResume extends Document {
  // 基础信息（解析 + 手动补充）
  candidateName: string;          // 姓名
  phone: string;                  // 联系电话
  workYears?: string;             // 工作年限
  educationLevel?: string;        // 学历
  resumeSource: string;           // 简历来源（BOSS/智联/内部推荐）

  // 学历信息
  school?: string;                // 毕业院校
  major?: string;                 // 专业
  graduationTime?: Date;          // 毕业时间

  // 关联信息
  recommendedPositionId: Schema.Types.ObjectId; // 推荐岗位（仅招募中）
  uploadedBy: Schema.Types.ObjectId;            // 归属 HR（用户 ID）

  // 文件存储
  fileUrl: string;                // 简历文件在线预览链接

  // 回访记录（数组）
  followUps: {
    operator: Schema.Types.ObjectId; // 操作人（用户 ID）
    content: string;                // 回访内容
    timestamp: Date;                // 回访时间
  }[];
}

const resumeSchema = new Schema<IResume>({
  candidateName: { type: String, required: true },
  phone: { type: String, required: true }, // 用于查重
  workYears: String,
  educationLevel: String,
  resumeSource: { 
    type: String, 
    required: true,
    enum: ['BOSS直聘', '智联招聘', '内部推荐', '其他']
  },

  school: String,
  major: String,
  graduationTime: Date,

  recommendedPositionId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Position', 
    required: true 
  },
  uploadedBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },

  fileUrl: { type: String, required: true },

  followUps: [{
    operator: { type: Schema.Types.ObjectId, ref: 'User' },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// 查重索引：姓名 + 电话 唯一
resumeSchema.index({ candidateName: 1, phone: 1 }, { unique: true });

export const Resume = model<IResume>('Resume', resumeSchema);