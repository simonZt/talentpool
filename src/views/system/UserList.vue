<!-- src/views/system/UserList.vue -->
<template>
  <div class="user-list-container">
    <el-card>
      <template #header>
        <div class="toolbar">
          <el-button
            type="primary"
            @click="openCreateDialog"
            :disabled="!canCreateUser"
          >
            新增用户
          </el-button>
        </div>
      </template>

      <el-table :data="userStore.userList" v-loading="userStore.loading" row-key="id">
        <el-table-column prop="username" label="登录名" width="120" />
        <el-table-column prop="displayName" label="用户名" width="120" />
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column label="角色" width="120">
          <template #default="{ row }">
            {{ getRoleLabel(row.role) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="220">
          <template #default="{ row }">
            <el-button
              size="small"
              link
              type="primary"
              @click="openEditDialog(row)"
              :disabled="!canEditUser(row)"
            >
              编辑
            </el-button>
            <el-button
              v-if="authStore.isSuperAdmin || (authStore.isManager && row.role === 'user')"
              size="small"
              link
              type="danger"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
            <el-button
              v-if="authStore.isSuperAdmin && row.role === 'manager'"
              size="small"
              link
              type="warning"
              @click="openPermissionDialog(row)"
            >
              权限配置
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      :model-value="showUserDialog"
      :title="isEditing ? '编辑用户' : '新增用户'"
      width="500px"
      @close="closeUserDialog"
    >
      <el-form :model="userForm" :rules="userRules" ref="userFormRef" label-width="100px">
        <el-form-item label="登录名" prop="username" :required="!isEditing">
          <el-input v-model="userForm.username" :disabled="isEditing" />
        </el-form-item>
        <el-form-item label="用户名" prop="displayName">
          <el-input v-model="userForm.displayName" />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="userForm.name" />
        </el-form-item>
        <el-form-item v-if="!isEditing" label="初始密码">
          <el-input v-model="userForm.password" type="password" value="123456" disabled />
        </el-form-item>
        <el-form-item label="角色" prop="role" v-if="authStore.isSuperAdmin">
          <el-select v-model="userForm.role" :disabled="isEditing">
            <el-option value="super" label="超级管理员" />
            <el-option value="manager" label="管理人员" />
            <el-option value="user" label="普通用户" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeUserDialog">取消</el-button>
        <el-button type="primary" @click="saveUser">保存</el-button>
      </template>
    </el-dialog>

    <!-- 权限配置弹窗 -->
    <el-dialog
      v-model="showPermissionDialog"
      title="权限配置"
      width="500px"
    >
      <el-form label-width="120px">
        <el-form-item label="岗位管理权限">
          <el-checkbox-group v-model="permissionForm.positionPermissions">
            <el-checkbox label="create">新增岗位</el-checkbox>
            <el-checkbox label="edit">修改岗位</el-checkbox>
            <el-checkbox label="delete">下架岗位</el-checkbox>
            <el-checkbox label="viewBudget">查看项目预算</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="用户管理权限">
          <el-checkbox-group v-model="permissionForm.userPermissions">
            <el-checkbox label="create">新增普通用户</el-checkbox>
            <el-checkbox label="edit">修改普通用户</el-checkbox>
            <el-checkbox label="delete">删除普通用户</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPermissionDialog = false">取消</el-button>
        <el-button type="primary" @click="savePermissions">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { useUserStore } from '@/stores/user'

const authStore = useAuthStore()
const userStore = useUserStore()

// ========== 状态 ==========
const showUserDialog = ref(false)
const showPermissionDialog = ref(false)
const isEditing = ref(false)
const currentUserId = ref('')
const userForm = reactive({
  username: '',
  displayName: '',
  name: '',
  password: '123456',
  role: 'user' as 'super' | 'manager' | 'user'
})
const permissionForm = reactive({
  positionPermissions: [] as string[],
  userPermissions: [] as string[]
})

const userFormRef = ref()

// ========== 计算属性 ==========
const canCreateUser = computed(() => {
  return authStore.isSuperAdmin || (authStore.isManager && authStore.hasUserPermission('create'))
})

// ========== 方法 ==========
const getRoleLabel = (role: string) => {
  const map: Record<string, string> = {
    super: '超级管理员',
    manager: '管理人员',
    user: '普通用户'
  }
  return map[role] || role
}

const canEditUser = (user: any) => {
  if (authStore.isSuperAdmin) return true
  if (authStore.isManager && user.role === 'user' && authStore.hasUserPermission('edit')) {
    return true
  }
  return false
}

const openCreateDialog = () => {
  isEditing.value = false
  userForm.username = ''
  userForm.displayName = ''
  userForm.name = ''
  userForm.role = authStore.isSuperAdmin ? 'user' : 'user'
  showUserDialog.value = true
}

const openEditDialog = (user: any) => {
  isEditing.value = true
  currentUserId.value = user.id
  userForm.username = user.username
  userForm.displayName = user.displayName
  userForm.name = user.name
  userForm.role = user.role
  showUserDialog.value = true
}

const closeUserDialog = () => {
  showUserDialog.value = false
}

const saveUser = async () => {
  try {
    await (userFormRef.value as any).validate()
    if (isEditing.value) {
      await userStore.updateUser(currentUserId.value, {
        displayName: userForm.displayName,
        name: userForm.name,
        ...(authStore.isSuperAdmin && { role: userForm.role })
      })
    } else {
      await userStore.createUser({
        username: userForm.username,
        displayName: userForm.displayName,
        name: userForm.name,
        password: userForm.password,
        role: userForm.role
      })
    }
    ElMessage.success(isEditing.value ? '用户更新成功' : '用户创建成功')
    closeUserDialog()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const handleDelete = (user: any) => {
  ElMessageBox.confirm(
    `确认删除已离职用户【${user.name}】？删除后不可恢复`,
    '警告',
    { type: 'warning' }
  ).then(async () => {
    await userStore.deleteUser(user.id)
    ElMessage.success('用户删除成功')
  }).catch(() => {})
}

const openPermissionDialog = (user: any) => {
  currentUserId.value = user.id
  // 从 store 获取当前权限
  const perms = userStore.getPermissions(user.id)
  permissionForm.positionPermissions = perms.position || []
  permissionForm.userPermissions = perms.user || []
  showPermissionDialog.value = true
}

const savePermissions = async () => {
  await userStore.setPermissions(currentUserId.value, {
    position: permissionForm.positionPermissions,
    user: permissionForm.userPermissions
  })
  ElMessage.success('权限配置成功')
  showPermissionDialog.value = false
}

// ========== 初始化 ==========
onMounted(async () => {
  await userStore.fetchUsers()
})
</script>

<style scoped>
.user-list-container {
  padding: 20px;
}
.toolbar {
  display: flex;
  justify-content: space-between;
}
</style>