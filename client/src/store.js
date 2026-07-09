import { reactive } from 'vue'

// 全局状态
export const store = reactive({
  // 用户认证
  isLoggedIn: !!localStorage.getItem('token'),
  user: JSON.parse(localStorage.getItem('user') || 'null'),

  // 饮食记录
  meals: [
    { type: 'breakfast', label: '早餐', emoji: '🌅', foods: [] },
    { type: 'lunch', label: '午餐', emoji: '☀️', foods: [] },
    { type: 'dinner', label: '晚餐', emoji: '🌙', foods: [] },
    { type: 'snack', label: '加餐', emoji: '🍎', foods: [] },
  ],

  // 体重记录
  weightRecords: [],

  // 用户设置
  targetKcal: 2000,
})

// 登录
export function login(token, user) {
  localStorage.setItem('token', token)
  localStorage.setItem('user', JSON.stringify(user))
  store.isLoggedIn = true
  store.user = user
}

// 登出
export function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  store.isLoggedIn = false
  store.user = null
  store.meals.forEach(m => m.foods = [])
  store.weightRecords = []
}

// 添加食物到指定餐次
export function addFoodToMeal(mealType, foods) {
  const meal = store.meals.find(m => m.type === mealType)
  if (meal) {
    meal.foods.push(...foods)
  }
}

// 添加体重记录
export function addWeightRecord(record) {
  store.weightRecords.push(record)
}
