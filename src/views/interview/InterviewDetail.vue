<!-- src/views/interview/InterviewDetail.vue -->
<template>
  <div class="interview-detail-container">
    <el-button icon="ArrowLeft" @click="$router.back()" style="margin-bottom: 20px;">
      返回列表
    </el-button>

    <el-card>
      <template #header>
        <div class="header">
          <span class="title">{{ interview.candidateName }} - {{ interview.positionName }}</span>
          <el-tag :type="getStatusType(interview.status)">
            {{ getStatusText(interview.status) }}
          </el-tag>
        </div>
      </template>

      <!-- 面试基本信息 -->
      <el-descriptions :column="2" border>
        <el-descriptions-item label="候选人">{{ interview.candidateName }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ interview.phone }}</el-descriptions-item>
        <el-descriptions-item label="关联岗位">{{ interview.positionName }}</el-descriptions-item>
        <el-descriptions-item label="工作城市">{{ interview.workCity }}</el-descriptions-item>
        <el-descriptions-item label="面试时间">{{ formatDate(interview.interviewTime) }}</el-descriptions-item>
        <el-descriptions-item label="面试类型">{{ interview.typeLabel }}</el-descriptions-item>
        <el-descriptions-item label="面试地点">
          <div v-if="interview.meetingType === 'offline'">{{ interview.address }}</div>
          <div v-else>
            <a :href="interview.meetingLink" target="_blank">{{ interview.meetingLink }}</a>
            （会议码：{{ interview.meetingCode }}）
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="面试官">
          {{ interview.interviewers.map(i => i.name).join('、') }}
        </el-descriptions-item>
      </el-descriptions>

      <!-- 流程图（简化版） -->
      <div class="process" style="margin-top: 20px;">
        <el-steps :active="getStepActive()" finish-status="success" simple>
          <el-step title="候选人关联" />
          <el-step title="岗位关联" />
          <el-step title="待面试" />
          <el-step :title="getStatusText(interview.status)" />
        </el-steps>
      </div>

      <!-- 面试评价（仅面试官可见） -->
      <div v-if="isInterviewer" class="evaluation-section" style="margin-top: 24px;">
        <h3>我的面试评价</h3>
        <el-form :model="evaluationForm" label-width="100px">
          <el-form-item label="专业能力">
            <el-rate v-model="evaluationForm.professional" :max="5" />
          </el-form-item>
          <el-form-item label="沟通能力">
            <el-rate v-model="evaluationForm.communication" :max="5" />
          </el-form-item>
          <el-form-item label="岗位匹配度">
            <el-rate v-model="evaluationForm.match" :max="5" />
          </el-form-item>
          <el-form-item label="学习能力">
            <el-rate v-model="evaluationForm.learning" :max="5" />
          </el-form-item>
          <el-form-item label="文字评价">
            <el-input
              v-model="evaluationForm.comment"
              type="textarea"
              :rows="3"
              placeholder="请填写综合评价..."
            />
          </el-form-item>
          <el-button type="primary" @click="submitEvaluation">提交评价</el-button>
        </el-form>
      </div>

      <!-- 所有评价（归属HR可见） -->
      <div v-if="interview.evaluations?.length" class="all-evaluations" style="margin-top: 24px;">
        <h3>所有面试官评价</h3>
        <el-timeline>
          <el-timeline-item
            v-for="eval in interview.evaluations"
            :key="eval.id"
            :timestamp="formatDate(eval.createdAt)"
            placement="top"
          >
            <el-card>
              <div><strong>{{ eval.interviewerName }}</strong> 的评价：</div>
              <div>专业能力：{{ eval.professional }} 分</div>
              <div>沟通能力：{{ eval.communication }} 分</div>
              <div>岗位匹配度：{{ eval.match }} 分</div>
              <div>学习能力：{{ eval.learning }} 分</div>
              <div style="margin-top: 8px;">{{ eval.comment }}</div>
            </el-card>
          </el-timeline-item>
        </el-timeline>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useInterviewStore } from '@/stores/interview'
import type { InterviewEvaluation } from '@/types'

const route = useRoute()
const authStore = useAuthStore()
const interviewStore = useInterviewStore()

const interview = ref<any>({})
const evaluationForm = ref({
  professional: 0,
  communication: 0,
  match: 0,
  learning: 0,
  comment: ''
})

// ========== 计算属性 ==========
const isInterviewer = computed(() => {
  const userId = authStore.user?.id
  return interview.value.interviewers.some((i: any) => i.id === userId)
})

// ========== 方法 ==========
const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    pending: '待面试',
    completed: '已面试',
    passed: '通过',
    failed: '未通过',
    cancelled: '取消面试'
  }
  return map[status] || status
}

const getStatusType = (status: string) => {
  if (status === 'passed') return 'success'
  if (status === 'failed' || status === 'cancelled') return 'danger'
  return 'info'
}

const getStepActive = () => {
  const steps: Record<string, number> = {
    pending: 2,
    completed: 3,
    passed: 3,
    failed: 3,
    cancelled: 3
  }
  return steps[interview.value.status] || 0
}

const formatDate = (time: string) => {
  return new Date(time).toLocaleString('zh-CN')
}

const submitEvaluation = async () => {
  const payload: InterviewEvaluation = {
    ...evaluationForm.value,
    interviewId: interview.value.id
  }
  await interviewStore.submitEvaluation(payload)
  ElMessage.success('评价提交成功')
  // 刷新详情
  loadDetail()
}

const loadDetail = async () => {
  const id = route.params.id as string
  await interviewStore.fetchDetail(id)
  interview.value = interviewStore.detail
}

// ========== 初始化 ==========
onMounted(() => {
  loadDetail()
})
</script>

<style scoped>
.interview-detail-container {
  padding: 20px;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.title {
  font-weight: bold;
}
.process {
  text-align: center;
}
</style>