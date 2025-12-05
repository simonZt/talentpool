<template>
  <div class="resume-list">
    <el-page-header content="简历管理" />

    <div class="toolbar">
      <el-upload
        action=""
        :auto-upload="false"
        :on-change="handleFileChange"
        :show-file-list="false"
        accept=".pdf,.doc,.docx"
      >
        <el-button type="primary">上传简历</el-button>
      </el-upload>
    </div>

    <el-table :data="resumes" style="width: 100%" v-loading="loading">
      <el-table-column prop="name" label="姓名" width="100" />
      <el-table-column prop="phone" label="电话" width="120" />
      <el-table-column prop="education" label="学历" width="80" />
      <el-table-column prop="workYears" label="工作年限" width="100" />
      <el-table-column prop="source" label="来源" width="120" />
      <el-table-column prop="recommendedPositionName" label="推荐岗位" />
      <el-table-column prop="hrName" label="归属HR" width="100" />
      <el-table-column prop="uploadTime" label="上传时间" width="160">
        <template #default="{ row }">
          {{ formatDate(row.uploadTime) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120">
        <template #default="{ row }">
          <el-button link type="primary" @click="viewDetail(row.id)">
            查看
          </el-button>
          <el-button link type="primary" @click="previewResume(row.resumeUrl)">
            预览
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { getResumeList, uploadResume } from '@/api/resume'
import type { ResumeItem } from '@/types/resume'
import { formatDate } from '@/utils/helpers'

const router = useRouter()
const resumes = ref<ResumeItem[]>([])
const loading = ref(false)

onMounted(() => {
  fetchResumes()
})

const fetchResumes = async () => {
  loading.value = true
  try {
    resumes.value = await getResumeList()
  } finally {
    loading.value = false
  }
}

const handleFileChange = async (file: any) => {
  if (!['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.raw.type)) {
    ElMessage.error('仅支持 PDF 或 Word 文档')
    return
  }

  const formData = new FormData()
  formData.append('file', file.raw)

  try {
    loading.value = true
    const res = await uploadResume(formData)
    ElMessage.success('上传成功')
    await fetchResumes()
  } catch (error: any) {
    if (error.response?.data?.code === 'DUPLICATE') {
      const msg = error.response.data.message // "该候选人简历已存在..."
      ElMessageBox.confirm(msg, '查重提示', {
        confirmButtonText: '覆盖',
        cancelButtonText: '取消',
        type: 'warning',
      })
        .then(async () => {
          // 前端无法直接覆盖，需后端支持。此处简化为重新上传并强制覆盖
          formData.append('force', 'true')
          await uploadResume(formData)
          ElMessage.success('已覆盖原简历')
          await fetchResumes()
        })
        .catch(() => {})
    } else {
      ElMessage.error('上传失败')
    }
  } finally {
    loading.value = false
  }
}

const viewDetail = (id: string) => {
  router.push(`/resumes/${id}`)
}

const previewResume = (url: string) => {
  window.open(url, '_blank')
}
</script>

<style scoped>
.toolbar {
  margin-bottom: 16px;
  text-align: right;
}
</style>