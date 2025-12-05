<!-- src/views/PositionList.vue -->
<template>
  <div class="position-list">
    <div class="header">
      <h2>岗位管理</h2>
      <el-button
        type="primary"
        @click="openCreateDialog"
        v-if="authStore.role === 'super_admin' || (authStore.role === 'manager' && managerPerms.canCreatePosition)"
      >
        新增岗位
      </el-button>
    </div>

    <el-table :data="positions" border style="width: 100%" v-loading="loading" row-key="id">
      <el-table-column prop="title" label="岗位名称" width="180" />
      <el-table-column prop="workCity" label="工作城市" width="150" />
      <el-table-column prop="specificLocation" label="具体地点" min-width="150" />
      <el-table-column prop="duration" label="工期" width="100" />
      <el-table-column prop="headcount" label="招聘人数" width="100" />
      <el-table-column prop="salaryRange" label="薪资范围" width="120" />
      <el-table-column prop="experience" label="工作年限" width="120" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 'recruiting' ? 'success' : 'info'">
            {{ row.status === 'recruiting' ? '招募中' : '已下架' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <!-- 修改：仅 super_admin 或赋权 manager -->
          <el-button
            size="small"
            @click="openEditDialog(row)"
            v-if="authStore.role === 'super_admin' || (authStore.role === 'manager' && managerPerms.canEditPosition)"
          >
            修改
          </el-button>
          <!-- 下架：仅 recruiting 状态可操作 -->
          <el-button
            size="small"
            type="danger"
            @click="handleArchive(row)"
            v-if="row.status === 'recruiting' && (authStore.role === 'super_admin' || (authStore.role === 'manager' && managerPerms.canDeletePosition))"
          >
            下架
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增/编辑对话框 -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="600px">
      <el-form :model="form" label-width="100px" :rules="rules" ref="formRef">
        <el-form-item label="岗位名称" prop="title">
          <el-input v-model="form.title" :disabled="isEditing" />
        </el-form-item>
        <el-form-item label="工作城市" prop="workCity">
          <el-cascader
            v-model="form.workCityArr"
            :options="cityOptions"
            :props="{ checkStrictly: true }"
            :disabled="isEditing"
          />
        </el-form-item>
        <el-form-item label="具体地点" prop="specificLocation">
          <el-input v-model="form.specificLocation" :disabled="isEditing" />
        </el-form-item>
        <el-form-item label="工期" prop="duration">
          <DurationInput v-model="form.duration" placeholder="如：3个月、1年" />
        </el-form-item>
        <el-form-item label="招聘人数" prop="headcount">
          <el-input-number v-model="form.headcount" :min="1" controls-position="right" />
        </el-form-item>
        <el-form-item label="学历要求" prop="education">
          <el-select v-model="form.education" style="width: 100%">
            <el-option label="大专" value="大专" />
            <el-option label="本科" value="本科" />
            <el-option label="硕士" value="硕士" />
            <el-option label="博士" value="博士" />
            <el-option label="不限" value="不限" />
          </el-select>
        </el-form-item>
        <el-form-item label="薪资范围" prop="salaryRange">
          <el-input v-model="form.salaryRange" placeholder="如：15k-20k/月" />
        </el-form-item>
        <el-form-item label="工作年限" prop="experience">
          <el-select v-model="form.experience" style="width: 100%">
            <el-option label="1年以内" value="1年以内" />
            <el-option label="1-3年" value="1-3年" />
            <el-option label="3-5年" value="3-5年" />
            <el-option label="5年以上" value="5年以上" />
            <el-option label="不限" value="不限" />
          </el-select>
        </el-form-item>
        <el-form-item label="岗位说明" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="其他技能要求">
          <el-input v-model="form.skills" type="textarea" :rows="2" />
        </el-form-item>

        <!-- 项目预算：仅特定角色可见 -->
        <PositionBudgetView
          v-model="form.budget"
          :manager-permissions="managerPerms"
        />
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, FormInstance } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import {
  getPositionList,
  createPosition,
  updatePosition,
  archivePosition
} from '@/api/position'
import type { Position } from '@/types/position'
import DurationInput from '@/components/DurationInput.vue'
import PositionBudgetView from '@/components/PositionBudgetView.vue'

// 城市数据（简化，实际可用省市区 JSON）
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
]

const authStore = useAuthStore()
const positions = ref<Position[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEditing = ref(false)
const submitting = ref(false)
const formRef = ref<FormInstance>()

// 模拟管理人员权限（实际应从 API 获取）
const managerPerms = reactive({
  canCreatePosition: true,
  canEditPosition: true,
  canDeletePosition: true,
  canViewBudget: true,
  canManageHrUsers: false
})

const form = reactive({
  id: '',
  title: '',
  workCityArr: [] as string[],
  specificLocation: '',
  duration: '',
  headcount: 1,
  education: '本科',
  salaryRange: '',
  experience: '1-3年',
  description: '',
  skills: '',
  budget: undefined as number | undefined
})

const rules = {
  title: [{ required: true, message: '请输入岗位名称', trigger: 'blur' }],
  workCityArr: [{ required: true, message: '请选择工作城市', trigger: 'change' }],
  specificLocation: [{ required: true, message: '请输入具体地点', trigger: 'blur' }],
  duration: [{ required: true, message: '请输入工期', trigger: 'blur' }],
  headcount: [{ required: true, message: '请输入招聘人数', trigger: 'blur' }],
  salaryRange: [{ required: true, message: '请输入薪资范围', trigger: 'blur' }],
  description: [{ required: true, message: '请输入岗位说明', trigger: 'blur' }]
}

const dialogTitle = computed(() => isEditing.value ? '编辑岗位' : '新增岗位')

const loadPositions = async () => {
  loading.value = true
  try {
    const list = await getPositionList()
    // 合并 workCity 字段用于显示
    positions.value = list.map(p => ({
      ...p,
      workCity: p.workCity // 假设后端返回 "浙江省 - 杭州市"
    }))
  } catch (err) {
    ElMessage.error('加载岗位失败')
  } finally {
    loading.value = false
  }
}

onMounted(loadPositions)

const openCreateDialog = () => {
  isEditing.value = false
  Object.assign(form, {
    id: '',
    title: '',
    workCityArr: [],
    specificLocation: '',
    duration: '',
    headcount: 1,
    education: '本科',
    salaryRange: '',
    experience: '1-3年',
    description: '',
    skills: '',
    budget: undefined
  })
  dialogVisible.value = true
}

const openEditDialog = (row: Position) => {
  isEditing.value = true
  form.id = row.id
  form.title = row.title
  // 拆分 workCity 为数组（如 "浙江省 - 杭州市" → ['浙江省', '杭州市']）
  form.workCityArr = row.workCity.split(' - ')
  form.specificLocation = row.specificLocation
  form.duration = row.duration
  form.headcount = row.headcount
  form.education = row.education
  form.salaryRange = row.salaryRange
  form.experience = row.experience
  form.description = row.description
  form.skills = row.skills || ''
  form.budget = row.budget
  dialogVisible.value = true
}

const submitForm = async () => {
  await formRef.value?.validate()
  submitting.value = true
  try {
    const payload = {
      ...form,
      workCity: form.workCityArr.join(' - ') // 合并为字符串存入
    }
    if (isEditing.value) {
      await updatePosition(form.id, payload)
      ElMessage.success('岗位更新成功')
    } else {
      await createPosition(payload)
      ElMessage.success('岗位创建成功')
    }
    dialogVisible.value = false
    loadPositions()
  } catch (err) {
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

const handleArchive = (row: Position) => {
  ElMessageBox.confirm(`确定下架岗位【${row.title}】？下架后不可恢复，且无法再关联新简历。`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await archivePosition(row.id)
    ElMessage.success('岗位已下架')
    loadPositions()
  }).catch(() => {})
}
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
</style>