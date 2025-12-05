<template>
  <div class="dashboard-container">
    <h2>人才管理大看板</h2>

    <!-- 时间维度选择 -->
    <div class="time-filter">
      <span>时间维度：</span>
      <el-radio-group v-model="timeRange" size="small">
        <el-radio-button label="day">日</el-radio-button>
        <el-radio-button label="week">周</el-radio-button>
        <el-radio-button label="month">月</el-radio-button>
        <el-radio-button label="quarter">季度</el-radio-button>
        <el-radio-button label="year">年</el-radio-button>
      </el-radio-group>
      <el-button size="small" @click="exportData" style="margin-left: 20px;">导出Excel</el-button>
    </div>

    <!-- 数据卡片 -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="value">{{ stats.totalResumes }}</div>
            <div class="label">总简历数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="value">{{ stats.recruitingPositions }}</div>
            <div class="label">招募中岗位</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="value">{{ stats.totalInterviews }}</div>
            <div class="label">面试总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="value">{{ stats.passedCount }}</div>
            <div class="label">通过人数</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <!-- 简历趋势 -->
      <el-col :span="12">
        <el-card>
          <div ref="resumeChartRef" style="height: 300px;"></div>
        </el-card>
      </el-col>
      <!-- 岗位趋势 -->
      <el-col :span="12">
        <el-card>
          <div ref="positionChartRef" style="height: 300px;"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- HR 个人数据（表格） -->
    <el-card style="margin-top: 20px;">
      <template #header>
        <span>HR 个人简历上传量</span>
      </template>
      <el-table :data="hrStats" style="width: 100%">
        <el-table-column prop="hrName" label="HR姓名" />
        <el-table-column prop="resumeCount" label="简历数量" sortable />
        <el-table-column prop="lastUpload" label="最后上传时间" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import { useDashboardStore } from '@/stores/dashboard'

const dashboardStore = useDashboardStore()
const timeRange = ref<'day' | 'week' | 'month' | 'quarter' | 'year'>('month')

const resumeChartRef = ref<HTMLDivElement>()
const positionChartRef = ref<HTMLDivElement>()

// ========== 计算属性 ==========
const stats = computed(() => dashboardStore.overview)
const hrStats = computed(() => dashboardStore.hrStats)
const resumeTrend = computed(() => dashboardStore.resumeTrend)
const positionTrend = computed(() => dashboardStore.positionTrend)

// ========== 方法 ==========
const initResumeChart = () => {
  if (!resumeChartRef.value) return
  const chart = echarts.init(resumeChartRef.value)
  chart.setOption({
    title: { text: '简历上传趋势', left: 'center' },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: resumeTrend.value.dates },
    yAxis: { type: 'value' },
    series: [{ data: resumeTrend.value.values, type: 'bar' }]
  })
}

const initPositionChart = () => {
  if (!positionChartRef.value) return
  const chart = echarts.init(positionChartRef.value)
  chart.setOption({
    title: { text: '岗位新增趋势', left: 'center' },
    tooltip: { trigger: 'axis' },
    legend: { data: ['招募中', '已下架'] },
    xAxis: { type: 'category', data: positionTrend.value.dates },
    yAxis: { type: 'value' },
    series: [
      { name: '招募中', type: 'bar', data: positionTrend.value.recruiting },
      { name: '已下架', type: 'bar', data: positionTrend.value.archived }
    ]
  })
}

const exportData = () => {
  // 调用 store 导出方法
  dashboardStore.exportExcel(timeRange.value)
  ElMessage.success('数据导出成功')
}

// ========== 监听 & 初始化 ==========
watch(timeRange, async (newVal) => {
  await dashboardStore.fetchDashboardData(newVal)
  initResumeChart()
  initPositionChart()
}, { immediate: true })
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
}
.time-filter {
  display: flex;
  align-items: center;
}
.stat-card {
  text-align: center;
}
.value {
  font-size: 24px;
  font-weight: bold;
  color: #409EFF;
}
.label {
  color: #909399;
  margin-top: 4px;
}
</style>