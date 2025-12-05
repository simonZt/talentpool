<!-- src/components/InterviewFeedbackForm.vue -->
<template>
  <el-form :model="form" label-width="120px" size="small">
    <el-form-item label="专业能力（1-5分）">
      <el-rate v-model="form.professionalSkill" :max="5" show-score />
    </el-form-item>
    <el-form-item label="沟通能力（1-5分）">
      <el-rate v-model="form.communication" :max="5" show-score />
    </el-form-item>
    <el-form-item label="岗位匹配度（1-5分）">
      <el-rate v-model="form.jobFit" :max="5" show-score />
    </el-form-item>
    <el-form-item label="学习能力（1-5分）">
      <el-rate v-model="form.learningAbility" :max="5" show-score />
    </el-form-item>
    <el-form-item label="文字评价">
      <el-input
        v-model="form.comment"
        type="textarea"
        :rows="4"
        placeholder="请结合岗位要求补充评价依据..."
      />
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="handleSubmit" :loading="loading">
        提交评价
      </el-button>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import type { InterviewFeedback } from '@/types/interview'
import { submitInterviewFeedback } from '@/api/interview'
import { ElMessage } from 'element-plus'

const props = defineProps<{
  interviewId: string
  onSuccess?: () => void
}>()

const form = reactive<Omit<InterviewFeedback, 'interviewer' | 'timestamp'>>({
  professionalSkill: 3,
  communication: 3,
  jobFit: 3,
  learningAbility: 3,
  comment: ''
})

const loading = ref(false)

const handleSubmit = async () => {
  loading.value = true
  try {
    await submitInterviewFeedback(props.interviewId, form)
    ElMessage.success('评价提交成功')
    if (props.onSuccess) props.onSuccess()
  } catch (err) {
    ElMessage.error('提交失败')
  } finally {
    loading.value = false
  }
}
</script>