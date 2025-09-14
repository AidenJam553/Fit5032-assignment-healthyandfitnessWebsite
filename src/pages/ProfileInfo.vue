<script setup>
import SiteHeader from '@/components/SiteHeader.vue'
import Button from '@/components/Button.vue'
import { getCurrentUser, logout, getUserProfile } from '@/lib/auth'
import { useLessonsStore } from '@/lib/stores/lessons'
import { useForumStore } from '@/lib/stores/forum'
import { useRecordsStore } from '@/lib/stores/records'
import { useRouter } from 'vue-router'
import { ref, onMounted } from 'vue'

const router = useRouter()
const current = getCurrentUser()
const loading = ref(false)
const error = ref('')

// stores for achievements
const lessons = useLessonsStore()
const forum = useForumStore()
const records = useRecordsStore()

// Initialize stores
lessons.initializeCourses()
if (forum.seedIfEmpty) {
  forum.seedIfEmpty()
}
if (records.loadPersisted) {
  records.loadPersisted()
}

const view = ref({
  avatarDataUrl: '',
  username: current?.username || 'User',
  email: current?.email || '',
  phone: '',
  dob: '',
  gender: 'Other',
  weightKg: null,
  heightCm: null,
  bmrKcal: null,
  bio: '',
  region: '',
  role: current?.role || 'user',
})

// Load user profile data
async function loadProfile() {
  if (!current?.id) {
    error.value = 'User not found'
    return
  }
  
  loading.value = true
  try {
    const result = await getUserProfile(current.id)
    if (result.ok) {
      const user = result.user
      view.value = {
        avatarDataUrl: user.avatarDataUrl || '',
        username: user.username || current?.username || 'User',
        email: user.email || current?.email || '',
        phone: user.phone || '',
        dob: user.dob || '',
        gender: user.gender || 'Other',
        weightKg: user.weightKg ?? null,
        heightCm: user.heightCm ?? null,
        bmrKcal: user.bmrKcal ?? null,
        bio: user.bio || '',
        region: user.region || '',
        role: user.role || current?.role || 'user',
      }
    } else {
      error.value = result.error || 'Failed to load profile'
    }
  } catch (err) {
    error.value = 'Network error'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadProfile()
})

function calcAge(dob) {
  if (!dob) return ''
  const d = new Date(dob)
  if (Number.isNaN(d.getTime())) return ''
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / (365.2425 * 24 * 60 * 60 * 1000)))
}

function edit() { router.push('/profile/edit') }
function handleLogout() { logout(); router.replace('/') }
</script>

<template>
  <div class="page">
    <SiteHeader />
    <div class="container info">
      <div class="header profile-head">
        <img v-if="view.avatarDataUrl" :src="view.avatarDataUrl" alt="avatar" class="avatar-img" />
        <div class="avatar" v-else>{{ (view.username || 'U')[0].toUpperCase() }}</div>
        <div>
          <h1 class="title">{{ view.username }}</h1>
          <div class="muted">{{ view.email }}</div>
        </div>
        <div class="spacer"></div>
        <Button variant="secondary" size="medium" style="margin-right:8px" @click="handleLogout">Log out</Button>
        <Button variant="primary" size="medium" @click="edit">Edit</Button>
      </div>
      
      <div v-if="error" class="error-message">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
        {{ error }}
      </div>

      <div class="grid">
        <div class="card">
          <h3>Contact</h3>
          <p><strong>Email:</strong> {{ view.email || '-' }}</p>
          <p><strong>Phone:</strong> {{ view.phone || '-' }}</p>
          <p><strong>Region:</strong> {{ view.region || '-' }}</p>
        </div>
        <div class="card">
          <h3>Achievements</h3>
          <ul class="achv">
            <li><span>Lessons taken</span><b>{{ (lessons.courses || []).length }}</b></li>
            <li><span>Avg course rating</span><b>{{ ((lessons.courses || []).length && Object.keys(lessons.ratings).length) ? '★' : '—' }}</b></li>
            <li><span>Forum posts</span><b>{{ forum.posts.length }}</b></li>
            <li><span>Weight logs</span><b>{{ records.weightLog?.length || 0 }}</b></li>
            <li><span>Diet entries</span><b>{{ records.dietLog?.length || 0 }}</b></li>
            <li><span>Exercise entries</span><b>{{ records.exerciseLog?.length || 0 }}</b></li>
          </ul>
        </div>
        <div class="card">
          <h3>Vitals</h3>
          <p><strong>DOB:</strong> {{ view.dob || '-' }}</p>
          <p><strong>Age:</strong> {{ calcAge(view.dob) || '-' }}</p>
          <p><strong>Gender:</strong> {{ view.gender }}</p>
          <p><strong>Weight:</strong> {{ view.weightKg ?? '-' }} kg</p>
          <p><strong>Height:</strong> {{ view.heightCm ?? '-' }} cm</p>
          <p><strong>BMR:</strong> {{ view.bmrKcal ?? '-' }} Kcal</p>
        </div>
        <div class="card">
          <h3>Bio</h3>
          <p style="white-space: pre-wrap;">{{ view.bio || '—' }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.info { padding: 24px 0; font-family: 'Manrope', ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; }
.header { display: flex; align-items: center; gap: 12px; }
.profile-head { background: linear-gradient(180deg, rgba(240,253,244,.85), #fff); border: 1px solid var(--green-100); border-radius: 16px; padding: 14px 16px; box-shadow: var(--shadow-lg); }
.spacer { flex: 1; }
.avatar, .avatar-img { width: 64px; height: 64px; border-radius: 50%; }
.avatar { background: var(--green-100); display: grid; place-content: center; font-weight: 800; }
.avatar-img { object-fit: cover; box-shadow: inset 0 0 0 3px #fff, 0 0 0 3px var(--green-200); }
.title { margin: 0; letter-spacing: .2px; font-weight: 800; }
.muted { color: #64748b; }
.grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-top: 16px; }
.card { position: relative; background: #fff; border: 1px solid var(--green-100); border-radius: 16px; padding: 18px 20px; box-shadow: var(--shadow-md); }
.card h3 { margin: 0 0 8px 0; font-size: 18px; }
.card::before { content: ''; position: absolute; left: 0; right: 0; top: 0; height: 5px; border-radius: 16px 16px 0 0; background: linear-gradient(90deg, var(--green-200), var(--green-600)); }
.achv { margin: 0; padding: 0; list-style: none; display: grid; gap: 8px; }
.achv li { display: flex; align-items: center; justify-content: space-between; background: var(--green-50); border: 1px solid var(--green-100); border-radius: 999px; padding: 8px 12px; }

/* Error Message */
.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #ef4444;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
  margin-top: 16px;
}

.error-message svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

@media (max-width: 760px) { .grid { grid-template-columns: 1fr; } }
</style>


