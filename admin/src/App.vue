<template>
  <el-container class="layout">
    <!-- 侧边栏 -->
    <el-aside width="220px" class="sidebar">
      <div class="logo">🥗 轻食记管理后台</div>
      <el-menu
        :default-active="route.path"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#4CAF50"
      >
        <el-menu-item index="/">
          <el-icon><DataBoard /></el-icon>
          <span>数据看板</span>
        </el-menu-item>
        <el-menu-item index="/foods">
          <el-icon><DishDot /></el-icon>
          <span>食物库管理</span>
        </el-menu-item>
        <el-menu-item index="/users">
          <el-icon><User /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
        <el-menu-item index="/records">
          <el-icon><Document /></el-icon>
          <span>饮食记录</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="topbar">
        <span class="topbar-title">轻食记 · 管理后台</span>
        <el-tag type="success" size="small">v1.0.0</el-tag>
      </el-header>
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif; }

.layout { height: 100vh; }
.sidebar { background: #304156; overflow-y: auto; }
.logo { color: #fff; font-size: 16px; font-weight: 600; padding: 20px 16px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.1); }

.topbar { background: #fff; border-bottom: 1px solid #e8e8e8; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; }
.topbar-title { font-size: 16px; font-weight: 500; }

.main { background: #f5f6fa; padding: 24px; min-height: calc(100vh - 60px); }
</style>
