<script setup>
import SiteHeader from '@/components/SiteHeader.vue'
import Button from '@/components/Button.vue'
import { reactive, computed, onMounted, ref } from 'vue'
import { getCurrentUser, getUserProfile, updateUserProfile } from '@/lib/auth'
import { useRouter } from 'vue-router'

const router = useRouter()

const current = getCurrentUser()
const loading = ref(false)
const error = ref('')

const form = reactive({
  avatarDataUrl: '',
  username: '',
  email: '',
  phone: '',
  dob: '',
  gender: 'Other',
  weightKg: 0,
  heightCm: 0,
  bmrKcal: 0,
  bio: '',
  region: '',
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
      form.avatarDataUrl = user.avatarDataUrl || ''
      form.username = user.username || ''
      form.email = user.email || ''
      form.phone = user.phone || ''
      form.dob = user.dob || ''
      form.gender = user.gender || 'Other'
      form.weightKg = user.weightKg ?? 0
      form.heightCm = user.heightCm ?? 0
      form.bmrKcal = user.bmrKcal ?? 0
      form.bio = user.bio || ''
      form.region = user.region || ''
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

const age = computed(() => {
  if (!form.dob) return 0
  const d = new Date(form.dob)
  if (Number.isNaN(d.getTime())) return 0
  const diff = Date.now() - d.getTime()
  return Math.max(0, Math.floor(diff / (365.2425 * 24 * 60 * 60 * 1000)))
})

function computeBmr() {
  const a = age.value || 0
  const w = Number(form.weightKg) || 0
  const h = Number(form.heightCm) || 0
  let base = 10 * w + 6.25 * h - 5 * a
  if (form.gender === 'Male') base += 5
  else if (form.gender === 'Female') base -= 161
  else base -= 78 // neutral offset between male/female
  return Math.max(0, Math.round(base))
}

function autoBmr() {
  // Only auto-set when empty or obviously out of range
  if (!form.bmrKcal || form.bmrKcal < 600 || form.bmrKcal > 4000) {
    form.bmrKcal = computeBmr()
  }
}

// Simple square cropper state
const cropper = reactive({ show: false, src: '', scale: 1, offsetX: 0, offsetY: 0, lastX: 0, lastY: 0, dragging: false, naturalWidth: 0, naturalHeight: 0, cropSize: 512, resizing: false, pinchStartDist: 0, pinchStartScale: 1, pinchCenter: { x: 256, y: 256 } })
const viewportRef = ref(null)

function openCropper(src) {
  cropper.src = src
  cropper.show = true
  cropper.scale = 0.5
  cropper.offsetX = 0
  cropper.offsetY = 0
  cropper.cropSize = 512
  // load to get natural size
  const img = new Image()
  img.onload = () => {
    cropper.naturalWidth = img.naturalWidth; cropper.naturalHeight = img.naturalHeight
    // center the image at current scale in 320x320 viewport
    const w = cropper.naturalWidth * cropper.scale
    const h = cropper.naturalHeight * cropper.scale
    cropper.offsetX = Math.round((512 - w) / 2)
    cropper.offsetY = Math.round((512 - h) / 2)
    clampOffsets()
  }
  img.src = src
}

function closeCropper() { cropper.show = false }

function onAvatarChange(e) {
  const file = e.target.files && e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => { openCropper(String(reader.result || '')) }
  reader.readAsDataURL(file)
}

function pointer(e) {
  if (e.touches && e.touches[0]) return { x: e.touches[0].clientX, y: e.touches[0].clientY }
  return { x: e.clientX, y: e.clientY }
}

function startDrag(e) {
  const p = pointer(e)
  cropper.dragging = true
  cropper.lastX = p.x
  cropper.lastY = p.y
  window.addEventListener('mousemove', onDrag)
  window.addEventListener('mouseup', endDrag)
  window.addEventListener('touchmove', onDrag, { passive: false })
  window.addEventListener('touchend', endDrag)
}

function onDrag(e) {
  if (!cropper.dragging) return
  e.preventDefault?.()
  const p = pointer(e)
  const dx = p.x - cropper.lastX
  const dy = p.y - cropper.lastY
  cropper.offsetX += dx
  cropper.offsetY += dy
  cropper.lastX = p.x
  cropper.lastY = p.y
  clampOffsets()
}

function endDrag() {
  cropper.dragging = false
  window.removeEventListener('mousemove', onDrag)
  window.removeEventListener('mouseup', endDrag)
  window.removeEventListener('touchmove', onDrag)
  window.removeEventListener('touchend', endDrag)
}

function clampOffsets() {
  const vw = 512, vh = 512
  const w = cropper.naturalWidth * cropper.scale
  const h = cropper.naturalHeight * cropper.scale
  const minX = Math.min(0, vw - w)
  const minY = Math.min(0, vh - h)
  const maxX = 0
  const maxY = 0
  cropper.offsetX = Math.min(maxX, Math.max(minX, cropper.offsetX))
  cropper.offsetY = Math.min(maxY, Math.max(minY, cropper.offsetY))
}

const imageStyle = computed(() => ({
  transform: `translate(${cropper.offsetX}px, ${cropper.offsetY}px) scale(${cropper.scale})`,
  transformOrigin: 'top left'
}))

// Resize crop circle by dragging a handle – circle always centered
function startResize(e) {
  cropper.resizing = true
  window.addEventListener('mousemove', onResize)
  window.addEventListener('mouseup', endResize)
  window.addEventListener('touchmove', onResize, { passive: false })
  window.addEventListener('touchend', endResize)
  onResize(e)
}

function onResize(e) {
  if (!cropper.resizing) return
  e.preventDefault?.()
  const p = pointer(e)
  // viewport center (360/2)
  const cx = 256, cy = 256
  const dx = p.x - (e.currentTarget?.getBoundingClientRect?.().left || 0) - cx
  const dy = p.y - (e.currentTarget?.getBoundingClientRect?.().top || 0) - cy
  const dist = Math.sqrt(dx*dx + dy*dy)
  const size = Math.min(320, Math.max(120, Math.round(dist * 2)))
  cropper.cropSize = size
}

function endResize() {
  cropper.resizing = false
  window.removeEventListener('mousemove', onResize)
  window.removeEventListener('mouseup', endResize)
  window.removeEventListener('touchmove', onResize)
  window.removeEventListener('touchend', endResize)
}

function confirmCrop() {
  const canvas = document.createElement('canvas')
  const size = 512
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const img = new Image()
  img.onload = () => {
    // viewport center
    // map viewport rect (0,0,size,size) back to image space
    let srcX = (-cropper.offsetX) / cropper.scale
    let srcY = (-cropper.offsetY) / cropper.scale
    let srcW = size / cropper.scale
    let srcH = size / cropper.scale
    let dstX = 0, dstY = 0
    let dstW = size, dstH = size

    // Clip when requested crop exceeds image bounds, while keeping visual center
    if (srcX < 0) {
      const cut = -srcX; srcX = 0; srcW -= cut; dstX = cut * cropper.scale; dstW = srcW * cropper.scale
    }
    if (srcY < 0) {
      const cut = -srcY; srcY = 0; srcH -= cut; dstY = cut * cropper.scale; dstH = srcH * cropper.scale
    }
    if (srcX + srcW > img.naturalWidth) {
      const cut = srcX + srcW - img.naturalWidth; srcW -= cut; dstW = srcW * cropper.scale
    }
    if (srcY + srcH > img.naturalHeight) {
      const cut = srcY + srcH - img.naturalHeight; srcH -= cut; dstH = srcH * cropper.scale
    }

    ctx.fillStyle = '#fff'
    ctx.fillRect(0,0,size,size)
    if (srcW > 0 && srcH > 0) {
      ctx.drawImage(img, srcX, srcY, srcW, srcH, dstX, dstY, dstW, dstH)
    }
    form.avatarDataUrl = canvas.toDataURL('image/png')
    closeCropper()
  }
  img.src = cropper.src
}

function clampScale(val) { return Math.min(3, Math.max(0.5, val)) }

function applyZoomAt(px, py, newScale) {
  newScale = clampScale(newScale)
  // world coord under pointer before zoom
  const sX = (px - cropper.offsetX) / cropper.scale
  const sY = (py - cropper.offsetY) / cropper.scale
  cropper.scale = newScale
  // keep same world coord under pointer
  cropper.offsetX = px - sX * cropper.scale
  cropper.offsetY = py - sY * cropper.scale
  clampOffsets()
}

function onWheel(e) {
  e.preventDefault()
  const rect = viewportRef.value?.getBoundingClientRect()
  if (!rect) return
  const px = e.clientX - rect.left
  const py = e.clientY - rect.top
  const factor = e.deltaY < 0 ? 1.1 : 0.9
  applyZoomAt(px, py, cropper.scale * factor)
}

function handleTouchStart(e) {
  if (e.touches && e.touches.length === 2) { startResizeOrPinch(e); return }
  startDrag(e)
}

function startResizeOrPinch(e) {
  // pinch zoom
  const rect = viewportRef.value?.getBoundingClientRect()
  const t1 = e.touches[0], t2 = e.touches[1]
  const cx = ((t1.clientX + t2.clientX) / 2) - (rect?.left || 0)
  const cy = ((t1.clientY + t2.clientY) / 2) - (rect?.top || 0)
  cropper.pinchCenter = { x: cx, y: cy }
  const dx = t1.clientX - t2.clientX
  const dy = t1.clientY - t2.clientY
  cropper.pinchStartDist = Math.hypot(dx, dy)
  cropper.pinchStartScale = cropper.scale
  window.addEventListener('touchmove', onPinchMove, { passive: false })
  window.addEventListener('touchend', endPinch)
}

function onPinchMove(e) {
  if (!(e.touches && e.touches.length === 2)) return
  e.preventDefault()
  const t1 = e.touches[0], t2 = e.touches[1]
  const dx = t1.clientX - t2.clientX
  const dy = t1.clientY - t2.clientY
  const dist = Math.hypot(dx, dy)
  if (!cropper.pinchStartDist) return
  const newScale = clampScale(cropper.pinchStartScale * (dist / cropper.pinchStartDist))
  applyZoomAt(cropper.pinchCenter.x, cropper.pinchCenter.y, newScale)
}

function endPinch() {
  window.removeEventListener('touchmove', onPinchMove)
  window.removeEventListener('touchend', endPinch)
}

function onKeydown(e) {
  const step = e.shiftKey ? 10 : 1
  if (e.key === 'ArrowLeft') { cropper.offsetX += step; clampOffsets(); }
  else if (e.key === 'ArrowRight') { cropper.offsetX -= step; clampOffsets(); }
  else if (e.key === 'ArrowUp') { cropper.offsetY += step; clampOffsets(); }
  else if (e.key === 'ArrowDown') { cropper.offsetY -= step; clampOffsets(); }
  else if (e.key === '+' || e.key === '=' ) {
    const rect = viewportRef.value?.getBoundingClientRect(); if (!rect) return
    applyZoomAt(rect.width/2, rect.height/2, cropper.scale * 1.1)
  } else if (e.key === '-' || e.key === '_') {
    const rect = viewportRef.value?.getBoundingClientRect(); if (!rect) return
    applyZoomAt(rect.width/2, rect.height/2, cropper.scale * 0.9)
  }
}

function validate() {
  const name = String(form.username || '').trim()
  if (name.length < 2) return 'Username is too short'
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email || '')) return 'Invalid email'
  if (Number(form.weightKg) < 0) return 'Weight cannot be negative'
  if (Number(form.heightCm) < 0) return 'Height cannot be negative'
  if (Number(form.bmrKcal) < 0) return 'BMR cannot be negative'
  return ''
}

async function save() {
  const err = validate()
  if (err) { 
    error.value = err
    return 
  }

  if (!current?.id) {
    error.value = 'User not found'
    return
  }

  autoBmr()
  loading.value = true
  error.value = ''

  try {
    const profileData = {
      username: form.username.trim(),
      email: form.email.trim(),
      phone: form.phone,
      dob: form.dob,
      gender: form.gender,
      weightKg: Number(form.weightKg) || 0,
      heightCm: Number(form.heightCm) || 0,
      bmrKcal: Number(form.bmrKcal) || 0,
      bio: form.bio,
      region: form.region,
      avatarDataUrl: form.avatarDataUrl,
    }

    const result = await updateUserProfile(current.id, profileData)
    
    if (result.ok) {
      router.replace('/profile')
    } else {
      error.value = result.error || 'Failed to save profile'
    }
  } catch (err) {
    error.value = 'Network error'
  } finally {
    loading.value = false
  }
}

</script>

<template>
  <div class="page">
    <SiteHeader />
    <div class="container profile">
      <div class="toolbar center">
        <Button variant="secondary" size="medium" @click="router.push('/profile')">← Back</Button>
        <h1 class="title">Edit Profile</h1>
      </div>
      <div class="panel">
        <h3 class="section-title">Avatar</h3>
        <div class="avatar-row center">
          <label for="avatarInput" class="avatar-large">
            <img v-if="form.avatarDataUrl" :src="form.avatarDataUrl" alt="avatar" />
            <span v-else>{{ (form.username||'U')[0]?.toUpperCase() }}</span>
          </label>
          <input id="avatarInput" type="file" accept="image/*" @change="onAvatarChange" style="display:none" />
        </div>
        
        <h3 class="section-title">Account</h3>
        <label>Username</label>
        <input v-model="form.username" />

        <label>Email</label>
        <input v-model="form.email" type="email" />

        <h3 class="section-title">Contact</h3>
        <label>Phone</label>
        <input v-model="form.phone" placeholder="Optional" />

        <h3 class="section-title">Vitals</h3>
        <div class="grid">
          <div>
            <label>Date of birth</label>
            <input v-model="form.dob" type="date" @change="autoBmr" />
          </div>
          <div>
            <label>Age</label>
            <input :value="age" disabled />
          </div>
          <div>
            <label>Gender</label>
            <select v-model="form.gender" @change="autoBmr">
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </div>
        </div>

        <div class="grid">
          <div>
            <label>Weight (kg)</label>
            <input v-model.number="form.weightKg" type="number" min="0" step="0.1" @input="autoBmr" />
          </div>
          <div>
            <label>Height (cm)</label>
            <input v-model.number="form.heightCm" type="number" min="0" step="0.1" @input="autoBmr" />
          </div>
          <div>
            <label>Basal Metabolic Rate (Kcal)</label>
            <input v-model.number="form.bmrKcal" type="number" min="0" />
          </div>
        </div>

        <h3 class="section-title">About</h3>
        <label>Region</label>
        <input v-model="form.region" placeholder="City / Country" />

        <label>Bio</label>
        <textarea v-model="form.bio" rows="3" placeholder="Tell us about yourself..." />

        <div class="row actions">
          <Button 
            variant="primary" 
            size="medium" 
            :loading="loading"
            :disabled="loading"
            @click="save"
          >
            {{ loading ? 'Saving...' : 'Save' }}
          </Button>
        </div>
        
        <div v-if="error" class="error-message">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          {{ error }}
        </div>
      </div>
      <div v-if="cropper.show" class="cropper-backdrop" @click.self="closeCropper">
        <div class="cropper">
          <div class="viewport large" ref="viewportRef" tabindex="0" @mousedown="startDrag" @touchstart.prevent="handleTouchStart" @wheel.prevent="onWheel" @keydown.prevent="onKeydown">
            <img :src="cropper.src" :style="imageStyle" draggable="false" />
            <div class="mask">
              <div class="circle" :style="{ width: cropper.cropSize + 'px', height: cropper.cropSize + 'px', marginLeft: (256 - cropper.cropSize/2) + 'px', marginTop: (256 - cropper.cropSize/2) + 'px' }"></div>
            </div>
          </div>
          <input class="zoom" type="range" min="0.5" max="3" step="0.01" v-model.number="cropper.scale" @input="clampOffsets" />
          <div class="row actions">
            <Button variant="secondary" size="medium" @click="closeCropper">Cancel</Button>
            <Button variant="primary" size="medium" @click="confirmCrop">Use avatar</Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile { padding: 24px 0; max-width: 720px; }
.panel { position: relative; background: #fff; border: 1px solid var(--green-100); border-radius: 16px; padding: 20px; box-shadow: var(--shadow-lg); display: grid; gap: 14px; }
.panel::before { content: ''; position: absolute; left: 0; right: 0; top: 0; height: 6px; border-radius: 16px 16px 0 0; background: linear-gradient(90deg, var(--green-200), var(--green-600)); }
input, select, textarea { border: 1px solid var(--gray-200); border-radius: 8px; padding: 10px; width: 100%; box-sizing: border-box; }
.section-title { margin: 4px 0 -6px; font-size: 14px; text-transform: uppercase; letter-spacing: .08em; color: #64748b; }
.toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
.toolbar.center { justify-content: flex-start; position: relative; }
.toolbar.center .title { position: absolute; left: 50%; transform: translateX(-50%); margin: 0; }
.actions { justify-content: flex-end; }
input:focus, select:focus, textarea:focus { outline: 2px solid var(--green-500); outline-offset: 1px; }
.row { display: flex; gap: 10px; }
.grid { display: grid; gap: 12px; grid-template-columns: repeat(3, 1fr); }
.avatar-row { display: flex; align-items: center; gap: 12px; }
.avatar-row.center { justify-content: center; }
.avatar { width: 56px; height: 56px; border-radius: 50%; object-fit: cover; background: var(--green-100); display: inline-block; text-align: center; line-height: 56px; font-weight: 700; box-shadow: inset 0 0 0 3px #fff, 0 0 0 3px var(--green-200); }
.avatar-large { width: 120px; height: 120px; aspect-ratio: 1/1; border-radius: 50%; background: var(--green-100); display: grid; place-content: center; box-shadow: inset 0 0 0 4px #fff, 0 0 0 4px var(--green-200); cursor: pointer; }
.avatar-large img { width: 100%; height: 100%; display: block; border-radius: 50%; object-fit: cover; }
.avatar-large span { font-size: 28px; font-weight: 800; color: #0f172a; }
@media (max-width: 760px) { .grid { grid-template-columns: 1fr; } }

/* cropper */
.cropper-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: grid; place-content: center; z-index: 60; }
.cropper { background: #fff; border: 1px solid var(--green-100); border-radius: 16px; padding: 16px; box-shadow: var(--shadow-lg); width: 560px; max-width: 96vw; }
.viewport { position: relative; width: 320px; height: 320px; margin: 0 auto 12px; overflow: hidden; border-radius: 12px; background: #f8fafc; touch-action: none; }
.viewport.large { width: 512px; height: 512px; }
.viewport img { position: absolute; top: 0; left: 0; user-select: none; }
.viewport .mask { position: absolute; inset: 0; pointer-events: none; }
.viewport .mask .circle { border-radius: 50%; outline: 2000px solid rgba(0,0,0,.35); outline-offset: -2000px; box-shadow: 0 0 0 4px #22c55e inset; }
.zoom { width: 100%; }

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
</style>


