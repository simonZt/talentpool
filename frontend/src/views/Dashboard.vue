<template>
  <div>
    <el-row :gutter="20" style="margin-bottom: 20px;">
      <el-col :span="6">
        <el-card shadow="hover" style="text-align: center; height: 100px; display: flex; flex-direction: column; justify-content: center;">
          <div style="font-size: 12px; color: #999;">今日简历</div>
          <div style="font-size: 28px; font-weight: bold; color: #409EFF">{{ stats.daily_resumes || 0 }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" style="text-align: center; height: 100px; display: flex; flex-direction: column; justify-content: center;">
          <div style="font-size: 12px; color: #999;">本周面试</div>
          <div style="font-size: 28px; font-weight: bold; color: #67C23A">{{ stats.weekly_interviews || 0 }}</div>
        </el-card>
      </el-col>
    </el-row>
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card>
          <div ref="chartResume" style="height: 300px; width: 100%;"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <div ref="chartInterview" style="height: 300px; width: 100%;"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import * as echarts from 'echarts'
import { getStats } from '@/api'
import { ElMessage } from 'element-plus'

const stats = reactive({ daily_resumes: 0, weekly_interviews: 0, resumes_trend: [], interview_status_counts: [] })
const chartResume = ref<HTMLElement>()
const chartInterview = ref<HTMLElement>()

onMounted(async () => {
  try {
    const data: any = await getStats()
    Object.assign(stats, data)
    renderCharts()
  } catch (e) {
    ElMessage.error('加载统计数据失败')
  }
})

const renderCharts = () => {
  // 简历趋势图
  if (chartResume.value && stats.resumes_trend && stats.resumes_trend.length > 0) {
    const chart = echarts.init(chartResume.value)
    chart.setOption({
      title: { text: '近7天简历趋势', left: 'center' },
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', boundaryGap: false, data: stats.resumes_trend.map((i: any) => i.date) },
      yAxis: { type: 'value' },
      series: [{
        data: stats.resumes_trend.map((i: any) => i.count),
        type: 'line',
        areaStyle: { opacity: 0.3 },
        smooth: true
      }]
    })
  } else if (chartResume.value) {
    // 空状态
    echarts.init(chartResume.value).setOption({
      title: { text: '近7天简历趋势', left: 'center', textStyle: { color: '#ccc' } },
      graphic: [{ type: 'text', left: 'center', top: 'middle', style: { text: '暂无数据', fill: '#999' } }]
    })
  }

  // 面试状态饼图
  if (chartInterview.value && stats.interview_status_counts && stats.interview_status_counts.length > 0) {
    const chart = echarts.init(chartInterview.value)
    chart.setOption({
      title: { text: '面试状态分布', left: 'center' },
      tooltip: { trigger: 'item' },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
        data: stats.interview_status_counts.map((i: any) => ({ name: i.status, value: i.count }))
      }]
    })
  } else if (chartInterview.value) {
    echarts.init(chartInterview.value).setOption({
      title: { text: '面试状态分布', left: 'center', textStyle: { color: '#ccc' } },
      graphic: [{ type: 'text', left: 'center', top: 'middle', style: { text: '暂无数据', fill: '#999' } }]
    })
  }
}
</script>
