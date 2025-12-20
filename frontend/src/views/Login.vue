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
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()
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
    // ✅正确：调用 Pinia store 的 handleLogin 方法
    // 这会确保 token 和 userInfo 都被正确保存到 store 和 localStorage
    await userStore.handleLogin(form.username, form.password)

    // ✅ 登录成功后，store 已经更新，路由守卫现在能正确识别登录状态
    // 使用 router.push 而不是 window.location，保持单页应用体验
    await router.push('/dashboard')

  } catch (error: any) {
    // 错误已经在 store 的 handleLogin 中通过 ElMessage 显示了
    // 这里只需要控制台日志和重置 loading    console.error('登录流程失败:', error)
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
