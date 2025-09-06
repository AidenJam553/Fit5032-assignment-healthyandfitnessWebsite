<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { loginLocal, signInWithGoogle, getRedirectForEmail } from '@/lib/auth'
import { useRouter } from 'vue-router'
import Button from '@/components/Button.vue'

const router = useRouter()
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const isLoaded = ref(false)
const showContent = ref(false)

async function onSubmit() {
  error.value = ''
  loading.value = true
  const res = loginLocal({ email: email.value, password: password.value })
  loading.value = false
  if (!res.ok) { error.value = res.error; return }
  router.push(getRedirectForEmail(email.value))
}

function renderGoogle() {
  const gi = window.google && window.google.accounts && window.google.accounts.id
  if (!gi) {
    console.log('Google Identity Services not available')
    return
  }
  
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  console.log('Google Client ID:', clientId ? 'Set' : 'Not set')
  
  if (!clientId) {
    console.error('VITE_GOOGLE_CLIENT_ID environment variable not set')
    showGoogleSetupMessage()
    return
  }
  
  try {
    gi.initialize({ 
      client_id: clientId, 
      callback: handleGoogleResponse,
      auto_select: false,
      cancel_on_tap_outside: true
    })
    gi.renderButton(document.getElementById('googleBtn'), { 
      theme: 'outline', 
      size: 'large',
      width: '100%'
    })
  } catch (err) {
    console.error('Google initialization error:', err)
    showGoogleSetupMessage()
  }
}

function showGoogleSetupMessage() {
  const googleBtn = document.getElementById('googleBtn')
  if (googleBtn) {
    googleBtn.innerHTML = `
      <div style="
        padding: 12px 16px; 
        border: 1px solid #d1d5db; 
        border-radius: 8px; 
        background: #f9fafb; 
        color: #6b7280; 
        text-align: center; 
        font-size: 14px;
        line-height: 1.4;
      ">
        <div style="margin-bottom: 4px; font-weight: 600;">Google Sign-in not configured</div>
        <div style="font-size: 12px;">
          Set VITE_GOOGLE_CLIENT_ID in environment variables.<br>
          See console for setup instructions.
        </div>
      </div>
    `
    
    console.group('🔧 Google OAuth Setup Instructions')
    console.log('1. Go to Google Cloud Console: https://console.cloud.google.com/')
    console.log('2. Create a project or select existing one')
    console.log('3. Enable Google Identity API')
    console.log('4. Go to Credentials → Create OAuth 2.0 Client ID')
    console.log('5. Add authorized origins:')
    console.log('   - http://localhost:5173')
    console.log('   - http://127.0.0.1:5173')
    console.log('   - Your production domain')
    console.log('6. Copy Client ID and add to .env file:')
    console.log('   VITE_GOOGLE_CLIENT_ID=your-client-id-here')
    console.log('   GOOGLE_CLIENT_ID=your-client-id-here')
    console.groupEnd()
  }
}

async function handleGoogleResponse(response) {
  try {
    error.value = ''
    const res = await fetch('/api/auth/google', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ credential: response.credential }) })
    const data = await res.json()
    if (!data.ok) { error.value = data.error || 'Google auth failed'; return }
    
    // Get user info from Google response
    const email = data.profile?.email
    const name = data.profile?.name
    
    if (!email) { error.value = 'Failed to get email from Google'; return }
    
    // Use the signInWithGoogle function to handle user creation/login
    const authResult = signInWithGoogle(email, name)
    if (!authResult.ok) { error.value = authResult.error; return }
    
    // Redirect to appropriate page
    router.push(getRedirectForEmail(email))
  } catch (e) {
    error.value = 'Network error'
  }
}

function loadGisAndRender() {
  if (window.google && window.google.accounts && window.google.accounts.id) {
    renderGoogle()
    return
  }
  let script = document.getElementById('gis-sdk')
  if (!script) {
    script = document.createElement('script')
    script.id = 'gis-sdk'
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => renderGoogle()
    document.head.appendChild(script)
  } else {
    script.addEventListener('load', () => renderGoogle(), { once: true })
  }
}

onMounted(async () => { 
  loadGisAndRender()
  
  // Trigger animations
  await nextTick()
  setTimeout(() => {
    isLoaded.value = true
  }, 100)
  setTimeout(() => {
    showContent.value = true
  }, 300)
})
</script>

<template>
  <div class="auth-page">
    <!-- Animated Background -->
    <div class="bg-animation">
      <div class="floating-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
        <div class="shape shape-4"></div>
        <div class="shape shape-5"></div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="auth-container animate-fade-up" :class="{ 'animate-in': isLoaded }">
      <!-- Back Button -->
      <router-link to="/" class="back-home animate-slide-left" :class="{ 'animate-in': showContent }" style="animation-delay: 0.1s">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Back to Home
      </router-link>

      <!-- Login Card -->
      <div class="auth-card animate-slide-up" :class="{ 'animate-in': isLoaded }" style="animation-delay: 0.2s">
        <!-- Header -->
        <div class="card-header animate-fade-up" :class="{ 'animate-in': showContent }" style="animation-delay: 0.3s">
          <div class="logo-container">
            <div class="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 12l2 2 4-4"/>
                <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/>
              </svg>
            </div>
          </div>
          <h1 class="auth-title">Welcome</h1>
          <p class="auth-subtitle">Sign in to your account</p>
        </div>

        <!-- Form -->
        <form @submit.prevent="onSubmit" class="auth-form">
          <div class="form-group animate-slide-left" :class="{ 'animate-in': showContent }" style="animation-delay: 0.4s">
            <label class="form-label">Email Address</label>
            <div class="input-container">
              <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <input v-model="email" type="email" required class="form-input" placeholder="Enter your email" />
            </div>
          </div>

          <div class="form-group animate-slide-right" :class="{ 'animate-in': showContent }" style="animation-delay: 0.5s">
            <label class="form-label">Password</label>
            <div class="input-container">
              <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <circle cx="12" cy="16" r="1"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input v-model="password" type="password" required class="form-input" placeholder="Enter your password" />
    </div>
  </div>
  
          <Button 
            variant="primary" 
            size="large" 
            :full-width="true"
            :loading="loading"
            :disabled="loading"
            @click="onSubmit"
            class="animate-fade-up"
            :class="{ 'animate-in': showContent }"
            style="animation-delay: 0.6s"
          >
            Sign In
          </Button>
        </form>

        <!-- Google Login -->
        <div class="divider animate-fade-up" :class="{ 'animate-in': showContent }" style="animation-delay: 0.7s">
          <span>or</span>
        </div>

        <div class="google-container animate-slide-up" :class="{ 'animate-in': showContent }" style="animation-delay: 0.8s">
          <div id="googleBtn" class="google-btn-wrapper"></div>
        </div>

        <!-- Footer -->
        <div class="card-footer animate-fade-up" :class="{ 'animate-in': showContent }" style="animation-delay: 0.9s">
          <p class="hint">Don't have an account? <router-link to="/register" class="link">Create one</router-link></p>
        </div>

        <!-- Error Message -->
        <div v-if="error" class="error-message animate-shake">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          {{ error }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* CSS Variables */
:root {
  --primary-color: #22c55e;
  --primary-dark: #16a34a;
  --primary-light: #dcfce7;
  --text-primary: #0f172a;
  --text-secondary: #64748b;
  --text-muted: #94a3b8;
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --border-color: #e2e8f0;
  --error-color: #ef4444;
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  --radius: 16px;
  --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Page Layout */
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background: linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%);
  overflow: hidden;
}

/* Animated Background */
.bg-animation {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 0;
}

.floating-shapes {
  position: relative;
  width: 100%;
  height: 100%;
}

.shape {
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(45deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
  backdrop-filter: blur(10px);
  animation: float 20s infinite ease-in-out;
}

.shape-1 {
  width: 80px;
  height: 80px;
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.shape-2 {
  width: 120px;
  height: 120px;
  top: 20%;
  right: 10%;
  animation-delay: -5s;
}

.shape-3 {
  width: 60px;
  height: 60px;
  bottom: 30%;
  left: 20%;
  animation-delay: -10s;
}

.shape-4 {
  width: 100px;
  height: 100px;
  bottom: 20%;
  right: 20%;
  animation-delay: -15s;
}

.shape-5 {
  width: 140px;
  height: 140px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: -7s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
    opacity: 0.7;
  }
  33% {
    transform: translateY(-30px) rotate(120deg);
    opacity: 1;
  }
  66% {
    transform: translateY(30px) rotate(240deg);
    opacity: 0.4;
  }
}

/* Main Container */
.auth-container {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 440px;
  padding: 20px;
}

/* Back Button */
.back-home {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  text-decoration: none;
  padding: 12px 20px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  backdrop-filter: blur(10px);
  transition: var(--transition);
  margin-bottom: 24px;
}

.back-home:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.back-home svg {
  width: 16px;
  height: 16px;
}

/* Auth Card */
.auth-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 24px;
  padding: 40px;
  box-shadow: var(--shadow-xl);
  position: relative;
  overflow: hidden;
}

.auth-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #059669, #10b981, #34d399);
  border-radius: 24px 24px 0 0;
}

/* Card Header */
.card-header {
  text-align: center;
  margin-bottom: 32px;
}

.logo-container {
  margin-bottom: 24px;
}

.logo-icon {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  box-shadow: var(--shadow-lg);
  position: relative;
}

.logo-icon::before {
  content: '';
  position: absolute;
  inset: -2px;
  background: linear-gradient(45deg, #059669, #10b981, #34d399);
  border-radius: 22px;
  z-index: -1;
  opacity: 0.7;
  animation: pulse 2s ease-in-out infinite;
}

.logo-icon svg {
  width: 32px;
  height: 32px;
  color: white;
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.7;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
}

.auth-title {
  font-size: 2rem;
  font-weight: 700;
  color: #047857;
  margin: 0 0 8px 0;
}

.auth-subtitle {
  color: var(--text-secondary);
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
  letter-spacing: -0.025em;
}

/* Form Styles */
.auth-form {
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 24px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.input-container {
  position: relative;
}

.input-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  color: var(--text-muted);
  transition: var(--transition);
  z-index: 2;
}

.form-input {
  width: 100%;
  padding: 16px 16px 16px 48px;
  border: 2px solid var(--border-color);
  border-radius: 20px;
  font-size: 16px;
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: var(--transition);
  box-sizing: border-box;
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.1), inset 0 1px 3px rgba(0, 0, 0, 0.06);
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.1), inset 0 2px 6px rgba(0, 0, 0, 0.1), inset 0 1px 3px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}

.form-input:focus + .input-icon {
  color: var(--primary-color);
}

.form-input::placeholder {
  color: #a1a1aa;
  font-size: 15px;
}

/* Legacy button styles removed - now using Button component */

/* Loading Spinner */
.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
  margin: 0 auto;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Divider */
.divider {
  display: flex;
  align-items: center;
  margin: 24px 0;
  color: var(--text-muted);
  font-size: 14px;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border-color);
}

.divider span {
  margin: 0 16px;
  background: var(--bg-primary);
  padding: 0 8px;
}

/* Google Button Container */
.google-container {
  margin-bottom: 24px;
}

.google-btn-wrapper {
  display: flex;
  justify-content: center;
}

/* Card Footer */
.card-footer {
  text-align: center;
}

.hint {
  color: var(--text-secondary);
  font-size: 14px;
  margin: 0;
}

.link {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 600;
  transition: var(--transition);
}

.link:hover {
  color: var(--primary-dark);
  text-decoration: underline;
}

/* Error Message */
.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: var(--error-color);
  padding: 12px 16px;
  border-radius: var(--radius);
  font-size: 14px;
  margin-top: 16px;
}

.error-message svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

/* Animation Classes */
.animate-fade-up {
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.animate-slide-up {
  opacity: 0;
  transform: translateY(50px);
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.animate-slide-left {
  opacity: 0;
  transform: translateX(-30px);
  transition: all 0.7s cubic-bezier(0.4, 0, 0.2, 1);
}

.animate-slide-right {
  opacity: 0;
  transform: translateX(30px);
  transition: all 0.7s cubic-bezier(0.4, 0, 0.2, 1);
}

.animate-shake {
  animation: shake 0.5s ease-in-out;
}

.animate-in {
  opacity: 1;
  transform: translate(0, 0);
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

/* Responsive Design */
@media (max-width: 640px) {
  .auth-container {
    padding: 16px;
  }
  
  .auth-card {
    padding: 24px;
    border-radius: 16px;
  }
  
  .auth-title {
    font-size: 1.5rem;
  }
  
  .form-input {
    font-size: 16px; /* Prevent zoom on iOS */
  }
}

@media (max-width: 480px) {
  .shape {
    display: none; /* Hide floating shapes on very small screens */
  }
}
</style>

<!-- Google Identity Services -->


