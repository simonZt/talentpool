<!-- src/views/ResumeList.vue -->
<template>
  <div class="resume-list">
    <div class="header">
      <h2>简历管理</h2>
      <ResumeUpload @success="loadResumes" />
    </div>

    <el-table :data="resumes" border style="width: 100%" v-loading="loading" row-key="id">
      <el-table-column prop="name" label="候选人姓名" width="120" />
      <el-table-column prop="phone" label="联系电话" width="130" />
      <el-table-column prop="education" label="学历" width="100" />
      <el-table-column prop="yearsOfExperience" label="工作年限" width="100">
        <template #default="{ row }">
          {{ row.yearsOfExperience || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="source" label="简历来源" width="120" />
      <el-table-column prop="recommendedPositionTitle" label="推荐岗位" min-width="150" />
      <el-table-column prop="hrOwner" label="归属 HR" width="120" />
      <el-table-column prop="uploadedAt" label="上传时间" width="180">
        <template #default="{ row }">
          {{ formatDate(row.uploadedAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="viewDetail(row)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" width="800px" :title="`候选人：${currentResume?.name}`">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="姓名">{{ currentResume?.name }}</el-descriptions-item>
        <el-descriptions-item label="电话">{{ currentResume?.phone }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ currentResume?.email || '-' }}</el-descriptions-item>
        <el-descriptions-item label="毕业院校">{{ currentResume?.university || '-' }}</el-descriptions-item>
        <el-descriptions-item label="专业">{{ currentResume?.major || '-' }}</el-descriptions-item>
        <el-descriptions-item label="工作年限">{{ currentResume?.yearsOfExperience || '-' }}</el-descriptions-item>
      </el-descriptions>

      <!-- 可编辑字段 -->
      <el-form label-width="100px" style="margin-top: 20px;">
        <el-form-item label="联系电话">
          <el-input v-model="editablePhone" />
        </el-form-item>
        <el-form-item label="推荐岗位">
          <el-select v-model="editablePositionId" filterable placeholder="请选择招募中岗位">
            <el-option
              v-for="pos in recruitingPositions"
              :key="pos.id"
              :label="`${pos.title} - ${pos.workCity}`"
              :value="pos.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveEditableFields" :loading="saving">保存修改</el-button>
        </el-form-item>
      </el-form>

      <!-- 回访记录 -->
      <div style="margin-top: 20px;">
        <h4>回访记录</h4>
        <el-input
          v-model="newFollowUp"
          type="textarea"
          :rows="3"
          placeholder="请输入回访内容..."
          style="margin-bottom: 10px;"
        />
        <el-button @click="addFollowUp" :loading="addingFollowUp">添加回访</el-button>
        <div v-for="(record, index) in currentResume?.followUpRecords" :key="index" class="follow-up-record">
          <p><strong>{{ record.operator }}</strong> · {{ formatDate(record.timestamp) }}</p>
          <p>{{ record.content }}</p>
        </div>
      </div>

      <!-- 编辑历史 -->
      <div style="margin-top: 20px;">
        <h4>编辑历史</h4>
        <el-table :data="currentResume?.editHistory || []" size="small">
          <el-table-column prop="operator" label="操作人" width="100" />
          <el-table-column prop="timestamp" label="时间" width="180">
            <template #default="{ row }">{{ formatDate(row.timestamp) }}</template>
          </el-table-column>
          <el-table-column prop="field" label="字段" width="100" />
          <el-table-column prop="oldValue" label="原值" />
          <el-table-column prop="newValue" label="新值" />
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { getResumeList, updateResumeField, addFollowUpRecord } from '@/api/resume'
import { getPositionList } from '@/api/position'
import type { Resume, Position } from '@/types/resume'
import ResumeUpload from '@/components/ResumeUpload.vue'
import { formatDate } from '@/utils/helpers'

const authStore = useAuthStore()
const resumes = ref<Resume[]>([])
const loading = ref(false)
const detailVisible = ref(false)
const currentResume = ref<Resume | null>(null)
const editablePhone = ref('')
const editablePositionId = ref('')
const newFollowUp = ref('')
const saving = ref(false)
const addingFollowUp = ref(false)
const recruitingPositions = ref<Position[]>([])

const loadResumes = async () => {
  loading.value = true
  try {
    resumes.value = await getResumeList()
  } catch (err) {
    ElMessage.error('加载简历失败')
  } finally {
    loading.value = false
  }
}

const loadPositions = async () => {
  const positions = await getPositionList()
  recruitingPositions.value = positions.filter(p => p.status === 'recruiting')
}

onMounted(() => {
  loadResumes()
  loadPositions()
})

const viewDetail = (row: Resume) => {
  currentResume.value = row
  editablePhone.value = row.phone
  editablePositionId.value = row.recommendedPositionId
  detailVisible.value = true
}

const saveEditableFields = async () => {
  if (!currentResume.value) return
  saving.value = true
  try {
    // 更新电话
    if (editablePhone.value !== currentResume.value.phone) {
      await updateResumeField(currentResume.value.id, 'phone', editablePhone.value)
    }
    // 更新推荐岗位
    if (editablePositionId.value !== currentResume.value.recommendedPositionId) {
      await updateResumeField(currentResume.value.id, 'recommendedPositionId', editablePositionId.value)
    }
    ElMessage.success('修改成功')
    loadResumes() // 刷新列表
    detailVisible.value = false
  } catch (err) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

const addFollowUp = async () => {
  if (!currentResume.value || !newFollowUp.value.trim()) return
  addingFollowUp.value = true
  try {
    await addFollowUpRecord(currentResume.value.id, newFollowUp.value)
    ElMessage.success('回访记录添加成功')
    newFollowUp.value = ''
    loadResumes() // 刷新以获取最新记录
  } catch (err) {
    ElMessage.error('添加失败')
  } finally {
    addingFollowUp.value = false
  }
}
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.follow-up-record {
  padding: 10px;
  border-bottom: 1px solid #eee;
}
.follow-up-record:last-child {
  border-bottom: none;
}
</style>