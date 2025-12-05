<!-- src/App.vue -->
<template>
  <div id="app">
    <template v-if="$route.meta.public">
      <!-- 公开页面（如登录） -->
      <router-view />
    </template>
    <template v-else>
      <!-- 受保护页面：带导航栏 -->
      <div class="layout">
        <NavBar />
        <div class="main-content">
          <router-view />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import NavBar from '@/components/NavBar.vue'
</script>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
}
.main-content {
  flex: 1;
  padding: 20px;
  background-color: #f9fafb;
}
</style>