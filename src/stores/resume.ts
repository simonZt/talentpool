// src/stores/resume.ts
import {
  addFollowUp,
  checkDuplicateResume,
  getResumeDetail,
  getResumeList,
  updateResume,
  uploadResume
} from '@/api/resume'
import type { Resume, ResumeDetail } from '@/types'
import { defineStore } from 'pinia'

export const useResumeStore = defineStore('resume', {
  state: () => ({
    list: [] as Resume[],
    detail: null as ResumeDetail | null,
    loading: false
  }),

  

  actions: {
    async fetchResumes() {
      this.loading = true
      try {
        this.list = await getResumeList()
      } finally {
        this.loading = false
      }
    },

    actions: {
  async uploadResume(formData: FormData) { /* ... */ },
  async checkDuplicate(payload: { candidateName: string; phone: string }) { /* ... */ }
},

    async fetchDetail(id: string) {
      this.detail = await getResumeDetail(id)
    },

    async upload(file: File, positionId: string) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('positionId', positionId)

      // 查重（可选：前端提示）
      // 实际以上传接口返回为准

      await uploadResume(formData)
      await this.fetchResumes()
    },

    async editResume(id: string, data: Partial<Resume>) {
      await updateResume(id, data)
      await this.fetchDetail(id) // 刷新详情（含留痕）
    },

    async addFollowUpRecord(id: string, content: string) {
      await addFollowUp(id, content)
      await this.fetchDetail(id)
    },

    async checkDuplicate(name: string, phone: string) {
      return await checkDuplicateResume(name, phone)
    }
  }
})