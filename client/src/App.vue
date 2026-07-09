<template>
  <div class="app">
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>

    <nav v-if="showTabBar" class="tab-bar">
      <router-link v-for="t in tabs" :key="t.key" :to="t.to" class="tab-item" active-class="active">
        <span class="tab-icon">{{ t.icon }}</span>
        <span>{{ t.label }}</span>
      </router-link>
      <button class="tab-item tab-add" @click="showAdd = true">
        <span class="tab-add-btn">+</span>
      </button>
    </nav>

    <FoodSearch v-if="showAdd" @close="showAdd = false" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import FoodSearch from './components/FoodSearch.vue'
import { store } from './store.js'

const showAdd = ref(false)
const route = useRoute()

const showTabBar = computed(() => {
  const authPages = ['/login', '/register']
  return store.isLoggedIn && !authPages.includes(route.path)
})

const tabs = [
  { key: 'home', to: '/home', icon: '📋', label: '饮食' },
  { key: 'weight', to: '/weight', icon: '📊', label: '体重' },
  { key: 'mine', to: '/mine', icon: '👤', label: '我的' },
]
</script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  background: #F5F6FA; color: #333; display: flex; justify-content: center;
}
.app { width: 100%; max-width: 420px; min-height: 100vh; background: #F5F6FA; padding-bottom: 70px; position: relative; }
.tab-bar {
  position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
  width: 100%; max-width: 420px; background: #fff; display: flex;
  border-top: 1px solid #eee; z-index: 50;
}
.tab-item {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  padding: 6px 0; font-size: 10px; color: #999; text-decoration: none;
  cursor: pointer; border: none; background: none;
}
.tab-item.active { color: #4CAF50; }
.tab-icon { font-size: 22px; margin-bottom: 2px; }
.tab-add {
  position: relative; top: -18px;
}
.tab-add-btn {
  background: #4CAF50; color: #fff; width: 48px; height: 48px;
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  font-size: 28px; border: none; cursor: pointer;
}
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
