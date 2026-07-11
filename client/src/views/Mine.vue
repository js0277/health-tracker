<template>
  <div class="page" style="padding: 0 16px;">
    <div style="padding:24px 0 12px;font-size:18px;font-weight:600;">👤 我的</div>

    <div class="profile-card">
      <div class="avatar">{{ store.user ? '🙋' : '👤' }}</div>
      <div class="name">{{ store.user ? store.user.nickname || store.user.username : '未登录' }}</div>
      <div class="bio">健康饮食，天天向上</div>

      <div class="profile-stats">
        <div class="ps-item">
          <div class="ps-val">0</div>
          <div class="ps-label">累计记录</div>
        </div>
        <div class="ps-item">
          <div class="ps-val">{{ store.meals.reduce((s, m) => s + m.foods.length, 0) }}</div>
          <div class="ps-label">今日食物</div>
        </div>
        <div class="ps-item">
          <div class="ps-val">{{ store.targetKcal }}</div>
          <div class="ps-label">目标(千卡)</div>
        </div>
      </div>
    </div>

    <div class="section-title" style="margin-top:20px;">⚙️ 设置</div>
    <div class="menu-item" v-for="m in menuItems" :key="m.label" @click="m.action?.()">
      <span>{{ m.icon }} {{ m.label }}</span>
      <span class="arrow">›</span>
    </div>

    <div class="section-title" style="margin-top:20px;">🔐 账号</div>
    <div class="menu-item logout-item" @click="handleLogout">
      <span>🚪 退出登录</span>
      <span class="arrow">›</span>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { store, logout } from '../store.js'

const router = useRouter()

const menuItems = [
  { icon: '🎯', label: '热量目标设置' },
  { icon: '📅', label: '历史记录' },
  { icon: '🔔', label: '提醒设置', action: () => router.push('/reminder-settings') },
  { icon: '📖', label: '食物库', action: () => router.push('/food-library') },
]

function handleLogout() {
  logout()
  router.push('/login')
}
</script>

<style scoped>
.page { padding-bottom: 20px; }
.profile-card {
  background: #fff; border-radius: 16px; padding: 24px;
  text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.avatar {
  width: 64px; height: 64px; border-radius: 50%;
  background: linear-gradient(135deg, #E8F5E9, #C8E6C9);
  display: flex; align-items: center; justify-content: center;
  font-size: 30px; margin: 0 auto 12px;
}
.name { font-size: 18px; font-weight: 600; }
.bio { font-size: 13px; color: #999; margin-top: 4px; }
.profile-stats {
  display: flex; justify-content: space-around; margin-top: 20px;
  padding-top: 16px; border-top: 1px solid #f0f0f0;
}
.ps-item { text-align: center; }
.ps-val { font-size: 20px; font-weight: 700; color: #388E3C; }
.ps-label { font-size: 11px; color: #999; margin-top: 2px; }
.section-title { font-size: 13px; font-weight: 600; color: #666; }
.menu-item {
  background: #fff; padding: 14px 16px; margin-top: 6px;
  border-radius: 12px; display: flex; align-items: center;
  justify-content: space-between; font-size: 14px; cursor: pointer;
  box-shadow: 0 1px 4px rgba(0,0,0,0.03);
}
.menu-item:active { background: #f9f9f9; }
.logout-item { color: #E53935; }
.arrow { color: #ccc; font-size: 18px; }
</style>
