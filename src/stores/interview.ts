// src/stores/interview.ts
import {
    createInterview,
    getInterviewDetail,
    getInterviewList,
    submitInterviewFeedback,
    updateInterviewStatus
} from '@/api/interview'
import type { Interview } from '@/types'
import { defineStore } from 'pinia'

export const useInterviewStore = defineStore('interview', {
  state: () => ({
    list: [] as Interview[],
    detail: null as Interview | null,
    loading: false
  }),

  actions: {
    async fetchInterviews() {
      this.loading = true
      try {
        this.list = await getInterviewList()
      } finally {
        this.loading = false
      }
    },

    async fetchDetail(id: string) {
      this.detail = await getInterviewDetail(id)
    },

    async create(data: Parameters<typeof createInterview>[0]) {
      await createInterview(data)
      await this.fetchInterviews()
    },

    async updateStatus(id: string, status: Interview['status']) {
      await updateInterviewStatus(id, status)
      await this.fetchInterviews()
    },

    async submitFeedback(interviewId: string, feedback: Parameters<typeof submitInterviewFeedback>[1]) {
      await submitInterviewFeedback(interviewId, feedback)
      await this.fetchDetail(interviewId)
    }
  }
})