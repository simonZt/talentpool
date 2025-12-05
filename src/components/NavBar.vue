<!-- src/components/NavBar.vue -->
<template>
  <div class="nav-bar">
    <div class="logo">人才系统</div>
    <div class="nav-links">
      <router-link to="/dashboard">大看板</router-link>
      <router-link to="/positions">岗位管理</router-link>
      <router-link to="/resumes">简历管理</router-link>
      <router-link to="/interviews">面试管理</router-link>
      <router-link v-if="isSuperAdmin" to="/system/users">系统管理</router-link>
    </div>
    <div class="user-actions">
      <el-dropdown @command="handleCommand" trigger="click">
        <span class="user-info">
          {{ username }} <el-icon><ArrowDown /></el-icon>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="logout">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const username = computed(() => authStore.username || '用户')
const isSuperAdmin = computed(() => authStore.isSuperAdmin)

const handleCommand = (command: string) => {
  if (command === 'logout') {
    authStore.logout()
    router.push('/login')
  }
}
</script>

<style scoped>
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  padding: 0 24px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
  z-index: 1000;
}

.logo {
  font-size: 18px;
  font-weight: bold;
  color: #409eff;
}

.nav-links a {
  margin-left: 24px;
  text-decoration: none;
  color: #333;
}

.nav-links a.router-link-exact-active {
  color: #409eff;
  font-weight: bold;
}

.user-info {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>