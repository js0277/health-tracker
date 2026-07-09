<template>
  <div>
    <h2 style="margin-bottom:16px;">📋 饮食记录</h2>

    <el-card shadow="hover">
      <div style="display:flex;gap:12px;margin-bottom:16px;">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          style="width:280px;"
          @change="fetchRecords"
        />
        <el-input v-model="keyword" placeholder="搜索用户..." style="width:200px;" clearable @clear="fetchRecords" @keyup.enter="fetchRecords" />
        <el-button type="primary" @click="fetchRecords">查询</el-button>
      </div>

      <el-table :data="records" border stripe v-loading="loading">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="user" label="用户" width="120" />
        <el-table-column prop="mealType" label="餐次" width="90">
          <template #default="{ row }">
            <el-tag size="small" :type="mealTag(row.mealType)">{{ row.mealType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="foods" label="食物" min-width="250" />
        <el-table-column prop="kcal" label="热量(千卡)" width="110" sortable />
        <el-table-column prop="date" label="日期" width="120" sortable />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const dateRange = ref([])
const keyword = ref('')
const records = ref([])
const loading = ref(false)

const mealTag = (type) => {
  const map = { '早餐': '', '午餐': 'warning', '晚餐': 'danger', '加餐': 'success' }
  return map[type] || ''
}

const fetchRecords = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams()
    if (dateRange.value && dateRange.value.length === 2) {
      const [start, end] = dateRange.value
      const fmt = (d) => {
        const y = d.getFullYear()
        const m = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        return `${y}-${m}-${day}`
      }
      params.set('dateFrom', fmt(start))
      params.set('dateTo', fmt(end))
    }
    if (keyword.value) params.set('keyword', keyword.value)

    const res = await fetch(`/api/admin/records?${params}`)
    const data = await res.json()
    records.value = data
  } catch (e) {
    ElMessage.error('加载记录失败')
  } finally {
    loading.value = false
  }
}

onMounted(fetchRecords)
</script>
