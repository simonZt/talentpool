<template>
  <div>
    <div style="margin-bottom: 15px; text-align: right;">
      <el-button type="primary" @click="dialogVisible = true" v-if="userStore.role !== 'user'">新增用户</el-button>
    </div>

    <el-table :data="users" stripe v-loading="loading">
      <el-table-column prop="username" label="登录名" />
      <el-table-column prop="name" label="姓名" />
      <el-table-column prop="role" label="角色">
        <template #default="scope">
          <el-tag :type="scope.row.role === 'super_admin' ? 'danger' : (scope.row.role === 'manager' ? 'warning' : '')">
            {{ scope.row.role === 'super_admin' ? '超级管理员' : (scope.row.role === 'manager' ? '管理人员' : '普通用户') }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="scope">
          <!-- 只能修改自己或下级的密码 (逻辑由后端控制) -->
          <el-button size="small" @click="openPasswordDialog(scope.row)">修改密码</el-button>
          <el-button v-if="userStore.role === 'super_admin' && scope.row.role !== 'super_admin'" size="small" type="danger" @click="deleteUser(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增用户弹窗 -->
    <el-dialog v-model="dialogVisible" title="新增用户">
      <el-form :model="form" label-width="100px">
        <el-form-item label="登录名"><el-input v-model="form.username" /></el-form-item>
        <el-form-item label="姓名"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="角色">
          <el-select v-model="form.role" :disabled="userStore.role === 'manager'">
            <el-option v-if="userStore.role === 'super_admin'" label="超级管理员" value="super_admin" />
            <el-option v-if="userStore.role === 'super_admin'" label="管理人员" value="manager" />
            <el-option label="普通用户" value="user" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="createUser">创建 (默认密码 123456)</el-button>
      </template>
    </el-dialog>

    <!-- 修改密码弹窗 -->
    <el-dialog v-model="pwdDialogVisible" title="修改密码">
      <el-input v-model="newPassword" type="password" placeholder="新密码 (默认 123456)" show-password />
      <template #footer>
        <el-button type="primary" @click="updatePassword">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getUsers, createUser, deleteUser, changePassword } from '@/api'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()
const users = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const form = reactive({ username: '', name: '', role: 'user' })

const pwdDialogVisible = ref(false)
const newPassword = ref('')
const currentUserId = ref(null)

onMounted(loadUsers)

async function loadUsers() {
  loading.value = true
  try {
    users.value = await getUsers()
  } catch (e) {
    ElMessage.error('加载用户列表失败')
  }
  loading.value = false
}

async function createUser() {
  if (!form.username || !form.name) return ElMessage.warning('请填写完整')
  try {
    await createUser({ ...form, password: '123456' })
    ElMessage.success('用户创建成功，初始密码：123456')
    dialogVisible.value = false
    Object.assign(form, { username: '', name: '', role: 'user' })
    loadUsers()
  } catch (e) {
    ElMessage.error('创建失败，可能用户名重复或权限不足')
  }
}

function openPasswordDialog(row: any) {
  currentUserId.value = row.id
  newPassword.value = ''
  pwdDialogVisible.value = true
}

async function updatePassword() {
  if (!newPassword.value) return ElMessage.warning('请输入密码')
  try {
    await changePassword(currentUserId.value, newPassword.value)
    ElMessage.success('密码已更新')
    pwdDialogVisible.value = false
  } catch (e) {
    ElMessage.error('更新失败')
  }
}

async function deleteUser(row: any) {
  try {
    await ElMessageBox.confirm(`确定删除用户 ${row.name} 吗？`, '警告', { type: 'warning' })
    await deleteUser(row.id)
    ElMessage.success('已删除')
    loadUsers()
  } catch (e) { /* cancel */ }
}
</script>
