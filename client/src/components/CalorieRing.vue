<template>
  <svg width="120" height="120" viewBox="0 0 120 120" class="ring">
    <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="10" />
    <circle
      cx="60" cy="60" r="52" fill="none" stroke="#fff"
      stroke-width="10" stroke-linecap="round"
      :stroke-dasharray="circumference"
      :stroke-dashoffset="dashOffset"
    />
    <text x="60" y="56" text-anchor="middle" fill="#fff" font-size="22" font-weight="700" transform="rotate(90, 60, 60)">{{ eaten }}</text>
    <text x="60" y="76" text-anchor="middle" fill="rgba(255,255,255,0.7)" font-size="11" transform="rotate(90, 60, 60)">/ {{ target }} 千卡</text>
  </svg>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({
  eaten: { type: Number, default: 0 },
  target: { type: Number, default: 2000 },
})

const circumference = 2 * Math.PI * 52
const dashOffset = computed(() => {
  const pct = Math.min(props.eaten / props.target, 1)
  return circumference * (1 - pct)
})
</script>

<style scoped>
.ring { display: block; transform: rotate(-90deg); }
</style>
