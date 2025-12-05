<template>
  <div class="position-list-container">
    <!-- 顶部操作栏 -->
    <div class="toolbar">
      <el-button
        v-if="canManagePositions"
        type="primary"
        @click="openCreateForm"
      >
        新增岗位
      </el-button>
    </div>

    <!-- 岗位表格 -->
    <el-table
      :data="filteredPositions"
      v-loading="loading"
      style="width: 100%"
      row-key="id"
    >
      <!-- 基础信息列 -->
      <el-table-column prop="name" label="岗位名称" width="180" />
      <el-table-column prop="workCity" label="工作城市" width="150" />
      <el-table-column prop="address" label="具体地点" show-overflow-tooltip />
      <el-table-column prop="duration" label="工期" width="100" />
      <el-table-column prop="headcount" label="招聘人数" width="100" />
      <el-table-column prop="salaryRange" label="薪资范围" width="120" />
      <el-table-column prop="education" label="学历要求" width="100" />
      <el-table-column prop="experience" label="工作年限" width="120" />

      <!-- 项目预算（权限控制） -->
      <el-table-column
        v-if="authStore.isSuperAdmin || hasBudgetPermission"
        label="项目预算（元）"
        width="120"
      >
        <template #default="{ row }">
          {{ row.budget ? `¥${row.budget.toLocaleString()}` : '—' }}
        </template>
      </el-table-column>

      <!-- 状态列 -->
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag
            :type="row.status === 'recruiting' ? 'success' : 'info'"
            effect="plain"
          >
            {{ row.status === 'recruiting' ? '招募中' : '已下架' }}
          </el-tag>
        </template>
      </el-table-column>

      <!-- 操作列 -->
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button
            size="small"
            link
            type="primary"
            @click="viewDetail(row.id)"
          >
            查看
          </el-button>

          <!-- 编辑按钮（仅招募中 + 有权限） -->
          <el-button
            v-if="canManagePositions && row.status === 'recruiting'"
            size="small"
            link
            type="primary"
            @click="openEditForm(row.id)"
          >
            编辑
          </el-button>

          <!-- 下架按钮（仅招募中 + 有权限） -->
          <el-button
            v-if="canManagePositions && row.status === 'recruiting'"
            size="small"
            link
            type="danger"
            @click="archivePosition(row.id, row.name)"
          >
            下架
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="showFormDialog"
      :title="formMode === 'create' ? '新增岗位' : '编辑岗位'"
      width="600px"
      destroy-on-close
    >
      <PositionForm
        v-if="showFormDialog"
        :position-id="editingId"
        @success="handleFormSuccess"
        @cancel="showFormDialog = false"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usePositionStore } from '@/stores/position'
import { useUserStore } from '@/stores/user'
import PositionForm from '@/components/PositionForm.vue'
import type { Position } from '@/types'

// ========== 状态 ==========
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const positionStore = usePositionStore()
const userStore = useUserStore()

const loading = computed(() => positionStore.loading)
const positions = computed(() => positionStore.list)

// 表单弹窗
const showFormDialog = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const editingId = ref<string | null>(null)

// ========== 权限计算 ==========
// 是否有岗位管理权限（新增/修改/下架）
const canManagePositions = computed(() => {
  if (authStore.isSuperAdmin) return true
  if (authStore.isManager) {
    // 从 userStore 获取当前 manager 的权限
    const currentUser = userStore.userList.find(u => u.id === authStore.user?.id)
    return currentUser?.permissions?.canCreatePosition ?? false
  }
  return false
})

// 是否有查看预算权限（用于列显示）
const hasBudgetPermission = computed(() => {
  if (authStore.isSuperAdmin) return true
  if (authStore.isManager) {
    const currentUser = userStore.userList.find(u => u.id === authStore.user?.id)
    return currentUser?.permissions?.canViewBudget ?? false
  }
  return false
})

// 过滤岗位（未来可加搜索）
const filteredPositions = computed(() => positions.value)

// ========== 方法 ==========
// 打开新增表单
const openCreateForm = () => {
  formMode.value = 'create'
  editingId.value = null
  showFormDialog.value = true
}

// 打开编辑表单
const openEditForm = (id: string) => {
  formMode.value = 'edit'
  editingId.value = id
  showFormDialog.value = true
}

// 查看详情
const viewDetail = (id: string) => {
  router.push(`/positions/${id}`)
}

// 下架岗位
const archivePosition = (id: string, name: string) => {
  ElMessageBox.confirm(
    `确定要下架岗位【${name}】吗？下架后不可恢复，且无法再关联新简历。`,
    '确认下架',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  )
    .then(async () => {
      await positionStore.archive(id)
      ElMessage.success('岗位已下架')
    })
    .catch(() => {})
}

// 表单成功回调
const handleFormSuccess = () => {
  showFormDialog.value = false
  // 刷新列表（store 已自动更新）
}

// ========== 生命周期 ==========
onMounted(async () => {
  await positionStore.fetchPositions()
  // 如果是 manager，需加载用户权限数据
  if (authStore.isAuthenticated && !authStore.isSuperAdmin) {
    await userStore.fetchUsers()
  }
})
</script>

<style scoped>
.position-list-container {
  padding: 20px;
}
.toolbar {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>