<!-- src/layout/Layout.vue -->
<template>
  <el-container style="height: 100vh">
    <!-- 侧边栏 -->
    <el-aside width="200px" style="background: #333; color: white;">
      <div class="logo">人才系统</div>
      <el-menu
        :default-active="$route.path"
        router
        background-color="#333"
        text-color="#fff"
        active-text-color="#ffd04b"
        :collapse="false"
      >
        <el-menu-item index="/dashboard">
          <el-icon><PieChart /></el-icon>
          <span>大看板</span>
        </el-menu-item>
        <el-menu-item index="/positions" v-if="canViewPositions">
          <el-icon><OfficeBuilding /></el-icon>
          <span>岗位管理</span>
        </el-menu-item>
        <el-menu-item index="/resumes">
          <el-icon><Document /></el-icon>
          <span>简历管理</span>
        </el-menu-item>
        <el-menu-item index="/interviews">
          <el-icon><VideoCamera /></el-icon>
          <span>面试管理</span>
        </el-menu-item>
        <el-menu-item index="/system" v-if="authStore.role === 'super_admin'">
          <el-icon><Setting /></el-icon>
          <span>系统管理</span>
        </el-menu-item>
        <el-menu-item index="/profile">
          <el-icon><User /></el-icon>
          <span>个人中心</span>
        </el-menu-item>
        <el-menu-item index="/logout" @click="handleLogout">
          <el-icon><SwitchButton /></el-icon>
          <span>退出登录</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 主内容区 -->
    <el-main>
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { PieChart, OfficeBuilding, Document, VideoCamera, Setting, User, SwitchButton } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// 普通用户也能看岗位（只读），所以 always true
const canViewPositions = computed(() => true)

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: bold;
  color: white;
  border-bottom: 1px solid #555;
}
.el-aside {
  height: 100vh;
}
</style>