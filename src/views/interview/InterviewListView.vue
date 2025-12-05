<template>
  <div class="interview-list">
    <el-page-header content="面试管理" />

    <div class="toolbar" v-if="canManageInterview">
      <el-button type="primary" @click="handleCreate">新建面试</el-button>
    </div>

    <el-table :data="filteredInterviews" style="width: 100%">
      <el-table-column prop="candidateName" label="候选人" width="120" />
      <el-table-column prop="positionName" label="岗位" width="150" />
      <el-table-column label="面试官" width="200">
        <template #default="{ row }">
          <el-tag
            v-for="interviewer in row.interviewers"
            :key="interviewer.id"
            size="small"
            style="margin-right: 4px; margin-bottom: 4px"
          >
            {{ interviewer.name }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="statusLabel" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)">
            {{ getStatusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="scheduledTime" label="面试时间" width="160">
        <template #default="{ row }">
          {{ row.scheduledTime ? formatDate(row.scheduledTime) : '—' }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180">
        <template #default="{ row }">
          <el-button
            v-if="row.status === 'pending' && canManageInterview"
            size="small"
            @click="handleSchedule(row)"
          >
            安排时间
          </el-button>
          <el-button
            v-else-if="row.status === 'scheduled' && isInterviewerOf(row)"
            size="small"
            type="success"
            @click="handleComplete(row)"
          >
            填写评价
          </el-button>
          <el-button link type="primary" @click="viewDetail(row)">
            查看
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { getInterviewList } from '@/api/interview'
import type { InterviewItem } from '@/types/interview'
import { formatDate } from '@/utils/helpers'
import { usePermission } from '@/composables/usePermission'

const router = useRouter()
const { canManageInterview, isInterviewerOf } = usePermission()

const interviews = ref<InterviewItem[]>([])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  interviews.value = await getInterviewList()
  loading.value = false
})

// 过滤：普通用户只看自己参与的
const filteredInterviews = computed(() => {
  if (canManageInterview()) return interviews.value
  return interviews.value.filter((item) => isInterviewerOf(item))
})

const getStatusLabel = (status: string): string => {
  const map: Record<string, string> = {
    pending: '待安排',
    scheduled: '已安排',
    completed: '已完成',
  }
  return map[status] || status
}

const getStatusType = (status: string): '' | 'success' | 'warning' | 'info' => {
  if (status === 'completed') return 'success'
  if (status === 'scheduled') return 'warning'
  return 'info'
}

const handleCreate = () => {
  router.push('/interviews/new')
}

const handleSchedule = (row: InterviewItem) => {
  ElMessageBox.prompt('请输入面试时间', '安排面试', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputType: 'datetime-local',
  })
    .then(async ({ value }) => {
      if (!value) return
      const iso = new Date(value).toISOString()
      await scheduleInterview(row.id, iso)
      ElMessage.success('安排成功')
      interviews.value = await getInterviewList()
    })
    .catch(() => {})
}

const handleComplete = (row: InterviewItem) => {
  router.push(`/interviews/${row.id}/complete`)
}

const viewDetail = (row: InterviewItem) => {
  router.push(`/interviews/${row.id}`)
}
</script>

<style scoped>
.toolbar {
  margin-bottom: 16px;
  text-align: right;
}
</style>