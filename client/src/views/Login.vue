<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-logo">🥗</div>
      <h2>轻食记</h2>
      <p class="auth-sub">记录每一餐，遇见更好的自己</p>

      <div class="form-group">
        <input v-model="username" type="text" placeholder="用户名" class="input" @keyup.enter="handleLogin" />
      </div>
      <div class="form-group">
        <input v-model="password" type="password" placeholder="密码" class="input" @keyup.enter="handleLogin" />
      </div>

      <p v-if="error" class="error-msg">{{ error }}</p>

      <button class="btn-primary" :disabled="loading" @click="handleLogin">
        {{ loading ? '登录中...' : '登 录' }}
      </button>

      <p class="switch-link">
        还没有账号？<router-link to="/register">立即注册</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authApi } from '../api/index.js'
import { login } from '../store.js'

const router = useRouter()
const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  if (!username.value.trim() || !password.value.trim()) {
    error.value = '请输入用户名和密码'
    return
  }
  error.value = ''
  loading.value = true
  try {
    const res = await authApi.login({
      username: username.value.trim(),
      password: password.value,
    })
    login(res.token, res.user)
    router.push('/home')
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh; display: flex; align-items: flex-start; justify-content: center;
  background: linear-gradient(135deg, #E8F5E9, #C8E6C9, #A5D6A7); padding-top: 80px;
}
.auth-card {
  background: #fff; border-radius: 20px; padding: 36px 28px 28px;
  width: 90%; max-width: 360px; box-shadow: 0 8px 30px rgba(0,0,0,0.08); text-align: center;
}
.auth-logo { font-size: 48px; }
h2 { font-size: 24px; margin: 8px 0 4px; color: #333; }
.auth-sub { font-size: 13px; color: #999; margin-bottom: 28px; }
.form-group { margin-bottom: 14px; }
.input {
  width: 100%; padding: 12px 16px; border: 1.5px solid #e0e0e0;
  border-radius: 12px; font-size: 15px; outline: none; transition: border .2s;
}
.input:focus { border-color: #4CAF50; }
.error-msg { color: #E53935; font-size: 13px; margin-bottom: 8px; text-align: left; }
.btn-primary {
  width: 100%; padding: 13px; background: #4CAF50; color: #fff;
  border: none; border-radius: 12px; font-size: 16px; font-weight: 600;
  cursor: pointer; margin-top: 6px; transition: background .2s;
}
.btn-primary:hover { background: #388E3C; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.switch-link { margin-top: 18px; font-size: 13px; color: #999; }
.switch-link a { color: #4CAF50; text-decoration: none; font-weight: 500; }
</style>
