// src/stores/position.ts
import {
    archivePosition,
    createPosition,
    getPositionDetail,
    getPositionList,
    updatePosition
} from '@/api/position'
import type { Position } from '@/types'
import { defineStore } from 'pinia'

export const usePositionStore = defineStore('position', {
  state: () => ({
    list: [] as Position[],
    detail: null as Position | null,
    loading: false
  }),

  actions: {
    async fetchPositions() {
      this.loading = true
      try {
        this.list = await getPositionList()
      } finally {
        this.loading = false
      }
    },

    async addPosition(data: Omit<Position, 'id' | 'status' | 'createdAt' | 'budget'> & { budget?: number }) {
      await createPosition(data)
      await this.fetchPositions()
    },

    async editPosition(id: string, data: Partial<Position>) {
      await updatePosition(id, data)
      await this.fetchPositions()
    },

    async archive(id: string) {
      await archivePosition(id)
      await this.fetchPositions()
    },

    async fetchDetail(id: string) {
      this.detail = await getPositionDetail(id)
    }
  }
})