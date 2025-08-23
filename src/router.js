import { createRouter, createWebHistory } from 'vue-router'
import HomePage from './pages/HomePage.vue'
// Public pages
const Forum = () => import('./pages/Forum.vue')
const Learn = () => import('./pages/Learn.vue')
const Record = () => import('./pages/Record.vue')
const About = () => import('./pages/About.vue')
import AdminHome from './pages/AdminHome.vue'
import AuthLogin from './pages/AuthLogin.vue'
import AuthRegister from './pages/AuthRegister.vue'

// Lazy admin child pages (simple placeholders)
const AdminUsers = () => import('./pages/admin/AdminUsers.vue')
const AdminCourses = () => import('./pages/admin/AdminCourses.vue')
const AdminPosts = () => import('./pages/admin/AdminPosts.vue')
const AdminBookings = () => import('./pages/admin/AdminBookings.vue')
const AdminEmail = () => import('./pages/admin/AdminEmail.vue')
const AdminMapsPoi = () => import('./pages/admin/AdminMapsPoi.vue')
const AdminTables = () => import('./pages/admin/AdminTables.vue')
const AdminSystem = () => import('./pages/admin/AdminSystem.vue')
const AdminAudits = () => import('./pages/admin/AdminAudits.vue')

const routes = [
  { path: '/', name: 'home', component: HomePage },
  { path: '/forum', name: 'forum', component: Forum },
  { path: '/learn', name: 'learn', component: Learn },
  { path: '/record', name: 'record', component: Record },
  { path: '/about', name: 'about', component: About },
  { path: '/login', name: 'login', component: AuthLogin },
  { path: '/register', name: 'register', component: AuthRegister },
  { path: '/admin', name: 'admin-home', component: AdminHome },
  { path: '/admin/users', component: AdminUsers },
  { path: '/admin/courses', component: AdminCourses },
  { path: '/admin/posts', component: AdminPosts },
  { path: '/admin/bookings', component: AdminBookings },
  { path: '/admin/email-centre', component: AdminEmail },
  { path: '/admin/maps-poi', component: AdminMapsPoi },
  { path: '/admin/tables', component: AdminTables },
  { path: '/admin/system-settings', component: AdminSystem },
  { path: '/admin/audit-logs', component: AdminAudits },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() { return { top: 0 } },
})

// Simple admin guard
import { requireAdmin } from './lib/auth'
router.beforeEach((to) => {
  if (to.path.startsWith('/admin') && !requireAdmin(to)) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
})

export default router


