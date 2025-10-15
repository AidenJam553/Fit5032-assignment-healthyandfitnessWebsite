import { createRouter, createWebHistory } from 'vue-router'
import HomePage from './pages/HomePage.vue'
// Public pages
const Forum = () => import('./pages/Forum.vue')
const Learn = () => import('./pages/Learn.vue')
const Record = () => import('./pages/Record.vue')
const About = () => import('./pages/About.vue')
// New flows
const LessonDetail = () => import('./pages/LessonDetail.vue')
const LessonLearning = () => import('./pages/LessonLearning.vue')
const ForumNew = () => import('./pages/ForumNew.vue')
const ForumDetail = () => import('./pages/ForumDetail.vue')
const Explore = () => import('./pages/Explore.vue')
const ProfileInfo = () => import('./pages/ProfileInfo.vue')
const ProfileEdit = () => import('./pages/Profile.vue')
import AdminHome from './pages/AdminHome.vue'
import AuthLogin from './pages/AuthLogin.vue'
import AuthRegister from './pages/AuthRegister.vue'

// Lazy admin child pages (simple placeholders)
const AdminUsers = () => import('./pages/admin/AdminUsers.vue')
const AdminCourses = () => import('./pages/admin/AdminCourses.vue')
const AdminCourseAnalytics = () => import('./pages/admin/AdminCourseAnalytics.vue')
const AdminPosts = () => import('./pages/admin/AdminPosts.vue')
const AdminBookings = () => import('./pages/admin/AdminBookings.vue')
const AdminEmail = () => import('./pages/admin/AdminEmail.vue')
const AdminMapsPoi = () => import('./pages/admin/AdminMapsPoi.vue')
const AdminTables = () => import('./pages/admin/AdminTables.vue')
const AdminSystem = () => import('./pages/admin/AdminSystem.vue')
const AdminAudits = () => import('./pages/admin/AdminAudits.vue')

const routes = [
  // Public pages
  { path: '/', name: 'home', component: HomePage },
  { path: '/about', name: 'about', component: About },
  { path: '/login', name: 'login', component: AuthLogin },
  { path: '/register', name: 'register', component: AuthRegister },
  
  // Pages requiring authentication
  { path: '/forum', name: 'forum', component: Forum, meta: { requiresAuth: true } },
  { path: '/forum/new', name: 'forum-new', component: ForumNew, meta: { requiresAuth: true } },
  { path: '/forum/:id', name: 'forum-detail', component: ForumDetail, meta: { requiresAuth: true } },
  { path: '/learn', name: 'learn', component: Learn, meta: { requiresAuth: true } },
  { path: '/learn/:id', name: 'lesson-detail', component: LessonDetail, meta: { requiresAuth: true } },
  { path: '/learn/:id/learning', name: 'lesson-learning', component: LessonLearning, meta: { requiresAuth: true } },
  { path: '/record', name: 'record', component: Record, meta: { requiresAuth: true } },
  { path: '/explore', name: 'explore', component: Explore, meta: { requiresAuth: true } },
  { path: '/profile', name: 'profile', component: ProfileInfo, meta: { requiresAuth: true } },
  { path: '/profile/edit', name: 'profile-edit', component: ProfileEdit, meta: { requiresAuth: true } },
  
  // Pages requiring admin privileges
  { path: '/admin', name: 'admin-home', component: AdminHome, meta: { requiresAuth: true, requiresAdmin: true } },
  { path: '/admin/users', component: AdminUsers, meta: { requiresAuth: true, requiresAdmin: true } },
  { path: '/admin/courses', component: AdminCourses, meta: { requiresAuth: true, requiresAdmin: true } },
  { path: '/admin/courses/analytics', component: AdminCourseAnalytics, meta: { requiresAuth: true, requiresAdmin: true } },
  { path: '/admin/posts', component: AdminPosts, meta: { requiresAuth: true, requiresAdmin: true } },
  { path: '/admin/bookings', component: AdminBookings, meta: { requiresAuth: true, requiresAdmin: true } },
  { path: '/admin/email-centre', component: AdminEmail, meta: { requiresAuth: true, requiresAdmin: true } },
  { path: '/admin/maps-poi', component: AdminMapsPoi, meta: { requiresAuth: true, requiresAdmin: true } },
  { path: '/admin/tables', component: AdminTables, meta: { requiresAuth: true, requiresAdmin: true } },
  { path: '/admin/system-settings', component: AdminSystem, meta: { requiresAuth: true, requiresAdmin: true } },
  { path: '/admin/audit-logs', component: AdminAudits, meta: { requiresAuth: true, requiresAdmin: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() { return { top: 0 } },
})

// Enhanced route guards
import { requireAdmin, isUserLoggedIn, isCurrentUserAdmin } from './lib/auth'

router.beforeEach((to, from, next) => {
  // Check if authentication is required
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin)
  
  // If page requires authentication but user is not logged in
  if (requiresAuth && !isUserLoggedIn()) {
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }
  
  // If page requires admin privileges but user is not admin
  if (requiresAdmin && !isCurrentUserAdmin()) {
    next({ path: '/', query: { error: 'insufficient_permissions' } })
    return
  }
  
  // If logged-in user accesses login page, redirect to homepage
  if (to.path === '/login' && isUserLoggedIn()) {
    next('/')
    return
  }
  
  // If logged-in user accesses registration page, redirect to homepage
  if (to.path === '/register' && isUserLoggedIn()) {
    next('/')
    return
  }
  
  next()
})

export default router


