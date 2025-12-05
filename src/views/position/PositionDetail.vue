<template>
  <div class="position-detail-container">
    <!-- 返回按钮 -->
    <el-button icon="ArrowLeft" @click="$router.back()" style="margin-bottom: 20px;">
      返回岗位列表
    </el-button>

    <!-- 岗位信息卡片 -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="title">{{ position.name }}</span>
          <el-tag
            :type="position.status === 'recruiting' ? 'success' : 'info'"
            size="large"
          >
            {{ position.status === 'recruiting' ? '招募中' : '已下架' }}
          </el-tag>
        </div>
      </template>

      <el-descriptions :column="2" border>
        <el-descriptions-item label="工作城市">{{ position.workCity }}</el-descriptions-item>
        <el-descriptions-item label="具体地点">{{ position.address }}</el-descriptions-item>
        <el-descriptions-item label="工期时间">{{ position.duration }}</el-descriptions-item>
        <el-descriptions-item label="招聘人数">{{ position.headcount }} 人</el-descriptions-item>
        <el-descriptions-item label="学历要求">{{ position.education }}</el-descriptions-item>
        <el-descriptions-item label="工作年限">{{ position.experience }}</el-descriptions-item>
        <el-descriptions-item label="薪资范围">{{ position.salaryRange }}</el-descriptions-item>
        <el-descriptions-item label="年龄要求">{{ position.ageRequirement || '—' }}</el-descriptions-item>
        <el-descriptions-item label="其他技能">{{ position.skills || '—' }}</el-descriptions-item>
        <el-descriptions-item label="岗位说明">{{ position.description || '—' }}</el-descriptions-item>

        <!-- 项目预算（权限控制） -->
        <el-descriptions-item
          v-if="showBudget"
          label="项目预算（元）"
        >
          ¥{{ position.budget?.toLocaleString() || '0' }}
        </el-descriptions-item>
      </el-descriptions>

      <!-- 操作区域 -->
      <div class="action-bar" v-if="canManage && position.status === 'recruiting'">
        <el-button type="primary" @click="openEditForm">编辑岗位</el-button>
        <el-button type="danger" @click="handleArchive">下架岗位</el-button>
      </div>
    </el-card>

    <!-- 编辑弹窗 -->
    <el-dialog
      v-model="showEditDialog"
      title="编辑岗位"
      width="600px"
      destroy-on-close
    >
      <PositionForm
        v-if="showEditDialog"
        :position-id="position.id"
        @success="handleEditSuccess"
        @cancel="showEditDialog = false"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usePositionStore } from '@/stores/position'
import PositionForm from '@/components/PositionForm.vue'
import type { Position } from '@/types'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const positionStore = usePositionStore()

const position = ref<Position>({
  id: '',
  name: '',
  description: '',
  ageRequirement: '',
  workCity: '',
  address: '',
  duration: '',
  headcount: 0,
  education: '本科',
  salaryRange: '',
  experience: '1-3年',
  skills: '',
  status: 'recruiting',
  createdAt: ''
})

const showEditDialog = ref(false)

// ========== 权限计算 ==========
const showBudget = computed(() => {
  return authStore.isSuperAdmin || authStore.currentUserPermissions.canViewBudget
})

const canManage = computed(() => {
  return authStore.isSuperAdmin || authStore.currentUserPermissions.canEditPosition
})

// ========== 方法 ==========
const loadDetail = async () => {
  const id = route.params.id as string
  await positionStore.fetchDetail(id)
  position.value = positionStore.detail!
}

const openEditForm = () => {
  showEditDialog.value = true
}

const handleEditSuccess = () => {
  showEditDialog.value = false
  loadDetail() // 刷新详情
}

const handleArchive = () => {
  ElMessageBox.confirm(
    `确定要下架岗位【${position.value.name}】吗？`,
    '确认下架',
    { type: 'warning' }
  )
    .then(async () => {
      await positionStore.archive(position.value.id)
      ElMessage.success('岗位已下架')
      loadDetail() // 刷新状态
    })
    .catch(() => {})
}

// ========== 生命周期 ==========
onMounted(() => {
  loadDetail()
})
</script>

<style scoped>
.position-detail-container {
  padding: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.title {
  font-size: 18px;
  font-weight: bold;
}
.action-bar {
  margin-top: 20px;
  text-align: right;
}
</style>