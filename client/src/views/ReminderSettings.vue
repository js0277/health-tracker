<template>
  <div class="page">
    <!-- 顶部 -->
    <div class="header">
      <button class="back-btn" @click="$router.back()">← 返回</button>
      <div class="header-title">提醒设置</div>
      <div class="header-right"></div>
    </div>

    <!-- 通知权限提示 -->
    <div class="permission-banner" v-if="!notificationGranted">
      <div class="perm-icon">🔕</div>
      <div class="perm-text">
        <div class="perm-title">通知未开启</div>
        <div class="perm-desc">开启后才能收到提醒通知</div>
      </div>
      <button class="perm-btn" @click="requestPermission">开启</button>
    </div>

    <!-- 用餐提醒 -->
    <div class="section-title">🍽️ 用餐提醒</div>
    <div class="card">
      <div class="reminder-item" v-for="r in mealReminders" :key="r.key">
        <div class="reminder-left">
          <div class="reminder-label">{{ r.emoji }} {{ r.label }}</div>
          <div class="reminder-time" v-if="r.enabled">{{ r.time }}</div>
          <div class="reminder-off" v-else>已关闭</div>
        </div>
        <div class="reminder-right">
          <input
            type="time"
            v-model="r.time"
            :disabled="!r.enabled"
            class="time-picker"
          />
          <label class="switch">
            <input type="checkbox" v-model="r.enabled" @change="save" />
            <span class="slider"></span>
          </label>
        </div>
      </div>
    </div>

    <!-- 体重记录提醒 -->
    <div class="section-title">⚖️ 体重记录提醒</div>
    <div class="card">
      <div class="reminder-item">
        <div class="reminder-left">
          <div class="reminder-label">📏 每日称重</div>
          <div class="reminder-time" v-if="weightReminder.enabled">{{ weightReminder.time }}</div>
          <div class="reminder-off" v-else>已关闭</div>
        </div>
        <div class="reminder-right">
          <input
            type="time"
            v-model="weightReminder.time"
            :disabled="!weightReminder.enabled"
            class="time-picker"
          />
          <label class="switch">
            <input type="checkbox" v-model="weightReminder.enabled" @change="save" />
            <span class="slider"></span>
          </label>
        </div>
      </div>
    </div>

    <!-- 喝水提醒 -->
    <div class="section-title">💧 喝水提醒</div>
    <div class="card">
      <div class="reminder-item">
        <div class="reminder-left">
          <div class="reminder-label">💧 定时喝水</div>
          <div class="reminder-time" v-if="waterReminder.enabled">
            每 {{ waterReminder.interval }} 分钟
          </div>
          <div class="reminder-off" v-else>已关闭</div>
        </div>
        <div class="reminder-right">
          <select
            v-model="waterReminder.interval"
            :disabled="!waterReminder.enabled"
            class="interval-picker"
            @change="save"
          >
            <option value="30">30分钟</option>
            <option value="60">1小时</option>
            <option value="90">1.5小时</option>
            <option value="120">2小时</option>
          </select>
          <label class="switch">
            <input type="checkbox" v-model="waterReminder.enabled" @change="save" />
            <span class="slider"></span>
          </label>
        </div>
      </div>
      <div class="reminder-hint" v-if="waterReminder.enabled">
        ⏰ 从 {{ waterReminder.start }} 到 {{ waterReminder.end }} 之间提醒
      </div>
      <div class="reminder-item" v-if="waterReminder.enabled">
        <div class="reminder-left">
          <div class="reminder-label sub">起止时间</div>
        </div>
        <div class="reminder-right">
          <input type="time" v-model="waterReminder.start" class="time-picker" @change="save" />
          <span style="color:#ccc;">~</span>
          <input type="time" v-model="waterReminder.end" class="time-picker" @change="save" />
        </div>
      </div>
    </div>

    <!-- 保存按钮 -->
    <div class="save-area">
      <button class="save-btn" @click="saveAndStart">保存并生效</button>
    </div>

    <!-- 状态提示 -->
    <div class="status-text" v-if="statusMsg">{{ statusMsg }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const notificationGranted = ref(false)
const statusMsg = ref('')

// 用餐提醒
const mealReminders = ref([
  { key: 'breakfast', label: '早餐', emoji: '🌅', time: '08:00', enabled: false },
  { key: 'lunch', label: '午餐', emoji: '☀️', time: '12:00', enabled: false },
  { key: 'dinner', label: '晚餐', emoji: '🌙', time: '18:00', enabled: false },
  { key: 'snack', label: '加餐', emoji: '🍎', time: '15:30', enabled: false },
])

// 体重提醒
const weightReminder = ref({ time: '07:30', enabled: false })

// 喝水提醒
const waterReminder = ref({
  interval: '60',
  start: '09:00',
  end: '21:00',
  enabled: false,
})

// 定时器引用
let timers = []

// 从 localStorage 读取
function load() {
  const saved = localStorage.getItem('reminderSettings')
  if (saved) {
    try {
      const data = JSON.parse(saved)
      if (data.meals) {
        data.meals.forEach(s => {
          const r = mealReminders.value.find(m => m.key === s.key)
          if (r) { r.time = s.time; r.enabled = s.enabled }
        })
      }
      if (data.weight) {
        weightReminder.value = { ...weightReminder.value, ...data.weight }
      }
      if (data.water) {
        waterReminder.value = { ...waterReminder.value, ...data.water }
      }
    } catch (e) { console.error('读取提醒设置失败', e) }
  }
}

// 保存到 localStorage
function save() {
  const data = {
    meals: mealReminders.value.map(r => ({ key: r.key, time: r.time, enabled: r.enabled })),
    weight: { ...weightReminder.value },
    water: { ...waterReminder.value },
  }
  localStorage.setItem('reminderSettings', JSON.stringify(data))
}

// 请求通知权限
async function requestPermission() {
  if (!('Notification' in window)) {
    statusMsg.value = '当前浏览器不支持通知'
    return
  }
  const perm = await Notification.requestPermission()
  notificationGranted.value = perm === 'granted'
  if (perm === 'granted') {
    statusMsg.value = '通知已开启'
    new Notification('轻食记', { body: '提醒通知已开启，记得按时吃饭哦~' })
  } else {
    statusMsg.value = '通知权限被拒绝，请在浏览器设置中开启'
  }
  setTimeout(() => statusMsg.value = '', 3000)
}

// 发送通知
function notify(title, body) {
  if (notificationGranted.value && 'Notification' in window) {
    new Notification(title, { body })
  }
}

// 保存并启动定时
function saveAndStart() {
  save()
  clearTimers()
  startTimers()
  statusMsg.value = '设置已保存'
  setTimeout(() => statusMsg.value = '', 2000)
}

// 清除所有定时器
function clearTimers() {
  timers.forEach(t => clearTimeout(t))
  timers = []
}

// 计算到下一个指定时间的毫秒数
function msToNext(timeStr) {
  const [h, m] = timeStr.split(':').map(Number)
  const now = new Date()
  const target = new Date()
  target.setHours(h, m, 0, 0)
  if (target <= now) {
    target.setDate(target.getDate() + 1)
  }
  return target - now
}

// 启动所有定时器
function startTimers() {
  // 用餐提醒
  mealReminders.value.forEach(r => {
    if (r.enabled) {
      const delay = msToNext(r.time)
      const t = setTimeout(function tick() {
        notify('轻食记 · 用餐提醒', `该吃${r.label}啦！记得记录饮食~`)
        const next = msToNext(r.time)
        timers.push(setTimeout(tick, next))
      }, delay)
      timers.push(t)
    }
  })

  // 体重提醒
  if (weightReminder.value.enabled) {
    const delay = msToNext(weightReminder.value.time)
    const t = setTimeout(function tick() {
      notify('轻食记 · 体重提醒', '该称体重啦！坚持记录才能看到变化~')
      const next = msToNext(weightReminder.value.time)
      timers.push(setTimeout(tick, next))
    }, delay)
    timers.push(t)
  }

  // 喝水提醒
  if (waterReminder.value.enabled) {
    const interval = parseInt(waterReminder.value.interval) * 60 * 1000
    const tick = () => {
      const now = new Date()
      const [sh, sm] = waterReminder.value.start.split(':').map(Number)
      const [eh, em] = waterReminder.value.end.split(':').map(Number)
      const curMin = now.getHours() * 60 + now.getMinutes()
      const startMin = sh * 60 + sm
      const endMin = eh * 60 + em
      if (curMin >= startMin && curMin <= endMin) {
        notify('轻食记 · 喝水提醒', '该喝水啦！保持充足水分~')
      }
    }
    const t = setInterval(tick, interval)
    timers.push(t)
  }
}

// 页面可见性变化时重新检查定时器
function onVisibilityChange() {
  // 页面重新可见时不需要额外操作，定时器会继续运行
}

onMounted(() => {
  // 检查通知权限
  if ('Notification' in window) {
    notificationGranted.value = Notification.permission === 'granted'
  }
  load()
  startTimers()
  document.addEventListener('visibilitychange', onVisibilityChange)
})

onUnmounted(() => {
  clearTimers()
  document.removeEventListener('visibilitychange', onVisibilityChange)
})
</script>

<style scoped>
.page { padding-bottom: 30px; background: #F5F6FA; min-height: 100vh; }
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
.header-right { width: 50px; }

.permission-banner {
  display: flex; align-items: center; gap: 10px;
  margin: 12px 16px 0; padding: 12px 14px;
  background: #FFF3E0; border-radius: 12px;
  border: 1px solid #FFE0B2;
}
.perm-icon { font-size: 22px; }
.perm-text { flex: 1; }
.perm-title { font-size: 14px; font-weight: 600; color: #E65100; }
.perm-desc { font-size: 12px; color: #BF360C; margin-top: 2px; }
.perm-btn {
  background: #FF9800; color: #fff; border: none;
  padding: 6px 16px; border-radius: 8px; font-size: 13px;
  cursor: pointer; font-weight: 500;
}
.perm-btn:active { background: #F57C00; }

.section-title {
  font-size: 13px; font-weight: 600; color: #888;
  padding: 18px 16px 6px;
}
.card {
  margin: 0 16px; background: #fff; border-radius: 14px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04); overflow: hidden;
}
.reminder-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 16px; border-bottom: 1px solid #F5F5F5;
}
.reminder-item:last-child { border-bottom: none; }
.reminder-left { display: flex; flex-direction: column; gap: 2px; }
.reminder-label { font-size: 15px; color: #333; }
.reminder-label.sub { font-size: 13px; color: #999; }
.reminder-time { font-size: 12px; color: #4CAF50; font-weight: 500; }
.reminder-off { font-size: 12px; color: #bbb; }
.reminder-right { display: flex; align-items: center; gap: 10px; }

.time-picker {
  border: 1px solid #E0E0E0; border-radius: 8px;
  padding: 5px 8px; font-size: 14px; color: #333;
  background: #FAFAFA; outline: none;
}
.time-picker:disabled { color: #ccc; background: #F5F5F5; }
.time-picker:focus { border-color: #4CAF50; }

.interval-picker {
  border: 1px solid #E0E0E0; border-radius: 8px;
  padding: 5px 8px; font-size: 13px; color: #333;
  background: #FAFAFA; outline: none;
}
.interval-picker:disabled { color: #ccc; background: #F5F5F5; }

.reminder-hint {
  font-size: 12px; color: #999; padding: 6px 16px 10px;
}

/* 开关样式 */
.switch {
  position: relative; display: inline-block;
  width: 44px; height: 24px;
}
.switch input { opacity: 0; width: 0; height: 0; }
.slider {
  position: absolute; cursor: pointer;
  top: 0; left: 0; right: 0; bottom: 0;
  background: #E0E0E0; border-radius: 24px;
  transition: 0.2s;
}
.slider:before {
  position: absolute; content: "";
  height: 18px; width: 18px; left: 3px; bottom: 3px;
  background: #fff; border-radius: 50%; transition: 0.2s;
}
.switch input:checked + .slider { background: #4CAF50; }
.switch input:checked + .slider:before { transform: translateX(20px); }

.save-area { padding: 24px 16px; }
.save-btn {
  width: 100%; padding: 13px; border: none; border-radius: 12px;
  background: linear-gradient(135deg, #43A047, #66BB6A);
  color: #fff; font-size: 16px; font-weight: 600;
  cursor: pointer; box-shadow: 0 2px 8px rgba(67,160,71,0.3);
}
.save-btn:active { opacity: 0.85; }

.status-text {
  text-align: center; font-size: 13px; color: #4CAF50;
  margin-top: 8px;
}
</style>
