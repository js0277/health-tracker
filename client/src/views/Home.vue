<template>
  <div class="page">
    <!-- 顶部 -->
    <div class="header">
      <div class="header-title">轻食记</div>
      <!-- 日期选择器 -->
      <div class="date-bar">
        <button class="date-nav" @click="shiftDate(-1)" title="前一天">&lt;</button>
        <div class="date-selector" @click="openDatePicker">
          <span class="date-icon">&#128197;</span>
          <span class="date-text">{{ selectedDateLabel }}</span>
        </div>
        <button class="date-nav" @click="shiftDate(1)" title="后一天">&gt;</button>
      </div>
      <input
        ref="dateInput"
        type="date"
        :value="selectedDate"
        @change="onDateChange"
        class="hidden-date-input"
      />

      <!-- 热量环 -->
      <div class="calorie-ring-wrap">
        <CalorieRing :eaten="totalKcal" :target="targetKcal" />
        <div class="ring-side">
          <div class="ring-side-label">还可摄入</div>
          <div class="ring-side-val">{{ Math.max(0, Math.round(targetKcal - totalKcal)) }}</div>
          <div class="ring-side-unit">千卡</div>
        </div>
      </div>

      <!-- 营养素 -->
      <div class="nutrient-row">
        <div class="nutrient-item">
          <div class="nutrient-val">{{ totalProtein }}g</div>
          <div class="nutrient-label">蛋白质</div>
        </div>
        <div class="nutrient-item">
          <div class="nutrient-val">{{ totalFat }}g</div>
          <div class="nutrient-label">脂肪</div>
        </div>
        <div class="nutrient-item">
          <div class="nutrient-val">{{ totalCarbs }}g</div>
          <div class="nutrient-label">碳水</div>
        </div>
      </div>
    </div>

    <!-- 饮食记录 -->
    <div class="section">
      <div class="section-title">饮食记录</div>

      <div class="empty-hint" v-if="allMealsEmpty">
        <div class="empty-icon">🍽️</div>
        <div class="empty-text">还没有记录，点击底部 + 开始吧</div>
      </div>

      <MealCard
        v-for="meal in meals" :key="meal.type"
        :meal="meal"
        @click="openMealAdd(meal.type)"
        @delete="handleDeleteFood"
      />
    </div>

    <!-- 目标设置引导 -->
    <GoalSetup :visible="showGoalSetup" @done="onGoalDone" />

    <!-- 修改目标按钮 -->
    <div class="edit-goal-btn" v-if="!showGoalSetup && goalInfo" @click="showGoalSetup = true">
      {{ goalInfo.mode === 'lose' ? '📉' : goalInfo.mode === 'gain' ? '📈' : '⚖️' }}
      {{ goalInfo.weight_diff > 0 ? '+' : '' }}{{ goalInfo.weight_diff }}kg · {{ goalInfo.diff_days }}天
      <span class="edit-icon">✏️</span>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CalorieRing from '../components/CalorieRing.vue'
import MealCard from '../components/MealCard.vue'
import GoalSetup from '../components/GoalSetup.vue'
import { dietApi, authApi } from '../api/index.js'
import { store } from '../store.js'

const route = useRoute()
const router = useRouter()

// 日期选择
const dateInput = ref(null)
const selectedDate = ref(new Date().toISOString().slice(0, 10))

const selectedDateLabel = computed(() => {
  const d = new Date(selectedDate.value)
  const today = new Date()
  const isToday = d.toDateString() === today.toDateString()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday = d.toDateString() === yesterday.toDateString()
  const prefix = isToday ? '今天' : isYesterday ? '昨天' : ''
  const weekDay = ['日','一','二','三','四','五','六'][d.getDay()]
  const dateStr = `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日 周${weekDay}`
  return prefix ? `${prefix} · ${dateStr}` : dateStr
})

function openDatePicker() {
  dateInput.value?.showPicker()
}

function shiftDate(days) {
  const d = new Date(selectedDate.value)
  d.setDate(d.getDate() + days)
  selectedDate.value = d.toISOString().slice(0, 10)
  loadByDate()
  window.__selectedDate = selectedDate.value
}

function onDateChange(e) {
  selectedDate.value = e.target.value
  loadByDate()
  window.__selectedDate = selectedDate.value
}

const targetKcal = ref(2000)
const showGoalSetup = ref(false)
const goalInfo = ref(null)

const meals = ref([
  { type: 'breakfast', label: '早餐', emoji: '🌅', foods: [] },
  { type: 'lunch', label: '午餐', emoji: '☀️', foods: [] },
  { type: 'dinner', label: '晚餐', emoji: '🌙', foods: [] },
  { type: 'snack', label: '加餐', emoji: '🍎', foods: [] },
])

// 检查用户是否已设置目标
async function checkUserProfile() {
  try {
    const res = await authApi.me()
    const u = res.user
    // 已有 target_kcal 则使用
    if (u.target_kcal && u.target_kcal > 0) {
      targetKcal.value = u.target_kcal
      store.targetKcal = u.target_kcal
    }
    // 检查是否设置了完整目标
    if (!u.weight || !u.target_weight || !u.target_date) {
      showGoalSetup.value = true
    } else {
      // 有目标信息，计算展示
      const now = new Date(); now.setHours(0,0,0,0)
      const target = new Date(u.target_date); target.setHours(0,0,0,0)
      const diffDays = Math.max(1, Math.ceil((target - now) / 86400000))
      const weightDiff = Math.round((u.target_weight - u.weight) * 10) / 10
      goalInfo.value = {
        weight_diff: weightDiff,
        diff_days: diffDays,
        mode: weightDiff < 0 ? 'lose' : weightDiff > 0 ? 'gain' : 'maintain',
      }
    }
  } catch (e) {
    console.log('获取用户信息失败', e)
  }
}

// 目标设置完成回调
function onGoalDone(result) {
  if (result.target_kcal) {
    targetKcal.value = result.target_kcal
    store.targetKcal = result.target_kcal
  }
  showGoalSetup.value = false
  goalInfo.value = {
    weight_diff: result.weight_diff,
    diff_days: result.diff_days,
    mode: result.mode,
  }
  // 刷新饮食数据
  loadByDate()
}

// 从 API 加载指定日期数据
async function loadByDate() {
  try {
    const data = await dietApi.getToday(selectedDate.value)
    meals.value.forEach(m => {
      m.foods = (data[m.type] || []).map(item => ({
        id: item.id,
        food_id: item.food_id,
        name: item.food_name,
        grams: item.grams,
        kcal: item.kcal,
        protein: item.protein,
        fat: item.fat,
        carbs: item.carbs,
      }))
    })
  } catch (e) {
    console.log('API 未连接，使用本地数据')
  }
}

// 初始化
window.__selectedDate = selectedDate.value
onMounted(() => {
  loadByDate()
  checkUserProfile()
  // 从 Mine 页面跳转过来编辑目标
  if (route.query.editGoal) {
    showGoalSetup.value = true
    router.replace('/home')
  }
})

// 监听食物添加事件 -> 调用 API
const handleAddDiet = async (e) => {
  try {
    await dietApi.addRecord({ ...e.detail, record_date: selectedDate.value })
    await loadByDate()
  } catch (err) {
    console.error('添加失败:', err)
  }
}
onMounted(() => window.addEventListener('add-diet', handleAddDiet))
onUnmounted(() => window.removeEventListener('add-diet', handleAddDiet))

// 总计
// API 返回的 kcal/protein/fat/carbs 已经是按克数算好的总值，直接加和即可
const totalKcal = computed(() => Math.round(meals.value.reduce((s, m) => s + m.foods.reduce((a, f) => a + f.kcal, 0), 0)))
const totalProtein = computed(() => Math.round(meals.value.reduce((s, m) => s + m.foods.reduce((a, f) => a + f.protein, 0), 0)))
const totalFat = computed(() => Math.round(meals.value.reduce((s, m) => s + m.foods.reduce((a, f) => a + f.fat, 0), 0)))
const totalCarbs = computed(() => Math.round(meals.value.reduce((s, m) => s + m.foods.reduce((a, f) => a + f.carbs, 0), 0)))

const allMealsEmpty = computed(() => meals.value.every(m => m.foods.length === 0))

// 打开添加面板
const openMealAdd = (mealType) => {
  window.__addMealType = mealType
  document.querySelector('.tab-add-btn')?.click()
}

// 删除单条食物
const handleDeleteFood = async (foodId) => {
  try {
    await dietApi.deleteItem(foodId)
    await loadByDate()
  } catch (err) {
    console.error('删除失败:', err)
  }
}
</script>

<style scoped>
.page { position: relative; }
.header {
  background: linear-gradient(135deg, #43A047, #66BB6A);
  color: #fff; padding: 20px 20px 30px;
  border-radius: 0 0 24px 24px;
}
.header-title { font-size: 18px; font-weight: 600; margin-bottom: 10px; }
.date-bar {
  display: flex; align-items: center; justify-content: center; gap: 10px;
}
.date-nav {
  width: 32px; height: 32px; border-radius: 50%; border: none;
  background: rgba(255,255,255,0.25); color: #fff;
  font-size: 16px; font-weight: 600; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.15s;
}
.date-nav:active { background: rgba(255,255,255,0.4); }
.date-selector {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 16px; border-radius: 20px;
  background: rgba(255,255,255,0.2);
  cursor: pointer; user-select: none; transition: background 0.15s;
}
.date-selector:active { background: rgba(255,255,255,0.35); }
.date-icon { font-size: 15px; }
.date-text { font-size: 14px; font-weight: 500; white-space: nowrap; }
.hidden-date-input {
  position: absolute; opacity: 0; width: 0; height: 0; pointer-events: none;
}
.calorie-ring-wrap {
  display: flex; align-items: center; justify-content: center;
  margin-top: 16px; gap: 22px;
}
.ring-side { text-align: center; }
.ring-side-label { font-size: 13px; opacity: 0.8; }
.ring-side-val { font-size: 28px; font-weight: 700; }
.ring-side-unit { font-size: 12px; opacity: 0.7; }
.nutrient-row {
  display: flex; justify-content: space-around; margin-top: 14px;
}
.nutrient-item { text-align: center; }
.nutrient-val { font-size: 18px; font-weight: 600; }
.nutrient-label { font-size: 11px; opacity: 0.75; }
.section { padding: 0 16px; margin-top: 12px; }
.section-title { font-size: 15px; font-weight: 600; margin: 12px 0 8px; }
.empty-hint { text-align: center; padding: 40px 0; color: #aaa; }
.empty-icon { font-size: 48px; margin-bottom: 10px; }
.empty-text { font-size: 14px; }
.edit-goal-btn {
  margin: 8px 16px 20px; padding: 10px 14px;
  background: #E8F5E9; border-radius: 10px;
  font-size: 13px; color: #388E3C; font-weight: 500;
  display: flex; align-items: center; gap: 4px; cursor: pointer;
}
.edit-goal-btn:active { background: #C8E6C9; }
.edit-icon { margin-left: auto; font-size: 12px; opacity: 0.7; }
</style>
