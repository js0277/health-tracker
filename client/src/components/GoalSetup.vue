<template>
  <div class="goal-overlay" v-if="visible">
    <div class="goal-card">
      <!-- 步骤1：输入信息 -->
      <template v-if="step === 1">
        <div class="goal-emoji">🎯</div>
        <div class="goal-title">设置你的体重目标</div>
        <div class="goal-subtitle">我们会根据你的目标和时间，智能计算每日热量需求</div>

        <div class="form-group">
          <label>当前体重</label>
          <div class="input-row">
            <input
              v-model.number="form.currentWeight"
              type="number"
              step="0.1"
              min="20"
              max="400"
              placeholder="例如 65.0"
              class="form-input"
            />
            <span class="unit">kg</span>
          </div>
        </div>

        <div class="form-group">
          <label>目标体重</label>
          <div class="input-row">
            <input
              v-model.number="form.targetWeight"
              type="number"
              step="0.1"
              min="20"
              max="400"
              placeholder="例如 58.0"
              class="form-input"
            />
            <span class="unit">kg</span>
          </div>
          <div class="hint" v-if="weightDiff !== 0">
            {{ weightDiff < 0 ? '📉 计划减重' : '📈 计划增重' }}
            {{ Math.abs(weightDiff).toFixed(1) }} kg
          </div>
        </div>

        <div class="form-group">
          <label>预期达成日期</label>
          <div class="input-row">
            <input
              v-model="form.targetDate"
              type="date"
              :min="minDate"
              class="form-input"
            />
          </div>
          <div class="hint" v-if="days > 0">
            ⏱️ 共 {{ days }} 天，平均每天
            {{ weightDiff < 0 ? '减' : '增' }}
            {{ (Math.abs(weightDiff) / days * 1000).toFixed(0) }} g
          </div>
          <div class="warn" v-if="days > 0 && Math.abs(weightDiff) / days > 0.2">
            ⚠️ 每日变化超过200g，建议适当延长周期
          </div>
        </div>

        <button
          class="goal-btn"
          :disabled="!canSubmit"
          @click="calcGoal"
        >计算我的每日热量</button>
      </template>

      <!-- 步骤2：展示结果 -->
      <template v-if="step === 2">
        <div class="result-emoji">✨</div>
        <div class="result-title">你的每日热量目标</div>

        <div class="result-kcal">
          <span class="kcal-num">{{ result.target_kcal }}</span>
          <span class="kcal-unit">千卡/天</span>
        </div>

        <div class="result-detail">
          <div class="detail-row">
            <span>📊 基础消耗 (TDEE)</span>
            <span>{{ result.tdee }} 千卡</span>
          </div>
          <div class="detail-row" v-if="result.weight_diff < 0">
            <span>🔥 每日热量缺口</span>
            <span>{{ result.daily_adjust }} 千卡</span>
          </div>
          <div class="detail-row" v-if="result.weight_diff > 0">
            <span>🍞 每日热量盈余</span>
            <span>{{ result.daily_adjust }} 千卡</span>
          </div>
          <div class="detail-row">
            <span>📅 目标周期</span>
            <span>{{ result.diff_days }} 天</span>
          </div>
          <div class="detail-row">
            <span>{{ result.mode === 'lose' ? '📉' : result.mode === 'gain' ? '📈' : '⚖️' }} 目标类型</span>
            <span>{{ result.mode === 'lose' ? '减重' : result.mode === 'gain' ? '增重' : '维持体重' }}</span>
          </div>
        </div>

        <div class="result-tip">
          {{ result.mode === 'lose' ? '坚持每天的热量缺口，你一定能达成目标！' :
             result.mode === 'gain' ? '保证热量盈余和适量运动，健康增重！' :
             '保持均衡饮食，维持当前体重！' }}
        </div>

        <button class="goal-btn" @click="confirmGoal">开始我的健康计划</button>
        <button class="back-link" @click="step = 1">← 返回修改</button>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { authApi } from '../api/index.js'

const props = defineProps({
  visible: { type: Boolean, default: false },
})
const emit = defineEmits(['done'])

const step = ref(1)

const today = new Date()
const minDate = new Date(today.getTime() + 7 * 86400000).toISOString().slice(0, 10)

const form = ref({
  currentWeight: null,
  targetWeight: null,
  targetDate: '',
})

const weightDiff = computed(() => {
  if (!form.value.currentWeight || !form.value.targetWeight) return 0
  return Math.round((form.value.targetWeight - form.value.currentWeight) * 10) / 10
})

const days = computed(() => {
  if (!form.value.targetDate) return 0
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const target = new Date(form.value.targetDate)
  target.setHours(0, 0, 0, 0)
  return Math.max(0, Math.ceil((target - now) / 86400000))
})

const canSubmit = computed(() => {
  return form.value.currentWeight > 0 &&
         form.value.targetWeight > 0 &&
         form.value.targetDate &&
         days.value >= 7
})

const result = ref({})

async function calcGoal() {
  if (!canSubmit.value) return
  try {
    const res = await authApi.setGoal({
      current_weight: form.value.currentWeight,
      target_weight: form.value.targetWeight,
      target_date: form.value.targetDate,
    })
    result.value = res
    step.value = 2
  } catch (err) {
    alert('计算失败：' + err.message)
  }
}

function confirmGoal() {
  emit('done', result.value)
  // reset
  step.value = 1
  form.value = { currentWeight: null, targetWeight: null, targetDate: '' }
  result.value = {}
}
</script>

<style scoped>
.goal-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5); z-index: 9999;
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
}
.goal-card {
  background: #fff; border-radius: 20px; padding: 28px 24px;
  max-width: 380px; width: 100%; max-height: 90vh; overflow-y: auto;
  animation: pop 0.25s ease;
}
@keyframes pop {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
.goal-emoji, .result-emoji { font-size: 48px; text-align: center; }
.goal-title, .result-title {
  font-size: 20px; font-weight: 700; text-align: center;
  margin-top: 8px; color: #333;
}
.goal-subtitle {
  font-size: 13px; color: #999; text-align: center;
  margin-top: 6px; line-height: 1.5;
}

.form-group { margin-top: 20px; }
.form-group label {
  font-size: 13px; font-weight: 600; color: #666; display: block;
  margin-bottom: 6px;
}
.input-row { display: flex; align-items: center; gap: 8px; }
.form-input {
  flex: 1; border: 2px solid #E0E0E0; border-radius: 12px;
  padding: 12px 14px; font-size: 16px; color: #333;
  outline: none; transition: border-color 0.15s;
  background: #FAFAFA;
}
.form-input:focus { border-color: #4CAF50; background: #fff; }
.unit { font-size: 14px; color: #999; font-weight: 600; }
.hint {
  font-size: 12px; color: #4CAF50; margin-top: 6px; font-weight: 500;
}
.warn {
  font-size: 12px; color: #FF9800; margin-top: 4px;
}

.goal-btn {
  width: 100%; margin-top: 24px; padding: 14px; border: none;
  border-radius: 12px; font-size: 16px; font-weight: 600;
  background: linear-gradient(135deg, #43A047, #66BB6A); color: #fff;
  cursor: pointer; box-shadow: 0 2px 10px rgba(67,160,71,0.3);
  transition: opacity 0.15s;
}
.goal-btn:disabled {
  background: #E0E0E0; box-shadow: none; cursor: not-allowed;
}
.goal-btn:active:not(:disabled) { opacity: 0.85; }

.result-kcal {
  text-align: center; margin: 16px 0 20px;
}
.kcal-num {
  font-size: 48px; font-weight: 800; color: #43A047;
}
.kcal-unit {
  font-size: 16px; color: #999; margin-left: 4px;
}

.result-detail {
  background: #F8FAF8; border-radius: 12px; padding: 12px 16px;
}
.detail-row {
  display: flex; justify-content: space-between;
  padding: 8px 0; border-bottom: 1px solid #F0F0F0;
  font-size: 14px; color: #555;
}
.detail-row:last-child { border-bottom: none; }
.detail-row span:last-child { font-weight: 600; color: #333; }

.result-tip {
  font-size: 13px; color: #888; text-align: center;
  margin-top: 16px; line-height: 1.5;
}

.back-link {
  display: block; width: 100%; margin-top: 10px; border: none;
  background: none; font-size: 14px; color: #999; cursor: pointer;
  text-align: center; padding: 8px;
}
.back-link:active { color: #666; }
</style>
