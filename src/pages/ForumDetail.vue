<script setup>
import SiteHeader from '@/components/SiteHeader.vue'
import { useForumStore } from '@/lib/stores/forum'
import { useRoute, useRouter } from 'vue-router'
import { getCurrentUser } from '@/lib/auth'
import { computed, ref, onMounted, onBeforeUnmount, nextTick } from 'vue'

const store = useForumStore()
const route = useRoute()
const router = useRouter()
const user = ref(getCurrentUser())
const comment = ref('')
const comments = ref([])
const isLoaded = ref(false)
const showContent = ref(false)
const showUserModal = ref(false)
const selectedUser = ref(null)
const showEmojiPicker = ref(false)
const showImageModal = ref(false)
const selectedImage = ref(null)
const currentImageIndex = ref(0)

const post = computed(() => store.getById(String(route.params.id)))
if (!post.value) router.replace('/forum')

// User data functions
const USERS_KEY = 'users'
function loadUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]')
  } catch {
    return []
  }
}

function getUserAvatar(authorName) {
  const users = loadUsers()
  const foundUser = users.find(u => u.username === authorName || u.email === authorName)
  return foundUser?.avatarDataUrl || null
}

function getInitials(name) {
  return (name || 'U')[0]?.toUpperCase() || 'U'
}

// Get full user data by username/email
function getFullUserData(authorName) {
  const users = loadUsers()
  return users.find(u => u.username === authorName || u.email === authorName) || null
}

// Handle avatar click
function handleAvatarClick(authorName) {
  // Check if clicking on own avatar
  const currentUser = user.value
  if (currentUser && (currentUser.username === authorName || currentUser.email === authorName)) {
    // Navigate to own profile
    router.push('/profile')
    return
  }
  
  // Show other user's info modal
  const userData = getFullUserData(authorName)
  if (userData) {
    selectedUser.value = userData
    showUserModal.value = true
  }
}

// Close user modal
function closeUserModal() {
  showUserModal.value = false
  selectedUser.value = null
}

// Emoji data
const emojiCategories = {
  'Smileys': ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳'],
  'Gestures': ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏', '🙌', '🤲', '🙏', '✍️', '💪', '🦾', '🦿', '🦵', '🦶'],
  'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'],
  'Activities': ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷'],
  'Food': ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔']
}

// Toggle emoji picker
function toggleEmojiPicker() {
  showEmojiPicker.value = !showEmojiPicker.value
}

// Add emoji to comment
function addEmoji(emoji) {
  comment.value += emoji
  showEmojiPicker.value = false
  // Focus back to textarea
  nextTick(() => {
    const textarea = document.querySelector('.comment-input')
    if (textarea) {
      textarea.focus()
    }
  })
}

// Image modal functions
function openImageModal(imageUrl, imageIndex = 0) {
  selectedImage.value = imageUrl
  currentImageIndex.value = imageIndex
  showImageModal.value = true
  document.body.style.overflow = 'hidden' // Prevent background scrolling
}

function closeImageModal() {
  showImageModal.value = false
  selectedImage.value = null
  currentImageIndex.value = 0
  document.body.style.overflow = '' // Restore scrolling
}

function navigateImage(direction) {
  if (!post.value?.images?.length) return
  
  const totalImages = post.value.images.length
  if (direction === 'prev') {
    currentImageIndex.value = (currentImageIndex.value - 1 + totalImages) % totalImages
  } else {
    currentImageIndex.value = (currentImageIndex.value + 1) % totalImages
  }
  selectedImage.value = post.value.images[currentImageIndex.value]
}

// Keyboard navigation for image modal
function handleImageKeydown(event) {
  if (!showImageModal.value) return
  
  switch (event.key) {
    case 'Escape':
      closeImageModal()
      break
    case 'ArrowLeft':
      navigateImage('prev')
      break
    case 'ArrowRight':
      navigateImage('next')
      break
  }
}

// Get display size for image info
function getImageDisplaySize(image) {
  if (image.size) {
    const kb = Math.round(image.size / 1024)
    if (kb < 1024) {
      return `${kb} KB`
    } else {
      const mb = (kb / 1024).toFixed(1)
      return `${mb} MB`
    }
  }
  return ''
}

// Check if user liked this post
const isLiked = computed(() => {
  if (!user.value || !post.value) return false
  return post.value.likedBy?.includes(user.value.id || user.value.email) || false
})

// Check if user bookmarked this post
const isBookmarked = ref(false)

// Load saved bookmarks
function loadBookmarks() {
  try {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]')
    return bookmarks
  } catch {
    return []
  }
}

// Save bookmarks
function saveBookmarks(bookmarks) {
  localStorage.setItem('bookmarks', JSON.stringify(bookmarks))
}

// Handle like
function handleLike() {
  if (!user.value) {
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }
  store.toggleLike(post.value.id, user.value.id || user.value.email)
}

// Handle bookmark
function handleBookmark() {
  if (!user.value) {
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }
  
  const bookmarks = loadBookmarks()
  const postId = post.value.id
  const userKey = user.value.id || user.value.email
  
  const existingIndex = bookmarks.findIndex(b => b.postId === postId && b.userId === userKey)
  
  if (existingIndex > -1) {
    bookmarks.splice(existingIndex, 1)
    isBookmarked.value = false
  } else {
    bookmarks.push({
      postId: postId,
      userId: userKey,
      savedAt: new Date().toISOString()
    })
    isBookmarked.value = true
  }
  
  saveBookmarks(bookmarks)
}

// Handle comment
function handleComment() {
  if (!user.value) {
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }
  
  if (!comment.value.trim()) return
  
  const newComment = {
    id: crypto.randomUUID(),
    author: user.value.username || user.value.email,
    content: comment.value.trim(),
    createdAt: new Date().toISOString(),
    likes: 0,
    likedBy: []
  }
  
  comments.value.push(newComment)
  comment.value = ''
  
  // Update post reply count
  store.addReply(post.value.id)
  
  // Save comments to localStorage
  const commentsKey = `comments_${post.value.id}`
  localStorage.setItem(commentsKey, JSON.stringify(comments.value))
}

// Load comments and bookmark status
onMounted(async () => {
  // Load comments
  const commentsKey = `comments_${post.value.id}`
  try {
    const savedComments = JSON.parse(localStorage.getItem(commentsKey) || '[]')
    comments.value = savedComments
  } catch {
    comments.value = []
  }
  
  // Check bookmark status
  if (user.value) {
    const bookmarks = loadBookmarks()
    const userKey = user.value.id || user.value.email
    isBookmarked.value = bookmarks.some(b => b.postId === post.value.id && b.userId === userKey)
  }
  
  // Add keyboard event listener for image modal
  window.addEventListener('keydown', handleImageKeydown)
  
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
  // Remove keyboard event listener
  window.removeEventListener('keydown', handleImageKeydown)
  // Restore body scroll if modal is open
  document.body.style.overflow = ''
})

// Format date
function formatDate(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffHours < 1) return 'Just now'
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  
  return date.toLocaleDateString()
}

// Get topic emoji
function getTopicEmoji(topic) {
  const emojiMap = {
    'General': '💬',
    'Nutrition': '🥗',
    'Workout': '💪',
    'Weight loss': '⚖️',
    'Q & A': '❓'
  }
  return emojiMap[topic] || '💬'
}
</script>

<template>
  <div class="page">
    <SiteHeader />
    
    <div class="container">
      <!-- Back Button -->
      <div class="back-section animate-fade-up" :class="{ 'animate-in': isLoaded }">
        <button class="back-btn" @click="router.back()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to Forum
        </button>
      </div>

      <!-- Post Content -->
      <article class="post-detail animate-slide-up" :class="{ 'animate-in': isLoaded }" v-if="post">
        <!-- Post Header -->
        <header class="post-header">
          <div class="author-section">
            <div class="author-avatar clickable" @click="handleAvatarClick(post.author)">
              <img v-if="getUserAvatar(post.author)" :src="getUserAvatar(post.author)" alt="Author Avatar" class="avatar-img" />
              <span v-else class="avatar-initials">{{ getInitials(post.author) }}</span>
            </div>
            <div class="author-info">
              <h3 class="author-name">{{ post.author }}</h3>
              <div class="post-meta">
                <span class="topic-badge">
                  {{ getTopicEmoji(post.topic) }} {{ post.topic }}
                </span>
                <span class="post-date">{{ formatDate(post.createdAt) }}</span>
              </div>
            </div>
          </div>
        </header>

        <!-- Post Title -->
        <h1 class="post-title animate-fade-up" :class="{ 'animate-in': showContent }" style="animation-delay: 0.2s">{{ post.title }}</h1>

        <!-- Post Images -->
        <div v-if="post.images && post.images.length > 0" class="post-images animate-fade-up" :class="{ 'animate-in': showContent }" style="animation-delay: 0.3s">
          <div class="image-grid" :class="`grid-${Math.min(post.images.length, 3)}`">
            <img
              v-for="(image, index) in post.images.slice(0, 3)"
              :key="image.id"
              :src="image.dataUrl"
              :alt="image.name"
              class="post-image clickable-image"
              @click="openImageModal(image.dataUrl, index)"
            />
            <div v-if="post.images.length > 3" class="more-images">
              +{{ post.images.length - 3 }} more
            </div>
          </div>
        </div>

        <!-- Post Content -->
        <div class="post-content animate-fade-up" :class="{ 'animate-in': showContent }" style="animation-delay: 0.4s">
          <p>{{ post.content }}</p>
        </div>

        <!-- Post Actions -->
        <div class="post-actions animate-fade-up" :class="{ 'animate-in': showContent }" style="animation-delay: 0.5s">
          <button 
            class="action-btn like-btn" 
            :class="{ liked: isLiked }"
            @click="handleLike"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <span>{{ post.likes || 0 }}</span>
          </button>

          <button 
            class="action-btn bookmark-btn" 
            :class="{ bookmarked: isBookmarked }"
            @click="handleBookmark"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
            <span>{{ isBookmarked ? 'Saved' : 'Save' }}</span>
          </button>

          <div class="action-btn comment-info">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span>{{ comments.length }} {{ comments.length === 1 ? 'comment' : 'comments' }}</span>
          </div>
        </div>

        <!-- Comments Section -->
        <section class="comments-section animate-fade-up" :class="{ 'animate-in': showContent }" style="animation-delay: 0.6s">
          <h3 class="comments-title">Comments</h3>

          <!-- Add Comment -->
          <div v-if="user" class="add-comment">
            <div class="comment-avatar clickable" @click="handleAvatarClick(user.username || user.email)">
              <img v-if="getUserAvatar(user.username || user.email)" :src="getUserAvatar(user.username || user.email)" alt="Your Avatar" class="avatar-img" />
              <span v-else class="avatar-initials">{{ getInitials(user.username || user.email) }}</span>
            </div>
            <div class="comment-form">
              <div class="input-container">
                <textarea 
                  v-model="comment"
                  placeholder="Share your thoughts..."
                  class="comment-input"
                  rows="3"
                ></textarea>
                <button 
                  class="emoji-btn"
                  @click="toggleEmojiPicker"
                  type="button"
                  title="Add emoji"
                >
                  😊
                </button>
              </div>
              
              <!-- Emoji Picker -->
              <div v-if="showEmojiPicker" class="emoji-picker">
                <div class="emoji-header">
                  <h4>Choose an emoji</h4>
                  <button class="close-emoji-btn" @click="showEmojiPicker = false">×</button>
                </div>
                <div class="emoji-categories">
                  <div v-for="(emojis, category) in emojiCategories" :key="category" class="emoji-category">
                    <div class="category-title">{{ category }}</div>
                    <div class="emoji-grid">
                      <button 
                        v-for="emoji in emojis" 
                        :key="emoji"
                        class="emoji-item"
                        @click="addEmoji(emoji)"
                        :title="emoji"
                      >
                        {{ emoji }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="comment-actions">
                <button 
                  class="submit-comment-btn"
                  @click="handleComment"
                  :disabled="!comment.trim()"
                >
                  Post Comment
                </button>
              </div>
            </div>
          </div>

          <!-- Login Prompt -->
          <div v-else class="login-prompt">
            <p>Please <router-link to="/login" class="login-link">log in</router-link> to join the discussion.</p>
          </div>

          <!-- Comments List -->
          <div class="comments-list">
            <div v-for="commentItem in comments" :key="commentItem.id" class="comment-item">
              <div class="comment-avatar clickable" @click="handleAvatarClick(commentItem.author)">
                <img v-if="getUserAvatar(commentItem.author)" :src="getUserAvatar(commentItem.author)" alt="Commenter Avatar" class="avatar-img" />
                <span v-else class="avatar-initials">{{ getInitials(commentItem.author) }}</span>
              </div>
              <div class="comment-content">
                <div class="comment-header">
                  <span class="comment-author">{{ commentItem.author }}</span>
                  <span class="comment-date">{{ formatDate(commentItem.createdAt) }}</span>
                </div>
                <p class="comment-text">{{ commentItem.content }}</p>
              </div>
            </div>

            <!-- Empty Comments -->
            <div v-if="comments.length === 0" class="empty-comments">
              <div class="empty-icon">💭</div>
              <p>No comments yet. Be the first to share your thoughts!</p>
            </div>
          </div>
        </section>
      </article>

      <!-- User Info Modal -->
      <div v-if="showUserModal && selectedUser" class="modal-overlay" @click="closeUserModal">
        <div class="user-modal" @click.stop>
          <div class="modal-header">
            <h3 class="modal-title">User Profile</h3>
            <button class="close-btn" @click="closeUserModal">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
          
          <div class="modal-content">
            <div class="user-info">
              <div class="user-avatar-large">
                <img v-if="selectedUser.avatarDataUrl" :src="selectedUser.avatarDataUrl" alt="User Avatar" class="avatar-img" />
                <span v-else class="avatar-initials-large">{{ getInitials(selectedUser.username || selectedUser.email) }}</span>
              </div>
              
              <div class="user-details">
                <h4 class="username">{{ selectedUser.username || selectedUser.email }}</h4>
                <p class="user-email" v-if="selectedUser.username && selectedUser.email">{{ selectedUser.email }}</p>
                
                <div class="user-meta">
                  <div class="meta-item" v-if="selectedUser.createdAt">
                    <span class="meta-label">Joined:</span>
                    <span class="meta-value">{{ formatDate(selectedUser.createdAt) }}</span>
                  </div>
                  
                  <div class="meta-item" v-if="selectedUser.bio">
                    <span class="meta-label">Bio:</span>
                    <span class="meta-value">{{ selectedUser.bio }}</span>
                  </div>
                  
                  <div class="meta-item" v-if="selectedUser.location">
                    <span class="meta-label">Location:</span>
                    <span class="meta-value">{{ selectedUser.location }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Image Modal -->
  <div v-if="showImageModal && selectedImage" class="image-modal-overlay" @click="closeImageModal">
    <div class="image-modal" @click.stop>
      <!-- Modal Header -->
      <div class="image-modal-header">
        <div class="image-counter" v-if="post.images && post.images.length > 1">
          {{ currentImageIndex + 1 }} / {{ post.images.length }}
        </div>
        <button class="close-image-btn" @click="closeImageModal" title="Close (Esc)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Image Container -->
      <div class="image-container">
        <!-- Navigation Arrows -->
        <button 
          v-if="post.images && post.images.length > 1"
          class="nav-arrow nav-prev" 
          @click="navigateImage('prev')"
          title="Previous (←)"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>

        <!-- Main Image -->
        <img 
          :src="selectedImage" 
          :alt="`Image ${currentImageIndex + 1}`"
          class="modal-image"
        />

        <!-- Navigation Arrows -->
        <button 
          v-if="post.images && post.images.length > 1"
          class="nav-arrow nav-next" 
          @click="navigateImage('next')"
          title="Next (→)"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      </div>

      <!-- Image Info -->
      <div class="image-info" v-if="post.images && post.images[currentImageIndex]">
        <div class="image-name">{{ post.images[currentImageIndex].name }}</div>
        <div class="image-size">{{ getImageDisplaySize(post.images[currentImageIndex]) }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Variables */
:root {
  --primary-color: #22c55e;
  --primary-dark: #16a34a;
  --text-primary: #0f172a;
  --text-secondary: #64748b;
  --border-color: #e2e8f0;
  --background-light: #f8fafc;
}

/* Base Styles */
.page {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  min-height: 100vh;
  position: relative;
}

.page::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 80%, rgba(34, 197, 94, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(34, 197, 94, 0.05) 0%, transparent 50%);
  pointer-events: none;
  z-index: 0;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
  position: relative;
  z-index: 1;
}

/* Back Button */
.back-section {
  padding: 20px 0;
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
  border-radius: 20px;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
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

/* Post Detail */
.post-detail {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 28px;
  padding: 40px;
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.15), 
    0 10px 20px -5px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin-bottom: 40px;
  backdrop-filter: blur(20px);
  position: relative;
  overflow: hidden;
}

.post-detail::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--primary-color), #16a34a, #059669);
  opacity: 0.8;
}

/* Post Header */
.post-header {
  margin-bottom: 24px;
}

.author-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.author-avatar {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--background-light) 0%, #e2e8f0 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 4px solid rgba(255, 255, 255, 0.8);
  box-shadow: 
    0 8px 20px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(34, 197, 94, 0.2);
  position: relative;
  transition: all 0.3s ease;
}

.author-avatar:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 
    0 12px 28px rgba(0, 0, 0, 0.2),
    0 0 0 2px rgba(34, 197, 94, 0.3);
}

/* Clickable avatars */
.clickable {
  cursor: pointer;
  transition: all 0.3s ease;
}

.clickable:hover {
  transform: translateY(-2px) scale(1.05);
}

.comment-avatar.clickable:hover {
  transform: scale(1.1);
  box-shadow: 
    0 6px 16px rgba(0, 0, 0, 0.2),
    0 0 0 3px rgba(34, 197, 94, 0.3);
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-initials {
  font-weight: 800;
  color: var(--primary-color);
  font-size: 20px;
}

.author-name {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 4px 0;
}

.post-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
}

.topic-badge {
  background: #22c55e !important;
  color: white !important;
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 12px;
  border: none;
}

.post-date {
  color: var(--text-secondary);
}

/* Post Title */
.post-title {
  font-size: 2rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0 0 24px 0;
  line-height: 1.2;
}

/* Post Images */
.post-images {
  margin-bottom: 24px;
}

.image-grid {
  display: grid;
  gap: 8px;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
}

.image-grid.grid-1 {
  grid-template-columns: 1fr;
  max-height: 400px;
}

.image-grid.grid-2 {
  grid-template-columns: 1fr 1fr;
  max-height: 300px;
}

.image-grid.grid-3 {
  grid-template-columns: 2fr 1fr 1fr;
  max-height: 250px;
}

.post-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s ease;
  cursor: pointer;
}

.post-image:hover {
  transform: scale(1.02);
}

.more-images {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

/* Post Content */
.post-content {
  margin-bottom: 24px;
}

.post-content p {
  font-size: 16px;
  line-height: 1.7;
  color: var(--text-primary);
  margin: 0;
  white-space: pre-wrap;
}

/* Post Actions */
.post-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 0;
  border-top: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 32px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 8px 12px;
  border-radius: 8px;
}

.action-btn:hover {
  background: var(--background-light);
  color: var(--text-primary);
}

.action-btn svg {
  width: 18px;
  height: 18px;
}

.like-btn.liked {
  color: #ef4444;
}

.like-btn.liked svg {
  fill: #ef4444;
}

.bookmark-btn.bookmarked {
  color: var(--primary-color);
}

.bookmark-btn.bookmarked svg {
  fill: var(--primary-color);
}

.comment-info {
  cursor: default;
}

/* Comments Section */
.comments-section {
  margin-top: 32px;
}

.comments-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 24px 0;
}

/* Add Comment */
.add-comment {
  display: flex;
  gap: 16px;
  margin-bottom: 32px;
  padding: 24px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%);
  border-radius: 20px;
  border: 2px solid rgba(34, 197, 94, 0.1);
  box-shadow: 
    0 8px 20px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  position: relative;
  transition: all 0.3s ease;
}

.add-comment::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--primary-color), #16a34a, #059669);
  border-radius: 20px 20px 0 0;
  opacity: 0.7;
}

.add-comment:hover {
  border-color: rgba(34, 197, 94, 0.2);
  box-shadow: 
    0 12px 28px rgba(0, 0, 0, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  transform: translateY(-2px);
}

.comment-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, white 0%, #f8fafc 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 3px solid rgba(255, 255, 255, 0.9);
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(34, 197, 94, 0.1);
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.comment-avatar:hover {
  transform: scale(1.05);
  box-shadow: 
    0 6px 16px rgba(0, 0, 0, 0.2),
    0 0 0 2px rgba(34, 197, 94, 0.2);
}

.comment-avatar .avatar-initials {
  font-size: 14px;
  font-weight: 700;
}

.comment-form {
  flex: 1;
  position: relative;
}

.input-container {
  position: relative;
}

.comment-input {
  width: 100%;
  padding: 16px 60px 16px 20px;
  border: 2px solid var(--border-color);
  border-radius: 16px;
  font-size: 15px;
  resize: vertical;
  min-height: 100px;
  margin-bottom: 12px;
  font-family: inherit;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.05),
    inset 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.comment-input:focus {
  outline: none;
  border-color: var(--primary-color);
  background: rgba(255, 255, 255, 1);
  box-shadow: 
    0 0 0 4px rgba(34, 197, 94, 0.15),
    0 8px 20px rgba(34, 197, 94, 0.1),
    inset 0 1px 3px rgba(0, 0, 0, 0.05);
  transform: translateY(-2px);
}

.submit-comment-btn {
  background: #22c55e !important;
  color: white !important;
  border: none !important;
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 
    0 4px 12px rgba(34, 197, 94, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;
}

.submit-comment-btn:hover:not(:disabled) {
  background: #16a34a !important;
  color: white !important;
  transform: translateY(-2px);
  box-shadow: 
    0 8px 20px rgba(34, 197, 94, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.submit-comment-btn:disabled {
  background: #94a3b8;
  color: #e2e8f0;
  cursor: not-allowed;
}

/* Emoji Button */
.emoji-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s ease;
  z-index: 2;
}

.emoji-btn:hover {
  background: rgba(34, 197, 94, 0.1);
  transform: scale(1.1);
}

/* Comment Actions */
.comment-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

/* Emoji Picker */
.emoji-picker {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.98);
  border: 2px solid var(--border-color);
  border-radius: 16px;
  box-shadow: 
    0 12px 28px rgba(0, 0, 0, 0.15),
    0 4px 8px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(20px);
  z-index: 100;
  max-height: 300px;
  overflow-y: auto;
  animation: slideDown 0.3s ease;
}

.emoji-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 12px;
  border-bottom: 1px solid var(--border-color);
  background: rgba(248, 250, 252, 0.8);
  border-radius: 16px 16px 0 0;
}

.emoji-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.close-emoji-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: var(--text-secondary);
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.close-emoji-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: var(--text-primary);
}

.emoji-categories {
  padding: 12px;
}

.emoji-category {
  margin-bottom: 16px;
}

.category-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
  padding: 0 4px;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(32px, 1fr));
  gap: 4px;
}

.emoji-item {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
}

.emoji-item:hover {
  background: rgba(34, 197, 94, 0.1);
  transform: scale(1.2);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Login Prompt */
.login-prompt {
  text-align: center;
  padding: 40px 20px;
  background: var(--background-light);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  margin-bottom: 32px;
}

.login-link {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 600;
}

.login-link:hover {
  text-decoration: underline;
}

/* Comments List */
.comments-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.comment-item {
  display: flex;
  gap: 12px;
  padding: 16px 0;
  border-bottom: 1px solid var(--border-color);
}

.comment-item:last-child {
  border-bottom: none;
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.comment-author {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 14px;
}

.comment-date {
  color: var(--text-secondary);
  font-size: 12px;
}

.comment-text {
  color: var(--text-primary);
  font-size: 14px;
  line-height: 1.6;
  margin: 0;
  white-space: pre-wrap;
}

/* Empty Comments */
.empty-comments {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-secondary);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

/* Animations */
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

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.animate-fade-up {
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.animate-slide-up {
  opacity: 0;
  transform: translateY(50px);
  transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.animate-fade-up.animate-in,
.animate-slide-up.animate-in {
  opacity: 1;
  transform: translateY(0);
}

/* Hover Effects */
.action-btn:hover {
  animation: pulse 0.3s ease;
}

.post-image:hover {
  transform: scale(1.03) rotate(1deg);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
}

/* Responsive */
@media (max-width: 768px) {
  .container {
    padding: 0 16px;
  }

  .post-detail {
    padding: 24px;
    border-radius: 20px;
  }

  .post-title {
    font-size: 1.5rem;
  }

  .author-avatar {
    width: 60px;
    height: 60px;
  }

  .avatar-initials {
    font-size: 18px;
  }

  .post-actions {
    flex-wrap: wrap;
    gap: 12px;
  }

  .add-comment {
    padding: 16px;
  }
}

/* User Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  animation: fadeIn 0.3s ease;
}

.user-modal {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 24px;
  max-width: 500px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.25),
    0 10px 20px -5px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 28px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  color: var(--text-secondary);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: var(--text-primary);
  transform: scale(1.1);
}

.close-btn svg {
  width: 20px;
  height: 20px;
}

.modal-content {
  padding: 20px 28px 28px;
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.user-avatar-large {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--background-light) 0%, #e2e8f0 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 4px solid rgba(255, 255, 255, 0.8);
  box-shadow: 
    0 12px 28px rgba(0, 0, 0, 0.15),
    0 0 0 2px rgba(34, 197, 94, 0.2);
  margin-bottom: 20px;
  position: relative;
}

.avatar-initials-large {
  font-weight: 800;
  color: var(--primary-color);
  font-size: 2.5rem;
}

.user-details {
  width: 100%;
}

.username {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}

.user-email {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin: 0 0 20px 0;
}

.user-meta {
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-align: left;
}

.meta-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 12px 16px;
  background: rgba(248, 250, 252, 0.8);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.meta-label {
  font-weight: 600;
  color: var(--text-secondary);
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-right: 16px;
  flex-shrink: 0;
}

.meta-value {
  color: var(--text-primary);
  font-size: 0.9rem;
  text-align: right;
  word-break: break-word;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(50px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Mobile modal styles */
@media (max-width: 768px) {
  .modal-overlay {
    padding: 16px;
  }
  
  .user-modal {
    border-radius: 20px;
  }
  
  .modal-header {
    padding: 20px 24px 16px;
  }
  
  .modal-content {
    padding: 16px 24px 24px;
  }
  
  .user-avatar-large {
    width: 100px;
    height: 100px;
  }
  
  .avatar-initials-large {
    font-size: 2rem;
  }
  
  .username {
    font-size: 1.25rem;
  }
  
  .meta-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .meta-label {
    margin-right: 0;
  }
  
  .meta-value {
    text-align: left;
  }
}

/* Image Modal Styles */
.image-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(10px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.3s ease;
  cursor: zoom-out;
}

.image-modal {
  position: relative;
  max-width: 95vw;
  max-height: 95vh;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.3),
    0 10px 20px rgba(0, 0, 0, 0.2);
  cursor: default;
  animation: slideUp 0.3s ease;
}

.image-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(20px);
}

.image-counter {
  color: white;
  font-size: 14px;
  font-weight: 500;
  opacity: 0.8;
}

.close-image-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-image-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.4);
  transform: scale(1.1);
}

.close-image-btn svg {
  width: 18px;
  height: 18px;
}

.image-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 400px;
  padding: 20px;
}

.modal-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  cursor: zoom-in;
  transition: transform 0.3s ease;
}

.modal-image:hover {
  transform: scale(1.02);
}

.nav-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  z-index: 10;
}

.nav-arrow:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.4);
  transform: translateY(-50%) scale(1.1);
}

.nav-prev {
  left: 20px;
}

.nav-next {
  right: 20px;
}

.nav-arrow svg {
  width: 20px;
  height: 20px;
}

.image-info {
  padding: 16px 20px;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.image-name {
  color: white;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}

.image-size {
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
}

/* Clickable Image Styles */
.clickable-image {
  cursor: zoom-in;
  transition: all 0.3s ease;
}

.clickable-image:hover {
  transform: scale(1.05);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.15),
    0 4px 16px rgba(34, 197, 94, 0.2);
  filter: brightness(1.1);
}

/* Responsive adjustments for image modal */
@media (max-width: 768px) {
  .image-modal {
    max-width: 98vw;
    max-height: 98vh;
    margin: 10px;
  }
  
  .image-container {
    padding: 15px;
    min-height: 300px;
  }
  
  .nav-arrow {
    width: 40px;
    height: 40px;
  }
  
  .nav-prev {
    left: 15px;
  }
  
  .nav-next {
    right: 15px;
  }
  
  .nav-arrow svg {
    width: 16px;
    height: 16px;
  }
  
  .image-modal-header {
    padding: 12px 16px;
  }
  
  .image-info {
    padding: 12px 16px;
  }
}
</style>


