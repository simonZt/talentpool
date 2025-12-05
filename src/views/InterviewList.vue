<!-- src/views/InterviewList.vue -->
<template>
  <div class="interview-list">
    <div class="header">
      <h2>面试管理</h2>
      <el-button type="primary" @click="openCreateDialog">发起面试邀约</el-button>
    </div>

    <el-table :data="interviews" border style="width: 100%" v-loading="loading" row-key="id">
      <el-table-column prop="candidateName" label="候选人" width="120" />
      <el-table-column prop="positionTitle" label="关联岗位" min-width="150" />
      <el-table-column prop="interviewTime" label="面试时间" width="180">
        <template #default="{ row }">
          {{ formatDate(row.interviewTime) }}
        </template>
      </el-table-column>
      <el-table-column label="面试官" width="150">
        <template #default="{ row }">
          {{ row.interviewers.join('、') }}
        </template>
      </el-table-column>
      <el-table-column prop="type" label="面试类型" width="100" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusTypeMap[row.status]">
            {{ statusTextMap[row.status] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-select v-model="row.status" @change="(val) => updateStatus(row.id, val)" size="small" style="width: 100px;">
            <el-option value="pending" label="待面试" />
            <el-option value="completed" label="已面试" />
            <el-option value="passed" label="通过" />
            <el-option value="failed" label="未通过" />
            <el-option value="cancelled" label="取消" />
          </el-select>
          <el-button
            size="small"
            @click="openFeedbackDialog(row)"
            v-if="row.status === 'completed' && isInterviewer(row)"
            style="margin-left: 8px;"
          >
            填写评价
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 发起邀约弹窗 -->
    <el-dialog v-model="createDialogVisible" title="发起面试邀约" width="600px">
      <el-form :model="createForm" label-width="100px">
        <el-form-item label="候选人">
          <el-select v-model="createForm.resumeId" filterable placeholder="请选择候选人">
            <el-option
              v-for="r in resumes"
              :key="r.id"
              :label="`${r.name} - ${r.positionTitle}`"
              :value="r.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="关联岗位">
          <el-select v-model="createForm.positionId" filterable placeholder="请选择岗位" :disabled="!createForm.resumeId">
            <el-option
              v-for="pos in recruitingPositions"
              :key="pos.id"
              :label="`${pos.title} - ${pos.workCity}`"
              :value="pos.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="面试时间">
          <el-date-picker
            v-model="createForm.interviewTime"
            type="datetime"
            placeholder="选择日期时间"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DDTHH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="面试类型">
          <el-select v-model="createForm.type" style="width: 100%;">
            <el-option label="初面" value="初面" />
            <el-option label="复面" value="复面" />
            <el-option label="终面" value="终面" />
          </el-select>
        </el-form-item>
        <el-form-item label="面试官">
          <el-select v-model="createForm.interviewers" multiple placeholder="请选择面试官">
            <el-option
              v-for="user in allUsers"
              :key="user.id"
              :label="user.realName"
              :value="user.realName"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitCreate" :loading="creating">确定</el-button>
      </template>
    </el-dialog>

    <!-- 面试评价弹窗 -->
    <el-dialog v-model="feedbackDialogVisible" :title="`评价：${currentInterview?.candidateName}`" width="600px">
      <InterviewFeedbackForm
        :interview-id="currentInterview?.id || ''"
        @success="() => { feedbackDialogVisible = false; loadInterviews(); }"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import {
  getInterviewList,
  createInterview,
  updateInterviewStatus
} from '@/api/interview'
import { getResumeList } from '@/api/resume'
import { getPositionList } from '@/api/user'
import type { Interview, Resume, Position, User } from '@/types/interview'
import InterviewFeedbackForm from '@/components/InterviewFeedbackForm.vue'
import { formatDate } from '@/utils/helpers'

const authStore = useAuthStore()
const interviews = ref<Interview[]>([])
const loading = ref(false)
const createDialogVisible = ref(false)
const feedbackDialogVisible = ref(false)
const currentInterview = ref<Interview | null>(null)

// 用于创建表单
const resumes = ref<Resume[]>([])
const recruitingPositions = ref<Position[]>([])
const allUsers = ref<User[]>([])
const createForm = ref({
  resumeId: '',
  positionId: '',
  interviewTime: '',
  type: '初面' as '初面' | '复面' | '终面',
  interviewers: [] as string[]
})
const creating = ref(false)

// 状态映射
const statusTextMap = {
  pending: '待面试',
  completed: '已面试',
  passed: '通过',
  failed: '未通过',
  cancelled: '取消'
}
const statusTypeMap = {
  pending: 'info',
  completed: 'primary',
  passed: 'success',
  failed: 'danger',
  cancelled: 'warning'
}

const loadInterviews = async () => {
  loading.value = true
  try {
    interviews.value = await getInterviewList()
  } catch (err) {
    ElMessage.error('加载面试列表失败')
  } finally {
    loading.value = false
  }
}

const loadDependencies = async () => {
  resumes.value = await getResumeList()
  const positions = await getPositionList()
  recruitingPositions.value = positions.filter(p => p.status === 'recruiting')
  // 模拟用户列表（实际应调用 getUserList）
  allUsers.value = [
    { id: '1', loginName: 'zhangsan', username: '张三', realName: '张三', role: 'hr', createdAt: '' },
    { id: '2', loginName: 'lisi', username: '李四', realName: '李四', role: 'manager', createdAt: '' }
  ]
}

onMounted(() => {
  loadInterviews()
  loadDependencies()
})

const openCreateDialog = () => {
  createForm.value = {
    resumeId: '',
    positionId: '',
    interviewTime: '',
    type: '初面',
    interviewers: []
  }
  createDialogVisible.value = true
}

const submitCreate = async () => {
  if (!createForm.value.resumeId || !createForm.value.interviewTime) {
    ElMessage.warning('请填写完整信息')
    return
  }
  creating.value = true
  try {
    const payload = {
      ...createForm.value,
      candidateName: resumes.value.find(r => r.id === createForm.value.resumeId)?.name || '',
      positionTitle: recruitingPositions.value.find(p => p.id === createForm.value.positionId)?.title || ''
    }
    await createInterview(payload)
    ElMessage.success('面试邀约创建成功')
    createDialogVisible.value = false
    loadInterviews()
  } catch (err) {
    ElMessage.error('创建失败')
  } finally {
    creating.value = false
  }
}

const updateStatus = async (id: string, status: Interview['status']) => {
  try {
    await updateInterviewStatus(id, status)
    ElMessage.success('状态更新成功')
    loadInterviews()
  } catch (err) {
    ElMessage.error('更新失败')
  }
}

const isInterviewer = (interview: Interview): boolean => {
  return interview.interviewers.includes(authStore.realName)
}

const openFeedbackDialog = (row: Interview) => {
  currentInterview.value = row
  feedbackDialogVisible.value = true
}
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
</style>