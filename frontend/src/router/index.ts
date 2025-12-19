import { useUserStore } from '@/store/user'
import { ElMessage } from 'element-plus'
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { guest: true }
  },
  {
    path: '/',
    component: () => import('@/layout/Index.vue'), // 动态引入 Layout
    meta: { requiresAuth: true },
    children: [
      { path: 'dashboard', name: 'Dashboard', component: () => import('@/views/Dashboard.vue'), meta: { title: '仪表盘' } },
      { path: 'positions', name: 'Positions', component: () => import('@/views/Positions.vue'), meta: { title: '岗位管理' } },
      { path: 'resumes', name: 'Resumes', component: () => import('@/views/Resumes.vue'), meta: { title: '简历管理' } },
      { path: 'interviews', name: 'Interviews', component: () => import('@/views/Interviews.vue'), meta: { title: '面试管理' } },
      { path: 'system', name: 'System', component: () => import('@/views/System.vue'), meta: { title: '系统管理', roles: ['super_admin', 'manager'] } }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  // 如果 store 为空且有 token，尝试获取用户信息
  if (!userStore.info && userStore.token && to.path !== '/login') {
    await userStore.fetchUserInfo()
  }

  const isAuthenticated = userStore.isAuthenticated

  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }

  if (to.path === '/login' && isAuthenticated) {
    next('/dashboard')
    return
  }

  // 权限拦截
  if (to.meta.roles && !to.meta.roles.includes(userStore.role)) {
    ElMessage.warning('权限不足：您无权访问此页面')
    next(from.path === '/login' ? '/dashboard' : false) // 防止死循环
    return
  }

  next()
})

export default router
