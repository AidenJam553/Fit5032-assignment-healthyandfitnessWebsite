<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { registerLocal, signInWithGoogle, getRedirectForEmail } from '@/lib/auth'
import { useRouter } from 'vue-router'

const router = useRouter()
const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const loading = ref(false)
const isLoaded = ref(false)
const showContent = ref(false)

const passwordPolicyOk = computed(() => {
  const p = password.value
  return p.length >= 6 && /[a-z]/.test(p) && /[A-Z]/.test(p) && /\d/.test(p)
})

async function onSubmit() {
  error.value = ''
  if (password.value !== confirmPassword.value) { error.value = 'Passwords do not match'; return }
  if (!passwordPolicyOk.value) { error.value = 'Password must be 6+ chars with lower, upper, number'; return }
  loading.value = true
  const res = registerLocal({ username: username.value, email: email.value, password: password.value })
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
    return
  }
  
  gi.initialize({ client_id: clientId, callback: handleGoogleResponse })
  gi.renderButton(document.getElementById('googleBtnReg'), { theme: 'outline', size: 'large' })
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
        <div class="shape shape-6"></div>
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

      <!-- Register Card -->
      <div class="auth-card animate-slide-up" :class="{ 'animate-in': isLoaded }" style="animation-delay: 0.2s">
        <!-- Header -->
        <div class="card-header animate-fade-up" :class="{ 'animate-in': showContent }" style="animation-delay: 0.3s">
          <div class="logo-container">
            <div class="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="m19 8 2 2-2 2"/>
                <path d="m17 12 2-2-2-2"/>
              </svg>
            </div>
          </div>
          <h1 class="auth-title">Join Us Today</h1>
          <p class="auth-subtitle">Create your account to get started</p>
        </div>

        <!-- Form -->
        <form @submit.prevent="onSubmit" class="auth-form">
          <div class="form-group animate-slide-left" :class="{ 'animate-in': showContent }" style="animation-delay: 0.4s">
            <label class="form-label">Username</label>
            <div class="input-container">
              <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <input v-model="username" type="text" required class="form-input" placeholder="Choose a username" />
            </div>
          </div>

          <div class="form-group animate-slide-right" :class="{ 'animate-in': showContent }" style="animation-delay: 0.5s">
            <label class="form-label">Email Address</label>
            <div class="input-container">
              <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <input v-model="email" type="email" required class="form-input" placeholder="Enter your email" />
            </div>
          </div>

          <div class="form-group animate-slide-left" :class="{ 'animate-in': showContent }" style="animation-delay: 0.6s">
            <label class="form-label">Password</label>
            <div class="input-container">
              <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <circle cx="12" cy="16" r="1"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input v-model="password" type="password" required class="form-input" placeholder="Create a strong password" />
            </div>
            <div class="password-policy" :class="{ 'policy-ok': passwordPolicyOk }">
              <svg class="policy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path v-if="passwordPolicyOk" d="M9 12l2 2 4-4"/>
                <circle v-else cx="12" cy="12" r="10"/>
                <path v-if="!passwordPolicyOk" d="M12 8v4M12 16h.01"/>
              </svg>
              6+ chars with uppercase, lowercase & number
            </div>
          </div>

          <div class="form-group animate-slide-right" :class="{ 'animate-in': showContent }" style="animation-delay: 0.7s">
            <label class="form-label">Confirm Password</label>
            <div class="input-container">
              <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                <polyline points="9,12 11,14 15,10"/>
              </svg>
              <input v-model="confirmPassword" type="password" required class="form-input" placeholder="Confirm your password" />
            </div>
          </div>

          <button class="btn-register animate-fade-up" :class="{ 'animate-in': showContent, 'loading': loading }" style="animation-delay: 0.8s" :disabled="loading">
            <span v-if="!loading">Create Account</span>
            <div v-else class="loading-spinner"></div>
          </button>
        </form>

        <!-- Google Login -->
        <div class="divider animate-fade-up" :class="{ 'animate-in': showContent }" style="animation-delay: 0.9s">
          <span>or</span>
        </div>

        <div class="google-container animate-slide-up" :class="{ 'animate-in': showContent }" style="animation-delay: 1.0s">
          <div id="googleBtnReg" class="google-btn-wrapper"></div>
        </div>

        <!-- Footer -->
        <div class="card-footer animate-fade-up" :class="{ 'animate-in': showContent }" style="animation-delay: 1.1s">
          <p class="hint">Already have an account? <router-link to="/login" class="link">Sign in</router-link></p>
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
:root {
  --green-700: #15803d;
  --green-600: #16a34a;
  --green-50: #f0fdf4;
  --border: #e2e8f0;
}
.auth { min-height: 100vh; display: grid; place-content: center; padding: 20px; }
.card { background: #fff; border: 1px solid var(--green-100); border-radius: 12px; padding: 20px; width: 360px; box-shadow: var(--shadow-lg); }
.form { display: grid; gap: 10px; margin-bottom: 10px; }
label { color: #334155; font-size: 14px; }
input { border: 1px solid var(--gray-200); border-radius: 8px; padding: 10px; }
.btn { border: 1px solid var(--green-600); border-radius: 8px; padding: 10px 14px; cursor: pointer; }
.btn--primary { background: var(--green-600); color: #fff; }
.btn--ghost { margin-top: 8px; background: #fff; color: var(--green-700); }
.btn--ghost:hover { background: var(--green-50); }
.hint { font-size: 13px; color: #64748b; }
.error { color: #b91c1c; margin-top: 8px; }
.back-home { display: inline-block; margin-bottom: 8px; color: var(--green-800); text-decoration: none; }
.back-home:hover { text-decoration: underline; }
.policy { font-size: 12px; color: #64748b; margin-top: -6px; }
.policy.ok { color: var(--green-700); }

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
  --success-color: #10b981;
  --warning-color: #f59e0b;
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
  background: linear-gradient(135deg, #047857 0%, #059669 30%, #10b981 70%, #34d399 100%);
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
  animation: float 25s infinite ease-in-out;
}

.shape-1 {
  width: 60px;
  height: 60px;
  top: 15%;
  left: 15%;
  animation-delay: 0s;
}

.shape-2 {
  width: 100px;
  height: 100px;
  top: 25%;
  right: 15%;
  animation-delay: -8s;
}

.shape-3 {
  width: 80px;
  height: 80px;
  bottom: 35%;
  left: 25%;
  animation-delay: -16s;
}

.shape-4 {
  width: 120px;
  height: 120px;
  bottom: 25%;
  right: 25%;
  animation-delay: -4s;
}

.shape-5 {
  width: 90px;
  height: 90px;
  top: 60%;
  left: 60%;
  animation-delay: -12s;
}

.shape-6 {
  width: 70px;
  height: 70px;
  top: 45%;
  right: 45%;
  animation-delay: -20s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
    opacity: 0.6;
  }
  25% {
    transform: translateY(-40px) rotate(90deg);
    opacity: 1;
  }
  50% {
    transform: translateY(20px) rotate(180deg);
    opacity: 0.4;
  }
  75% {
    transform: translateY(-20px) rotate(270deg);
    opacity: 0.8;
  }
}

/* Override existing styles for modern design */
.auth { display: none; }
.card { display: none; }
.form { display: none; }

/* Main Container */
.auth-container {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 480px;
  padding: 20px;
}

/* Back Button */
.back-home {
  display: inline-flex !important;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.1) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  color: white !important;
  text-decoration: none;
  padding: 12px 20px !important;
  border-radius: 12px !important;
  font-size: 14px;
  font-weight: 500;
  backdrop-filter: blur(10px);
  transition: var(--transition);
  margin-bottom: 24px !important;
}

.back-home:hover {
  background: rgba(255, 255, 255, 0.2) !important;
  border-color: rgba(255, 255, 255, 0.3) !important;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  text-decoration: none !important;
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
  background: linear-gradient(90deg, #047857, #059669, #10b981, #34d399);
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
  background: linear-gradient(135deg, #059669, #10b981);
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
  background: linear-gradient(45deg, #047857, #059669, #10b981, #34d399);
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

/* Password Policy */
.password-policy {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding: 10px 14px;
  background: rgba(239, 68, 68, 0.05);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 12px;
  font-size: 12px;
  color: var(--error-color);
  transition: var(--transition);
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.08);
}

.password-policy.policy-ok {
  background: rgba(16, 185, 129, 0.05);
  border-color: rgba(16, 185, 129, 0.2);
  color: var(--success-color);
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.12);
}

.policy-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

/* Register Button */
.btn-register {
  width: 100%;
  padding: 18px 24px;
  background: linear-gradient(135deg, #059669, #10b981);
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: var(--transition);
  position: relative;
  overflow: hidden;
  box-shadow: 0 8px 20px rgba(5, 150, 105, 0.25), 0 4px 12px rgba(0, 0, 0, 0.1);
}

.btn-register:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 12px 32px rgba(5, 150, 105, 0.35), 0 8px 20px rgba(0, 0, 0, 0.15);
  background: linear-gradient(135deg, #047857, #059669);
}

.btn-register:active {
  transform: translateY(0);
}

.btn-register:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.btn-register.loading {
  background: linear-gradient(135deg, var(--text-muted), var(--text-secondary));
}

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
  color: var(--text-secondary) !important;
  font-size: 14px !important;
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


