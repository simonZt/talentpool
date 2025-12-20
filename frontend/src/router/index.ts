import { useUserStore } from '@/store/user'
import { ElMessage } from 'element-plus'
import { createRouter, createWebHistory, type NavigationGuardNext, type RouteRecordRaw } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { guest: true }
  },
  {
    path: '/',
    component: () => import('@/layout/Index.vue'),
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

router.beforeEach(async (to, from, next: NavigationGuardNext) => {
  const userStore = useUserStore()

  // 1. 如果用户已登录但store中没有用户信息，尝试获取
  if (!userStore.info && userStore.token && to.path !== '/login') {
    try {
      await userStore.fetchUserInfo()
    } catch (error) {
      // 获取用户信息失败，清除token并重定向到登录
      userStore.logout()
      next({ path: '/login', query: { redirect: to.fullPath } })
      return
    }
  }

  // 2. 检查是否已认证
  const isAuthenticated = !!userStore.token && userStore.isAuthenticated

  // 3. 需要认证但未登录 → 跳转到登录页
  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }

  // 4. 已登录但访问登录页 → 跳转到仪表盘
  if (to.path === '/login' && isAuthenticated) {
    next('/dashboard')
    return
  }

  // 5. 权限检查（仅对需要特定角色的路由）
  if (to.meta.roles && Array.isArray(to.meta.roles)) {
    const requiredRoles = to.meta.roles
    const userRole = userStore.role || ''

    // 如果用户没有所需角色
    if (!requiredRoles.includes(userRole)) {
      ElMessage.warning('权限不足：您无权访问此页面')

      // ✅ 修复：正确处理导航中断
      if (from.path === '/login') {
        // 如果是从登录页来的，跳转到仪表盘避免死循环
        next('/dashboard')
      } else {
        // 否则中断导航，停留在原页面
        next(false)
      }
      return
    }
  }

  // 6. 所有检查通过，正常导航
  next()
})

export default router
