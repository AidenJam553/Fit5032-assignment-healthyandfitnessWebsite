<script setup>
import { logout } from '@/lib/auth'
import { useRouter } from 'vue-router'
import Button from '@/components/Button.vue'

const router = useRouter()

function handleLogout() {
  logout()
  router.push('/')
}
</script>

<template>
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
</style>



