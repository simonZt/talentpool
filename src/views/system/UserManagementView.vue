<template>
  <div class="user-management">
    <el-page-header content="用户管理（仅超级管理员）" />

    <el-card>
      <template #header>
        <div class="card-header">
          <span>新增用户</span>
        </div>
      </template>
      <el-form :model="createForm" label-width="80px" inline>
        <el-form-item label="用户名">
          <el-input v-model="createForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="createForm.role" placeholder="请选择角色">
            <el-option value="super_admin" label="超级管理员" />
            <el-option value="manager" label="经理" />
            <el-option value="hr" label="HR" />
            <el-option value="user" label="普通用户" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleCreate" :loading="loading">
            创建用户
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card style="margin-top: 16px">
      <template #header>
        <div class="card-header">用户列表</div>
      </template>
      <el-table :data="users" style="width: 100%" v-loading="loading">
        <el-table-column prop="username" label="用户名" width="160" />
        <el-table-column prop="roleName" label="角色" width="120" />
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <!-- 禁止修改/删除自己 -->
            <el-button
              v-if="row.id !== currentUserId"
              size="small"
              @click="handleEdit(row)"
            >
              修改角色
            </el-button>
            <el-button
              v-if="row.id !== currentUserId"
              size="small"
              type="danger"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
            <span v-else style="color: #999">（当前账号）</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { getUserList, createUser, updateUser, deleteUser } from '@/api/user'
import type { UserItem, UserRole } from '@/types/user'
import { formatDate } from '@/utils/helpers'

const authStore = useAuthStore()
const currentUserId = authStore.userId

const users = ref<UserItem[]>([])
const loading = ref(false)

const createForm = ref({
  username: '',
  role: 'user' as UserRole,
})

// 获取用户列表
const fetchUsers = async () => {
  loading.value = true
  try {
    const list = await getUserList()
    // 补充 roleName 用于显示
    users.value = list.map(u => ({
      ...u,
      roleName: {
        super_admin: '超级管理员',
        manager: '经理',
        hr: 'HR',
        user: '普通用户',
      }[u.role],
    }))
  } finally {
    loading.value = false
  }
}

// 创建用户
const handleCreate = async () => {
  const { username, role } = createForm.value
  if (!username.trim()) {
    ElMessage.warning('请输入用户名')
    return
  }
  loading.value = true
  try {
    await createUser({ username, role })
    ElMessage.success('用户创建成功')
    createForm.value = { username: '', role: 'user' }
    await fetchUsers()
  } finally {
    loading.value = false
  }
}

// 修改角色
const handleEdit = async (row: UserItem) => {
  const { value } = await ElMessageBox.prompt(
    '请选择新角色',
    '修改角色',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputType: 'select',
      inputOptions: {
        super_admin: '超级管理员',
        manager: '经理',
        hr: 'HR',
        user: '普通用户',
      },
      inputValue: row.role,
    }
  )
  if (!value || value === row.role) return

  loading.value = true
  try {
    await updateUser(row.id, value as UserRole)
    ElMessage.success('角色更新成功')
    await fetchUsers()

    // 如果修改的是当前用户自己的角色（理论上不会发生，但安全起见）
    if (row.id === currentUserId) {
      authStore.updateRole(value as UserRole)
    }
  } finally {
    loading.value = false
  }
}

// 删除用户
const handleDelete = async (row: UserItem) => {
  await ElMessageBox.confirm(
    `确定删除用户 "${row.username}"？此操作不可恢复。`,
    '删除确认',
    { type: 'warning' }
  )
  loading.value = true
  try {
    await deleteUser(row.id)
    ElMessage.success('用户删除成功')
    await fetchUsers()
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.card-header {
  font-weight: bold;
}
</style>