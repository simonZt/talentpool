<template>
  <el-form
    ref="formRef"
    :model="form"
    :rules="rules"
    label-width="120px"
    @submit.prevent="handleSubmit"
  >
    <!-- 基础信息 -->
    <el-form-item label="岗位名称" prop="name" :required="isCreateMode">
      <el-input v-model="form.name" :disabled="!isCreateMode" />
    </el-form-item>

    <el-form-item label="岗位说明" prop="description">
      <el-input v-model="form.description" type="textarea" :rows="3" />
    </el-form-item>

    <el-form-item label="年龄要求" prop="ageRequirement">
      <el-input v-model="form.ageRequirement" placeholder="如：25-35岁" />
    </el-form-item>

    <el-form-item label="工作城市" prop="workCity" :required="isCreateMode">
      <el-cascader
        v-model="cityValue"
        :options="cityOptions"
        :props="{ checkStrictly: true }"
        :disabled="!isCreateMode"
        @change="handleCityChange"
        placeholder="请选择省 - 市"
      />
    </el-form-item>

    <el-form-item label="具体地点" prop="address" :required="isCreateMode">
      <el-input
        v-model="form.address"
        placeholder="如：杭州市西湖区XX大厦15层"
        :disabled="!isCreateMode"
      />
    </el-form-item>

    <el-form-item label="工期时间" prop="duration" :required="isCreateMode">
      <el-input
        v-model="form.duration"
        placeholder="如：2个月、1年"
        :disabled="!isCreateMode"
      />
    </el-form-item>

    <el-form-item label="招聘人数" prop="headcount" :required="isCreateMode">
      <el-input-number v-model="form.headcount" :min="1" :max="999" />
    </el-form-item>

    <!-- 任职要求 -->
    <el-divider>任职要求</el-divider>

    <el-form-item label="学历要求" prop="education">
      <el-select v-model="form.education" placeholder="请选择">
        <el-option
          v-for="item in educationOptions"
          :key="item"
          :label="item"
          :value="item"
        />
      </el-select>
    </el-form-item>

    <el-form-item label="薪资范围" prop="salaryRange">
      <el-input v-model="form.salaryRange" placeholder="如：15k-20k/月" />
    </el-form-item>

    <el-form-item label="工作年限" prop="experience">
      <el-select v-model="form.experience" placeholder="请选择">
        <el-option
          v-for="item in experienceOptions"
          :key="item"
          :label="item"
          :value="item"
        />
      </el-select>
    </el-form-item>

    <el-form-item label="其他技能" prop="skills">
      <el-input v-model="form.skills" type="textarea" :rows="2" />
    </el-form-item>

    <!-- 项目预算（权限控制） -->
    <el-form-item
      v-if="showBudgetField"
      label="项目预算（元）"
      prop="budget"
    >
      <el-input-number
        v-model="form.budget"
        :min="0"
        :step="1000"
        controls-position="right"
      />
    </el-form-item>

    <!-- 操作按钮 -->
    <el-form-item>
      <el-button type="primary" :loading="loading" @click="handleSubmit">
        {{ isCreateMode ? '新增岗位' : '保存修改' }}
      </el-button>
      <el-button @click="$emit('cancel')">取消</el-button>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { usePositionStore } from '@/stores/position'
import type {
  Position,
  CreatePositionDTO,
  UpdatePositionDTO,
  EducationRequirement,
  ExperienceRequirement
} from '@/types'

// ========== Props & Emits ==========
const props = defineProps<{
  positionId?: string // 编辑模式传入ID，新增模式不传
}>()

const emit = defineEmits<{
  (e: 'success'): void
  (e: 'cancel'): void
}>()

// ========== 状态 ==========
const authStore = useAuthStore()
const positionStore = usePositionStore()
const formRef = ref()
const loading = ref(false)

// ========== 表单数据 ==========
const form = ref<Partial<Position>>({
  name: '',
  description: '',
  ageRequirement: '',
  workCity: '',
  address: '',
  duration: '',
  headcount: 1,
  education: '本科',
  salaryRange: '',
  experience: '1-3年',
  skills: '',
  budget: undefined
})

// ========== 城市数据（简化版，实际可用 pinyin-pro 或接口）=========
const cityOptions = [
  {
    value: '浙江省',
    label: '浙江省',
    children: [{ value: '杭州市', label: '杭州市' }, { value: '宁波市', label: '宁波市' }]
  },
  {
    value: '广东省',
    label: '广东省',
    children: [{ value: '广州市', label: '广州市' }, { value: '深圳市', label: '深圳市' }]
  }
  // 可扩展更多
]

const cityValue = ref<string[]>([])

// ========== 选项数据 ==========
const educationOptions: EducationRequirement[] = ['大专', '本科', '硕士', '博士']
const experienceOptions: ExperienceRequirement[] = ['1年以内', '1-3年', '3-5年', '5年以上']

// ========== 计算属性 ==========
const isCreateMode = computed(() => !props.positionId)

// 是否显示预算字段（仅 super_admin 或赋权 manager）
const showBudgetField = computed(() => {
  if (authStore.isSuperAdmin) return true
  if (authStore.isManager) {
    // TODO: 从 user store 获取当前 manager 的权限
    // 此处简化：假设所有 manager 都有权限（实际需调用 API 获取）
    return true
  }
  return false
})

// ========== 表单规则 ==========
const rules = {
  name: [{ required: true, message: '请输入岗位名称', trigger: 'blur' }],
  workCity: [{ required: true, message: '请选择工作城市', trigger: 'change' }],
  address: [{ required: true, message: '请输入具体地点', trigger: 'blur' }],
  duration: [{ required: true, message: '请输入工期时间', trigger: 'blur' }],
  headcount: [{ required: true, message: '请输入招聘人数', trigger: 'blur' }],
  education: [{ required: true, message: '请选择学历要求', trigger: 'change' }],
  experience: [{ required: true, message: '请选择工作年限', trigger: 'change' }]
}

// ========== 方法 ==========
// 城市选择变更
const handleCityChange = (value: string[]) => {
  if (value.length === 2) {
    form.value.workCity = `${value[0]} - ${value[1]}`
  }
}

// 加载编辑数据
const loadEditData = async () => {
  if (!props.positionId) return
  await positionStore.fetchDetail(props.positionId)
  const detail = positionStore.detail
  if (detail) {
    // 复制可编辑字段
    form.value = {
      name: detail.name,
      description: detail.description,
      ageRequirement: detail.ageRequirement,
      workCity: detail.workCity,
      address: detail.address,
      duration: detail.duration,
      headcount: detail.headcount,
      education: detail.education,
      salaryRange: detail.salaryRange,
      experience: detail.experience,
      skills: detail.skills,
      budget: detail.budget // 仅当有权限时存在
    }

    // 设置城市级联值
    const [province, city] = detail.workCity.split(' - ')
    cityValue.value = province && city ? [province, city] : []
  }
}

// 提交表单
const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    if (isCreateMode.value) {
      const data: CreatePositionDTO = {
        ...form.value,
        headcount: form.value.headcount!,
        education: form.value.education!,
        experience: form.value.experience!
      }
      await positionStore.addPosition(data)
      ElMessage.success('岗位新增成功')
    } else {
      const data: UpdatePositionDTO = {
        description: form.value.description,
        ageRequirement: form.value.ageRequirement,
        duration: form.value.duration,
        headcount: form.value.headcount,
        education: form.value.education,
        salaryRange: form.value.salaryRange,
        experience: form.value.experience,
        skills: form.value.skills
        // 注意：不可修改 name/workCity/address/budget/status
      }
      await positionStore.editPosition(props.positionId!, data)
      ElMessage.success('岗位修改成功')
    }
    emit('success')
  } catch (error) {
    ElMessage.error('操作失败')
  } finally {
    loading.value = false
  }
}

// ========== 生命周期 ==========
if (!isCreateMode.value) {
  loadEditData()
}
</script>