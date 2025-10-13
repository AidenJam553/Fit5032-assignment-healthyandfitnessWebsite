<script setup>
import { logout } from '@/lib/auth'
import { useRouter } from 'vue-router'
import Button from '@/components/Button.vue'

const router = useRouter()

function handleLogout() {
  logout()
  router.push('/')
}

// Dashboard menu items
const menuItems = [
  {
    title: 'Users',
    description: 'Manage user accounts and permissions',
    route: '/admin/users',
    icon: '👥',
    color: '#3b82f6'
  },
  {
    title: 'Courses',
    description: 'Manage courses and learning materials',
    route: '/admin/courses',
    icon: '📚',
    color: '#8b5cf6'
  },
  {
    title: 'Posts',
    description: 'Manage forum posts and discussions',
    route: '/admin/posts',
    icon: '📝',
    color: '#ec4899'
  },
  {
    title: 'Bookings',
    description: 'View and manage user bookings',
    route: '/admin/bookings',
    icon: '📅',
    color: '#f59e0b'
  },
  {
    title: 'Email Centre',
    description: 'Send emails and manage templates',
    route: '/admin/email-centre',
    icon: '✉️',
    color: '#10b981'
  },
  {
    title: 'System/Settings',
    description: 'Configure system settings',
    route: '/admin/system-settings',
    icon: '⚙️',
    color: '#6366f1'
  }
]
</script>

<template>
  <div class="admin">
    <header class="admin__bar">
      <div class="container admin__bar-inner">
        <router-link to="/admin" class="logo">ADMIN DASHBOARD</router-link>
        <div class="admin__actions">
          <Button variant="secondary" size="medium" @click="handleLogout">Log out</Button>
          <div class="chip">
            <span class="chip__avatar">A</span>
            <span>Admin</span>
          </div>
        </div>
      </div>
    </header>

    <main class="container admin__content">
      <div class="header-section">
        <h1 class="greeting">Welcome, Administrator</h1>
        <p class="subtitle">Manage your platform from the dashboard below</p>
      </div>

      <div class="dashboard-grid">
        <router-link 
          v-for="item in menuItems" 
          :key="item.route"
          :to="item.route"
          class="dashboard-card"
          :style="{ '--card-color': item.color }"
        >
          <div class="card-icon">{{ item.icon }}</div>
          <div class="card-content">
            <h3 class="card-title">{{ item.title }}</h3>
            <p class="card-description">{{ item.description }}</p>
          </div>
          <div class="card-arrow">→</div>
        </router-link>
      </div>
    </main>
  </div>
</template>

<style scoped>
.container { 
  max-width: 1200px; 
  margin: 0 auto; 
  padding: 0 24px; 
}

.admin__bar { 
  background: #fff; 
  border-bottom: 1px solid #e5e7eb; 
  position: sticky; 
  top: 0; 
  z-index: 10; 
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.admin__bar-inner { 
  height: 70px; 
  display: flex; 
  align-items: center; 
  justify-content: space-between; 
}

.logo { 
  font-weight: 800; 
  font-size: 1.25rem;
  color: #059669; 
  text-decoration: none;
  cursor: pointer;
  letter-spacing: 0.5px;
}

.logo:hover { 
  color: #10b981; 
  text-decoration: none;
}

.admin__actions { 
  display: flex; 
  align-items: center; 
  gap: 16px; 
}

.chip { 
  display: inline-flex; 
  align-items: center; 
  gap: 8px; 
  background: #f0fdf4; 
  color: #059669; 
  border: 1px solid #bbf7d0; 
  padding: 8px 14px; 
  border-radius: 999px; 
  font-weight: 600;
  font-size: 0.875rem;
}

.chip__avatar { 
  width: 26px; 
  height: 26px; 
  border-radius: 50%; 
  background: #10b981; 
  color: white; 
  display: grid; 
  place-content: center; 
  font-weight: 700; 
  font-size: 0.875rem;
}

.admin__content { 
  padding: 48px 0 80px; 
}

.header-section {
  margin-bottom: 40px;
  text-align: center;
}

.greeting { 
  margin: 0 0 8px 0; 
  font-size: 2.25rem;
  font-weight: 700;
  color: #111827;
}

.subtitle {
  margin: 0;
  font-size: 1.125rem;
  color: #6b7280;
}

.dashboard-grid { 
  display: grid; 
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); 
  gap: 24px;
}

.dashboard-card {
  background: #fff;
  border: 2px solid #f3f4f6;
  border-radius: 16px;
  padding: 28px;
  display: flex;
  align-items: center;
  gap: 20px;
  text-decoration: none;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.dashboard-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: var(--card-color);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.dashboard-card:hover {
  border-color: var(--card-color);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.dashboard-card:hover::before {
  opacity: 1;
}

.card-icon {
  font-size: 2.5rem;
  flex-shrink: 0;
  filter: grayscale(0.3);
  transition: filter 0.2s ease;
}

.dashboard-card:hover .card-icon {
  filter: grayscale(0);
}

.card-content {
  flex: 1;
}

.card-title {
  margin: 0 0 6px 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
}

.card-description {
  margin: 0;
  font-size: 0.9375rem;
  color: #6b7280;
  line-height: 1.5;
}

.card-arrow {
  font-size: 1.5rem;
  color: #d1d5db;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.dashboard-card:hover .card-arrow {
  color: var(--card-color);
  transform: translateX(4px);
}

@media (max-width: 768px) {
  .greeting {
    font-size: 1.75rem;
  }
  
  .subtitle {
    font-size: 1rem;
  }
  
  .dashboard-grid { 
    grid-template-columns: 1fr;
  }
  
  .dashboard-card {
    padding: 24px;
  }
}
</style>


