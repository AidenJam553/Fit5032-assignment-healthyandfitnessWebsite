<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { getCurrentUser } from '@/lib/auth'

const user = ref(null)
function updateUser() { user.value = getCurrentUser() }

onMounted(() => {
  updateUser()
  window.addEventListener('storage', updateUser)
})
onBeforeUnmount(() => { window.removeEventListener('storage', updateUser) })

function initialsFrom(u) {
  const base = u?.username || u?.email || ''
  return base.split('@')[0].split(/\s+/).map(s => s[0]).join('').slice(0,2).toUpperCase() || 'U'
}
</script>
<template>
  <header class="site-topbar">
    <div class="container topbar__inner">
      <router-link class="logo" to="/">
        <img class="logo__img" src="/logo.png" alt="Healthy & Fitness" />
        <span class="brand__text">Healthy & Fitness</span>
      </router-link>
      <nav class="nav">
        <router-link class="nav__link" to="/" exact-active-class="active">Home</router-link>
        <router-link class="nav__link" to="/forum" active-class="active">Forum</router-link>
        <router-link class="nav__link" to="/learn" active-class="active">Learn</router-link>
        <router-link class="nav__link" to="/record" active-class="active">Record</router-link>
        <router-link class="nav__link" to="/about" active-class="active">About</router-link>
      </nav>
      <router-link v-if="!user" class="btn btn--outline" to="/login">Log In</router-link>
      <router-link v-else class="profile-pill" to="/profile">
        <span class="avatar">{{ initialsFrom(user) }}</span>
        <span class="email">{{ user.username || user.email }}</span>
      </router-link>
    </div>
  </header>
</template>

<style scoped>
.site-topbar {
  position: sticky;
  top: 0;
  z-index: 50;
  background: linear-gradient(180deg, #34d399 0%, #15803d 100%);
  border-bottom: 1px solid rgba(0,0,0,0.06);
  box-shadow: 0 4px 14px rgba(0,0,0,0.08);
}
.topbar__inner { display: flex; align-items: center; justify-content: space-between; height: 64px; }
.logo { display: flex; align-items: center; gap: 12px; text-decoration: none; cursor: pointer; }
.logo__img { height: 36px; width: auto; display: block; }
.brand__text { font-family: 'Dancing Script', cursive; font-size: 24px; font-style: italic; color: #ffffff; letter-spacing: .3px; text-shadow: 0 1px 2px rgba(0,0,0,0.15); }
.nav { display: none; gap: 20px; }
.nav__link { color: rgba(255,255,255,0.92); text-decoration: none; }
.nav__link.active { color: #ffffff; font-weight: 600; text-decoration: underline; }
.nav__link:hover { color: #ffffff; text-decoration: underline; }
.btn.btn--outline { background: #ffffff; color: var(--green-700); border-color: #ffffff; }
.btn.btn--outline:hover { background: var(--green-50); }

@media (min-width: 768px) { .nav { display: flex; } }

.profile-pill {
  display: inline-flex; align-items: center; gap: 10px;
  background: rgba(255,255,255,0.25);
  border: 1px solid rgba(255,255,255,0.35);
  color: #fff; text-decoration: none;
  padding: 8px 12px; border-radius: 999px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}
.profile-pill:hover { background: rgba(255,255,255,0.35); }
.avatar { width: 28px; height: 28px; border-radius: 50%; background: rgba(255,255,255,0.85); color: #15803d; display: grid; place-content: center; font-weight: 800; }
.email { color: #fff; font-weight: 600; }
</style>


