<script setup>
import SiteHeader from '@/components/SiteHeader.vue'
import { reactive } from 'vue'
import { getCurrentUser, logout } from '@/lib/auth'
import { useRouter } from 'vue-router'

const router = useRouter()
const current = getCurrentUser()
const form = reactive({ username: current?.username || '', email: current?.email || '' })

function save() {
  // Simple demo: update localStorage current user only
  const updated = { ...current, username: form.username, email: form.email }
  localStorage.setItem('currentUser', JSON.stringify(updated))
  router.replace('/profile')
}

function handleLogout() {
  logout()
  router.replace('/')
}
</script>

<template>
  <div class="page">
    <SiteHeader />
    <div class="container profile">
      <h1>My Profile</h1>
      <div class="panel">
        <label>Username</label>
        <input v-model="form.username" />
        <label>Email</label>
        <input v-model="form.email" type="email" />
        <div class="row">
          <button class="btn btn--primary" @click="save">Save</button>
          <button class="btn btn--outline" @click="handleLogout">Log out</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile { padding: 24px 0; max-width: 720px; }
.panel { background: #fff; border: 1px solid var(--green-100); border-radius: 12px; padding: 16px; box-shadow: var(--shadow-md); display: grid; gap: 10px; }
input { border: 1px solid var(--gray-200); border-radius: 8px; padding: 10px; }
.row { display: flex; gap: 10px; }
</style>


