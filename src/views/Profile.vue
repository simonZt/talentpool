<!-- src/views/Profile.vue -->
<template>
  <div class="profile-container">
    <h1>个人中心</h1>
    <el-card style="max-width: 600px; margin-top: 20px;">
      <el-descriptions title="账户信息" :column="1" border>
        <el-descriptions-item label="登录名">{{ user?.loginName }}</el-descriptions-item>
        <el-descriptions-item label="用户名">{{ user?.username }}</el-descriptions-item>
        <el-descriptions-item label="姓名">{{ user?.realName }}</el-descriptions-item>
        <el-descriptions-item label="角色">{{ roleTextMap[user?.role || 'hr'] }}</el-descriptions-item>
      </el-descriptions>

      <el-divider />

      <el-form
        ref="pwdFormRef"
        :model="pwdForm"
        :rules="pwdRules"
        label-width="100px"
        style="margin-top: 20px;"
        @submit.prevent="handleChangePassword"
      >
        <el-form-item label="当前密码" prop="oldPassword">
          <el-input v-model="pwdForm.oldPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="pwdForm.newPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input v-model="pwdForm.confirmPassword" type="password" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" native-type="submit">修改密码</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { getUserInfo, changePassword } from '@/api/user'

const authStore = useAuthStore()
const user = ref<any>(null)

const pwdFormRef = ref()
const pwdForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const pwdRules = {
  oldPassword: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule: any, value: string, callback: any) => {
        if (value !== pwdForm.value.newPassword) {
          callback(new Error('两次密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const roleTextMap = {
  super_admin: '超级管理员',
  manager: '管理人员',
  hr: '普通用户'
}

onMounted(async () => {
  const info = await getUserInfo()
  user.value = info
})

const handleChangePassword = async () => {
  await pwdFormRef.value?.validate()
  try {
    await changePassword({
      oldPassword: pwdForm.value.oldPassword,
      newPassword: pwdForm.value.newPassword
    })
    ElMessage.success('密码修改成功，请重新登录')
    authStore.logout()
    // 跳转到登录页（由路由守卫处理）
  } catch (err: any) {
    ElMessage.error(err.message || '修改失败')
  }
}
</script>

<style scoped>
.profile-container {
  padding: 20px;
}
</style>