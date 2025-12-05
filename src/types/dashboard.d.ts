// src/types/dashboard.d.ts
export interface DashboardMetrics {
  totalPositions: number
  openPositions: number
  totalResumes: number
  resumesThisWeek: number
  interviewsToday: number
  hiringRate: number // 百分比，如 25.5
}

export interface PositionStatsItem {
  title: string
  count: number
}

export interface WeeklyResumeTrend {
  date: string // YYYY-MM-DD
  count: number
}