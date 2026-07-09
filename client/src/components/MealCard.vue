<template>
  <div class="card">
    <div class="card-header" @click="$emit('click')">
      <div class="icon" :class="meal.type">{{ meal.emoji }}</div>
      <div class="info">
        <div class="label">{{ meal.label }}</div>
        <div class="foods empty" v-if="!meal.foods.length">点击添加</div>
      </div>
      <div class="kcal" v-if="mealKcal > 0">
        <span class="val">{{ mealKcal }}</span>
        <span class="unit">千卡</span>
      </div>
    </div>

    <!-- 每个食物条目，带删除按钮 -->
    <div class="food-list" v-if="meal.foods.length">
      <div class="food-item" v-for="food in meal.foods" :key="food.id">
        <span class="food-name">{{ food.name }}</span>
        <span class="food-grams">{{ food.grams }}g</span>
        <span class="food-kcal">{{ Math.round(food.kcal) }}kcal</span>
        <button class="del-btn" @click.stop="$emit('delete', food.id)">×</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({ meal: Object })
defineEmits(['click', 'delete'])

const mealKcal = computed(() => {
  return Math.round(props.meal.foods.reduce((s, f) => s + f.kcal, 0))
})
</script>

<style scoped>
.card {
  background: #fff; border-radius: 14px; margin-bottom: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04); overflow: hidden;
}
.card-header {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 16px; cursor: pointer; transition: background 0.15s;
}
.card-header:active { background: #f8f8f8; }
.icon {
  width: 42px; height: 42px; border-radius: 12px; display: flex;
  align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0;
}
.icon.breakfast { background: #FFF3E0; }
.icon.lunch     { background: #E8F5E9; }
.icon.dinner    { background: #F3E5F5; }
.icon.snack     { background: #E3F2FD; }
.info { flex: 1; min-width: 0; }
.label { font-size: 14px; font-weight: 500; }
.foods.empty { font-size: 12px; color: #ccc; margin-top: 2px; }
.kcal { text-align: right; flex-shrink: 0; }
.val { font-size: 16px; font-weight: 600; color: #388E3C; }
.unit { font-size: 11px; color: #888; display: block; }

.food-list {
  border-top: 1px solid #f0f0f0; padding: 6px 16px 10px;
}
.food-item {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 0; font-size: 13px;
}
.food-item + .food-item { border-top: 1px solid #f9f9f9; }
.food-name { flex: 1; color: #333; }
.food-grams { color: #999; font-size: 12px; }
.food-kcal { color: #388E3C; font-weight: 500; font-size: 12px; min-width: 45px; text-align: right; }
.del-btn {
  background: none; border: none; color: #ccc; font-size: 18px;
  cursor: pointer; padding: 0 4px; line-height: 1;
  transition: color 0.15s;
}
.del-btn:hover { color: #E53935; }
</style>
