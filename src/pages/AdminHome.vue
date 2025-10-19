<script setup>
import AdminHeader from '@/components/AdminHeader.vue'

// Dashboard menu items - Available features first, then disabled features
const menuItems = [
  // Available features (enabled)
  {
    title: 'Users',
    description: 'Manage user accounts and permissions',
    route: '/admin/users',
    icon: '👥',
    color: '#3b82f6',
    enabled: true
  },
  {
    title: 'Courses',
    description: 'Manage courses and learning materials',
    route: '/admin/courses',
    icon: '📚',
    color: '#8b5cf6',
    enabled: true
  },
  {
    title: 'Email Centre',
    description: 'Send emails and manage templates',
    route: '/admin/email-centre',
    icon: '✉️',
    color: '#10b981',
    enabled: true
  },
  // Disabled features (not yet online)
  {
    title: 'Posts',
    description: 'Manage forum posts and discussions - Not yet online',
    route: '/admin/posts',
    icon: '📝',
    color: '#ec4899',
    enabled: false // Feature not yet implemented
  },
  {
    title: 'Bookings',
    description: 'View and manage user bookings - Not yet online',
    route: '/admin/bookings',
    icon: '📅',
    color: '#f59e0b',
    enabled: false // Feature not yet implemented
  },
  {
    title: 'System/Settings',
    description: 'Configure system settings - Not yet online',
    route: '/admin/system-settings',
    icon: '⚙️',
    color: '#6366f1',
    enabled: false // Feature not yet implemented
  }
]
</script>

<template>
  <div class="admin">
    <AdminHeader />

    <main class="container admin__content">
      <div class="header-section">
        <h1 class="greeting">Welcome, Administrator</h1>
        <p class="subtitle">Manage your platform from the dashboard below</p>
      </div>

      <div class="dashboard-grid">
        <div 
          v-for="item in menuItems" 
          :key="item.route"
          :class="['dashboard-card', { 'disabled': !item.enabled }]"
          :style="{ '--card-color': item.color }"
        >
          <router-link 
            v-if="item.enabled"
            :to="item.route"
            class="card-link"
          >
            <div class="card-icon">{{ item.icon }}</div>
            <div class="card-content">
              <h3 class="card-title">{{ item.title }}</h3>
              <p class="card-description">{{ item.description }}</p>
            </div>
            <div class="card-arrow">→</div>
          </router-link>
          <div v-else class="card-link disabled-content">
            <div class="card-icon">{{ item.icon }}</div>
            <div class="card-content">
              <h3 class="card-title">{{ item.title }}</h3>
              <p class="card-description">{{ item.description }}</p>
            </div>
            <div class="card-arrow disabled-arrow">🚫</div>
          </div>
        </div>
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
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.card-link {
  display: flex;
  align-items: center;
  gap: 20px;
  width: 100%;
  text-decoration: none;
  color: inherit;
}

.disabled-content {
  display: flex;
  align-items: center;
  gap: 20px;
  width: 100%;
  cursor: not-allowed;
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

.dashboard-card:not(.disabled):hover {
  border-color: var(--card-color);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.dashboard-card:not(.disabled):hover::before {
  opacity: 1;
}

/* Disabled state styling */
.dashboard-card.disabled {
  background: #f9fafb;
  border-color: #e5e7eb;
  opacity: 0.6;
  cursor: not-allowed;
}

.dashboard-card.disabled .card-icon {
  filter: grayscale(1);
  opacity: 0.5;
}

.dashboard-card.disabled .card-title {
  color: #9ca3af;
}

.dashboard-card.disabled .card-description {
  color: #9ca3af;
}

.dashboard-card.disabled .disabled-arrow {
  color: #9ca3af;
  font-size: 1.2rem;
}

.card-icon {
  font-size: 2.5rem;
  flex-shrink: 0;
  filter: grayscale(0.3);
  transition: filter 0.2s ease;
}

.dashboard-card:not(.disabled):hover .card-icon {
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

.dashboard-card:not(.disabled):hover .card-arrow {
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


