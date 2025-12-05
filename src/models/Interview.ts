// src/models/Interview.ts
import { Document, Schema, model } from 'mongoose';

export type InterviewStatus = 'pending' | 'completed' | 'passed' | 'failed' | 'cancelled';
export type InterviewType = 'initial' | 'second' | 'final';

export interface IEvaluation {
  interviewer: Schema.Types.ObjectId; // 面试官（用户 ID）
  professional: number;               // 专业能力 (1-5)
  communication: number;              // 沟通能力 (1-5)
  fit: number;                        // 岗位匹配度 (1-5)
  learning: number;                   // 学习能力 (1-5)
  comment: string;                    // 文字评价
  timestamp: Date;
}

export interface IInterview extends Document {
  candidateId: Schema.Types.ObjectId;   // 候选人（简历 ID）
  positionId: Schema.Types.ObjectId;    // 关联岗位
  interviewers: Schema.Types.ObjectId[]; // 面试官列表（用户 ID 数组）

  scheduledTime: Date;                  // 面试时间（含时段）
  locationType: 'offline' | 'online';   // 线下 / 线上
  offlineAddress?: string;              // 线下地址
  onlineLink?: string;                  // 线上会议链接
  meetingCode?: string;                 // 会议码

  type: InterviewType;                  // 初面/复面/终面
  status: InterviewStatus;              // 面试状态

  evaluations: IEvaluation[];           // 面试评价列表
}

const interviewSchema = new Schema<IInterview>({
  candidateId: { type: Schema.Types.ObjectId, ref: 'Resume', required: true },
  positionId: { type: Schema.Types.ObjectId, ref: 'Position', required: true },
  interviewers: [{ type: Schema.Types.ObjectId, ref: 'User' }],

  scheduledTime: { type: Date, required: true },
  locationType: { type: String, enum: ['offline', 'online'], required: true },
  offlineAddress: String,
  onlineLink: String,
  meetingCode: String,

  type: { 
    type: String, 
    enum: ['initial', 'second', 'final'], 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'passed', 'failed', 'cancelled'],
    default: 'pending'
  },

  evaluations: [{
    interviewer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    professional: { type: Number, min: 1, max: 5, required: true },
    communication: { type: Number, min: 1, max: 5, required: true },
    fit: { type: Number, min: 1, max: 5, required: true },
    learning: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

export const Interview = model<IInterview>('Interview', interviewSchema);