<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="panel">
      <!-- 标题栏 -->
      <div class="panel-header">
        <span class="panel-title">记录饮食</span>
        <button class="close-btn" @click="$emit('close')">&times;</button>
      </div>

      <!-- 餐次选择 + 搜索 -->
      <div class="panel-toolbar">
        <select v-model="mealType" class="meal-select">
          <option value="breakfast">早餐</option>
          <option value="lunch">午餐</option>
          <option value="dinner">晚餐</option>
          <option value="snack">加餐</option>
        </select>
        <input
          v-model="query"
          class="search-input"
          placeholder="搜索食物..."
          @input="search"
          autofocus
        />
      </div>

      <!-- 搜索结果 -->
      <div class="results" v-if="query && results.length">
        <div v-for="food in results" :key="food.name" class="result-item" @click="addFood(food)">
          <div>
            <div class="result-name">🥘 {{ food.name }}</div>
            <div class="result-info">
              {{ food.kcal }}千卡 · 蛋白{{ food.protein }}g · 脂肪{{ food.fat }}g · 碳水{{ food.carbs }}g /100g
            </div>
          </div>
          <span class="result-add">+</span>
        </div>
      </div>

      <!-- 搜索前推荐 -->
      <div v-if="!query" class="recommend-section">
        <div class="recommend-title">🔥 热门推荐</div>
        <div class="recommend-grid">
          <div v-for="food in recommendFoods" :key="food.name" class="recommend-item" @click="addFood(food)">
            <div class="recommend-emoji">{{ food.icon }}</div>
            <div class="recommend-name">{{ food.name }}</div>
            <div class="recommend-kcal">{{ food.kcal }}千卡</div>
          </div>
        </div>
        <div class="recommend-divider">— 或搜索食物 —</div>

        <!-- 全部分类食物列表 -->
        <div v-for="cat in foodCategories" :key="cat.label" class="food-category">
          <div class="category-label">{{ cat.icon }} {{ cat.label }}</div>
          <div class="category-foods">
            <span
              v-for="name in cat.foods" :key="name"
              class="category-tag"
              @click="selectByName(name)"
            >{{ name }}</span>
          </div>
        </div>
      </div>

      <!-- 空结果 -->
      <div v-if="query && !results.length" class="search-hint">
        <div class="search-hint-icon">😕</div>
        <div>没找到"{{ query }}"，试试其他关键词</div>
      </div>

      <!-- 已选食物 -->
      <div v-if="selected.length" class="selected-section">
        <div class="selected-title">已选食物</div>
        <div v-for="(item, i) in selected" :key="i" class="selected-item">
          <span class="selected-name">{{ item.name }}</span>
          <div class="selected-controls">
            <input
              v-model.number="item.grams"
              type="number"
              class="gram-input"
              min="10"
              max="5000"
            />
            <span class="gram-unit">g</span>
            <span class="gram-kcal">{{ Math.round(item.kcal * item.grams / 100) }}千卡</span>
            <button class="remove-btn" @click="selected.splice(i, 1)">&times;</button>
          </div>
        </div>
      </div>

      <!-- 底部按钮 -->
      <div v-if="selected.length" class="confirm-bar">
        <button class="cancel-btn" @click="cancel">取消</button>
        <button class="confirm-btn" @click="confirm">
          记录 {{ totalKcal }} 千卡
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { foodApi } from '../api/index.js'

const emit = defineEmits(['close'])
const query = ref('')
const mealType = ref('lunch')
const selected = ref([])

// 内置食物数据库（API 不可用时的备选）
const foodDB = [
  // 主食
  { name: '米饭(熟)', kcal: 116, protein: 2.6, fat: 0.3, carbs: 25.6 },
  { name: '馒头', kcal: 223, protein: 7.0, fat: 1.1, carbs: 44.2 },
  { name: '全麦面包', kcal: 246, protein: 8.5, fat: 3.4, carbs: 43.6 },
  { name: '面条(煮)', kcal: 110, protein: 3.2, fat: 0.3, carbs: 22.3 },
  { name: '小米粥', kcal: 46, protein: 1.4, fat: 0.7, carbs: 8.4 },
  { name: '红薯', kcal: 86, protein: 1.6, fat: 0.1, carbs: 20.1 },
  // 肉类/蛋白质
  { name: '煮鸡蛋', kcal: 144, protein: 13.3, fat: 8.8, carbs: 2.8 },
  { name: '鸡胸肉', kcal: 133, protein: 31.0, fat: 1.2, carbs: 0 },
  { name: '牛排', kcal: 131, protein: 22.3, fat: 4.5, carbs: 0.6 },
  { name: '三文鱼', kcal: 139, protein: 17.2, fat: 7.8, carbs: 0 },
  { name: '猪瘦肉', kcal: 143, protein: 20.3, fat: 6.2, carbs: 1.5 },
  { name: '豆腐', kcal: 76, protein: 8.1, fat: 3.7, carbs: 2.8 },
  { name: '宫保鸡丁', kcal: 174, protein: 16.7, fat: 11.2, carbs: 3.5 },
  // 蔬菜
  { name: '西兰花', kcal: 34, protein: 2.8, fat: 0.4, carbs: 6.6 },
  { name: '凉拌黄瓜', kcal: 23, protein: 1.2, fat: 0.2, carbs: 4.2 },
  { name: '蒸南瓜', kcal: 22, protein: 0.7, fat: 0.1, carbs: 4.6 },
  { name: '西红柿', kcal: 18, protein: 0.9, fat: 0.2, carbs: 3.9 },
  { name: '菠菜', kcal: 24, protein: 2.6, fat: 0.3, carbs: 4.5 },
  { name: '胡萝卜', kcal: 37, protein: 1.0, fat: 0.2, carbs: 8.8 },
  { name: '炒青菜', kcal: 42, protein: 2.5, fat: 2.8, carbs: 3.5 },
  // 水果
  { name: '苹果', kcal: 53, protein: 0.2, fat: 0.2, carbs: 13.5 },
  { name: '香蕉', kcal: 93, protein: 1.4, fat: 0.2, carbs: 20.8 },
  { name: '橙子', kcal: 47, protein: 0.8, fat: 0.2, carbs: 11.1 },
  { name: '葡萄', kcal: 67, protein: 0.7, fat: 0.2, carbs: 16.0 },
  { name: '西瓜', kcal: 30, protein: 0.6, fat: 0.1, carbs: 6.8 },
  // 饮品/零食
  { name: '牛奶(全脂)', kcal: 61, protein: 3.0, fat: 3.2, carbs: 4.8 },
  { name: '豆浆', kcal: 33, protein: 2.4, fat: 1.3, carbs: 2.9 },
  { name: '酸奶', kcal: 72, protein: 2.5, fat: 2.7, carbs: 9.3 },
  { name: '薯片', kcal: 536, protein: 6.3, fat: 35.0, carbs: 53.0 },
  { name: '黑巧克力', kcal: 546, protein: 4.9, fat: 31.3, carbs: 61.0 },
]

const results = ref([])

// 推荐食物
const recommendFoods = ref([
  { name: '煮鸡蛋', icon: '🥚', kcal: 144, protein: 13.3, fat: 8.8, carbs: 2.8 },
  { name: '鸡胸肉', icon: '🍗', kcal: 133, protein: 31.0, fat: 1.2, carbs: 0 },
  { name: '米饭(熟)', icon: '🍚', kcal: 116, protein: 2.6, fat: 0.3, carbs: 25.6 },
  { name: '全麦面包', icon: '🍞', kcal: 246, protein: 8.5, fat: 3.4, carbs: 43.6 },
  { name: '牛奶(全脂)', icon: '🥛', kcal: 61, protein: 3.0, fat: 3.2, carbs: 4.8 },
  { name: '面条(煮)', icon: '🍝', kcal: 110, protein: 3.2, fat: 0.3, carbs: 22.3 },
  { name: '西兰花', icon: '🥦', kcal: 34, protein: 2.8, fat: 0.4, carbs: 6.6 },
  { name: '馒头', icon: '🥟', kcal: 223, protein: 7.0, fat: 1.1, carbs: 44.2 },
])

// 分类食物列表（显示全部可选项）
const foodCategories = [
  { label: '主食', icon: '🍙', foods: ['米饭(熟)', '馒头', '全麦面包', '面条(煮)', '小米粥', '红薯'] },
  { label: '肉蛋', icon: '🥩', foods: ['煮鸡蛋', '鸡胸肉', '牛排', '三文鱼', '猪瘦肉', '宫保鸡丁'] },
  { label: '素菜', icon: '🥬', foods: ['西兰花', '凉拌黄瓜', '蒸南瓜', '西红柿', '菠菜', '胡萝卜', '炒青菜', '豆腐'] },
  { label: '水果', icon: '🍎', foods: ['苹果', '香蕉', '橙子', '葡萄', '西瓜'] },
  { label: '饮品', icon: '☕', foods: ['牛奶(全脂)', '豆浆', '酸奶'] },
  { label: '零食', icon: '🍪', foods: ['薯片', '黑巧克力'] },
]

const search = async () => {
  if (!query.value) { results.value = []; return }
  // 优先用 API，失败则用本地数据
  try {
    results.value = await foodApi.search(query.value)
  } catch {
    const q = query.value.toLowerCase()
    results.value = foodDB.filter(f => f.name.includes(q))
  }
}

const addFood = (food) => {
  selected.value.push({ ...food, grams: 100 })
  query.value = ''
  results.value = []
}

// 按名称从本地数据库查找并添加
const selectByName = (name) => {
  const found = foodDB.find(f => f.name === name)
  if (found) addFood(found)
}

const totalKcal = computed(() => {
  return Math.round(selected.value.reduce((s, f) => s + f.kcal * f.grams / 100, 0))
})

const cancel = () => {
  selected.value = []
  emit('close')
}

const confirm = () => {
  // 获取 mealType，添加到对应餐次
  const type = mealType.value
  const e = new CustomEvent('add-diet', {
    detail: { meal_type: type, foods: selected.value.map(f => ({ ...f })) }
  })
  window.dispatchEvent(e)
  selected.value = []
  emit('close')
}
</script>

<style scoped>
.overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.35); z-index: 100;
  display: flex; align-items: flex-end; justify-content: center;
}
.panel {
  width: 100%; max-width: 420px; background: #fff;
  border-radius: 20px 20px 0 0; max-height: 80vh;
  display: flex; flex-direction: column; overflow: hidden;
}
.panel-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 20px 10px;
}
.panel-title { font-size: 17px; font-weight: 600; }
.close-btn { background: none; border: none; font-size: 24px; color: #999; cursor: pointer; }
.panel-toolbar { display: flex; gap: 8px; padding: 0 20px 12px; }
.meal-select {
  padding: 8px 12px; border: 1px solid #ddd; border-radius: 10px;
  font-size: 14px; background: #fff; flex-shrink: 0;
}
.search-input {
  flex: 1; padding: 8px 14px; border: 1px solid #ddd; border-radius: 10px;
  font-size: 14px; outline: none; background: #f8f8f8;
}
.search-input:focus { border-color: #4CAF50; background: #fff; }
.results { flex: 1; overflow-y: auto; padding: 0 20px; min-height: 0; }
.result-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 0; border-bottom: 1px solid #f0f0f0; cursor: pointer;
}
.result-item:active { background: #f9f9f9; margin: 0 -20px; padding: 12px 20px; }
.result-name { font-size: 14px; font-weight: 500; }
.result-info { font-size: 11px; color: #999; margin-top: 2px; }
.result-add {
  width: 26px; height: 26px; border-radius: 50%; background: #4CAF50;
  color: #fff; display: flex; align-items: center; justify-content: center;
  font-size: 18px; flex-shrink: 0;
}
.search-hint { text-align: center; padding: 30px 20px; color: #bbb; }
.search-hint-icon { font-size: 36px; margin-bottom: 8px; }
.recommend-section { padding: 0 20px; overflow-y: auto; flex: 1; }
.recommend-title { font-size: 13px; font-weight: 600; color: #888; margin-bottom: 12px; }
.recommend-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
.recommend-item {
  display: flex; flex-direction: column; align-items: center; padding: 12px 6px;
  background: #f8f8f8; border-radius: 12px; cursor: pointer; transition: background 0.2s;
}
.recommend-item:active { background: #e8f5e9; }
.recommend-emoji { font-size: 28px; margin-bottom: 4px; }
.recommend-name { font-size: 12px; color: #555; margin-bottom: 2px; }
.recommend-kcal { font-size: 11px; color: #999; }
.recommend-divider { text-align: center; font-size: 12px; color: #ccc; padding: 8px 0; }
.food-category { margin-bottom: 12px; }
.category-label { font-size: 13px; font-weight: 600; color: #666; margin-bottom: 6px; }
.category-foods { display: flex; flex-wrap: wrap; gap: 6px; }
.category-tag {
  padding: 5px 12px; background: #f0f0f0; border-radius: 14px;
  font-size: 12px; color: #555; cursor: pointer; transition: all 0.15s;
}
.category-tag:active { background: #e8f5e9; color: #4CAF50; }
.selected-section { border-top: 1px solid #f0f0f0; padding: 12px 20px; overflow-y: auto; max-height: 200px; }
.selected-title { font-size: 13px; font-weight: 600; margin-bottom: 8px; color: #666; }
.selected-item {
  display: flex; align-items: center; justify-content: space-between; padding: 6px 0;
}
.selected-name { font-size: 13px; flex: 1; }
.selected-controls { display: flex; align-items: center; gap: 6px; }
.gram-input { width: 50px; padding: 4px 6px; border: 1px solid #ddd; border-radius: 6px; font-size: 13px; text-align: center; }
.gram-unit { font-size: 12px; color: #999; }
.gram-kcal { font-size: 13px; font-weight: 600; color: #388E3C; min-width: 50px; text-align: right; }
.remove-btn { background: none; border: none; color: #F44336; font-size: 20px; cursor: pointer; }
.confirm-bar {
  display: flex; gap: 10px; padding: 14px 20px;
  border-top: 1px solid #f0f0f0;
}
.cancel-btn {
  flex: 1; padding: 12px; border: 1px solid #ddd; border-radius: 12px;
  background: #fff; font-size: 15px; cursor: pointer;
}
.confirm-btn {
  flex: 2; padding: 12px; border: none; border-radius: 12px;
  background: #4CAF50; color: #fff; font-size: 15px; font-weight: 600; cursor: pointer;
}
</style>
