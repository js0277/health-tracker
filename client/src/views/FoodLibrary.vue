<template>
  <div class="page">
    <!-- 顶部 -->
    <div class="header">
      <button class="back-btn" @click="$router.back()">← 返回</button>
      <div class="header-title">食物库</div>
      <div class="header-count">共 {{ filteredFoods.length }} 种</div>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <span class="search-icon">🔍</span>
      <input
        v-model="query"
        class="search-input"
        placeholder="搜索食物..."
        @input="filter"
      />
      <span v-if="query" class="clear-btn" @click="query='';filter()">✕</span>
    </div>

    <!-- 分类标签 -->
    <div class="category-tabs">
      <button
        v-for="cat in categories"
        :key="cat.key"
        :class="['cat-tab', { active: activeCat === cat.key }]"
        @click="activeCat = cat.key"
      >{{ cat.emoji }} {{ cat.label }}</button>
    </div>

    <!-- 食物列表 -->
    <div class="food-list" v-if="filteredFoods.length">
      <div class="food-item" v-for="food in filteredFoods" :key="food.id">
        <div class="food-info">
          <div class="food-name">{{ food.name }}</div>
          <div class="food-unit">每100g</div>
        </div>
        <div class="food-nutrition">
          <div class="fn-item kcal">
            <div class="fn-val">{{ food.kcal }}</div>
            <div class="fn-label">千卡</div>
          </div>
          <div class="fn-item">
            <div class="fn-val">{{ food.protein }}g</div>
            <div class="fn-label">蛋白质</div>
          </div>
          <div class="fn-item">
            <div class="fn-val">{{ food.fat }}g</div>
            <div class="fn-label">脂肪</div>
          </div>
          <div class="fn-item">
            <div class="fn-val">{{ food.carbs }}g</div>
            <div class="fn-label">碳水</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div class="empty" v-else>
      <div class="empty-icon">🍽️</div>
      <div class="empty-text">{{ query ? '没有找到相关食物' : '该分类暂无食物' }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { foodApi } from '../api/index.js'

const query = ref('')
const activeCat = ref('all')
const allFoods = ref([])

const categories = [
  { key: 'all', label: '全部', emoji: '📋' },
  { key: 'staple', label: '主食', emoji: '🍚' },
  { key: 'meat', label: '肉蛋', emoji: '🥩' },
  { key: 'vegetable', label: '蔬菜', emoji: '🥬' },
  { key: 'fruit', label: '水果', emoji: '🍎' },
  { key: 'drink', label: '饮品', emoji: '🥛' },
  { key: 'snack', label: '零食', emoji: '🍪' },
]

// 从 API 加载全部食物
onMounted(async () => {
  try {
    const res = await foodApi.getAll()
    allFoods.value = res.list || res || []
  } catch (e) {
    console.error('加载食物库失败:', e)
  }
})

// 筛选
const filteredFoods = computed(() => {
  let list = allFoods.value
  // 按分类筛选
  if (activeCat.value !== 'all') {
    list = list.filter(f => f.category === activeCat.value)
  }
  // 按关键词搜索
  if (query.value) {
    const kw = query.value.toLowerCase()
    list = list.filter(f => f.name.toLowerCase().includes(kw))
  }
  return list
})

function filter() {
  // computed 自动响应，无需额外逻辑
}
</script>

<style scoped>
.page { padding-bottom: 20px; background: #F5F6FA; min-height: 100vh; }
.header {
  background: linear-gradient(135deg, #43A047, #66BB6A);
  color: #fff; padding: 16px 20px 14px;
  display: flex; align-items: center;
}
.back-btn {
  background: none; border: none; color: #fff; font-size: 15px;
  cursor: pointer; padding: 0;
}
.header-title { flex: 1; text-align: center; font-size: 17px; font-weight: 600; }
.header-count { font-size: 12px; opacity: 0.8; }

.search-bar {
  display: flex; align-items: center; margin: 12px 16px;
  background: #fff; border-radius: 12px; padding: 10px 14px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}
.search-icon { font-size: 16px; margin-right: 8px; }
.search-input {
  flex: 1; border: none; outline: none; font-size: 14px; background: none;
}
.clear-btn {
  font-size: 14px; color: #999; cursor: pointer;
  padding: 2px 6px; border-radius: 50%;
}
.clear-btn:active { background: #eee; }

.category-tabs {
  display: flex; gap: 6px; padding: 0 16px 6px;
  overflow-x: auto; white-space: nowrap; -webkit-overflow-scrolling: touch;
}
.category-tabs::-webkit-scrollbar { display: none; }
.cat-tab {
  flex-shrink: 0; padding: 6px 14px; border-radius: 16px;
  border: 1px solid #E0E0E0; background: #fff;
  font-size: 13px; color: #666; cursor: pointer;
  transition: all 0.15s;
}
.cat-tab.active {
  background: #E8F5E9; border-color: #4CAF50; color: #388E3C; font-weight: 600;
}

.food-list { padding: 0 16px; }
.food-item {
  background: #fff; border-radius: 14px; padding: 14px 16px;
  margin-bottom: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.03);
}
.food-info {
  display: flex; align-items: baseline; gap: 8px; margin-bottom: 10px;
}
.food-name { font-size: 15px; font-weight: 600; color: #333; }
.food-unit { font-size: 12px; color: #999; }
.food-nutrition {
  display: flex; gap: 12px;
}
.fn-item {
  flex: 1; text-align: center; padding: 6px 4px;
  background: #F8FAF8; border-radius: 8px;
}
.fn-item.kcal { background: #FFF3E0; }
.fn-val { font-size: 15px; font-weight: 700; color: #333; }
.fn-item.kcal .fn-val { color: #E65100; }
.fn-label { font-size: 10px; color: #999; margin-top: 2px; }

.empty { text-align: center; padding: 60px 0; }
.empty-icon { font-size: 48px; margin-bottom: 12px; }
.empty-text { font-size: 14px; color: #aaa; }
</style>
