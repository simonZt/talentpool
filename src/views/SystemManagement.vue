<!-- src/views/SystemManagement.vue -->
<template>
  <div class="system-management">
    <h1>系统管理</h1>

    <!-- 用户操作区 -->
    <div class="user-actions">
      <el-button
        type="primary"
        @click="openCreateDialog"
        v-if="authStore.role === 'super_admin'"
      >
        新增用户
      </el-button>
    </div>

    <!-- 用户列表 -->
    <el-table :data="users" border style="width: 100%" v-loading="loading" row-key="id">
      <el-table-column prop="realName" label="姓名" width="120" />
      <el-table-column prop="username" label="用户名" width="150" />
      <el-table-column prop="loginName" label="登录名" width="150" />
      <el-table-column label="角色" width="120">
        <template #default="{ row }">
          {{ roleTextMap[row.role] }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="240" fixed="right">
        <template #default="{ row }">
          <!-- 编辑：超级管理员可改所有；管理人员仅可改普通用户 -->
          <el-button
            size="small"
            @click="openEditDialog(row)"
            v-if="
              authStore.role === 'super_admin' ||
              (authStore.role === 'manager' && row.role === 'hr')
            "
          >
            编辑
          </el-button>
          <!-- 删除：同上 -->
          <el-button
            size="small"
            type="danger"
            @click="handleDelete(row)"
            v-if="
              authStore.role === 'super_admin' ||
              (authStore.role === 'manager' && row.role === 'hr')
            "
          >
            删除
          </el-button>
          <!-- 权限配置：仅超级管理员对管理人员操作 -->
          <el-button
            size="small"
            type="warning"
            @click="openPermissionDialog(row)"
            v-if="authStore.role === 'super_admin' && row.role === 'manager'"
          >
            权限配置
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增/编辑用户弹窗 -->
    <el-dialog :title="dialogTitle" v-model="userDialogVisible" width="500px">
      <el-form :model="userForm" :rules="userRules" ref="userFormRef" label-width="80px">
        <el-form-item label="登录名" prop="loginName" :required="!isEditing">
          <el-input v-model="userForm.loginName" :disabled="isEditing" />
        </el-form-item>
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" />
        </el-form-item>
        <el-form-item label="姓名" prop="realName">
          <el-input v-model="userForm.realName" :disabled="isEditing" />
        </el-form-item>
        <el-form-item label="角色" prop="role" v-if="authStore.role === 'super_admin'">
          <el-select v-model="userForm.role" style="width: 100%">
            <el-option value="super_admin" label="超级管理员" />
            <el-option value="manager" label="管理人员" />
            <el-option value="hr" label="普通用户" />
          </el-select>
        </el-form-item>
        <!-- 普通用户不能选角色，默认 hr -->
        <el-form-item v-else label="角色">
          <el-input value="普通用户" disabled />
          <input type="hidden" v-model="userForm.role" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="userDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitUserForm" :loading="submitting">保存</el-button>
      </template>
    </el-dialog>

    <!-- 权限配置弹窗 -->
    <el-dialog title="权限配置" v-model="permDialogVisible" width="500px">
      <el-form label-width="150px">
        <el-form-item label="岗位管理权限">
          <el-checkbox v-model="permForm.canCreatePosition">新增岗位</el-checkbox>
          <el-checkbox v-model="permForm.canEditPosition">修改岗位</el-checkbox>
          <el-checkbox v-model="permForm.canDeletePosition">下架岗位</el-checkbox>
          <el-checkbox v-model="permForm.canViewBudget">查看项目预算</el-checkbox>
        </el-form-item>
        <el-form-item label="用户管理权限">
          <el-checkbox v-model="permForm.canManageHrUsers">管理普通用户（增删改）</el-checkbox>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="permDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="savePermissions" :loading="savingPerms">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, FormInstance } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import {
  getUserList,
  createUser,
  updateUser,
  deleteUser,
  assignManagerPermissions
} from '@/api/user'
import type { User, ManagerPermission } from '@/types/user'

const authStore = useAuthStore()
const users = ref<User[]>([])
const loading = ref(false)

// 用户表单
const userDialogVisible = ref(false)
const isEditing = ref(false)
const submitting = ref(false)
const userFormRef = ref<FormInstance>()
const userForm = reactive({
  id: '',
  loginName: '',
  username: '',
  realName: '',
  role: 'hr' as 'super_admin' | 'manager' | 'hr'
})

const userRules = {
  loginName: [{ required: true, message: '请输入登录名', trigger: 'blur' }],
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  realName: [{ required: true, message: '请输入姓名', trigger: 'blur' }]
}

const dialogTitle = computed(() => isEditing.value ? '编辑用户' : '新增用户')

// 权限表单
const permDialogVisible = ref(false)
const currentManagerId = ref('')
const savingPerms = ref(false)
const permForm = reactive<ManagerPermission>({
  canCreatePosition: false,
  canEditPosition: false,
  canDeletePosition: false,
  canViewBudget: false,
  canManageHrUsers: false
})

const roleTextMap = {
  super_admin: '超级管理员',
  manager: '管理人员',
  hr: '普通用户'
}

const loadUsers = async () => {
  loading.value = true
  try {
    users.value = await getUserList()
  } catch (err) {
    ElMessage.error('加载用户失败')
  } finally {
    loading.value = false
  }
}

onMounted(loadUsers)

const openCreateDialog = () => {
  isEditing.value = false
  Object.assign(userForm, {
    id: '',
    loginName: '',
    username: '',
    realName: '',
    role: authStore.role === 'super_admin' ? 'hr' : 'hr'
  })
  userDialogVisible.value = true
}

const openEditDialog = (row: User) => {
  isEditing.value = true
  Object.assign(userForm, { ...row })
  userDialogVisible.value = true
}

const submitUserForm = async () => {
  await userFormRef.value?.validate()
  submitting.value = true
  try {
    if (isEditing.value) {
      await updateUser(userForm.id, {
        username: userForm.username,
        realName: userForm.realName,
        role: userForm.role
      })
      ElMessage.success('用户更新成功')
    } else {
      await createUser({
        loginName: userForm.loginName,
        username: userForm.username,
        realName: userForm.realName,
        role: userForm.role,
        password: '123456'
      })
      ElMessage.success('用户创建成功')
    }
    userDialogVisible.value = false
    loadUsers()
  } catch (err) {
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

const handleDelete = (row: User) => {
  ElMessageBox.confirm(`确认删除已离职用户【${row.realName}】？删除后不可恢复。`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await deleteUser(row.id)
    ElMessage.success('用户已删除')
    loadUsers()
  }).catch(() => {})
}

const openPermissionDialog = (row: User) => {
  currentManagerId.value = row.id
  // 模拟从 API 获取当前权限（此处用默认值）
  Object.assign(permForm, {
    canCreatePosition: true,
    canEditPosition: true,
    canDeletePosition: true,
    canViewBudget: true,
    canManageHrUsers: false
  })
  permDialogVisible.value = true
}

const savePermissions = async () => {
  savingPerms.value = true
  try {
    await assignManagerPermissions(currentManagerId.value, permForm)
    ElMessage.success('权限配置成功')
    permDialogVisible.value = false
  } catch (err) {
    ElMessage.error('保存失败')
  } finally {
    savingPerms.value = false
  }
}
</script>

<style scoped>
.system-management {
  padding: 20px;
}
.user-actions {
  margin-bottom: 20px;
}
</style>