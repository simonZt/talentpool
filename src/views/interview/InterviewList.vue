<!-- src/views/interview/InterviewList.vue -->
<template>
  <div class="interview-list-container">
    <div class="toolbar">
      <el-button type="primary" @click="$router.push('/interviews/invite')">
        发起面试邀约
      </el-button>
    </div>

    <!-- 筛选条件 -->
    <el-form :inline="true" style="margin-bottom: 16px;">
      <el-form-item label="状态">
        <el-select v-model="filters.status" clearable placeholder="全部">
          <el-option value="pending" label="待面试" />
          <el-option value="completed" label="已面试" />
          <el-option value="passed" label="通过" />
          <el-option value="failed" label="未通过" />
          <el-option value="cancelled" label="取消面试" />
        </el-select>
      </el-form-item>
      <el-form-item label="面试类型">
        <el-select v-model="filters.type" clearable placeholder="全部">
          <el-option value="initial" label="初面" />
          <el-option value="second" label="复面" />
          <el-option value="final" label="终面" />
        </el-select>
      </el-form-item>
      <el-button @click="loadData">查询</el-button>
    </el-form>

    <!-- 面试表格 -->
    <el-table
      :data="filteredInterviews"
      v-loading="loading"
      row-key="id"
      style="width: 100%"
    >
      <el-table-column prop="candidateName" label="候选人" width="120" />
      <el-table-column prop="positionName" label="关联岗位" width="180" />
      <el-table-column label="面试时间" width="180">
        <template #default="{ row }">
          {{ formatDate(row.interviewTime) }}
        </template>
      </el-table-column>
      <el-table-column prop="typeLabel" label="面试类型" width="100" />
      <el-table-column label="面试官" width="150">
        <template #default="{ row }">
          {{ row.interviewers.map(i => i.name).join('、') }}
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" fixed="right" width="120">
        <template #default="{ row }">
          <el-button
            size="small"
            link
            type="primary"
            @click="viewDetail(row.id)"
          >
            查看
          </el-button>
          <el-button
            v-if="row.status === 'pending'"
            size="small"
            link
            type="primary"
            @click="openStatusDialog(row)"
          >
            更新状态
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 状态更新弹窗 -->
    <el-dialog v-model="showStatusDialog" title="更新面试状态" width="300px">
      <el-radio-group v-model="newStatus">
        <el-radio label="completed">已面试</el-radio>
        <el-radio label="cancelled">取消面试</el-radio>
      </el-radio-group>
      <template #footer>
        <el-button @click="showStatusDialog = false">取消</el-button>
        <el-button type="primary" @click="updateStatus">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { useInterviewStore } from '@/stores/interview'
import { useUserStore } from '@/stores/user'
import type { InterviewStatus, InterviewType } from '@/types'

const route = useRoute()
const router = useRouter()
const interviewStore = useInterviewStore()
const userStore = useUserStore()

const loading = computed(() => interviewStore.loading)
const interviews = computed(() => interviewStore.list)

// 筛选
const filters = ref({
  status: '',
  type: ''
})

const filteredInterviews = computed(() => {
  return interviews.value.filter(item => {
    const matchStatus = !filters.value.status || item.status === filters.value.status
    const matchType = !filters.value.type || item.type === filters.value.type
    return matchStatus && matchType
  })
})

// 状态弹窗
const showStatusDialog = ref(false)
const currentInterviewId = ref('')
const newStatus = ref<InterviewStatus>('completed')

// ========== 方法 ==========
const getStatusText = (status: InterviewStatus) => {
  const map: Record<InterviewStatus, string> = {
    pending: '待面试',
    completed: '已面试',
    passed: '通过',
    failed: '未通过',
    cancelled: '取消面试'
  }
  return map[status]
}

const getStatusType = (status: InterviewStatus) => {
  if (status === 'passed') return 'success'
  if (status === 'failed' || status === 'cancelled') return 'danger'
  return 'info'
}

const formatDate = (time: string) => {
  return new Date(time).toLocaleString('zh-CN')
}

const viewDetail = (id: string) => {
  router.push(`/interviews/${id}`)
}

const openStatusDialog = (interview: any) => {
  currentInterviewId.value = interview.id
  newStatus.value = 'completed'
  showStatusDialog.value = true
}

const updateStatus = async () => {
  await interviewStore.updateStatus(currentInterviewId.value, newStatus.value)
  ElMessage.success('状态更新成功')
  showStatusDialog.value = false
}

const loadData = async () => {
  await interviewStore.fetchInterviews()
}

// ========== 初始化 ==========
onMounted(async () => {
  await userStore.fetchUsers() // 加载面试官列表
  await loadData()
})
</script>

<style scoped>
.interview-list-container {
  padding: 20px;
}
.toolbar {
  margin-bottom: 16px;
}
</style>