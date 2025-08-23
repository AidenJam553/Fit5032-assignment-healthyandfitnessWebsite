<script setup>
import SiteHeader from '@/components/SiteHeader.vue'
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useForumStore } from '@/lib/stores/forum'
import { useRouter, useRoute } from 'vue-router'
import { getCurrentUser } from '@/lib/auth'

const store = useForumStore()
const router = useRouter()
const route = useRoute()
const user = ref(getCurrentUser())
const title = ref('')
const content = ref('')
const topic = ref('General')
const error = ref('')
const images = ref([])
const isUploading = ref(false)
const isLoaded = ref(false)
const showContent = ref(false)

// Edit mode
const isEditMode = ref(false)
const editingPostId = ref(null)

// Success state
const showSuccess = ref(false)
const countdown = ref(5)

// Update user data
function updateUser() {
  user.value = getCurrentUser()
}

// Get user name for display
const authorName = computed(() => {
  return user.value?.username || user.value?.email || 'Anonymous'
})

// Get user avatar
const USERS_KEY = 'users'
function loadUsers() { 
  try { 
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]') 
  } catch { 
    return [] 
  } 
}

const userAvatar = computed(() => {
  if (!user.value) return null
  const users = loadUsers()
  const fullUser = users.find(u => 
    (u.id && user.value?.id) ? u.id === user.value.id : u.email === user.value?.email
  )
  return fullUser?.avatarDataUrl || null
})

const userInitials = computed(() => {
  return (authorName.value || 'A')[0]?.toUpperCase() || 'A'
})

// Computed property for button disabled state
const isSubmitDisabled = computed(() => {
  return !title.value?.trim() || !content.value?.trim() || isUploading.value
})

function handleImageUpload(event) {
  const files = Array.from(event.target.files)
  
  files.forEach(file => {
    if (!file.type.startsWith('image/')) {
      error.value = 'Please select only image files'
      return
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      error.value = 'Image size should be less than 5MB'
      return
    }
    
    isUploading.value = true
    const reader = new FileReader()
    
    reader.onload = (e) => {
      images.value.push({
        id: Date.now() + Math.random(),
        file: file,
        dataUrl: e.target.result,
        name: file.name
      })
      isUploading.value = false
      error.value = ''
    }
    
    reader.onerror = () => {
      error.value = 'Failed to read image file'
      isUploading.value = false
    }
    
    reader.readAsDataURL(file)
  })
  
  // Clear the input
  event.target.value = ''
}

function removeImage(imageId) {
  images.value = images.value.filter(img => img.id !== imageId)
}

function handleSubmitClick(event) {
  console.log('=== BUTTON CLICKED ===')
  console.log('Event:', event)
  console.log('Event type:', event.type)
  console.log('Target:', event.target)
  
  // Add navigation monitoring
  window.addEventListener('beforeunload', () => {
    console.log('Page is about to unload!')
  })
  
  window.addEventListener('unload', () => {
    console.log('Page is unloading!')
  })
  
  // Monitor for router navigation
  const originalPush = router.push
  const originalReplace = router.replace
  
  router.push = function(...args) {
    console.log('Router push called with:', args)
    return originalPush.apply(this, args)
  }
  
  router.replace = function(...args) {
    console.log('Router replace called with:', args)
    return originalReplace.apply(this, args)
  }
  
  // Call submit function
  submit()
}

async function submit() {
  console.log('=== SUBMIT FUNCTION CALLED ===')
  console.log('isEditMode:', isEditMode.value)
  console.log('editingPostId:', editingPostId.value)
  console.log('isSubmitDisabled:', isSubmitDisabled.value)
  console.log('title.value:', title.value)
  console.log('content.value length:', content.value?.length)
  
  error.value = ''
  
  if (!title.value || title.value.length < 4) { 
    error.value = 'Title should be at least 4 characters'
    return 
  }
  
  if (!content.value || content.value.length < 10) { 
    error.value = 'Content should be at least 10 characters'
    return 
  }
  
  if (isEditMode.value) {
    console.log('Entering edit mode branch')
    
    // Prevent any form submission or page reload
    window.addEventListener('beforeunload', (e) => {
      e.preventDefault()
      e.returnValue = ''
    }, { once: true })
    
    // Update existing post
    const updates = {
      title: title.value,
      content: content.value,
      topic: topic.value,
      images: images.value.map(img => ({
        id: img.id,
        dataUrl: img.dataUrl,
        name: img.name
      }))
    }
    
    console.log('Calling store.editPost with:', editingPostId.value, updates)
    const success = store.editPost(editingPostId.value, updates)
    console.log('Edit result:', success)
    
    if (success) {
      console.log('Setting showSuccess to true')
      
      // Try multiple approaches to set showSuccess
      showSuccess.value = true
      console.log('showSuccess immediately after setting:', showSuccess.value)
      
      // Force trigger reactive update
      await nextTick()
      console.log('showSuccess after nextTick:', showSuccess.value)
      
      // Try setting again after nextTick
      showSuccess.value = true
      console.log('showSuccess after setting again:', showSuccess.value)
      
      // Force another update cycle
      await nextTick()
      console.log('showSuccess after second nextTick:', showSuccess.value)
      
      console.log('DOM showSuccess check:', document.querySelector('.success-container'))
      
      // Remove the beforeunload listener
      window.removeEventListener('beforeunload', () => {})
      
      // Start countdown after ensuring DOM is updated
      setTimeout(() => {
        console.log('Starting countdown, showSuccess is:', showSuccess.value)
        startCountdown()
      }, 200)
      
      // Also set a backup timer to check showSuccess value
      setTimeout(() => {
        console.log('Backup check - showSuccess is:', showSuccess.value)
        if (!showSuccess.value) {
          console.log('showSuccess was reset! Setting it again.')
          showSuccess.value = true
        }
      }, 500)
    } else {
      console.log('Edit failed')
      error.value = 'Failed to update post'
    }
  } else {
    // Create new post
    const postData = {
      author: authorName.value,
      title: title.value,
      content: content.value,
      topic: topic.value,
      images: images.value.map(img => ({
        id: img.id,
        dataUrl: img.dataUrl,
        name: img.name
      }))
    }
    
    const post = store.create(postData)
  router.push({ name: 'forum-detail', params: { id: post.id } })
}
}

function cancel() {
  router.push('/forum')
}

// Success page functions
function startCountdown() {
  console.log('Starting countdown')
  countdown.value = 5
  const timer = setInterval(() => {
    countdown.value--
    console.log('Countdown:', countdown.value)
    if (countdown.value <= 0) {
      clearInterval(timer)
      navigateToPost()
    }
  }, 1000)
}

function navigateToPost() {
  router.replace({ name: 'forum-detail', params: { id: editingPostId.value } })
}

// Listen for user data changes
onMounted(async () => {
  updateUser()
  window.addEventListener('storage', updateUser)
  
  // Watch showSuccess changes
  watch(showSuccess, (newVal, oldVal) => {
    console.log('showSuccess changed from', oldVal, 'to', newVal)
    console.log('Current DOM state:', document.querySelector('.success-container'))
  }, { immediate: true })
  
  // Initialize store data first
  store.seedIfEmpty()
  
  // Check if we're in edit mode
  const editId = route.query.edit
  
  if (editId) {
    const post = store.getById(editId)
    
    if (post) {
      // Check if user owns this post
      const currentUser = getCurrentUser()
      const ownsPost = currentUser && (post.author === currentUser.username || post.author === currentUser.email)
      
      if (ownsPost) {
        isEditMode.value = true
        editingPostId.value = editId
        title.value = post.title
        content.value = post.content
        topic.value = post.topic
        images.value = post.images || []
      } else {
        // Redirect if user doesn't own the post
        router.push('/forum')
      }
    } else {
      // Redirect if post not found
      router.push('/forum')
    }
  }
  
  // Trigger animations
  await nextTick()
  setTimeout(() => {
    isLoaded.value = true
  }, 100)
  setTimeout(() => {
    showContent.value = true
  }, 300)
})

onBeforeUnmount(() => {
  window.removeEventListener('storage', updateUser)
})
</script>

<template>
  <div class="page">
    <SiteHeader />
    
    <div class="main-container">
      <!-- Debug info -->
      <div style="position: fixed; top: 10px; right: 10px; background: red; color: white; padding: 10px; z-index: 9999; font-size: 11px; max-width: 300px;">
        <div :style="{background: showSuccess ? 'green' : 'red', padding: '2px'}">showSuccess: {{ showSuccess }}</div>
        isEditMode: {{ isEditMode }}<br>
        editingPostId: {{ editingPostId }}<br>
        title: "{{ title?.substring(0, 20) }}..."<br>
        content length: {{ content?.length || 0 }}<br>
        isUploading: {{ isUploading }}<br>
        Button disabled: {{ isSubmitDisabled }}<br>
        <button @click="showSuccess = true" style="margin-top: 5px; color: black; font-size: 10px;">Test Success</button>
        <button @click="submit" style="margin-top: 5px; color: black; font-size: 10px;">Force Submit</button>
        <button @click="showSuccess = false" style="margin-top: 5px; color: black; font-size: 10px;">Reset</button>
      </div>
      
      <!-- Success Message -->
      <div v-show="showSuccess" class="success-container animate-fade-up animate-in" style="background: rgba(0,255,0,0.1); border: 2px solid green;">
        <div class="success-content">
          <div class="success-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22,4 12,14.01 9,11.01"/>
            </svg>
          </div>
          <h1 class="success-title">Post Updated Successfully!</h1>
          <p class="success-message">Your post has been updated and saved successfully.</p>
          
          <div class="success-actions">
            <button class="btn btn-primary" @click="navigateToPost">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 11l3 3 8-8"/>
              </svg>
              View Updated Post
            </button>
          </div>
          
          <div class="auto-redirect">
            <p>Automatically redirecting in {{ countdown }} seconds...</p>
            <div class="countdown-bar">
              <div class="countdown-progress" :style="{ width: (countdown / 5) * 100 + '%' }"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Edit/Create Form -->
      <div v-show="!showSuccess" class="compose-container animate-fade-up" :class="{ 'animate-in': isLoaded }">
        <div class="header animate-slide-up" :class="{ 'animate-in': isLoaded }" style="animation-delay: 0.1s">
          <button class="back-btn animate-fade-up" :class="{ 'animate-in': showContent }" style="animation-delay: 0.0s" @click="cancel">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Forum
          </button>
          <h1 class="title animate-fade-up" :class="{ 'animate-in': showContent }" style="animation-delay: 0.2s">
            {{ isEditMode ? 'Edit Post' : 'Create New Post' }}
          </h1>
          <p class="subtitle animate-fade-up" :class="{ 'animate-in': showContent }" style="animation-delay: 0.3s">
            {{ isEditMode ? 'Update your post content' : 'Share your thoughts with the community' }}
          </p>
        </div>

        <div class="form-panel animate-slide-up" :class="{ 'animate-in': isLoaded }" style="animation-delay: 0.3s">
          <!-- Author Info -->
          <div class="author-section animate-fade-up" :class="{ 'animate-in': showContent }" style="animation-delay: 0.4s">
            <div class="author-avatar">
              <img v-if="userAvatar" :src="userAvatar" alt="User Avatar" class="avatar-img" />
              <span v-else class="avatar-initials">{{ userInitials }}</span>
            </div>
            <div class="author-info">
              <div class="author-name">{{ authorName }}</div>
              <div class="posting-as">Posting as</div>
            </div>
          </div>

          <!-- Form Fields -->
          <div class="form-group animate-slide-left" :class="{ 'animate-in': showContent }" style="animation-delay: 0.5s">
            <label class="form-label">Post Title</label>
            <input 
              v-model="title" 
              class="form-input"
              placeholder="Enter a clear, descriptive title..."
              maxlength="100"
            />
            <div class="char-count">{{ title.length }}/100</div>
          </div>

          <div class="form-group animate-slide-right" :class="{ 'animate-in': showContent }" style="animation-delay: 0.6s">
            <label class="form-label">Category</label>
            <select v-model="topic" class="form-select">
              <option value="General">💬 General Discussion</option>
              <option value="Nutrition">🥗 Nutrition</option>
              <option value="Workout">💪 Workout</option>
              <option value="Weight loss">⚖️ Weight Loss</option>
              <option value="Q & A">❓ Q & A</option>
        </select>
          </div>

          <div class="form-group animate-fade-up" :class="{ 'animate-in': showContent }" style="animation-delay: 0.7s">
            <label class="form-label">Content</label>
            <textarea 
              v-model="content" 
              class="form-textarea"
              rows="8" 
              placeholder="Share your thoughts, experiences, or questions with the community..."
              maxlength="2000"
            />
            <div class="char-count">{{ content.length }}/2000</div>
          </div>

          <!-- Image Upload Section -->
          <div class="form-group animate-slide-up" :class="{ 'animate-in': showContent }" style="animation-delay: 0.8s">
            <label class="form-label">Images (Optional)</label>
            <div class="image-upload-area">
              <input 
                type="file" 
                ref="imageInput"
                multiple
                accept="image/*"
                @change="handleImageUpload"
                class="image-input"
                id="imageUpload"
              />
              <label for="imageUpload" class="upload-button" :class="{ uploading: isUploading }">
                <svg class="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7,10 12,15 17,10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                <span v-if="!isUploading">Add Images</span>
                <span v-else>Uploading...</span>
              </label>
              <div class="upload-info">
                Support JPG, PNG, GIF. Max 5MB per image.
              </div>
            </div>

            <!-- Image Preview -->
            <div v-if="images.length > 0" class="image-preview-grid">
              <div 
                v-for="image in images" 
                :key="image.id"
                class="image-preview-item"
              >
                <img :src="image.dataUrl" :alt="image.name" class="preview-image" />
                <button 
                  @click="removeImage(image.id)"
                  class="remove-image-btn"
                  type="button"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
                <div class="image-name">{{ image.name }}</div>
              </div>
            </div>
          </div>

          <!-- Error Message -->
          <div v-if="error" class="error-message">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            {{ error }}
          </div>

          <!-- Action Buttons -->
          <div class="action-buttons animate-fade-up" :class="{ 'animate-in': showContent }" style="animation-delay: 0.9s">
            <button class="btn btn-secondary" @click="cancel" type="button">
              Cancel
            </button>
            <button 
              class="btn btn-primary" 
              @click.stop.prevent="handleSubmitClick"
              type="button"
              style="opacity: 1 !important; pointer-events: auto !important;"
            >
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 19l7-7 3 3-7 7-3-3z"/>
                <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
                <path d="M2 2l7.586 7.586"/>
                <circle cx="11" cy="11" r="2"/>
              </svg>
              {{ isEditMode ? 'Update Post' : 'Publish Post' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Variables */
:root {
  --primary-color: #22c55e;
  --primary-dark: #16a34a;
  --secondary-color: #f0fdf4;
  --text-primary: #0f172a;
  --text-secondary: #64748b;
  --border-color: #e2e8f0;
  --error-color: #ef4444;
  --success-color: #10b981;
  --radius: 12px;
}

/* Base Styles */
.page {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
}

.page::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 300px;
  background: radial-gradient(ellipse at top, rgba(34, 197, 94, 0.1) 0%, transparent 60%);
  pointer-events: none;
}

.main-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
}

.compose-container {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

/* Header */
.header {
  text-align: center;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 8px 16px;
  border-radius: 8px;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 24px;
}

.back-btn:hover {
  color: var(--primary-color);
  background: rgba(34, 197, 94, 0.1);
  border-color: var(--primary-color);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(34, 197, 94, 0.15);
}

.back-btn svg {
  width: 16px;
  height: 16px;
}

.title {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 1.125rem;
  margin: 0;
}

/* Form Panel */
.form-panel {
  background: white;
  border-radius: 24px;
  padding: 36px;
  box-shadow: 0 20px 50px -12px rgba(0, 0, 0, 0.15), 0 8px 20px -5px rgba(0, 0, 0, 0.1);
  border: 2px solid rgba(34, 197, 94, 0.1);
  position: relative;
  overflow: hidden;
}

.form-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--primary-color), #16a34a, #059669);
}

/* Author Section */
.author-section {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
  background: linear-gradient(135deg, var(--secondary-color) 0%, #e8f5e8 100%);
  border-radius: 20px;
  margin-bottom: 28px;
  border: 1px solid rgba(34, 197, 94, 0.2);
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.1);
}

.author-avatar {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 20px;
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
  border: 3px solid white;
  overflow: hidden;
  position: relative;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.avatar-initials {
  font-size: 18px;
  font-weight: 800;
}

.author-name {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 16px;
}

.posting-as {
  font-size: 14px;
  color: var(--text-secondary);
}

/* Form Groups */
.form-group {
  margin-bottom: 24px;
}

.form-label {
  display: block;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
  font-size: 15px;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 16px 20px;
  border: 2px solid var(--border-color);
  border-radius: 16px;
  font-size: 15px;
  transition: all 0.3s ease;
  box-sizing: border-box;
  font-family: inherit;
  background: #f8fafc;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
}

.form-select {
  padding-right: 50px;
  background-color: #f8fafc;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  cursor: pointer;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--primary-color);
  background: white;
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.1), inset 0 2px 4px rgba(0, 0, 0, 0.05);
  transform: translateY(-1px);
}

.form-select:focus {
  background-color: white;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2322c55e' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px;
}

/* 修复下拉选项的样式 */
.form-select option {
  background: white;
  color: var(--text-primary);
  padding: 12px 16px;
  font-size: 15px;
  line-height: 1.4;
}

.form-textarea {
  resize: vertical;
  min-height: 120px;
  line-height: 1.6;
}

.char-count {
  text-align: right;
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
}

/* Image Upload */
.image-upload-area {
  text-align: center;
  margin-bottom: 16px;
}

.image-input {
  display: none;
}

.upload-button {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 16px 32px;
  border: 2px dashed rgba(34, 197, 94, 0.3);
  border-radius: 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #f0fdf4 100%);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.upload-button:hover {
  border-color: var(--primary-color);
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(34, 197, 94, 0.1) 100%);
  color: var(--primary-color);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(34, 197, 94, 0.15);
}

.upload-button.uploading {
  border-color: var(--primary-color);
  background: rgba(34, 197, 94, 0.1);
  color: var(--primary-color);
  cursor: not-allowed;
}

.upload-icon {
  width: 20px;
  height: 20px;
}

.upload-info {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 8px;
}

/* Image Preview */
.image-preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.image-preview-item {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  background: #f8fafc;
  border: 2px solid rgba(34, 197, 94, 0.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.image-preview-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
  border-color: rgba(34, 197, 94, 0.3);
}

.preview-image {
  width: 100%;
  height: 120px;
  object-fit: cover;
}

.remove-image-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  border: none;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.remove-image-btn:hover {
  background: var(--error-color);
}

.remove-image-btn svg {
  width: 12px;
  height: 12px;
}

.image-name {
  padding: 8px;
  font-size: 12px;
  color: var(--text-secondary);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Error Message */
.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: var(--radius);
  color: var(--error-color);
  font-size: 14px;
  margin-bottom: 24px;
}

.error-message svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  margin-top: 32px;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  border-radius: 18px;
  font-weight: 700;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  text-decoration: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.btn-primary {
  background: #22c55e !important;
  color: white !important;
  border: none !important;
}

.btn-primary:hover:not(:disabled) {
  background: #16a34a !important;
  color: white !important;
  transform: translateY(-3px);
  box-shadow: 0 12px 28px rgba(34, 197, 94, 0.4);
}

.btn-primary:disabled {
  background: #94a3b8;
  color: #e2e8f0;
  cursor: not-allowed;
  transform: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn-secondary {
  background: white;
  color: var(--text-secondary);
  border: 2px solid var(--border-color);
}

.btn-secondary:hover {
  background: #f8fafc;
  color: var(--text-primary);
  border-color: rgba(34, 197, 94, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.btn-icon {
  width: 16px;
  height: 16px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .main-container {
    padding: 20px 16px;
  }
  
  .form-panel {
    padding: 24px 20px;
  }
  
  .title {
    font-size: 2rem;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
    justify-content: center;
  }
  
  .image-preview-grid {
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  }
}

/* Animation Keyframes */
@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Animation Classes */
.animate-fade-up {
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
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

.animate-in {
  opacity: 1;
  transform: translate(0, 0);
}

/* Success Page Styles */
.success-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 40px 20px;
}

.success-content {
  text-align: center;
  max-width: 500px;
  background: var(--bg-primary);
  border-radius: 20px;
  padding: 48px 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--border-color);
}

.success-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 24px;
  background: linear-gradient(135deg, var(--primary-color), #16a34a);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: successPulse 2s ease-in-out infinite alternate;
}

.success-icon svg {
  width: 40px;
  height: 40px;
  color: white;
  stroke-width: 3;
}

.success-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 12px;
  letter-spacing: -0.5px;
}

.success-message {
  font-size: 16px;
  color: var(--text-secondary);
  margin-bottom: 32px;
  line-height: 1.6;
}

.success-actions {
  margin-bottom: 32px;
}

.success-actions .btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.success-actions .btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(34, 197, 94, 0.3);
}

.auto-redirect {
  padding-top: 24px;
  border-top: 1px solid var(--border-color);
}

.auto-redirect p {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.countdown-bar {
  width: 100%;
  height: 4px;
  background: var(--bg-secondary);
  border-radius: 2px;
  overflow: hidden;
}

.countdown-progress {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color), #16a34a);
  border-radius: 2px;
  transition: width 1s ease-in-out;
}

@keyframes successPulse {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4);
  }
  100% {
    transform: scale(1.05);
    box-shadow: 0 0 0 20px rgba(34, 197, 94, 0);
  }
}

/* Mobile responsive */
@media (max-width: 768px) {
  .success-content {
    padding: 32px 24px;
    margin: 0 16px;
  }
  
  .success-title {
    font-size: 24px;
  }
  
  .success-icon {
    width: 64px;
    height: 64px;
  }
  
  .success-icon svg {
    width: 32px;
    height: 32px;
  }
}


</style>