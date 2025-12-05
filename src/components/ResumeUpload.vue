<!-- src/components/ResumeUpload.vue -->
<template>
  <div class="resume-upload">
    <el-upload
      ref="uploadRef"
      action=""
      :auto-upload="false"
      :show-file-list="false"
      accept=".pdf,.doc,.docx"
      :on-change="handleFileChange"
    >
      <el-button type="primary">选择简历文件（PDF/Word）</el-button>
    </el-upload>

    <div v-if="parsedData" class="preview-section">
      <h4>解析结果预览</h4>
      <el-form label-width="100px" size="small">
        <el-form-item label="姓名">
          <el-input v-model="parsedData.name" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="parsedData.phone" />
        </el-form-item>
        <el-form-item label="简历来源">
          <el-select v-model="source" placeholder="请选择">
            <el-option
              v-for="opt in sources"
              :key="opt"
              :label="opt"
              :value="opt"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="推荐岗位">
          <el-select v-model="selectedPositionId" filterable placeholder="请选择招募中岗位">
            <el-option
              v-for="pos in recruitingPositions"
              :key="pos.id"
              :label="`${pos.title} - ${pos.workCity} - ${pos.duration}`"
              :value="pos.id"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <el-button type="success" @click="submitResume" :loading="submitting">
        {{ duplicateExists ? '覆盖原简历' : '保存简历' }}
      </el-button>
    </div>

    <el-dialog v-model="showDuplicateDialog" title="重复候选人" width="400px">
      <p>该候选人（{{ duplicateName }} - {{ duplicatePhone }}）简历已存在。</p>
      <p>是否覆盖原简历？</p>
      <template #footer>
        <el-button @click="showDuplicateDialog = false">取消</el-button>
        <el-button type="danger" @click="confirmOverride">覆盖</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { ParsedResumeData, ResumeSource } from '@/types/resume'
import type { Position } from '@/types/position'
import { uploadResume, saveResume, checkDuplicateResume } from '@/api/resume'
import { getPositionList } from '@/api/position'
import { ElMessage } from 'element-plus'

const props = defineProps<{
  onSuccess?: () => void
}>()

const uploadRef = ref()
const parsedData = ref<ParsedResumeData | null>(null)
const source = ref<ResumeSource>('BOSS直聘')
const selectedPositionId = ref<string>('')
const submitting = ref(false)
const showDuplicateDialog = ref(false)
const duplicateExists = ref(false)
const duplicateName = ref('')
const duplicatePhone = ref('')

const sources: ResumeSource[] = ['BOSS直聘', '智联招聘', '前程无忧', '内部推荐', '其他']
const recruitingPositions = ref<Position[]>([])

onMounted(async () => {
  const positions = await getPositionList()
  recruitingPositions.value = positions.filter(p => p.status === 'recruiting')
})

const handleFileChange = async (file: any) => {
  if (!['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.raw.type)) {
    ElMessage.error('仅支持 PDF 或 Word 文件')
    return
  }

  const formData = new FormData()
  formData.append('file', file.raw)

  try {
    const res = await uploadResume(formData)
    parsedData.value = res.parsedData
    // 自动查重
    const { exists } = await checkDuplicateResume(res.parsedData.name, res.parsedData.phone)
    if (exists) {
      duplicateExists.value = true
      duplicateName.value = res.parsedData.name
      duplicatePhone.value = res.parsedData.phone
      showDuplicateDialog.value = true
    } else {
      duplicateExists.value = false
    }
  } catch (err) {
    ElMessage.error('简历解析失败')
  }
}

const confirmOverride = () => {
  showDuplicateDialog.value = false
  submitResume()
}

const submitResume = async () => {
  if (!parsedData.value || !selectedPositionId.value) {
    ElMessage.warning('请填写完整信息')
    return
  }

  submitting.value = true
  try {
    await saveResume({
      ...parsedData.value,
      source: source.value,
      recommendedPositionId: selectedPositionId.value,
      hrOwner: '当前用户', // 实际应从 authStore 获取
      fileUrl: 'mock-url.pdf'
    })
    ElMessage.success('简历保存成功')
    if (props.onSuccess) props.onSuccess()
    // 重置
    parsedData.value = null
    selectedPositionId.value = ''
    uploadRef.value?.clearFiles()
  } catch (err) {
    ElMessage.error('保存失败')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.preview-section {
  margin-top: 20px;
  padding: 16px;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
}
</style>