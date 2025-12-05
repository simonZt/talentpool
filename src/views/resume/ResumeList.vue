<template>
  <div class="resume-list-container">
    <!-- 搜索 & 操作 -->
    <div class="toolbar">
      <el-button type="primary" @click="$router.push('/resumes/upload')">
        上传简历
      </el-button>
    </div>

    <!-- 简历表格 -->
    <el-table
      :data="resumeStore.list"
      v-loading="resumeStore.loading"
      style="width: 100%"
      row-key="id"
    >
      <el-table-column prop="candidateName" label="候选人" width="120" />
      <el-table-column prop="phone" label="联系电话" width="140" />
      <el-table-column prop="education" label="学历" width="120" />
      <el-table-column prop="workYears" label="工作年限" width="100" />
      <el-table-column prop="source" label="简历来源" width="120" />
      <el-table-column label="推荐岗位" width="180">
        <template #default="{ row }">
          {{ getPositionName(row.recommendedPositionId) }}
        </template>
      </el-table-column>
      <el-table-column prop="hrName" label="归属HR" width="120" />
      <el-table-column prop="createdAt" label="上传时间" width="160" />

      <!-- 操作列 -->
      <el-table-column label="操作" fixed="right" width="180">
        <template #default="{ row }">
          <el-button
            size="small"
            link
            type="primary"
            @click="viewResume(row.fileUrl)"
          >
            预览
          </el-button>
          <el-button
            size="small"
            link
            type="primary"
            @click="openEditDialog(row)"
          >
            编辑
          </el-button>
          <el-button
            size="small"
            link
            type="success"
            @click="openFollowUpDialog(row.id)"
          >
            回访
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 编辑弹窗 -->
    <el-dialog v-model="showEditDialog" title="编辑简历信息" width="500px">
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="学历">
          <el-input v-model="editForm.education" />
        </el-form-item>
        <el-form-item label="工作年限">
          <el-input v-model="editForm.workYears" placeholder="如：3年" />
        </el-form-item>
        <el-form-item label="简历来源">
          <el-select v-model="editForm.source" placeholder="请选择">
            <el-option
              v-for="item in sourceOptions"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="editForm.phone" />
        </el-form-item>
        <el-form-item label="推荐岗位">
          <el-select v-model="editForm.recommendedPositionId" filterable placeholder="请选择">
            <el-option
              v-for="pos in recruitingPositions"
              :key="pos.id"
              :label="`${pos.name} - ${pos.workCity}`"
              :value="pos.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="saveEdit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 回访记录弹窗 -->
    <el-dialog v-model="showFollowUpDialog" title="添加回访记录" width="500px">
      <el-form :model="followUpForm">
        <el-form-item label="回访内容">
          <el-input
            v-model="followUpForm.content"
            type="textarea"
            :rows="4"
            placeholder="请输入回访内容..."
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showFollowUpDialog = false">取消</el-button>
        <el-button type="primary" @click="saveFollowUp">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useResumeStore } from '@/stores/resume'
import { usePositionStore } from '@/stores/position'
import type { Resume, ResumeSource } from '@/types'

const resumeStore = useResumeStore()
const positionStore = usePositionStore()

// ========== 状态 ==========
const showEditDialog = ref(false)
const showFollowUpDialog = ref(false)
const currentResumeId = ref('')
const editForm = ref({
  education: '',
  workYears: '',
  source: '' as ResumeSource,
  phone: '',
  recommendedPositionId: ''
})
const followUpForm = ref({ content: '' })

// ========== 选项 ==========
const sourceOptions: ResumeSource[] = ['BOSS直聘', '智联招聘', '内部推荐', '其他']

// 招募中岗位
const recruitingPositions = computed(() =>
  positionStore.list.filter(p => p.status === 'recruiting')
)

// ========== 方法 ==========
const getPositionName = (id: string) => {
  const pos = positionStore.list.find(p => p.id === id)
  return pos ? pos.name : '—'
}

const viewResume = (url: string) => {
  window.open(url, '_blank')
}

const openEditDialog = (resume: Resume) => {
  currentResumeId.value = resume.id
  editForm.value = {
    education: resume.education || '',
    workYears: resume.workYears || '',
    source: resume.source,
    phone: resume.phone,
    recommendedPositionId: resume.recommendedPositionId || ''
  }
  showEditDialog.value = true
}

const saveEdit = async () => {
  await resumeStore.updateResume(currentResumeId.value, editForm.value)
  ElMessage.success('简历信息已更新')
  showEditDialog.value = false
}

const openFollowUpDialog = (id: string) => {
  currentResumeId.value = id
  followUpForm.value.content = ''
  showFollowUpDialog.value = true
}

const saveFollowUp = async () => {
  await resumeStore.addFollowUp(currentResumeId.value, {
    content: followUpForm.value.content
  })
  ElMessage.success('回访记录已保存')
  showFollowUpDialog.value = false
}

// ========== 初始化 ==========
onMounted(async () => {
  await resumeStore.fetchResumes()
  await positionStore.fetchPositions()
})
</script>

<style scoped>
.resume-list-container {
  padding: 20px;
}
.toolbar {
  margin-bottom: 20px;
}
</style>