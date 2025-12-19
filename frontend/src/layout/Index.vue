<template>
  <el-container style="height: 100vh;">
    <el-aside width="200px" style="background-color: #304156; color: white;">
      <div style="height: 60px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px;">
        HR 系统
      </div>
      <el-menu
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        :default-active="$route.path"
        style="border-right: none;"
      >
        <el-menu-item index="/dashboard">
          <el-icon><Histogram /></el-icon>
          <span>仪表盘</span>
        </el-menu-item>
        <el-menu-item index="/positions">
          <el-icon><Briefcase /></el-icon>
          <span>岗位管理</span>
        </el-menu-item>
        <el-menu-item index="/resumes">
          <el-icon><Files /></el-icon>
          <span>简历管理</span>
        </el-menu-item>
        <el-menu-item index="/interviews">
          <el-icon><VideoCamera /></el-icon>
          <span>面试管理</span>
        </el-menu-item>
        <el-menu-item index="/system" v-if="['super_admin', 'manager'].includes(userStore.role)">
          <el-icon><Setting /></el-icon>
          <span>系统管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header style="background-color: white; border-bottom: 1px solid #e6e6e6; display: flex; align-items: center; justify-content: space-between; padding: 0 20px;">
        <div class="breadcrumbs">{{ $route.meta.title }}</div>
        <div>
          <span style="margin-right: 10px; color: #606266;">
            欢迎, <b>{{ userStore.name || '访客' }}</b>
            <el-tag size="small" style="margin-left: 5px;">{{ userStore.role === 'super_admin' ? '超级管理员' : userStore.role === 'manager' ? '经理' : '用户' }}</el-tag>
          </span>
          <el-button size="small" type="danger" plain @click="userStore.logout">退出</el-button>
        </div>
      </el-header>

      <el-main style="background-color: #f5f7fa; overflow-y: auto;">
        <router-view v-slot="{ Component }">
          <transition name="fade-transform" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { useUserStore } from '@/store/user'
const userStore = useUserStore()
</script>

<style>
.fade-transform-enter-active, .fade-transform-leave-active { transition: all 0.3s; }
.fade-transform-enter-from, .fade-transform-leave-to { opacity: 0; transform: translateX(10px); }
</style>
