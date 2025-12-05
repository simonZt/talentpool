// src/stores/dashboard.ts
import {
    getHrResumeStats,
    getInterviewStats,
    getPositionStats,
    getResumeStats
} from '@/api/dashboard';
import { defineStore } from 'pinia';

type TimeRange = 'day' | 'week' | 'month' | 'quarter' | 'year'

export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    timeRange: 'month' as TimeRange,
    resumeData: { dates: [] as string[], values: [] as number[] },
    positionData: {
      dates: [] as string[],
      recruiting: [] as number[],
      archived: [] as number[]
    },
    interviewData: {
      dates: [] as string[],
      statuses: {
        '待面试': [] as number[],
        '已面试': [] as number[],
        '通过': [] as number[],
        '未通过': [] as number[],
        '取消面试': [] as number[]
      }
    },
    hrResumeData: [] as Array<{ hrName: string; resumeCount: number }>,
    loading: false
  }),

  actions: {
    async setTimeRange(range: TimeRange) {
      this.timeRange = range
      await this.loadData()
    },

    async loadData() {
      this.loading = true
      try {
        const [resume, position, interview, hr] = await Promise.all([
          getResumeStats(this.timeRange),
          getPositionStats(this.timeRange),
          getInterviewStats(this.timeRange),
          getHrResumeStats(this.timeRange)
        ])
        this.resumeData = resume
        this.positionData = position
        this.interviewData = interview
        this.hrResumeData = hr
      } finally {
        this.loading = false
      }
    }
  }
})