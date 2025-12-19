<template>
  <div>
    <div style="margin-bottom: 15px; display: flex; justify-content: space-between;">
      <div>
        <el-input v-model="filterName" placeholder="搜索岗位名称" style="width: 200px" clearable />
      </div>
      <el-button type="primary" @click="openDialog()" v-if="['super_admin', 'manager'].includes(userStore.role)">新增岗位</el-button>
    </div>

    <el-table :data="filteredPositions" stripe v-loading="loading" style="width: 100%;">
      <el-table-column prop="name" label="岗位名称" min-width="120" />
      <el-table-column prop="city" label="城市" width="120" />
      <el-table-column prop="salary_range" label="薪资" width="120" />
      <el-table-column label="状态" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.status === 'active' ? 'success' : 'info'">
            {{ scope.row.status === 'active' ? '招募中' : '已下架' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column v-if="['super_admin', 'manager'].includes(userStore.role)" prop="budget" label="预算" width="100">
        <template #default="scope">￥{{ scope.row.budget || '-' }}</template>
      </el-table-column>
      <el-table-column label="操作" min-width="180" fixed="right">
        <template #default="scope">
          <el-button size="small" @click="openDialog(scope.row)">编辑</el-button>
          <el-button size="small" :type="scope.row.status === 'active' ? 'warning' : 'success'" @click="toggleStatus(scope.row)">
            {{ scope.row.status === 'active' ? '下架' : '上架' }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 弹窗 -->
    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑岗位' : '新增岗位'">
      <el-form :model="form" label-width="100px" :rules="rules" ref="formRef">
        <el-row :gutter="10">
            <el-col :span="12"><el-form-item label="岗位名称" prop="name"><el-input v-model="form.name" /></el-form-item></el-col>
            <el-col :span="12"><el-form-item label="城市"><el-input v-model="form.city" placeholder="如：北京-朝阳" /></el-form-item></el-col>
        </el-row>
        <el-form-item label="薪资范围"><el-input v-model="form.salary_range" placeholder="如：15k-25k" /></el-form-item>
        <!-- 预算仅超级管理员可见 -->
        <el-form-item label="预算" v-if="userStore.role === 'super_admin'"><el-input type="number" v-model="form.budget" /></el-form-item>
        <el-form-item label="岗位说明"><el-input type="textarea" v-model="form.description" :rows="3" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="savePosition">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { getPositions, createPosition, updatePosition, togglePositionStatus } from '@/api'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()
const positions = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const filterName = ref('')
const formRef = ref<FormInstance>()

const form = reactive({
  id: null, name: '', city: '', salary_range: '', budget: null, description: '', age_req: '', work_years: ''
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入岗位名称', trigger: 'blur' }]
}

const filteredPositions = computed(() => {
  if (!filterName.value) return positions.value
  return positions.value.filter((p: any) => p.name.includes(filterName.value))
})

onMounted(loadData)

async function loadData() {
  loading.value = true
  try {
    positions.value = await getPositions()
  } catch (e) { ElMessage.error('加载失败') }
  finally { loading.value = false }
}

function openDialog(row: any = null) {
  if (row) Object.assign(form, row)
  else Object.assign(form, { id: null, name: '', city: '', salary_range: '', budget: null, description: '', age_req: '', work_years: '' })
  dialogVisible.value = true
}

async function savePosition() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (form.id) {
          // 编辑时，根据 Schema，只允许更新部分字段
          await updatePosition(form.id, {
            description: form.description, age_req: form.age_req, work_years: form.work_years,
            salary_range: form.salary_range, city: form.city
          })
        } else {
          await createPosition(form)
        }
        ElMessage.success('保存成功')
        dialogVisible.value = false
        loadData()
      } catch (e) { ElMessage.error('操作失败，请检查权限或数据') }
    }
  })
}

async function toggleStatus(row: any) {
  const newStatus = row.status === 'active' ? 'inactive' : 'active'
  try {
    await togglePositionStatus(row.id, newStatus)
    ElMessage.success(`岗位已${newStatus === 'active' ? '开启' : '下架'}`)
    loadData()
  } catch (e) { ElMessage.error('状态更新失败') }
}
</script>
