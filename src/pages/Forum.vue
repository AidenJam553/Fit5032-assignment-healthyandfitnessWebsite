<script setup>
import SiteHeader from '@/components/SiteHeader.vue'
import { useForumStore } from '@/lib/stores/forum'
import { getCurrentUser } from '@/lib/auth'
import { onMounted, onBeforeUnmount, ref, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'

const forum = useForumStore()
const router = useRouter()
const searchQuery = ref('')
const isLoaded = ref(false)
const scrollY = ref(0)
const heroHeight = ref(0)

onMounted(async () => {
  forum.seedIfEmpty()
  await nextTick()
  setTimeout(() => {
    isLoaded.value = true
  }, 100)
  
  // Add scroll listener for drawer effect
  const handleScroll = () => {
    scrollY.value = window.scrollY
  }
  
  window.addEventListener('scroll', handleScroll, { passive: true })
  
  // Clean up on unmount
  const cleanup = () => {
    window.removeEventListener('scroll', handleScroll)
  }
  
  // Store cleanup function for unmount
  onBeforeUnmount(cleanup)
})

// Computed property for hero transform
const heroTransform = computed(() => {
  const maxScroll = 300 // Maximum scroll distance for full effect
  const progress = Math.min(scrollY.value / maxScroll, 1)
  
  // Drawer closing effect: scale down and move up
  const scale = 1 - (progress * 0.1) // Scale from 1 to 0.9
  const translateY = -(progress * 50) // Move up by 50px
  const opacity = 1 - (progress * 0.3) // Fade out slightly
  
  return {
    transform: `translateY(${translateY}px) scale(${scale})`,
    opacity: opacity
  }
})

const USERS_KEY = 'users'
function loadUsers() { 
  try { 
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]') 
  } catch { 
    return [] 
  } 
}

// Function to get user avatar by author name (username)
function getUserAvatar(authorName) {
  const users = loadUsers()
  const user = users.find(u => u.username === authorName)
  return user?.avatarDataUrl || null
}

// Function to get initials from author name
function getInitials(authorName) {
  return (authorName || '').split(' ').map(s => s[0]).join('').slice(0, 1).toUpperCase() || 'U'
}

// Computed property for filtered posts
const filteredPosts = computed(() => {
  let posts = forum.activeTopic === 'All' ? forum.posts : forum.posts.filter(p => p.topic === forum.activeTopic)
  
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    posts = posts.filter(p => 
      p.title.toLowerCase().includes(query) || 
      p.content.toLowerCase().includes(query) ||
      p.author.toLowerCase().includes(query)
    )
  }
  
  return posts
})

// Category list with post counts
const categories = computed(() => {
  const counts = {}
  forum.posts.forEach(p => {
    counts[p.topic] = (counts[p.topic] || 0) + 1
  })
  
  return [
    { name: 'All', count: forum.posts.length },
    { name: 'General', count: counts['General'] || 0 },
    { name: 'Nutrition', count: counts['Nutrition'] || 0 },
    { name: 'Workout', count: counts['Workout'] || 0 },
    { name: 'Weight loss', count: counts['Weight loss'] || 0 },
    { name: 'Q & A', count: counts['Q & A'] || 0 },
  ]
})

function newPost() {
  const user = getCurrentUser()
  if (!user) {
    router.push({ path: '/login', query: { redirect: '/forum/new' } })
    return
  }
  router.push('/forum/new')
}

function formatDate(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}

function viewPost(postId) {
  router.push({ name: 'forum-detail', params: { id: postId } })
}

function handleLike(event, postId) {
  event.stopPropagation() // Prevent post navigation
  const user = getCurrentUser()
  if (!user) {
    router.push({ path: '/login', query: { redirect: '/forum' } })
    return
  }
  forum.toggleLike(postId, user.id || user.email)
}

function isLiked(post) {
  const user = getCurrentUser()
  if (!user) return false
  return post.likedBy?.includes(user.id || user.email) || false
}
</script>

<template>
  <div class="page">
    <SiteHeader />

    <!-- Hero Section -->
    <section class="hero" :class="{ 'animate-in': isLoaded }" :style="heroTransform">
      <div class="container">
        <div class="hero-content">
          <h1 class="hero-title animate-fade-up" :class="{ 'animate-in': isLoaded }" style="animation-delay: 0.2s">Community Forum</h1>
          <p class="hero-subtitle animate-fade-up" :class="{ 'animate-in': isLoaded }" style="animation-delay: 0.4s">Connect with fellow fitness enthusiasts, share your journey, and get expert advice.</p>
          <button class="btn btn-primary animate-fade-up" :class="{ 'animate-in': isLoaded }" style="animation-delay: 0.6s" @click="newPost">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Create New Post
          </button>
        </div>
      </div>
    </section>

    <!-- Main Content -->
    <div class="container main-content">
      <div class="content-grid">
                <!-- Left Sidebar -->
        <aside class="sidebar animate-slide-left" :class="{ 'animate-in': isLoaded }" style="animation-delay: 0.8s">
          <!-- Categories -->
          <div class="sidebar-card animate-fade-up" :class="{ 'animate-in': isLoaded }" style="animation-delay: 1.0s">
            <h3 class="sidebar-title">Categories</h3>
            <ul class="category-list">
              <li 
                v-for="(cat, index) in categories" 
                :key="cat.name"
                :class="{ 
                  active: forum.activeTopic === cat.name,
                  'animate-in': isLoaded 
                }"
                @click="forum.setTopic(cat.name)"
                class="category-item animate-fade-up"
                :style="`animation-delay: ${1.2 + index * 0.1}s`"
              >
                <span class="category-name">{{ cat.name }}</span>
                <span class="category-count">{{ cat.count }}</span>
              </li>
            </ul>
          </div>

          <!-- Search -->
          <div class="sidebar-card animate-fade-up" :class="{ 'animate-in': isLoaded }" style="animation-delay: 1.8s">
            <h3 class="sidebar-title">Search Posts</h3>
            <div class="search-box">
              <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              <input 
                v-model="searchQuery"
                type="text" 
                placeholder="Search posts, authors..."
                class="search-input"
              />
            </div>
          </div>

          <!-- Forum Stats -->
          <div class="sidebar-card animate-fade-up" :class="{ 'animate-in': isLoaded }" style="animation-delay: 2.0s">
            <h3 class="sidebar-title">Community Stats</h3>
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-number">{{ forum.posts.length }}</div>
                <div class="stat-label">Total Posts</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">{{ new Set(forum.posts.map(p => p.author)).size }}</div>
                <div class="stat-label">Active Members</div>
              </div>
              </div>
            </div>
        </aside>

                <!-- Main Feed -->
        <main class="feed animate-slide-right" :class="{ 'animate-in': isLoaded }" style="animation-delay: 0.8s">
          <div class="feed-header animate-fade-up" :class="{ 'animate-in': isLoaded }" style="animation-delay: 1.0s">
            <h2 class="feed-title">
              {{ forum.activeTopic === 'All' ? 'All Posts' : forum.activeTopic }}
              <span class="post-count">({{ filteredPosts.length }})</span>
            </h2>
          </div>

          <!-- Posts -->
          <div v-if="filteredPosts.length > 0" class="posts-list">
            <article 
              v-for="(post, index) in filteredPosts" 
              :key="post.id"
              class="post-card animate-fade-up"
              :class="{ 'animate-in': isLoaded }"
              :style="`animation-delay: ${1.2 + index * 0.1}s`"
              @click="viewPost(post.id)"
            >
              <div class="post-header">
                <div class="author-info">
                  <div class="avatar">
                    <img v-if="getUserAvatar(post.author)" :src="getUserAvatar(post.author)" alt="avatar" class="avatar-img" />
                    <span v-else class="avatar-initials">{{ getInitials(post.author) }}</span>
            </div>
                  <div class="author-details">
                    <div class="author-name">{{ post.author }}</div>
                    <div class="post-meta">{{ formatDate(post.createdAt) }} • {{ post.topic }}</div>
            </div>
          </div>
                <div class="topic-badge" :class="`topic-${post.topic.replace(/\s+/g, '-').toLowerCase()}`">
                  {{ post.topic }}
            </div>
      </div>

                             <div class="post-content">
                 <h3 class="post-title">{{ post.title }}</h3>
                 <p class="post-excerpt">{{ (post.content || '').slice(0, 160) }}...</p>
                 
                 <!-- Post Images -->
                 <div v-if="post.images && post.images.length > 0" class="post-images">
                   <div class="image-grid" :class="`grid-${Math.min(post.images.length, 3)}`">
                     <img 
                       v-for="(image, index) in post.images.slice(0, 3)" 
                       :key="image.id"
                       :src="image.dataUrl" 
                       :alt="image.name"
                       class="post-image"
                     />
                     <div v-if="post.images.length > 3" class="more-images">
                       +{{ post.images.length - 3 }} more
                     </div>
        </div>
            </div>
          </div>

                             <div class="post-footer">
                 <div class="engagement-stats">
                   <span class="stat">
                     <svg class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                       <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                     </svg>
                     {{ post.replyCount || 0 }} replies
                   </span>
                   <button 
                     class="stat like-btn" 
                     :class="{ liked: isLiked(post) }"
                     @click="handleLike($event, post.id)"
                   >
                     <svg class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                       <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                     </svg>
                     {{ post.likes || 0 }} likes
                   </button>
                 </div>
                 <button class="read-more-btn">Read More →</button>
        </div>
            </article>
    </div>

          <!-- Empty State -->
          <div v-else class="empty-state animate-fade-up" :class="{ 'animate-in': isLoaded }" style="animation-delay: 1.2s">
            <div class="empty-icon">💬</div>
            <h3 class="empty-title">No posts found</h3>
            <p class="empty-message">
              {{ searchQuery ? 'Try adjusting your search terms' : 'Be the first to start a conversation in this category!' }}
            </p>
            <button v-if="!searchQuery" class="btn btn-outline" @click="newPost">Create First Post</button>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Variables */
:root {
  --primary-color: #22c55e;
  --primary-dark: #16a34a;
  --secondary-color: #f1f5f9;
  --text-primary: #0f172a;
  --text-secondary: #64748b;
  --border-color: #e2e8f0;
  --card-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --radius: 12px;
}

/* Base Styles */
.page {
  background: #f8fafc;
  min-height: 100vh;
  overflow-x: hidden;
}

/* Smooth scrolling */
html {
  scroll-behavior: smooth;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Hero Section */
.hero {
  background: url('/forumback.png') center/cover no-repeat;
  color: white;
  padding: 80px 0 100px 0;
  text-align: center;
  position: relative;
  border-radius: 0 0 32px 32px;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform-origin: top center;
  transition: transform 0.1s ease-out, opacity 0.1s ease-out;
  overflow: hidden;
}

.hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(3px);
  border-radius: 0 0 32px 32px;
}

.hero-content {
  max-width: 600px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.hero-title {
  font-size: 2.5rem;
  font-weight: 800;
  margin: 0 0 16px 0;
  letter-spacing: -0.025em;
  color: #1e3a8a;
}

.hero-subtitle {
  font-size: 1.125rem;
  opacity: 0.9;
  margin: 0 0 32px 0;
  line-height: 1.6;
  color: #f1f5f9;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  border-radius: 18px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
  cursor: pointer;
  border: none;
  font-size: 15px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.btn-primary {
  background: white;
  color: #15803d;
}

.btn-primary:hover {
  background: #f9fafb;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.btn-outline {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

.btn-outline:hover {
  background: white;
  color: var(--text-primary);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.icon {
  width: 16px;
  height: 16px;
}

/* Main Content */
.main-content {
  padding: 40px 20px;
}

.content-grid {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 32px;
}

/* Sidebar */
.sidebar {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.sidebar-card {
  background: white;
  border-radius: 20px;
  padding: 28px;
  box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
}

.sidebar-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 35px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -3px rgba(0, 0, 0, 0.1);
}

.sidebar-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 16px 0;
}

/* Categories */
.category-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.category-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.category-item:hover {
  background: var(--secondary-color);
  color: var(--text-primary);
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.15);
}

.category-item.active {
  background: rgba(34, 197, 94, 0.1);
  color: #15803d;
  box-shadow: 0 8px 20px rgba(34, 197, 94, 0.3);
  transform: translateX(4px);
  border-left: 4px solid #15803d;
}

.category-item.active .category-name {
  text-decoration: underline;
  font-weight: 600;
}

.category-name {
  font-weight: 500;
}

.category-count {
  background: rgba(0, 0, 0, 0.1);
  color: inherit;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.category-item.active .category-count {
  background: #15803d;
  color: white;
}

/* Search */
.search-box {
  position: relative;
  width: 100%;
  box-sizing: border-box;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: var(--text-secondary);
}

.search-input {
  width: 100%;
  max-width: 100%;
  padding: 14px 14px 14px 44px;
  border: 1px solid var(--border-color);
  border-radius: 16px;
  font-size: 14px;
  background: #f8fafc;
  transition: all 0.3s ease;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
  box-sizing: border-box;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-color);
  background: white;
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.1), inset 0 2px 4px rgba(0, 0, 0, 0.05);
  transform: translateY(-1px);
}

/* Stats */
.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--primary-color);
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
}

/* Feed */
.feed {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.feed-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.feed-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.post-count {
  color: var(--text-secondary);
  font-weight: 400;
  font-size: 1rem;
}

/* Posts */
.posts-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.post-card {
  background: white;
  border-radius: 24px;
  padding: 28px;
  box-shadow: 0 8px 20px -5px rgba(0, 0, 0, 0.08), 0 3px 6px -2px rgba(0, 0, 0, 0.05);
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.post-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--primary-color), #16a34a, #059669);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.post-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 10px 20px -5px rgba(0, 0, 0, 0.1);
  border-color: var(--primary-color);
}

.post-card:hover::before {
  opacity: 1;
}

.post-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--secondary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-initials {
  font-weight: 700;
  color: var(--primary-color);
  font-size: 16px;
}

.author-name {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 14px;
}

.post-meta {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.topic-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  background: var(--secondary-color);
  color: var(--primary-color);
}

/* Topic-specific badge colors */
.topic-nutrition { background: #fef3c7; color: #d97706; }
.topic-workout { background: #ddd6fe; color: #7c3aed; }
.topic-weight-loss { background: #fce7f3; color: #be185d; }
.topic-general { background: #e0f2fe; color: #0284c7; }
.topic-q-\&-a { background: #f3e8ff; color: #9333ea; }

.post-content {
  margin-bottom: 20px;
}

.post-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 12px 0;
  line-height: 1.4;
}

.post-excerpt {
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
}

/* Post Images */
.post-images {
  margin-top: 16px;
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
  max-height: 200px;
}

.image-grid.grid-2 {
  grid-template-columns: 1fr 1fr;
  max-height: 160px;
}

.image-grid.grid-3 {
  grid-template-columns: 2fr 1fr 1fr;
  max-height: 140px;
}

.post-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: all 0.2s ease;
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

.post-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
}

.engagement-stats {
  display: flex;
  gap: 20px;
}

.stat {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-secondary);
}

.stat-icon {
  width: 14px;
  height: 14px;
}

.like-btn {
  background: none;
  border: none;
  padding: 4px 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-secondary);
}

.like-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.like-btn.liked {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.like-btn.liked .stat-icon {
  fill: #ef4444;
}

.like-btn:hover .stat-icon {
  fill: #ef4444;
}

.read-more-btn {
  background: none;
  border: none;
  color: var(--primary-color);
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  padding: 4px 0;
  transition: all 0.2s ease;
}

.read-more-btn:hover {
  color: var(--primary-dark);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 80px 40px;
  background: white;
  border-radius: 24px;
  border: 1px solid var(--border-color);
  box-shadow: 0 8px 20px -5px rgba(0, 0, 0, 0.08), 0 3px 6px -2px rgba(0, 0, 0, 0.05);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 16px;
}

.empty-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}

.empty-message {
  color: var(--text-secondary);
  margin: 0 0 24px 0;
  line-height: 1.6;
}

/* Animation Styles */
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

@keyframes slideLeft {
  from {
    opacity: 0;
    transform: translateX(-50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideRight {
  from {
    opacity: 0;
    transform: translateX(50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes heroFade {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
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

.hero {
  opacity: 0;
  transform: scale(0.95);
  transition: all 1s cubic-bezier(0.16, 1, 0.3, 1);
}

.hero.animate-in {
  opacity: 1;
  transform: scale(1);
}

/* Stagger animation for posts */
.post-card {
  transition-delay: 0s;
}

.post-card.animate-in {
  transition-delay: inherit;
}

/* Enhanced hover animations */
.post-card:hover {
  transform: translateY(-4px) scale(1.02);
}

.sidebar-card:hover {
  transform: translateY(-2px) scale(1.01);
}

/* Responsive Design */
@media (max-width: 768px) {
  .content-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  
  .sidebar {
    order: 2;
  }
  
  .feed {
    order: 1;
  }
  
  .hero-title {
    font-size: 2rem;
  }
  
  .main-content {
    padding: 24px 20px;
  }
  
  .post-card {
    padding: 20px;
  }
  
  .post-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .topic-badge {
    align-self: flex-start;
  }
}

@media (max-width: 480px) {
  .hero {
    padding: 40px 0;
  }
  
  .container {
    padding: 0 16px;
  }
  
  .sidebar-card {
    padding: 16px;
  }
  
  .post-card {
    padding: 16px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}
</style>