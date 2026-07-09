import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Weight from '../views/Weight.vue'
import Mine from '../views/Mine.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'

const routes = [
  { path: '/', redirect: '/home' },
  { path: '/home', component: Home, meta: { requiresAuth: true } },
  { path: '/weight', component: Weight, meta: { requiresAuth: true } },
  { path: '/mine', component: Mine, meta: { requiresAuth: true } },
  { path: '/login', component: Login, meta: { guest: true } },
  { path: '/register', component: Register, meta: { guest: true } },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (to.meta.requiresAuth && !token) {
    next('/login')
  } else if (to.meta.guest && token) {
    next('/home')
  } else {
    next()
  }
})

export default router
