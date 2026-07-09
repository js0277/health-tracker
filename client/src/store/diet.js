import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useDietStore = defineStore('diet', () => {
  const today = ref({
    target: 2000,
    eaten: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
  })

  const meals = ref([
    { type: 'breakfast', label: '早餐', emoji: '🌅', foods: [], totalKcal: 0 },
    { type: 'lunch', label: '午餐', emoji: '☀️', foods: [], totalKcal: 0 },
    { type: 'dinner', label: '晚餐', emoji: '🌙', foods: [], totalKcal: 0 },
    { type: 'snack', label: '加餐', emoji: '🍎', foods: [], totalKcal: 0 },
  ])

  const remaining = computed(() => today.value.target - today.value.eaten)

  const percent = computed(() => {
    const p = today.value.eaten / today.value.target * 100
    return Math.min(Math.round(p), 100)
  })

  // 模拟今日数据
  function loadMockData() {
    meals.value = [
      { type: 'breakfast', label: '早餐 (7:30)', emoji: '🌅', foods: ['全麦面包', '煮鸡蛋', '牛奶'], totalKcal: 380 },
      { type: 'lunch', label: '午餐 (12:00)', emoji: '☀️', foods: ['米饭', '鸡胸肉', '西兰花'], totalKcal: 580 },
      { type: 'dinner', label: '晚餐', emoji: '🌙', foods: [], totalKcal: 0 },
      { type: 'snack', label: '加餐', emoji: '🍎', foods: ['苹果'], totalKcal: 116 },
    ]
    today.value = {
      target: 2000,
      eaten: 1076,
      protein: 62,
      fat: 28,
      carbs: 145,
    }
  }

  // TODO: 替换为真实 API 调用
  // async function fetchToday() {
  //   const res = await dietApi.getToday()
  //   today.value = res.today
  //   meals.value = res.meals
  // }

  return { today, meals, remaining, percent, loadMockData }
})
