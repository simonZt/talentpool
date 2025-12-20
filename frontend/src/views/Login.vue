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
      <div style="font-size: 12px; color: #999; text-align: center;">
      </div>
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
    // ✅ 关键修改：直接发送 POST 请求到后端
    // ✅ 使用环境变量 VITE_API_BASE_URL，确保生产环境指向正确的服务器地址
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
    const response = await axios.post(
      `${apiBaseUrl}/api/auth/login`,
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

    // 假设后端返回数据格式为 { token: 'xxx', user: {...} }
    const { token, user } = response.data

    // 保存 token 到 localStorage
    if (token) {
      localStorage.setItem('token', token)
    }

    ElMessage.success('登录成功！')

    // 跳转到首页
    await router.push('/')

  } catch (error: any) {
    // 错误处理
    if (error.response) {
      // 服务器返回了错误状态码
      const message = error.response.data?.detail || error.response.data?.message || '登录失败'
      ElMessage.error(message)
      console.error('登录失败 - 服务器响应:', error.response.data)
    } else if (error.request) {
      // 请求已发送但没有收到响应
      ElMessage.error('无法连接到服务器，请检查网络')
      console.error('登录失败 - 网络错误:', error.request)
    } else {
      // 其他错误
      ElMessage.error('登录请求失败')
      console.error('登录失败 - 其他错误:', error.message)
    }
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
