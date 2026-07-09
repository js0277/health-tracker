<template>
  <div>
    <h2 style="margin-bottom:20px;">📊 数据看板</h2>

    <!-- 概览卡片 -->
    <el-row :gutter="20" style="margin-bottom:20px;">
      <el-col :span="6" v-for="card in statsCards" :key="card.label">
        <el-card shadow="hover" v-loading="loading" element-loading-text="加载中...">
          <div style="text-align:center;">
            <div style="font-size:13px;color:#888;">{{ card.label }}</div>
            <div :style="{ fontSize:'28px',fontWeight:'700',color:card.color,marginTop:'8px' }">{{ card.value }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表 -->
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>近7天热量摄入趋势</template>
          <div ref="calorieChart" style="height:300px;"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>用户体重变化分布</template>
          <div ref="weightChart" style="height:300px;"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import * as echarts from 'echarts'

const loading = ref(true)
const statsCards = ref([
  { label: '总用户数', value: '-', color: '#409EFF' },
  { label: '今日记录', value: '-', color: '#4CAF50' },
  { label: '食物库条目', value: '-', color: '#FF9800' },
  { label: '日均摄入(千卡)', value: '-', color: '#E91E63' },
])

const calorieChart = ref(null)
const weightChart = ref(null)

onMounted(async () => {
  try {
    // 并行请求统计数据 + 趋势 + 分布
    const [statsRes, trendRes, weightRes] = await Promise.all([
      fetch('/api/admin/stats'),
      fetch('/api/admin/calorie-trend'),
      fetch('/api/admin/weight-distribution'),
    ])

    const stats = await statsRes.json()
    const trend = await trendRes.json()
    const weightDist = await weightRes.json()

    // 更新概览卡片
    statsCards.value = [
      { label: '总用户数', value: String(stats.userCount), color: '#409EFF' },
      { label: '今日记录', value: String(stats.todayRecords), color: '#4CAF50' },
      { label: '食物库条目', value: String(stats.foodCount), color: '#FF9800' },
      { label: '日均摄入(千卡)', value: String(stats.avgKcal), color: '#E91E63' },
    ]

    // 热量趋势图
    const cChart = echarts.init(calorieChart.value)
    cChart.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: { data: trend.dates },
      yAxis: { name: '千卡' },
      series: [{
        data: trend.values,
        type: 'line',
        smooth: true,
        areaStyle: { color: 'rgba(76,175,80,0.15)' },
        lineStyle: { color: '#4CAF50', width: 3 },
        itemStyle: { color: '#4CAF50' },
      }],
    })

    // 体重分布
    const wChart = echarts.init(weightChart.value)
    wChart.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: weightDist.map(d => d.label) },
      yAxis: { type: 'value', name: '人数' },
      series: [{
        data: weightDist.map(d => d.count),
        type: 'bar',
        itemStyle: { color: '#4CAF50', borderRadius: [6, 6, 0, 0] },
      }],
    })
  } catch (e) {
    console.error('加载数据看板失败:', e)
  } finally {
    loading.value = false
  }
})
</script>
