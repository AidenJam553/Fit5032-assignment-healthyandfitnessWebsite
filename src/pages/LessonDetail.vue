<script setup>
import SiteHeader from '@/components/SiteHeader.vue'
import { useRoute, useRouter } from 'vue-router'
import { computed, ref, onMounted, nextTick } from 'vue'
import { useLessonsStore } from '@/lib/stores/lessons.js'
import { getCurrentUser } from '@/lib/auth'

const route = useRoute()
const router = useRouter()
const lessons = useLessonsStore()
const user = getCurrentUser()

lessons.seedIfEmpty()

// 课单相关状态
const isInWishlist = ref(false)

const id = computed(() => route.params.id)
const lesson = computed(() => lessons.lessons.find(l => l.id === id.value) || { 
  title: 'Course Not Found', 
  minutes: 0, 
  topic: 'Unknown',
  difficulty: 'Beginner'
})

// 评论和评分状态
const comments = ref([])
const newComment = ref('')
const userRating = ref(0)
const isLoaded = ref(false)
const showContent = ref(false)

// 论坛评论相关状态
const showEmojiPicker = ref(false)
const activeReplyId = ref(null)

// Emoji 数据
const emojiCategories = {
  'Smileys': ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳'],
  'Gestures': ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏', '🙌', '🤲', '🙏', '✍️', '💪', '🦾', '🦿', '🦵', '🦶'],
  'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'],
  'Activities': ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷'],
  'Food': ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔']
}

// 加载评论数据
function loadComments() {
  const commentsKey = `lesson_comments_${id.value}`
  try {
    const savedComments = JSON.parse(localStorage.getItem(commentsKey) || '[]')
    comments.value = savedComments
  } catch {
    comments.value = []
  }
}

// 保存评论数据
function saveComments() {
  const commentsKey = `lesson_comments_${id.value}`
  localStorage.setItem(commentsKey, JSON.stringify(comments.value))
}

// 添加评论
function addComment() {
  if (!newComment.value.trim() || !user) return
  
  // 获取当前用户的完整信息
  const currentUser = getFullUserData(user.username || user.email)
  
  const comment = {
    id: crypto.randomUUID(),
    content: newComment.value.trim(),
    rating: userRating.value,
    author: user.username || user.email,
    authorId: user.id || user.email,
    createdAt: new Date().toISOString(),
    // 保存用户头像信息
    authorAvatar: currentUser?.avatarDataUrl || null
  }
  
  comments.value.unshift(comment)
  saveComments()
  
  // 如果用户给了评分，也保存到课程评分中
  if (userRating.value > 0) {
    lessons.rate(id.value, userRating.value)
  }
  
  newComment.value = ''
  userRating.value = 0
}

// 获取课程图片
function getCourseImage() {
  const topic = lesson.value.topic?.toLowerCase()
  const difficulty = lesson.value.difficulty?.toLowerCase()
  
  if (topic === 'nutrition') {
    return '/hero.png' // 使用现有的营养相关图片
  } else if (topic === 'workout') {
    return '/forumback.png' // 使用现有的运动相关图片
  }
  
  return '/hero.png' // 默认图片
}

// 获取课程介绍
function getCourseDescription() {
  const descriptions = {
    'Fundamentals of Nutrition': 'Learn the basics of nutrition science, including essential nutrients, dietary guidelines, and how to make informed food choices for better health.',
    'Understanding Macronutrients': 'Dive deep into proteins, carbohydrates, and fats - the building blocks of nutrition that fuel your body and support your fitness goals.',
    'Reading Food Labels': 'Master the skill of reading and understanding nutrition labels to make healthier food choices and avoid hidden ingredients.',
    'Meal Planning Basics': 'Discover how to plan balanced meals that support your health goals, save time, and reduce food waste.',
    'Healthy Grocery Shopping': 'Learn strategies for navigating the grocery store to fill your cart with nutritious, budget-friendly foods.',
    'Portion Control Guide': 'Understand proper portion sizes and learn practical techniques to manage your food intake without feeling deprived.',
    'Beginner Strength Routine': 'Start your strength training journey with safe, effective exercises designed for beginners.',
    'Basic Cardio Workout': 'Build cardiovascular fitness with simple, low-impact cardio exercises you can do anywhere.',
    'Introduction to Yoga': 'Begin your yoga practice with fundamental poses, breathing techniques, and mindfulness principles.',
    'Home Workout Essentials': 'Create an effective workout routine using minimal equipment and space in your own home.'
  }
  return descriptions[lesson.value.title] || 'A comprehensive course designed to help you achieve your health and fitness goals through expert guidance and practical knowledge.'
}

// 用户头像相关方法
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

// 获取完整用户数据
function getFullUserData(authorName) {
  const users = loadUsers()
  return users.find(u => u.username === authorName || u.email === authorName) || null
}

// 处理头像点击
function handleAvatarClick(authorName) {
  // 检查是否点击自己的头像
  const currentUser = user
  if (currentUser && (currentUser.username === authorName || currentUser.email === authorName)) {
    // 导航到自己的个人资料
    router.push('/profile')
    return
  }
  
  // 显示其他用户信息模态框（这里可以扩展为显示用户信息）
  const userData = getFullUserData(authorName)
  if (userData) {
    console.log('User data:', userData)
    // 可以在这里添加显示用户信息的逻辑
  }
}

// 论坛评论相关方法
function toggleEmojiPicker() {
  showEmojiPicker.value = !showEmojiPicker.value
}

function addEmoji(emoji) {
  if (activeReplyId.value) {
    const commentToReply = comments.value.find(c => c.id === activeReplyId.value)
    if (commentToReply) {
      commentToReply.replyContent = (commentToReply.replyContent || '') + emoji
    }
  } else {
    newComment.value += emoji
  }
  showEmojiPicker.value = false
  // Focus back to textarea
  nextTick(() => {
    const textarea = document.querySelector('.comment-input')
    if (textarea) {
      textarea.focus()
    }
  })
}

function formatDate(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diffInHours = (now - date) / (1000 * 60 * 60)
  
  if (diffInHours < 1) {
    return 'Just now'
  } else if (diffInHours < 24) {
    const hours = Math.floor(diffInHours)
    return `${hours} hour${hours > 1 ? 's' : ''} ago`
  } else if (diffInHours < 168) { // 7 days
    const days = Math.floor(diffInHours / 24)
    return `${days} day${days > 1 ? 's' : ''} ago`
  } else {
    return date.toLocaleDateString()
  }
}

function isOwnComment(comment) {
  return user && (user.username === comment.author || user.email === comment.author)
}

function toggleReply(comment) {
  comment.isReplying = !comment.isReplying
  if (comment.isReplying) {
    activeReplyId.value = comment.id
    comment.replyContent = ''
  } else {
    activeReplyId.value = null
  }
}

function editComment(comment) {
  comment.isEditing = true
  comment.editContent = comment.content
}

function cancelEdit(comment) {
  comment.isEditing = false
  comment.editContent = ''
}

function saveComment(comment) {
  if (comment.editContent?.trim()) {
    comment.content = comment.editContent.trim()
    comment.editedAt = new Date().toISOString()
    comment.isEditing = false
    comment.editContent = ''
    saveComments()
  }
}

function deleteComment(comment) {
  const index = comments.value.findIndex(c => c.id === comment.id)
  if (index > -1) {
    comments.value.splice(index, 1)
    saveComments()
  }
}

function handleReply(comment) {
  if (comment.replyContent?.trim()) {
    // 获取当前用户的完整信息
    const currentUser = getFullUserData(user.username || user.email)
    
    const reply = {
      id: crypto.randomUUID(),
      content: comment.replyContent.trim(),
      author: user.username || user.email,
      authorId: user.id || user.email,
      createdAt: new Date().toISOString(),
      // 保存用户头像信息
      authorAvatar: currentUser?.avatarDataUrl || null
    }
    
    if (!comment.replies) {
      comment.replies = []
    }
    comment.replies.push(reply)
    comment.isReplying = false
    comment.replyContent = ''
    activeReplyId.value = null
    saveComments()
  }
}

// 开始学习
function startLearning() {
  router.push({ name: 'lesson-learning', params: { id: id.value } })
}

// 课单相关方法
function toggleWishlist() {
  if (!user) {
    // 如果用户未登录，可以提示登录或跳转到登录页面
    router.push('/login')
    return
  }
  
  if (isInWishlist.value) {
    lessons.removeFromWishlist(user.id, id.value)
  } else {
    lessons.addToWishlist(user.id, id.value)
  }
  isInWishlist.value = !isInWishlist.value
}

function checkWishlistStatus() {
  if (user) {
    isInWishlist.value = lessons.isInWishlist(user.id, id.value)
  }
}

onMounted(async () => {
  loadComments()
  checkWishlistStatus()
  
  // 立即显示内容，不等待动画延迟
  isLoaded.value = true
  showContent.value = true
  
  await nextTick()
})
</script>

<template>
  <div class="page">
    <SiteHeader />
    
    <div class="container">
      <!-- Back Button -->
      <div class="back-section animate-fade-up" :class="{ 'animate-in': showContent }" style="animation-delay: 0.2s">
        <button class="back-btn" @click="router.back()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to Courses
        </button>
      </div>

      <!-- Course Header -->
      <div class="course-header animate-fade-up" :class="{ 'animate-in': showContent }" style="animation-delay: 0.3s">
        <div class="course-hero">
          <div class="course-image animate-slide-left" :class="{ 'animate-in': showContent }" style="animation-delay: 0.4s">
            <img :src="getCourseImage()" :alt="lesson.title" />
            <div class="course-overlay">
              <div class="course-badge animate-scale-in" :class="{ 'animate-in': showContent }" style="animation-delay: 0.6s">{{ lesson.difficulty }}</div>
              <div class="course-duration animate-scale-in" :class="{ 'animate-in': showContent }" style="animation-delay: 0.7s">{{ lesson.minutes }}m</div>
            </div>
          </div>
          
          <div class="course-info">
            <div class="course-topic animate-fade-up" :class="{ 'animate-in': showContent }" style="animation-delay: 0.5s">{{ lesson.topic }}</div>
            <h1 class="course-title animate-fade-up" :class="{ 'animate-in': showContent }" style="animation-delay: 0.6s">{{ lesson.title }}</h1>
            <p class="course-description animate-fade-up" :class="{ 'animate-in': showContent }" style="animation-delay: 0.7s">{{ getCourseDescription() }}</p>
            
            <div class="course-meta">
              <div class="meta-item animate-fade-up" :class="{ 'animate-in': showContent }" style="animation-delay: 0.8s">
                <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12,6 12,12 16,14"/>
                </svg>
                <span><strong>{{ lesson.minutes }}</strong> minutes</span>
              </div>
              
              <div class="meta-item animate-fade-up" :class="{ 'animate-in': showContent }" style="animation-delay: 0.9s">
                <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <span><strong>{{ (lessons.averageRating(id) || 0).toFixed(1) }}</strong> (<strong>{{ (lessons.ratings[id] || []).length }}</strong> ratings)</span>
              </div>
              
              <div class="meta-item animate-fade-up" :class="{ 'animate-in': showContent }" style="animation-delay: 1.0s">
                <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 12l2 2 4-4"/>
                  <path d="M21 12c-1 0-2-1-2-2s1-2 2-2 2 1 2 2-1 2-2 2z"/>
                  <path d="M3 12c1 0 2-1 2-2s-1-2-2-2-2 1-2 2 1 2 2 2z"/>
                  <path d="M12 3c0 1-1 2-2 2s-2-1-2-2 1-2 2-2 2 1 2 2z"/>
                  <path d="M12 21c0-1 1-2 2-2s2 1 2 2-1 2-2 2-2-1-2-2z"/>
                </svg>
                <span><strong>{{ lessons.progress[id] || 0 }}%</strong> complete</span>
              </div>
            </div>
            
            <div class="course-actions animate-fade-up" :class="{ 'animate-in': showContent }" style="animation-delay: 1.1s">
              <button class="btn-start-learning animate-bounce-in" :class="{ 'animate-in': showContent }" style="animation-delay: 1.2s" @click="startLearning">
                <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
                Start Learning
              </button>
              
              <button 
                class="btn-wishlist animate-bounce-in" 
                :class="{ 'animate-in': showContent, 'in-wishlist': isInWishlist }" 
                style="animation-delay: 1.3s" 
                @click="toggleWishlist"
                :title="isInWishlist ? 'Remove from My Courses' : 'Add to My Courses'"
              >
                <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path v-if="!isInWishlist" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  <path v-else d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="currentColor"/>
                </svg>
                {{ isInWishlist ? 'In My Courses' : 'Add to My Courses' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Course Content -->
      <div class="course-content animate-fade-up" :class="{ 'animate-in': showContent }" style="animation-delay: 0.4s">
        <div class="content-grid">
          <!-- Progress Section -->
          <div class="progress-section animate-slide-up" :class="{ 'animate-in': showContent }" style="animation-delay: 0.5s">
            <h3 class="section-title animate-fade-up" :class="{ 'animate-in': showContent }" style="animation-delay: 0.6s">Your Progress</h3>
            <div class="progress-card animate-scale-in" :class="{ 'animate-in': showContent }" style="animation-delay: 0.7s">
              <div class="progress-circle animate-rotate-in" :class="{ 'animate-in': showContent }" style="animation-delay: 0.8s">
                <svg class="progress-svg" viewBox="0 0 36 36">
                  <path class="progress-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                  <path 
                    class="progress-fill" 
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    :stroke-dasharray="`${(lessons.progress[id] || 0) * 1.1}, 100`"
                  />
                </svg>
                <div class="progress-text animate-fade-in" :class="{ 'animate-in': showContent }" style="animation-delay: 1.0s">{{ lessons.progress[id] || 0 }}%</div>
              </div>
              <div class="progress-info">
                <h4 class="animate-fade-up" :class="{ 'animate-in': showContent }" style="animation-delay: 0.9s">Course Progress</h4>
                <p class="progress-description animate-fade-up" :class="{ 'animate-in': showContent }" style="animation-delay: 1.0s">You're making great progress! Keep going to complete this course.</p>
                <div class="progress-bar-container animate-slide-right" :class="{ 'animate-in': showContent }" style="animation-delay: 1.1s">
                  <div class="progress-bar">
                    <div class="progress-bar-fill animate-progress-fill" :class="{ 'animate-in': showContent }" style="animation-delay: 1.2s" :style="{ '--progress-width': `${lessons.progress[id] || 0}%` }"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Rating Section -->
          <div class="rating-section animate-slide-up" :class="{ 'animate-in': showContent }" style="animation-delay: 0.6s">
            <h3 class="section-title animate-fade-up" :class="{ 'animate-in': showContent }" style="animation-delay: 0.7s">Rate This Course</h3>
            <div class="rating-card animate-scale-in" :class="{ 'animate-in': showContent }" style="animation-delay: 0.8s">
              <div class="rating-stars animate-fade-up" :class="{ 'animate-in': showContent }" style="animation-delay: 0.9s">
                <span 
                  v-for="i in 5" 
                  :key="i" 
                  class="star animate-star-in" 
                  :class="{ 'filled': i <= userRating, 'animate-in': showContent }"
                  :style="{ animationDelay: `${0.9 + i * 0.1}s` }"
                  @click="userRating = i"
                >
                  ★
                </span>
              </div>
              <p class="rating-text animate-fade-up" :class="{ 'animate-in': showContent }" style="animation-delay: 1.4s">Click the stars to rate this course</p>
            </div>
          </div>
        </div>

        <!-- Comments Section -->
        <section class="comments-section animate-fade-up" :class="{ 'animate-in': showContent }" style="animation-delay: 0.6s">
          <h3 class="comments-title animate-fade-up" :class="{ 'animate-in': showContent }" style="animation-delay: 0.7s">Reviews & Comments</h3>

          <!-- Add Comment -->
          <div v-if="user" class="add-comment animate-slide-up" :class="{ 'animate-in': showContent }" style="animation-delay: 0.8s">
            <div class="comment-avatar clickable animate-bounce-in" :class="{ 'animate-in': showContent }" style="animation-delay: 0.9s" @click="handleAvatarClick(user.username || user.email)">
              <img v-if="getUserAvatar(user.username || user.email)" :src="getUserAvatar(user.username || user.email)" alt="Your Avatar" class="avatar-img" />
              <span v-else class="avatar-initials">{{ getInitials(user.username || user.email) }}</span>
            </div>
            <div class="comment-form animate-fade-up" :class="{ 'animate-in': showContent }" style="animation-delay: 1.0s">
              <div class="input-container animate-scale-in" :class="{ 'animate-in': showContent }" style="animation-delay: 1.1s">
                <textarea 
                  v-model="newComment"
                  placeholder="Share your thoughts about this course..."
                  class="comment-input"
                  rows="3"
                ></textarea>
                <button 
                  class="emoji-btn animate-bounce-in"
                  :class="{ 'animate-in': showContent }"
                  style="animation-delay: 1.2s"
                  @click="toggleEmojiPicker"
                  type="button"
                  title="Add emoji"
                >
                  😊
                </button>
              </div>
              
                            <!-- Emoji Picker -->
              <div v-if="showEmojiPicker" class="emoji-picker animate-scale-in animate-in">
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
                        class="emoji-item animate-bounce-in"
                        :class="{ 'animate-in': showEmojiPicker }"
                        :style="{ animationDelay: `${Math.random() * 0.3}s` }"
                        @click="addEmoji(emoji)"
                        :title="emoji"
                      >
                        {{ emoji }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="comment-actions animate-fade-up" :class="{ 'animate-in': showContent }" style="animation-delay: 1.3s">
                <div class="comment-rating animate-slide-right" :class="{ 'animate-in': showContent }" style="animation-delay: 1.4s">
                  <span>Rate: </span>
                  <span
                    v-for="i in 5"
                    :key="i"
                    class="star small animate-star-in"
                    :class="{ 'filled': i <= userRating, 'animate-in': showContent }"
                    :style="{ animationDelay: `${1.4 + i * 0.05}s` }"
                    @click="userRating = i"
                  >
                    ★
                  </span>
                  <span class="rating-fraction animate-fade-in" :class="{ 'animate-in': showContent }" style="animation-delay: 1.7s">{{ userRating }}/5</span>
                </div>
                <button
                  class="submit-comment-btn animate-bounce-in"
                  :class="{ 'animate-in': showContent }"
                  style="animation-delay: 1.8s"
                  @click="addComment"
                  :disabled="!newComment.trim()"
                >
                  Post Comment
                </button>
              </div>
            </div>
          </div>

          <!-- Login Prompt -->
          <div v-else class="login-prompt animate-fade-up" :class="{ 'animate-in': showContent }" style="animation-delay: 0.8s">
            <p>Please <router-link to="/login" class="login-link">log in</router-link> to join the discussion.</p>
          </div>

          <!-- Comments List -->
          <div class="comments-list">
            <div v-if="comments.length === 0" class="empty-comments animate-fade-up" :class="{ 'animate-in': showContent }" style="animation-delay: 0.9s">
              <div class="empty-icon animate-bounce-in" :class="{ 'animate-in': showContent }" style="animation-delay: 1.0s">💭</div>
              <h4 class="animate-fade-up" :class="{ 'animate-in': showContent }" style="animation-delay: 1.1s">No reviews yet</h4>
              <p class="animate-fade-up" :class="{ 'animate-in': showContent }" style="animation-delay: 1.2s">Be the first to share your experience with this course!</p>
            </div>
            
            <div v-else v-for="(commentItem, index) in comments" :key="commentItem.id" class="comment-item-wrapper animate-slide-up" :class="{ 'animate-in': showContent }" :style="{ animationDelay: `${0.9 + index * 0.1}s` }">
              <div class="comment-item">
                <div class="comment-avatar clickable" @click="handleAvatarClick(commentItem.author)">
                  <img v-if="commentItem.authorAvatar || getUserAvatar(commentItem.author)" :src="commentItem.authorAvatar || getUserAvatar(commentItem.author)" alt="Commenter Avatar" class="avatar-img" />
                  <span v-else class="avatar-initials">{{ getInitials(commentItem.author) }}</span>
                </div>
                <div class="comment-content">
                  <div class="comment-header">
                    <div class="comment-info">
                      <span class="comment-author">{{ commentItem.author }}</span>
                      <span class="comment-date">
                        {{ formatDate(commentItem.createdAt) }}
                        <span v-if="commentItem.editedAt" class="edited-indicator"> • edited</span>
                      </span>
                    </div>
                    <!-- Edit/Delete buttons for own comments -->
                    <div class="comment-controls-wrapper">
                      <button class="control-btn reply-btn" @click="toggleReply(commentItem)" title="Reply to comment">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                        </svg>
                      </button>
                      <div v-if="isOwnComment(commentItem)" class="comment-controls">
                        <button class="control-btn edit-btn" @click="editComment(commentItem)" title="Edit Comment">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button class="control-btn delete-btn" @click="deleteComment(commentItem)" title="Delete Comment">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3,6 5,6 21,6"/>
                            <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2v2"/>
                            <line x1="10" y1="11" x2="10" y2="17"/>
                            <line x1="14" y1="11" x2="14" y2="17"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Rating Display -->
                  <div class="comment-rating-display">
                    <span 
                      v-for="i in 5" 
                      :key="i" 
                      class="star small" 
                      :class="{ 'filled': i <= commentItem.rating }"
                    >
                      ★
                    </span>
                    <span class="rating-text">{{ commentItem.rating }}/5</span>
                  </div>
                  
                  <p v-if="!commentItem.isEditing" class="comment-text">{{ commentItem.content }}</p>
                  <!-- Edit comment form -->
                  <div v-else class="edit-comment-form">
                    <textarea
                      v-model="commentItem.editContent"
                      class="edit-comment-input"
                      rows="3"
                      placeholder="Edit your comment..."
                      @keydown.ctrl.enter="saveComment(commentItem)"
                      @keydown.esc="cancelEdit(commentItem)"
                    ></textarea>
                    <div class="edit-comment-actions">
                      <button class="btn-save" @click="saveComment(commentItem)">Save</button>
                      <button class="btn-cancel" @click="cancelEdit(commentItem)">Cancel</button>
                    </div>
                  </div>
                </div>
              </div>
              <!-- Reply form -->
              <div v-if="commentItem.isReplying" class="reply-form">
                 <textarea
                    v-model="commentItem.replyContent"
                    class="reply-input"
                    rows="2"
                    placeholder="Write a reply..."
                 ></textarea>
                 <div class="reply-actions">
                    <button class="emoji-btn-reply" @click="toggleEmojiPicker" title="Add emoji">😊</button>
                    <button class="btn-cancel" @click="toggleReply(commentItem)">Cancel</button>
                    <button class="btn-save" @click="handleReply(commentItem)" :disabled="!commentItem.replyContent?.trim()">Reply</button>
                 </div>
              </div>

              <!-- Replies List -->
              <div v-if="commentItem.replies && commentItem.replies.length > 0" class="replies-list">
                <div v-for="reply in commentItem.replies" :key="reply.id" class="comment-item reply-item">
                  <div class="comment-avatar clickable" @click="handleAvatarClick(reply.author)">
                    <img v-if="reply.authorAvatar || getUserAvatar(reply.author)" :src="reply.authorAvatar || getUserAvatar(reply.author)" alt="Commenter Avatar" class="avatar-img" />
                    <span v-else class="avatar-initials">{{ getInitials(reply.author) }}</span>
                  </div>
                  <div class="comment-content">
                    <div class="comment-header">
                      <div class="comment-info">
                        <span class="comment-author">{{ reply.author }}</span>
                        <span class="comment-date">{{ formatDate(reply.createdAt) }}</span>
                      </div>
                    </div>
                    <p class="comment-text">{{ reply.content }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* CSS Variables */
:root {
  --primary-color: #10b981;
  --primary-dark: #059669;
  --primary-light: #d1fae5;
  --accent-color: #f59e0b;
  --text-primary: #1f2937;
  --text-secondary: #6b7280;
  --text-muted: #9ca3af;
  --border-color: #e5e7eb;
  --bg-light: #f9fafb;
  --bg-white: #ffffff;
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.page {
  background: #f0fdf4;
  min-height: 100vh;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
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

/* Course Header */
.course-header {
  margin-bottom: 48px;
}

.course-hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  align-items: start;
}

.course-image {
  position: relative;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: var(--shadow-lg);
}

.course-image img {
  width: 100%;
  height: 300px;
  object-fit: cover;
}

.course-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.8) 0%, rgba(5, 150, 105, 0.8) 100%);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 24px;
}

.course-badge {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  color: white;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.course-duration {
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  color: white;
}

.course-info {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.course-topic {
  display: inline-block;
  background: var(--primary-light);
  color: var(--primary-dark);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  width: fit-content;
}

.course-title {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.2;
}

.course-description {
  font-size: 1.125rem;
  color: #6b7280;
  line-height: 1.6;
  margin: 0;
}

.course-meta {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.meta-icon {
  width: 18px;
  height: 18px;
  color: var(--primary-color);
}

.course-actions {
  margin-top: 16px;
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.btn-start-learning {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  background: #059669;
  color: white;
  border: none;
  padding: 16px 32px;
  border-radius: 16px;
  font-size: 1.125rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: var(--shadow-md);
  transform: translateY(0);
}

.btn-start-learning:hover {
  background: #047857;
  transform: translateY(-3px) scale(1.02);
  box-shadow: var(--shadow-xl);
}

.btn-start-learning:active {
  transform: translateY(-1px) scale(0.98);
}

.btn-icon {
  width: 20px;
  height: 20px;
}

.btn-wishlist {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.9);
  color: var(--text-primary);
  border: 2px solid var(--border-color);
  padding: 16px 32px;
  border-radius: 16px;
  font-size: 1.125rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: var(--shadow-md);
  transform: translateY(0);
  backdrop-filter: blur(10px);
}

.btn-wishlist:hover {
  background: rgba(255, 255, 255, 1);
  border-color: var(--primary-color);
  color: var(--primary-color);
  transform: translateY(-3px) scale(1.02);
  box-shadow: var(--shadow-xl);
}

.btn-wishlist.in-wishlist {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.btn-wishlist.in-wishlist:hover {
  background: var(--primary-dark);
  border-color: var(--primary-dark);
  color: white;
}

.btn-wishlist:active {
  transform: translateY(-1px) scale(0.98);
}

/* Course Content */
.course-content {
  margin-bottom: 48px;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  margin-bottom: 48px;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 24px 0;
}

/* Progress Section */
.progress-card {
  background: white;
  border-radius: 20px;
  padding: 32px;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  gap: 24px;
}

.progress-circle {
  position: relative;
  width: 80px;
  height: 80px;
}

.progress-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.progress-bg {
  fill: none;
  stroke: var(--bg-light);
  stroke-width: 4;
}

.progress-fill {
  fill: none;
  stroke: var(--primary-color);
  stroke-width: 4;
  stroke-linecap: round;
  transition: stroke-dasharray 0.5s ease;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--primary-color);
}

.progress-info h4 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}

.progress-info p {
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
}

.progress-description {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 16px 0;
  line-height: 1.4;
}

.progress-bar-container {
  margin-top: 12px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color), #16a34a);
  border-radius: 4px;
  transition: width 0.5s ease;
}

/* Rating Section */
.rating-card {
  background: white;
  border-radius: 20px;
  padding: 32px;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-color);
  text-align: center;
}

.rating-stars {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 16px;
}

.star {
  font-size: 2rem;
  color: #d1d5db;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  transform: scale(1);
  user-select: none;
}

.star:hover {
  color: #fbbf24;
  transform: scale(1.2) rotate(5deg);
}

.star.filled {
  color: #fbbf24;
  transform: scale(1.1);
}

.star:active {
  transform: scale(0.9);
}

.rating-text {
  color: var(--text-secondary);
  margin: 0;
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

.comment-avatar.clickable {
  cursor: pointer;
}

.comment-avatar.clickable:hover {
  transform: scale(1.05);
  box-shadow: 
    0 6px 16px rgba(0, 0, 0, 0.2),
    0 0 0 2px rgba(34, 197, 94, 0.2);
}

.comment-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-initials {
  font-size: 14px;
  font-weight: 700;
  color: var(--primary-color);
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

.emoji-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.emoji-btn:hover {
  background: rgba(34, 197, 94, 0.1);
  transform: scale(1.1);
}

/* Emoji Picker */
.emoji-picker {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 2px solid var(--border-color);
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  max-height: 300px;
  overflow-y: auto;
}

.emoji-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
}

.emoji-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.close-emoji-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.close-emoji-btn:hover {
  background: var(--background-light);
}

.emoji-categories {
  padding: 16px;
}

.emoji-category {
  margin-bottom: 20px;
}

.category-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 8px;
}

.emoji-item {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.emoji-item:hover {
  background: var(--background-light);
  transform: scale(1.1);
}

.comment-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.comment-rating {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
  font-size: 14px;
}

.star.small {
  font-size: 18px;
  color: #d1d5db;
  cursor: pointer;
  transition: color 0.2s ease;
}

.star.small:hover,
.star.small.filled {
  color: #fbbf24;
}

.rating-fraction {
  margin-left: 8px;
  font-weight: 600;
  color: var(--text-primary);
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
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* Login Prompt */
.login-prompt {
  text-align: center;
  padding: 32px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.8) 100%);
  border-radius: 16px;
  border: 2px solid rgba(34, 197, 94, 0.1);
  margin-bottom: 32px;
}

.login-prompt p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 16px;
}

.login-link {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s ease;
}

.login-link:hover {
  color: var(--primary-dark);
}

/* Comments List */
.comments-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.empty-comments {
  text-align: center;
  padding: 48px 24px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.8) 100%);
  border-radius: 20px;
  border: 2px solid rgba(34, 197, 94, 0.1);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 16px;
}

.empty-comments h4 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}

.empty-comments p {
  margin: 0;
  color: var(--text-secondary);
}

.comment-item-wrapper {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.comment-item {
  display: flex;
  gap: 16px;
  padding: 24px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%);
  border-radius: 20px;
  border: 2px solid rgba(34, 197, 94, 0.1);
  box-shadow: 
    0 8px 20px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  transform: translateY(0);
}

.comment-item:hover {
  border-color: rgba(34, 197, 94, 0.2);
  box-shadow: 
    0 12px 28px rgba(0, 0, 0, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  transform: translateY(-3px) scale(1.01);
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.comment-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.comment-author {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.comment-date {
  font-size: 14px;
  color: var(--text-secondary);
}

.edited-indicator {
  color: var(--text-muted);
  font-style: italic;
}

.comment-controls-wrapper {
  display: flex;
  gap: 8px;
}

.control-btn {
  background: none;
  border: none;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--text-secondary);
}

.control-btn:hover {
  background: var(--background-light);
  color: var(--text-primary);
}

.control-btn svg {
  width: 16px;
  height: 16px;
}

.comment-controls {
  display: flex;
  gap: 4px;
}

.edit-btn:hover {
  color: var(--primary-color);
}

.delete-btn:hover {
  color: #ef4444;
}

.comment-rating-display {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.rating-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.comment-text {
  color: var(--text-primary);
  line-height: 1.7;
  margin: 0;
  white-space: pre-wrap;
}

/* Edit Comment Form */
.edit-comment-form {
  margin-top: 16px;
}

.edit-comment-input {
  width: 100%;
  padding: 16px;
  border: 2px solid var(--border-color);
  border-radius: 12px;
  font-size: 15px;
  resize: vertical;
  min-height: 80px;
  margin-bottom: 12px;
  font-family: inherit;
  background: rgba(255, 255, 255, 0.9);
  transition: all 0.2s ease;
}

.edit-comment-input:focus {
  outline: none;
  border-color: var(--primary-color);
  background: rgba(255, 255, 255, 1);
}

.edit-comment-actions {
  display: flex;
  gap: 12px;
}

.btn-save {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-save:hover {
  background: var(--primary-dark);
  transform: translateY(-1px);
}

.btn-cancel {
  background: var(--text-secondary);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cancel:hover {
  background: var(--text-primary);
  transform: translateY(-1px);
}

/* Reply Form */
.reply-form {
  margin-left: 64px;
  margin-top: 16px;
  padding: 20px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.8) 100%);
  border-radius: 16px;
  border: 2px solid rgba(34, 197, 94, 0.1);
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.reply-input {
  width: 100%;
  padding: 16px;
  border: 2px solid var(--border-color);
  border-radius: 12px;
  font-size: 15px;
  resize: vertical;
  min-height: 60px;
  margin-bottom: 12px;
  font-family: inherit;
  background: rgba(255, 255, 255, 0.9);
  transition: all 0.2s ease;
}

.reply-input:focus {
  outline: none;
  border-color: var(--primary-color);
  background: rgba(255, 255, 255, 1);
}

.reply-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.emoji-btn-reply {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.emoji-btn-reply:hover {
  background: rgba(34, 197, 94, 0.1);
  transform: scale(1.1);
}

/* Replies List */
.replies-list {
  margin-left: 64px;
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.reply-item {
  padding: 20px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.7) 100%);
  border-radius: 16px;
  border: 2px solid rgba(34, 197, 94, 0.05);
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

/* Animation Classes */
.animate-fade-up {
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.animate-fade-up.animate-in {
  opacity: 1;
  transform: translateY(0);
}

.animate-slide-left {
  opacity: 0;
  transform: translateX(-50px);
  transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.animate-slide-left.animate-in {
  opacity: 1;
  transform: translateX(0);
}

.animate-slide-right {
  opacity: 0;
  transform: translateX(50px);
  transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.animate-slide-right.animate-in {
  opacity: 1;
  transform: translateX(0);
}

.animate-slide-up {
  opacity: 0;
  transform: translateY(50px);
  transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.animate-slide-up.animate-in {
  opacity: 1;
  transform: translateY(0);
}

.animate-scale-in {
  opacity: 0;
  transform: scale(0.8);
  transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.animate-scale-in.animate-in {
  opacity: 1;
  transform: scale(1);
}

.animate-bounce-in {
  opacity: 0;
  transform: scale(0.3) translateY(50px);
  transition: all 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.animate-bounce-in.animate-in {
  opacity: 1;
  transform: scale(1) translateY(0);
}

.animate-rotate-in {
  opacity: 0;
  transform: rotate(-180deg) scale(0.5);
  transition: all 1s cubic-bezier(0.16, 1, 0.3, 1);
}

.animate-rotate-in.animate-in {
  opacity: 1;
  transform: rotate(0deg) scale(1);
}

.animate-fade-in {
  opacity: 0;
  transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.animate-fade-in.animate-in {
  opacity: 1;
}

.animate-star-in {
  opacity: 0;
  transform: scale(0) rotate(180deg);
  transition: all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.animate-star-in.animate-in {
  opacity: 1;
  transform: scale(1) rotate(0deg);
}

.animate-progress-fill {
  width: 0% !important;
  transition: width 1.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.animate-progress-fill.animate-in {
  width: var(--progress-width) !important;
}

/* Responsive Design */
@media (max-width: 768px) {
  .course-hero {
    grid-template-columns: 1fr;
    gap: 32px;
  }
  
  .course-title {
    font-size: 2rem;
  }
  
  .content-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  
  .progress-card {
    flex-direction: column;
    text-align: center;
  }
  
  .comment-actions {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .btn-submit-comment {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .container {
    padding: 0 16px;
  }
  
  .course-title {
    font-size: 1.75rem;
  }
  
  .course-description {
    font-size: 1rem;
  }
  
  .btn-start-learning {
    width: 100%;
    justify-content: center;
  }
}
</style>


