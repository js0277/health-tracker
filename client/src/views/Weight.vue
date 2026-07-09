<template>
  <div class="page" style="padding: 0 16px;">
    <div style="padding:20px 0 10px;font-size:18px;font-weight:600;">📊 体重趋势</div>

    <!-- 图表区 -->
    <div class="chart-card">
      <div class="empty-weight" v-if="!weightData.length">
        <div class="empty-icon">📉</div>
        <div class="empty-text">还没有体重记录</div>
        <div class="empty-sub">记录你的第一条体重数据吧</div>
      </div>

      <template v-else>
      <div class="chart-bars">
        <div v-for="w in weightData" :key="w.date" class="bar-wrap">
          <div class="bar-val">{{ w.weight }}</div>
          <div
            class="bar"
            :class="{ current: w.date === '今日' }"
            :style="{ height: (w.weight / maxWeight * 140) + 'px' }"
          ></div>
          <div class="bar-date">{{ w.date }}</div>
        </div>
      </div>

      <div class="stats">
        <div class="stat-item">
          <div class="stat-val">{{ currentWeight }} kg</div>
          <div class="stat-label">当前体重</div>
        </div>
        <div class="stat-item">
          <div class="stat-val">{{ bmi }}</div>
          <div class="stat-label">BMI</div>
        </div>
        <div class="stat-item">
          <div class="stat-val" :class="{ down: weightChangeNum < 0, up: weightChangeNum > 0 }">{{ weightChange }} kg</div>
          <div class="stat-label">近7天变化</div>
        </div>
      </div>
      </template>
    </div>

    <!-- 添加体重 -->
    <div class="section-title" style="margin-top:20px;">📝 记录体重</div>
    <div class="add-weight">
      <input v-model="newWeight" type="number" step="0.1" placeholder="输入今日体重" class="weight-input" />
      <button class="add-btn" @click="addWeight" :disabled="!newWeight">记录</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { store, addWeightRecord } from '../store.js'

const weightData = computed(() => store.weightRecords)
const newWeight = ref('')

const currentWeight = computed(() => {
  const records = weightData.value
  return records.length ? records[records.length - 1].weight : '--'
})

const bmi = computed(() => {
  if (currentWeight.value === '--') return '--'
  return (currentWeight.value / 1.7 / 1.7).toFixed(1)
})

const maxWeight = computed(() => {
  const records = weightData.value
  if (!records.length) return 70
  const max = Math.max(...records.map(w => w.weight))
  return Math.ceil(max / 10) * 10 || 70
})

const weightChangeNum = computed(() => {
  const records = weightData.value
  if (records.length < 2) return 0
  return records[records.length - 1].weight - records[0].weight
})

const weightChange = computed(() => {
  const change = weightChangeNum.value
  return (change > 0 ? '+' : '') + change.toFixed(1)
})

const addWeight = () => {
  const w = parseFloat(newWeight.value)
  if (!w) return
  const today = new Date()
  const dateStr = `${today.getMonth()+1}-${('0'+today.getDate()).slice(-2)}`
  addWeightRecord({ date: dateStr, weight: w })
  newWeight.value = ''
}
</script>

<style scoped>
.page { padding-bottom: 20px; }
.chart-card { background: #fff; border-radius: 16px; padding: 20px; margin-top: 12px; }
.empty-weight { text-align: center; padding: 30px 0; color: #aaa; }
.empty-icon { font-size: 42px; margin-bottom: 10px; }
.empty-text { font-size: 15px; margin-bottom: 4px; }
.empty-sub { font-size: 12px; color: #ccc; }
.chart-bars { display: flex; align-items: flex-end; gap: 8px; height: 170px; padding: 0 8px; }
.bar-wrap { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; }
.bar-val { font-size: 10px; color: #999; }
.bar {
  width: 100%; max-width: 30px; background: linear-gradient(180deg, #81C784, #C8E6C9);
  border-radius: 6px 6px 0 0; transition: height 0.4s;
}
.bar.current { background: linear-gradient(180deg, #388E3C, #66BB6A); }
.bar-date { font-size: 9px; color: #999; white-space: nowrap; }
.stats {
  display: flex; justify-content: space-around; margin-top: 16px;
  padding-top: 16px; border-top: 1px solid #f0f0f0;
}
.stat-item { text-align: center; }
.stat-val { font-size: 20px; font-weight: 700; color: #388E3C; }
.stat-val.change.down { color: #4CAF50; }
.stat-val.change.up { color: #F44336; }
.stat-label { font-size: 11px; color: #999; margin-top: 2px; }
.add-weight { display: flex; gap: 10px; margin-top: 8px; }
.weight-input {
  flex: 1; padding: 12px 14px; border: 1px solid #ddd; border-radius: 12px;
  font-size: 16px; outline: none;
}
.weight-input:focus { border-color: #4CAF50; }
.add-btn {
  padding: 12px 24px; border: none; border-radius: 12px;
  background: #4CAF50; color: #fff; font-size: 15px; font-weight: 600; cursor: pointer;
}
.add-btn:disabled { background: #ccc; }
.section-title { font-size: 15px; font-weight: 600; }
</style>
