<!-- src/views/Login.vue -->
<template>
  <div class="login-container">
    <div class="login-box">
      <h2>内部人才系统</h2>
      <el-form :model="loginForm" :rules="loginRules" ref="loginFormRef" @submit.prevent="handleLogin">
        <el-form-item prop="loginName">
          <el-input v-model="loginForm.loginName" placeholder="请输入登录名" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            show-password
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" native-type="submit" :loading="loggingIn" style="width: 100%;">
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const loginFormRef = ref()
const loggingIn = ref(false)

const loginForm = ref({
  loginName: '',
  password: ''
})

const loginRules = {
  loginName: [{ required: true, message: '请输入登录名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const handleLogin = async () => {
  await loginFormRef.value?.validate()
  loggingIn.value = true
  try {
    await authStore.login(loginForm.value.loginName, loginForm.value.password)
    ElMessage.success('登录成功')
    router.push({ name: 'Dashboard' })
  } catch (err: any) {
    ElMessage.error(err.message || '登录失败，请检查用户名或密码')
  } finally {
    loggingIn.value = false
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f7fa;
}
.login-box {
  width: 400px;
  padding: 30px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}
.login-box h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}
</style>