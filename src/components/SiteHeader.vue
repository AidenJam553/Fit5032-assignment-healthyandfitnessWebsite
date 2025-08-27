<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { getCurrentUser } from '@/lib/auth'

const user = ref(null)
const isMobileMenuOpen = ref(false)
const USERS_KEY = 'users'

function loadUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]')
  } catch {
    return []
  }
}

function updateUser() { 
  user.value = getCurrentUser() 
}

const fullUser = computed(() => {
  if (!user.value) return null
  const users = loadUsers()
  return users.find(u =>
    (u.id && user.value?.id) ? u.id === user.value.id : u.email === user.value?.email
  ) || user.value
})

const userAvatar = computed(() => {
  return fullUser.value?.avatarDataUrl || null
})

function toggleMobileMenu() {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

function closeMobileMenu() {
  isMobileMenuOpen.value = false
}

onMounted(() => {
  updateUser()
  window.addEventListener('storage', updateUser)
})
onBeforeUnmount(() => { window.removeEventListener('storage', updateUser) })

function initialsFrom(u) {
  const base = u?.username || u?.email || ''
  return base.split('@')[0].split(/\s+/).map(s => s[0]).join('').slice(0,1).toUpperCase() || 'U'
}
</script>
<template>
  <header class="site-topbar">
    <div class="container topbar__inner">
      <router-link class="logo" to="/" @click="closeMobileMenu">
        <img class="logo__img" src="/logo.png" alt="Healthy & Fitness" />
        <span class="brand__text">Healthy & Fitness</span>
      </router-link>
      
      <!-- Desktop Navigation -->
      <nav class="nav nav--desktop">
        <router-link class="nav__link" to="/" exact-active-class="active">Home</router-link>
        <router-link class="nav__link" to="/forum" active-class="active">Forum</router-link>
        <router-link class="nav__link" to="/learn" active-class="active">Learn</router-link>
        <router-link class="nav__link" to="/record" active-class="active">Record</router-link>
        <router-link class="nav__link" to="/about" active-class="active">About</router-link>
      </nav>
      
      <!-- Desktop Auth Section -->
      <div class="auth-section auth-section--desktop">
        <router-link v-if="!user" class="btn btn--outline" to="/login">Log In</router-link>
        <router-link v-else class="profile-pill" to="/profile">
          <div class="avatar">
            <img v-if="userAvatar" :src="userAvatar" alt="User Avatar" class="avatar-img" />
            <span v-else class="avatar-initials">{{ initialsFrom(user) }}</span>
          </div>
          <span class="email hidden-mobile">{{ user.username || user.email }}</span>
        </router-link>
      </div>
      
      <!-- Mobile Menu Button -->
      <button class="mobile-menu-btn" @click="toggleMobileMenu" :class="{ 'active': isMobileMenuOpen }">
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
      </button>
    </div>
    
    <!-- Mobile Navigation Overlay -->
    <div class="mobile-nav-overlay" :class="{ 'active': isMobileMenuOpen }" @click="closeMobileMenu">
      <nav class="nav nav--mobile" @click.stop>
        <router-link class="nav__link nav__link--mobile" to="/" exact-active-class="active" @click="closeMobileMenu">
          <svg class="nav__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9,22 9,12 15,12 15,22"/>
          </svg>
          Home
        </router-link>
        <router-link class="nav__link nav__link--mobile" to="/forum" active-class="active" @click="closeMobileMenu">
          <svg class="nav__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          Forum
        </router-link>
        <router-link class="nav__link nav__link--mobile" to="/learn" active-class="active" @click="closeMobileMenu">
          <svg class="nav__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
          </svg>
          Learn
        </router-link>
        <router-link class="nav__link nav__link--mobile" to="/record" active-class="active" @click="closeMobileMenu">
          <svg class="nav__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 19c-5 0-6-3-6-3s1-3 6-3 6 3 6 3-1 3-6 3z"/>
            <path d="M9 19c0 0-1-1-1-3s1-3 1-3"/>
            <path d="M15 19c0 0 1-1 1-3s-1-3-1-3"/>
            <path d="M9 10a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v9"/>
          </svg>
          Record
        </router-link>
        <router-link class="nav__link nav__link--mobile" to="/about" active-class="active" @click="closeMobileMenu">
          <svg class="nav__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          About
        </router-link>
        
        <!-- Mobile Auth Section -->
        <div class="auth-section auth-section--mobile">
          <router-link v-if="!user" class="btn btn--primary btn--mobile-full" to="/login" @click="closeMobileMenu">
            Log In
          </router-link>
          <router-link v-else class="profile-pill profile-pill--mobile" to="/profile" @click="closeMobileMenu">
            <div class="avatar">
              <img v-if="userAvatar" :src="userAvatar" alt="User Avatar" class="avatar-img" />
              <span v-else class="avatar-initials">{{ initialsFrom(user) }}</span>
            </div>
            <div class="profile-info">
              <span class="email">{{ user.username || user.email }}</span>
              <span class="profile-label">View Profile</span>
            </div>
          </router-link>
        </div>
      </nav>
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

.topbar__inner { 
  display: flex; 
  align-items: center; 
  justify-content: space-between; 
  height: 64px; 
  position: relative;
}

.logo { 
  display: flex; 
  align-items: center; 
  gap: 12px; 
  text-decoration: none; 
  cursor: pointer; 
  z-index: 60;
}

.logo__img { 
  height: 36px; 
  width: auto; 
  display: block; 
}

.brand__text { 
  font-family: 'Dancing Script', cursive; 
  font-size: 24px; 
  font-style: italic; 
  color: #ffffff; 
  letter-spacing: .3px; 
  text-shadow: 0 1px 2px rgba(0,0,0,0.15); 
}

/* Desktop Navigation */
.nav--desktop { 
  display: none; 
  gap: 20px; 
}

.nav__link { 
  color: rgba(255,255,255,0.92); 
  text-decoration: none; 
  transition: all 0.2s ease;
  padding: 8px 12px;
  border-radius: 8px;
}

.nav__link.active { 
  color: #ffffff; 
  font-weight: 600; 
  background: rgba(255,255,255,0.1);
}

.nav__link:hover { 
  color: #ffffff; 
  background: rgba(255,255,255,0.1);
}

/* Auth Section */
.auth-section--desktop {
  display: none;
}

.btn.btn--outline { 
  background: #ffffff; 
  color: var(--green-700); 
  border-color: #ffffff; 
}

.btn.btn--outline:hover { 
  background: var(--green-50); 
}

/* Mobile Menu Button */
.mobile-menu-btn {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 44px;
  height: 44px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.3s ease;
  z-index: 60;
}

.mobile-menu-btn:hover {
  background: rgba(255,255,255,0.1);
}

.hamburger-line {
  width: 24px;
  height: 2px;
  background: #ffffff;
  margin: 2px 0;
  transition: all 0.3s ease;
  border-radius: 1px;
}

.mobile-menu-btn.active .hamburger-line:nth-child(1) {
  transform: rotate(45deg) translate(5px, 5px);
}

.mobile-menu-btn.active .hamburger-line:nth-child(2) {
  opacity: 0;
}

.mobile-menu-btn.active .hamburger-line:nth-child(3) {
  transform: rotate(-45deg) translate(7px, -6px);
}

/* Mobile Navigation Overlay */
.mobile-nav-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(4px);
  z-index: 40;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
}

.mobile-nav-overlay.active {
  opacity: 1;
  visibility: visible;
}

.nav--mobile {
  position: fixed;
  top: 0;
  right: 0;
  width: 280px;
  height: 100vh;
  background: linear-gradient(180deg, #34d399 0%, #15803d 100%);
  padding: 80px 24px 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transform: translateX(100%);
  transition: transform 0.3s ease;
  box-shadow: -4px 0 20px rgba(0,0,0,0.15);
}

.mobile-nav-overlay.active .nav--mobile {
  transform: translateX(0);
}

.nav__link--mobile {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  color: rgba(255,255,255,0.9);
  text-decoration: none;
  border-radius: 12px;
  transition: all 0.2s ease;
  font-size: 16px;
  font-weight: 500;
  min-height: 56px;
}

.nav__link--mobile:hover {
  background: rgba(255,255,255,0.1);
  color: #ffffff;
  transform: translateX(4px);
}

.nav__link--mobile.active {
  background: rgba(255,255,255,0.15);
  color: #ffffff;
  font-weight: 600;
}

.nav__icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

/* Mobile Auth Section */
.auth-section--mobile {
  margin-top: auto;
  padding-top: 24px;
  border-top: 1px solid rgba(255,255,255,0.2);
}

.profile-pill--mobile {
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.25);
  color: #fff;
  text-decoration: none;
  padding: 16px 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  transition: all 0.2s ease;
}

.profile-pill--mobile:hover {
  background: rgba(255,255,255,0.25);
  transform: translateY(-2px);
}

.profile-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.profile-label {
  font-size: 14px;
  color: rgba(255,255,255,0.7);
  font-weight: 400;
}

/* Profile Pill Styles */
.profile-pill {
  display: inline-flex; 
  align-items: center; 
  gap: 10px;
  background: rgba(255,255,255,0.25);
  border: 1px solid rgba(255,255,255,0.35);
  color: #fff; 
  text-decoration: none;
  padding: 8px 12px; 
  border-radius: 999px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  transition: all 0.2s ease;
}

.profile-pill:hover { 
  background: rgba(255,255,255,0.35); 
  transform: translateY(-1px);
}

.avatar { 
  width: 28px; 
  height: 28px; 
  border-radius: 50%; 
  background: rgba(255,255,255,0.85); 
  color: #15803d; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  font-weight: 800; 
  overflow: hidden;
  position: relative;
  flex-shrink: 0;
}

.avatar-img { 
  width: 100%; 
  height: 100%; 
  object-fit: cover; 
  border-radius: 50%; 
}

.avatar-initials {
  font-size: 12px;
  font-weight: 800;
}

.email { 
  color: #fff; 
  font-weight: 600; 
}

/* Responsive Breakpoints */
@media (min-width: 576px) {
  .brand__text {
    font-size: 26px;
  }
  
  .mobile-menu-btn {
    width: 48px;
    height: 48px;
  }
  
  .nav--mobile {
    width: 320px;
  }
}

@media (min-width: 768px) { 
  .nav--desktop { 
    display: flex; 
  }
  
  .auth-section--desktop {
    display: block;
  }
  
  .mobile-menu-btn {
    display: none;
  }
  
  .mobile-nav-overlay {
    display: none;
  }
}

@media (min-width: 992px) {
  .topbar__inner {
    height: 72px;
  }
  
  .logo__img {
    height: 40px;
  }
  
  .brand__text {
    font-size: 28px;
  }
  
  .nav__link {
    padding: 10px 16px;
    font-size: 16px;
  }
}

@media (min-width: 1400px) {
  .topbar__inner {
    height: 80px;
  }
  
  .logo__img {
    height: 44px;
  }
  
  .brand__text {
    font-size: 30px;
  }
}
</style>


