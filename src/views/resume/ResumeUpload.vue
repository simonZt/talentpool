<template>
  <div class="resume-upload-container">
    <el-card>
      <template #header>
        <div class="upload-header">
          <h2>上传候选人简历</h2>
        </div>
      </template>

      <!-- 文件上传区 -->
      <el-upload
        ref="uploadRef"
        :auto-upload="false"
        :on-change="handleFileChange"
        :on-remove="handleFileRemove"
        :file-list="fileList"
        accept=".pdf,.doc,.docx"
        :limit="1"
        :on-exceed="onExceed"
      >
        <el-button type="primary">选择简历文件（PDF/Word）</el-button>
        <template #tip>
          <div class="el-upload__tip">支持格式：PDF、Word (.doc/.docx)</div>
        </template>
      </el-upload>

      <!-- 解析结果表单（文件选择后显示） -->
      <el-form
        v-if="showForm"
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        style="margin-top: 24px;"
      >
        <!-- 基础信息 -->
        <el-divider>基础信息</el-divider>
        <el-form-item label="候选人姓名" prop="candidateName">
          <el-input v-model="form.candidateName" />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item label="工作年限" prop="workYears">
          <el-input v-model="form.workYears" placeholder="如：3年" />
        </el-form-item>
        <el-form-item label="简历来源" prop="source">
          <el-select v-model="form.source" placeholder="请选择来源">
            <el-option
              v-for="item in sourceOptions"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </el-form-item>

        <!-- 学历信息 -->
        <el-divider>学历信息</el-divider>
        <el-form-item label="毕业院校" prop="education">
          <el-input v-model="form.education" />
        </el-form-item>
        <el-form-item label="专业" prop="major">
          <el-input v-model="form.major" />
        </el-form-item>
        <el-form-item label="毕业时间" prop="graduationTime">
          <el-date-picker
            v-model="form.graduationTime"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>

        <!-- 推荐岗位（仅招募中） -->
        <el-divider>推荐岗位</el-divider>
        <el-form-item label="关联岗位" prop="recommendedPositionId">
          <el-select
            v-model="form.recommendedPositionId"
            filterable
            placeholder="请选择一个招募中的岗位"
          >
            <el-option
              v-for="pos in recruitingPositions"
              :key="pos.id"
              :label="`${pos.name} - ${pos.workCity} (${pos.duration})`"
              :value="pos.id"
            />
          </el-select>
        </el-form-item>

        <!-- 提交按钮 -->
        <el-form-item>
          <el-button
            type="primary"
            :loading="submitting"
            @click="handleSubmit"
          >
            保存简历
          </el-button>
          <el-button @click="$router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { usePositionStore } from '@/stores/position'
import { useResumeStore } from '@/stores/resume'
import type { ResumeSource } from '@/types'

// ========== 状态 ==========
const route = useRoute()
const router = useRouter()
const positionStore = usePositionStore()
const resumeStore = useResumeStore()

const uploadRef = ref()
const fileList = ref<any[]>([])
const showForm = ref(false)
const submitting = ref(false)

// 表单数据（初始为空）
const form = reactive({
  candidateName: '',
  phone: '',
  workYears: '',
  source: '' as ResumeSource | '',
  education: '',
  major: '',
  graduationTime: '',
  recommendedPositionId: ''
})

// ========== 选项 ==========
const sourceOptions: ResumeSource[] = [
  'BOSS直聘',
  '智联招聘',
  '内部推荐',
  '其他'
]

// 招募中岗位列表
const recruitingPositions = computed(() =>
  positionStore.list.filter(p => p.status === 'recruiting')
)

// ========== 表单规则 ==========
const rules = {
  candidateName: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ],
  source: [{ required: true, message: '请选择简历来源', trigger: 'change' }],
  recommendedPositionId: [{ required: true, message: '请选择推荐岗位', trigger: 'change' }]
}

// ========== 方法 ==========
// 文件选择
const handleFileChange = (file: any) => {
  fileList.value = [file.raw]
  // 模拟解析（实际调用 API）
  simulateParse(file.raw)
}

const handleFileRemove = () => {
  fileList.value = []
  showForm.value = false
}

const onExceed = () => {
  ElMessage.warning('最多只能上传1个文件')
}

// 模拟简历解析（实际应调用后端解析接口）
const simulateParse = async (file: File) => {
  // 显示 loading
  submitting.value = true

  try {
    // TODO: 调用真实解析 API
    // const parsed = await resumeStore.parseResume(file)
    // 这里模拟解析结果
    const mockParsed = {
      name: '张三',
      phone: '13800138000',
      workYears: '5年',
      university: '浙江大学',
      major: '计算机科学与技术',
      graduationTime: '2020-06-01'
    }

    // 填充表单（保留用户可能已输入的内容）
    form.candidateName = form.candidateName || mockParsed.name
    form.phone = form.phone || mockParsed.phone
    form.workYears = form.workYears || mockParsed.workYears
    form.education = form.education || mockParsed.university
    form.major = form.major || mockParsed.major
    form.graduationTime = form.graduationTime || mockParsed.graduationTime

    showForm.value = true
  } catch (error) {
    ElMessage.error('简历解析失败，请手动填写')
    showForm.value = true
  } finally {
    submitting.value = false
  }
}

// 查重检查（姓名 + 电话）
const checkDuplicate = async (): Promise<boolean> => {
  const exists = await resumeStore.checkDuplicate({
    candidateName: form.candidateName,
    phone: form.phone
  })
  if (exists) {
    return new Promise((resolve) => {
      ElMessageBox.confirm(
        '该候选人简历已存在，是否覆盖原简历？',
        '重复提示',
        {
          confirmButtonText: '覆盖',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
        .then(() => resolve(true))
        .catch(() => resolve(false))
    })
  }
  return true
}

// 提交
const handleSubmit = async () => {
  const valid = await (formRef.value as any)?.validate().catch(() => false)
  if (!valid) return

  const isNotDuplicate = await checkDuplicate()
  if (!isNotDuplicate) return

  submitting.value = true
  try {
    const formData = new FormData()
    formData.append('file', fileList.value[0])
    formData.append('candidateName', form.candidateName)
    formData.append('phone', form.phone)
    formData.append('workYears', form.workYears)
    formData.append('source', form.source)
    formData.append('education', form.education)
    formData.append('major', form.major)
    formData.append('graduationTime', form.graduationTime || '')
    formData.append('recommendedPositionId', form.recommendedPositionId)

    await resumeStore.uploadResume(formData)
    ElMessage.success('简历上传成功')
    router.push('/resumes') // 跳转到简历列表
  } catch (error) {
    ElMessage.error('上传失败')
  } finally {
    submitting.value = false
  }
}

// ========== 初始化 ==========
onMounted(async () => {
  // 加载招募中岗位
  await positionStore.fetchPositions()
})
</script>

<style scoped>
.resume-upload-container {
  padding: 20px;
}
.upload-header {
  text-align: center;
  margin-bottom: 16px;
}
</style>