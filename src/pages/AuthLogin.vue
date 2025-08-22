<script setup>
import { ref, onMounted } from 'vue'
import { loginLocal, getRedirectForEmail } from '@/lib/auth'
import { useRouter } from 'vue-router'

const router = useRouter()
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

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
  if (!gi) return
  gi.initialize({ client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID, callback: handleGoogleResponse })
  gi.renderButton(document.getElementById('googleBtn'), { theme: 'outline', size: 'large' })
}

async function handleGoogleResponse(response) {
  try {
    error.value = ''
    const res = await fetch('/api/auth/google', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ credential: response.credential }) })
    const data = await res.json()
    if (!data.ok) { error.value = data.error || 'Google auth failed'; return }
    const email = data.profile?.email
    router.push(getRedirectForEmail(email || ''))
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

onMounted(() => { loadGisAndRender() })
</script>

<template>
  <div class="auth">
    <div class="card">
      <h1>Log in</h1>
      <form @submit.prevent="onSubmit" class="form">
        <label>Email</label>
        <input v-model="email" type="email" required />

        <label>Password</label>
        <input v-model="password" type="password" required />

        <button class="btn btn--primary" :disabled="loading">{{ loading ? 'Logging in...' : 'Log in' }}</button>
      </form>
      <div id="googleBtn" style="margin-top:8px"></div>
      <p class="hint">No account? <router-link to="/register">Create one</router-link></p>
      <p v-if="error" class="error">{{ error }}</p>
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
</style>

<!-- Google Identity Services -->


