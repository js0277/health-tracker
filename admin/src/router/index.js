import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
  },
  {
    path: '/foods',
    name: 'FoodManage',
    component: () => import('@/views/FoodManage.vue'),
  },
  {
    path: '/users',
    name: 'UserManage',
    component: () => import('@/views/UserManage.vue'),
  },
  {
    path: '/records',
    name: 'DietRecords',
    component: () => import('@/views/DietRecords.vue'),
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
