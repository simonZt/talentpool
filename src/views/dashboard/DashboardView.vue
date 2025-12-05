<template>
  <div class="dashboard">
    <el-page-header content="人才系统大看板" />

    <!-- 时间维度选择 -->
    <div class="time-filter">
      <span>时间维度：</span>
      <el-radio-group v-model="timePeriod" size="small">
        <el-radio-button label="day">日</el-radio-button>
        <el-radio-button label="week">周</el-radio-button>
        <el-radio-button label="month">月</el-radio-button>
        <el-radio-button label="quarter">季度</el-radio-button>
        <el-radio-button label="year">年</el-radio-button>
      </el-radio-group>
      <el-button
        type="primary"
        size="small"
        style="margin-left: 16px"
        @click="exportAll"
        :loading="exporting"
      >
        导出 Excel
      </el-button>
    </div>

    <!-- 简历量趋势 -->
    <el-card class="chart-card">
      <template #header>
        <div class="card-header">简历上传量趋势</div>
      </template>
      <div ref="resumeChartRef" class="chart-container"></div>
    </el-card>

    <!-- 岗位量趋势 -->
    <el-card class="chart-card">
      <template #header>
        <div class="card-header">新增岗位量趋势</div>
      </template>
      <div ref="positionChartRef" class="chart-container"></div>
    </el-card>

    <!-- 面试状态分布（饼图或柱状图） -->
    <el-card class="chart-card">
      <template #header>
        <div class="card-header">面试状态分布</div>
      </template>
      <div ref="interviewStatusChartRef" class="chart-container"></div>
    </el-card>

    <!-- HR 个人绩效表格 -->
    <el-card class="chart-card">
      <template #header>
        <div class="card-header">HR 个人绩效（按简历量排序）</div>
      </template>
      <el-table :data="hrPerformanceSorted" style="width: 100%">
        <el-table-column prop="hrName" label="HR 姓名" width="120" />
        <el-table-column prop="resumeCount" label="简历处理量" width="120" sortable />
        <el-table-column prop="interviewCount" label="安排面试数" width="120" sortable />
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import * as XLSX from 'xlsx'
import {
  getResumeStats,
  getPositionStats,
  getInterviewStatusDistribution,
  getHrPerformance,
} from '@/api/dashboard'
import type {
  TimeSeriesData,
  HrPerformanceItem,
  InterviewStatusCount,
} from '@/types/dashboard'

// 时间维度
const timePeriod = ref('month')

// 图表容器引用
const resumeChartRef = ref<HTMLDivElement | null>(null)
const positionChartRef = ref<HTMLDivElement | null>(null)
const interviewStatusChartRef = ref<HTMLDivElement | null>(null)

// 数据
const resumeData = ref<TimeSeriesData[]>([])
const positionData = ref<TimeSeriesData[]>([])
const interviewStatusData = ref<InterviewStatusCount[]>([])
const hrPerformance = ref<HrPerformanceItem[]>([])

// 导出状态
const exporting = ref(false)

// 计算属性：HR 按简历量排序
const hrPerformanceSorted = computed(() =>
  [...hrPerformance.value].sort((a, b) => b.resumeCount - a.resumeCount)
)

// 初始化图表
const initCharts = () => {
  if (resumeChartRef.value) {
    const chart = echarts.init(resumeChartRef.value)
    chart.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: resumeData.value.map(d => d.date) },
      yAxis: { type: 'value' },
      series: [{ data: resumeData.value.map(d => d.value), type: 'bar' }],
    })
  }

  if (positionChartRef.value) {
    const chart = echarts.init(positionChartRef.value)
    chart.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: positionData.value.map(d => d.date) },
      yAxis: { type: 'value' },
      series: [{ data: positionData.value.map(d => d.value), type: 'line' }],
    })
  }

  if (interviewStatusChartRef.value) {
    const chart = echarts.init(interviewStatusChartRef.value)
    chart.setOption({
      tooltip: { trigger: 'item' },
      legend: {},
      series: [
        {
          name: '面试状态',
          type: 'pie',
          radius: '50%',
          data: interviewStatusData.value.map(item => ({
            name: item.status,
            value: item.count,
          })),
          emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' } },
        },
      ],
    })
  }
}

// 获取数据
const fetchData = async () => {
  try {
    const period = timePeriod.value
    ;[resumeData.value, positionData.value, interviewStatusData.value, hrPerformance.value] = await Promise.all([
      getResumeStats(period),
      getPositionStats(period),
      getInterviewStatusDistribution(),
      getHrPerformance(period),
    ])
    await nextTick()
    initCharts()
  } catch (err) {
    ElMessage.error('数据加载失败')
  }
}

// 监听时间维度变化
watch(timePeriod, () => {
  fetchData()
})

// 导出 Excel
const exportAll = async () => {
  exporting.value = true
  try {
    const wb = XLSX.utils.book_new()

    // 简历量
    const resumeSheet = XLSX.utils.json_to_sheet(
      resumeData.value.map(d => ({ 日期: d.date, 简历量: d.value }))
    )
    XLSX.utils.book_append_sheet(wb, resumeSheet, '简历量')

    // 岗位量
    const positionSheet = XLSX.utils.json_to_sheet(
      positionData.value.map(d => ({ 日期: d.date, 岗位量: d.value }))
    )
    XLSX.utils.book_append_sheet(wb, positionSheet, '岗位量')

    // HR 绩效
    const hrSheet = XLSX.utils.json_to_sheet(hrPerformance.value)
    XLSX.utils.book_append_sheet(wb, hrSheet, 'HR绩效')

    // 面试状态
    const statusSheet = XLSX.utils.json_to_sheet(interviewStatusData.value)
    XLSX.utils.book_append_sheet(wb, statusSheet, '面试状态')

    // 下载
    XLSX.writeFile(wb, `人才系统大看板_${new Date().toISOString().slice(0, 10)}.xlsx`)
    ElMessage.success('导出成功')
  } catch (err) {
    ElMessage.error('导出失败')
  } finally {
    exporting.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.time-filter {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
}

.chart-card {
  margin-bottom: 24px;
}

.card-header {
  font-weight: bold;
}

.chart-container {
  width: 100%;
  height: 300px;
}
</style>