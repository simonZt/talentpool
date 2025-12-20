<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <div style="text-align: center; font-weight: bold; font-size: 18px;">内部人才管理系统</div>
      </template>
      <el-form :model="form" :rules="rules" @submit.prevent="handleLogin">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="用户名" prefix-icon="User" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="密码" prefix-icon="Lock" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" native-type="submit" style="width: 100%" :loading="loading">登 录</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(false)
const form = reactive({ username: '', password: '' })
const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const handleLogin = async () => {
  if (!form.username || !form.password) return ElMessage.warning('请输入用户名和密码')

  loading.value = true
  try {
    //直接发送登录请求
    const response = await axios.post(
      `http://8.137.37.22:8000/api/auth/login`,
      new URLSearchParams({
        username: form.username,
        password: form.password
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    )

    // 保存 token
    localStorage.setItem('token', response.data.access_token)
    localStorage.setItem('token_type', response.data.token_type)

    ElMessage.success('登录成功！')

    // ✅ 关键：直接跳转到 /dashboard，绕过所有路由守卫
    window.location.href = '/dashboard'

  } catch (error: any) {
    const message = error.response?.data?.detail || '登录失败'
    ElMessage.error(message)
    console.error('登录失败:', error.response?.data)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.login-card {
  width: 360px;
}
</style>
