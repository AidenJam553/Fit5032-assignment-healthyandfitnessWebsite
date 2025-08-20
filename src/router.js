import { createRouter, createWebHistory } from 'vue-router'
import HomePage from './pages/HomePage.vue'
import AdminHome from './pages/AdminHome.vue'

const routes = [
  { path: '/', name: 'home', component: HomePage },
  { path: '/admin', name: 'admin-home', component: AdminHome },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() { return { top: 0 } },
})

export default router


