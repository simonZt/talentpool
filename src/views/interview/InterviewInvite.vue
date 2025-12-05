<!-- src/views/interview/InterviewInvite.vue -->
<template>
  <div class="interview-invite-container">
    <el-card>
      <template #header>
        <h2>发起面试邀约</h2>
      </template>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        v-loading="loading"
      >
        <!-- 步骤1：选择候选人 -->
        <el-form-item label="候选人" prop="resumeId">
          <el-select
            v-model="form.resumeId"
            filterable
            placeholder="请选择候选人"
            @change="onCandidateChange"
          >
            <el-option
              v-for="r in resumeStore.list"
              :key="r.id"
              :label="`${r.candidateName} (${r.phone})`"
              :value="r.id"
            />
          </el-select>
        </el-form-item>

        <!-- 自动带出推荐岗位 -->
        <el-form-item label="关联岗位" prop="positionId">
          <el-select
            v-model="form.positionId"
            filterable
            placeholder="请选择岗位（仅招募中）"
            :disabled="!form.resumeId"
          >
            <el-option
              v-for="p in recruitingPositions"
              :key="p.id"
              :label="`${p.name} - ${p.workCity}`"
              :value="p.id"
            />
          </el-select>
        </el-form-item>

        <!-- 面试信息 -->
        <el-form-item label="面试时间" prop="interviewTime">
          <el-date-picker
            v-model="form.interviewTime"
            type="datetime"
            placeholder="选择日期时间"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>

        <el-form-item label="面试类型" prop="type">
          <el-radio-group v-model="form.type">
            <el-radio label="initial">初面</el-radio>
            <el-radio label="second">复面</el-radio>
            <el-radio label="final">终面</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="面试形式" prop="meetingType">
          <el-radio-group v-model="form.meetingType">
            <el-radio label="offline">线下</el-radio>
            <el-radio label="online">线上</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item
          v-if="form.meetingType === 'offline'"
          label="面试地址"
          prop="address"
        >
          <el-input v-model="form.address" placeholder="请输入详细地址" />
        </el-form-item>

        <el-form-item
          v-if="form.meetingType === 'online'"
          label="会议链接"
          prop="meetingLink"
        >
          <el-input v-model="form.meetingLink" placeholder="如：https://meet.example.com/123" />
        </el-form-item>

        <el-form-item
          v-if="form.meetingType === 'online'"
          label="会议码"
          prop="meetingCode"
        >
          <el-input v-model="form.meetingCode" placeholder="如：123 456 789" />
        </el-form-item>

        <el-form-item label="面试官" prop="interviewerIds">
          <el-select
            v-model="form.interviewerIds"
            multiple
            filterable
            placeholder="请选择面试官"
          >
            <el-option
              v-for="u in userStore.userList"
              :key="u.id"
              :label="u.name"
              :value="u.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            创建面试任务
          </el-button>
          <el-button @click="$router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { useResumeStore } from '@/stores/resume'
import { usePositionStore } from '@/stores/position'
import { useUserStore } from '@/stores/user'
import { useInterviewStore } from '@/stores/interview'

const router = useRouter()
const resumeStore = useResumeStore()
const positionStore = usePositionStore()
const userStore = useUserStore()
const interviewStore = useInterviewStore()

const loading = ref(false)
const submitting = ref(false)

const form = reactive({
  resumeId: '',
  positionId: '',
  interviewTime: '',
  type: 'initial' as 'initial' | 'second' | 'final',
  meetingType: 'offline' as 'offline' | 'online',
  address: '',
  meetingLink: '',
  meetingCode: '',
  interviewerIds: [] as string[]
})

// ========== 计算属性 ==========
const recruitingPositions = computed(() =>
  positionStore.list.filter(p => p.status === 'recruiting')
)

const rules = {
  resumeId: [{ required: true, message: '请选择候选人', trigger: 'change' }],
  positionId: [{ required: true, message: '请选择岗位', trigger: 'change' }],
  interviewTime: [{ required: true, message: '请选择面试时间', trigger: 'change' }],
  interviewerIds: [{ required: true, message: '至少选择一位面试官', trigger: 'change' }],
  address: [
    { required: true, message: '请输入面试地址', trigger: 'blur' }
  ],
  meetingLink: [
    { required: true, message: '请输入会议链接', trigger: 'blur' }
  ],
  meetingCode: [
    { required: true, message: '请输入会议码', trigger: 'blur' }
  ]
}

// ========== 方法 ==========
const onCandidateChange = (resumeId: string) => {
  const resume = resumeStore.list.find(r => r.id === resumeId)
  if (resume && resume.recommendedPositionId) {
    form.positionId = resume.recommendedPositionId
  }
}

const handleSubmit = async () => {
  const valid = await (formRef.value as any)?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    await interviewStore.createInterview({ ...form })
    ElMessage.success('面试邀约创建成功')
    router.push('/interviews')
  } catch (error) {
    ElMessage.error('创建失败')
  } finally {
    submitting.value = false
  }
}

// ========== 初始化 ==========
onMounted(async () => {
  loading.value = true
  await Promise.all([
    resumeStore.fetchResumes(),
    positionStore.fetchPositions(),
    userStore.fetchUsers()
  ])
  loading.value = false
})
</script>

<style scoped>
.interview-invite-container {
  padding: 20px;
}
</style>