<template>
  <div>
    <el-table :data="interviews" stripe v-loading="loading">
      <el-table-column label="候选人" width="120">
        <template #default="scope">{{ scope.row.resume?.name }}</template>
      </el-table-column>
      <el-table-column label="岗位" width="150" show-overflow-tooltip>
        <template #default="scope">{{ scope.row.position?.name }}</template>
      </el-table-column>
      <el-table-column label="时间" width="160">
        <template #default="scope">{{ formatDate(scope.row.interview_time) }}</template>
      </el-table-column>
      <el-table-column prop="type" label="类型" width="80" />
      <el-table-column prop="location" label="地点/链接" show-overflow-tooltip />
      <el-table-column label="状态" width="100">
        <template #default="scope">
          <el-tag :type="getStatusType(scope.row.status)">{{ scope.row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" min-width="250" fixed="right">
        <template #default="scope">
          <!-- 状态流转 -->
          <el-popconfirm title="更新状态?" @confirm="changeStatus(scope.row, '待面试')" v-if="scope.row.status === '已排期'">
            <template #reference><el-button size="small">待面试</el-button></template>
          </el-popconfirm>
          <el-popconfirm title="标记为已面试?" @confirm="changeStatus(scope.row, '已面试')" v-if="scope.row.status === '待面试'">
            <template #reference><el-button size="small" type="primary">已面试</el-button></template>
          </el-popconfirm>

          <!-- 评价 -->
          <el-button size="small" type="success" @click="openFeedback(scope.row)" v-if="scope.row.status === '已面试'">评价</el-button>

          <!-- 取消 -->
          <el-popconfirm title="确定取消?" @confirm="changeStatus(scope.row, '取消面试')" v-if="scope.row.status !== '已面试' && scope.row.status !== '已取消'">
             <template #reference><el-button size="small" type="danger" plain>取消</el-button></template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <!-- 评价弹窗 -->
    <el-dialog v-model="feedbackVisible" title="面试评价">
      <el-form :model="feedbackForm" label-width="100px">
        <el-form-item label="技术评分"><el-rate v-model="feedbackForm.scores.tech" show-text /></el-form-item>
        <el-form-item label="沟通评分"><el-rate v-model="feedbackForm.scores.comm" show-text /></el-form-item>
        <el-form-item label="匹配度"><el-rate v-model="feedbackForm.scores.match" show-text /></el-form-item>
        <el-form-item label="评价详情"><el-input type="textarea" v-model="feedbackForm.comment" :rows="3"></el-input></el-form-item>
      </el-form>
      <template #footer><el-button type="primary" @click="submitFeedback">提交评价</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed} from 'vue'
import { ElMessage } from 'element-plus'
import { getInterviews, updateInterviewStatus, submitFeedback } from '@/api'

const interviews = ref([])
const loading = ref(false)
const feedbackVisible = ref(false)
const feedbackForm = reactive({ id: null, scores: { tech: 0, comm: 0, match: 0 }, comment: '' })

onMounted(loadData)

async function loadData() {
  loading.value = true
  interviews.value = await getInterviews()
  loading.value = false
}

function formatDate(str: string) {
  return new Date(str).toLocaleString()
}

function getStatusType(status: string) {
  const map: any = { '待面试': 'warning', '已面试': 'info', '通过': 'success', '未通过': 'danger', '取消面试': 'info' }
  return map[status] || 'info'
}

async function changeStatus(row: any, status: string) {
  await updateInterviewStatus(row.id, status)
  ElMessage.success('状态已更新')
  loadData()
}

function openFeedback(row: any) {
  feedbackForm.id = row.id
  feedbackForm.scores = { tech: 0, comm: 0, match: 0 }
  feedbackForm.comment = ''
  feedbackVisible.value = true
}

async function submitFeedback() {
  await submitFeedback(feedbackForm.id, feedbackForm)
  ElMessage.success('评价提交成功')
  feedbackVisible.value = false
  loadData()
}
</script>
