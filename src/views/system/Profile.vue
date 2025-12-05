<!-- src/views/system/Profile.vue -->
<template>
  <div class="profile-container">
    <el-card style="max-width: 600px; margin: 0 auto;">
      <template #header>
        <h2>个人中心</h2>
      </template>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="当前用户名">
          {{ authStore.user?.displayName }}
        </el-form-item>
        <el-form-item label="姓名">
          {{ authStore.user?.name }}
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="form.newPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="form.confirmPassword" type="password" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="changePassword">修改密码</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const formRef = ref()

const form = reactive({
  newPassword: '',
  confirmPassword: ''
})

const rules = {
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule: any, value: string, callback: Function) => {
        if (value !== form.newPassword) {
          callback(new Error('两次输入不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const changePassword = async () => {
  try {
    await (formRef.value as any).validate()
    await authStore.changePassword(form.newPassword)
    ElMessage.success('密码修改成功，请重新登录')
    // 可选：跳转到登录页
  } catch (error) {
    ElMessage.error('修改失败')
  }
}
</script>

<style scoped>
.profile-container {
  padding: 40px 20px;
}
</style>