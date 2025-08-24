<script setup>
import SiteHeader from '@/components/SiteHeader.vue'
import { useLessonsStore } from '@/lib/stores/lessons'
import { onMounted, ref, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'

const lessons = useLessonsStore()
const router = useRouter()
const isLoaded = ref(false)
const scrollY = ref(0)

// 过滤状态
const activeDifficulty = ref('')
const activeTopic = ref('')
const searchQuery = ref('')

onMounted(async () => {
  // 强制重新加载课程数据
  lessons.resetData()
  
  await nextTick()
  setTimeout(() => {
    isLoaded.value = true
  }, 100)
  
  // Add scroll listener for hero effect
  const handleScroll = () => {
    scrollY.value = window.scrollY
  }
  
  window.addEventListener('scroll', handleScroll, { passive: true })
})

// 过滤后的课程
const filteredLessons = computed(() => {
  let filtered = lessons.lessons

  if (activeDifficulty.value) {
    filtered = filtered.filter(lesson => lesson.difficulty === activeDifficulty.value)
  }

  if (activeTopic.value) {
    filtered = filtered.filter(lesson => lesson.topic === activeTopic.value)
  }

  // 搜索过滤
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(lesson => 
      lesson.title.toLowerCase().includes(query) || 
      lesson.topic.toLowerCase().includes(query) ||
      lesson.difficulty.toLowerCase().includes(query)
    )
  }

  return filtered
})

// 过滤器选项
const difficulties = ['Beginner', 'Intermediate', 'Advanced']
const topics = ['Nutrition', 'Workout']

// 过滤器处理函数
const setDifficultyFilter = (difficulty) => {
  activeDifficulty.value = activeDifficulty.value === difficulty ? '' : difficulty
}

const setTopicFilter = (topic) => {
  activeTopic.value = activeTopic.value === topic ? '' : topic
}

// 检查过滤器是否激活
const isDifficultyActive = (difficulty) => activeDifficulty.value === difficulty
const isTopicActive = (topic) => activeTopic.value === topic

// 获取课程统计信息
const courseStats = computed(() => {
  const stats = {
    total: lessons.lessons.length,
    nutrition: lessons.lessons.filter(l => l.topic === 'Nutrition').length,
    workout: lessons.lessons.filter(l => l.topic === 'Workout').length,
    beginner: lessons.lessons.filter(l => l.difficulty === 'Beginner').length,
    intermediate: lessons.lessons.filter(l => l.difficulty === 'Intermediate').length,
    advanced: lessons.lessons.filter(l => l.difficulty === 'Advanced').length
  }
  return stats
})

// 获取当前过滤器标题
const getFilterTitle = () => {
  if (activeDifficulty.value && activeTopic.value) {
    return `${activeDifficulty.value} ${activeTopic.value} Courses`
  } else if (activeDifficulty.value) {
    return `${activeDifficulty.value} Level Courses`
  } else if (activeTopic.value) {
    return `${activeTopic.value} Courses`
  }
  return 'All Courses'
}
</script>

<template>
  <div class="page">
    <SiteHeader />

         <!-- Hero Section -->
     <section class="hero" :class="{ 'animate-in': isLoaded }">
       <div class="container">
         <div class="hero-content">
           <h1 class="hero-title animate-fade-up" :class="{ 'animate-in': isLoaded }" style="animation-delay: 0.2s">Learn & Grow</h1>
           <p class="hero-subtitle animate-fade-up" :class="{ 'animate-in': isLoaded }" style="animation-delay: 0.4s">Master nutrition, fitness, and wellness with our comprehensive course library.</p>
           
           <!-- Search Bar -->
           <div class="search-container animate-fade-up" :class="{ 'animate-in': isLoaded }" style="animation-delay: 0.5s">
             <div class="search-box">
               <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                 <circle cx="11" cy="11" r="8"/>
                 <path d="m21 21-4.35-4.35"/>
               </svg>
               <input 
                 v-model="searchQuery"
                 type="text" 
                 placeholder="Search courses, topics, or difficulty levels..."
                 class="search-input"
               />
             </div>
           </div>
           
           <div class="hero-stats animate-fade-up" :class="{ 'animate-in': isLoaded }" style="animation-delay: 0.7s">
             <div class="stat-item">
               <div class="stat-number">{{ courseStats.total }}</div>
               <div class="stat-label">Total Courses</div>
             </div>
             <div class="stat-item">
               <div class="stat-number">{{ courseStats.nutrition }}</div>
               <div class="stat-label">Nutrition</div>
             </div>
             <div class="stat-item">
               <div class="stat-number">{{ courseStats.workout }}</div>
               <div class="stat-label">Workout</div>
             </div>
           </div>
        </div>
      </div>
    </section>

    <!-- Main Content -->
    <div class="container main-content">
      <div class="content-grid">
        <!-- Left Sidebar -->
        <aside class="sidebar animate-slide-left" :class="{ 'animate-in': isLoaded }" style="animation-delay: 0.8s">
          <!-- Difficulty Filter -->
          <div class="sidebar-card animate-fade-up" :class="{ 'animate-in': isLoaded }" style="animation-delay: 1.0s">
            <h3 class="sidebar-title">Difficulty Level</h3>
            <ul class="filter-list">
              <li 
                v-for="(difficulty, index) in difficulties" 
                :key="difficulty"
                :class="{ 
                  active: isDifficultyActive(difficulty),
                  'animate-in': isLoaded 
                }"
                @click="setDifficultyFilter(difficulty)"
                class="filter-item animate-fade-up"
                :style="`animation-delay: ${1.2 + index * 0.1}s`"
              >
                <div class="filter-icon">
                  <svg v-if="difficulty === 'Beginner'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                  <svg v-else-if="difficulty === 'Intermediate'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                  </svg>
                  <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                    <path d="M6 12h12"/>
                  </svg>
                </div>
                <span class="filter-name">{{ difficulty }}</span>
                <span class="filter-count">{{ courseStats[difficulty.toLowerCase()] }}</span>
              </li>
            </ul>
          </div>

          <!-- Topic Filter -->
          <div class="sidebar-card animate-fade-up" :class="{ 'animate-in': isLoaded }" style="animation-delay: 1.4s">
            <h3 class="sidebar-title">Course Topics</h3>
            <ul class="filter-list">
              <li 
                v-for="(topic, index) in topics" 
                :key="topic"
                :class="{ 
                  active: isTopicActive(topic),
                  'animate-in': isLoaded 
                }"
                @click="setTopicFilter(topic)"
                class="filter-item animate-fade-up"
                :style="`animation-delay: ${1.6 + index * 0.1}s`"
              >
                <div class="filter-icon">
                  <svg v-if="topic === 'Nutrition'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
                    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
                    <line x1="6" y1="1" x2="6" y2="4"/>
                    <line x1="10" y1="1" x2="10" y2="4"/>
                    <line x1="14" y1="1" x2="14" y2="4"/>
                  </svg>
                  <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M6 4h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/>
                    <path d="M12 8v8"/>
                    <path d="M8 12h8"/>
                  </svg>
                </div>
                <span class="filter-name">{{ topic }}</span>
                <span class="filter-count">{{ courseStats[topic.toLowerCase()] }}</span>
              </li>
            </ul>
          </div>

                    <!-- Course Stats -->
          <div class="sidebar-card animate-fade-up" :class="{ 'animate-in': isLoaded }" style="animation-delay: 1.8s">
            <h3 class="sidebar-title">
              <svg class="title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2z"/>
              </svg>
              Course Overview
            </h3>
            
            <!-- Total Courses -->
            <div class="overview-main">
              <div class="overview-total">
                <div class="total-number">{{ courseStats.total }}</div>
                <div class="total-label">Total Courses</div>
              </div>
            </div>
            
            <!-- Difficulty Breakdown -->
            <div class="difficulty-breakdown">
              <div class="difficulty-item beginner">
                <div class="difficulty-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                    <line x1="9" y1="9" x2="9.01" y2="9"/>
                    <line x1="15" y1="9" x2="15.01" y2="9"/>
                  </svg>
                </div>
                <div class="difficulty-info">
                  <div class="difficulty-number">{{ courseStats.beginner }}</div>
                  <div class="difficulty-label">Beginner</div>
                </div>
                <div class="difficulty-bar">
                  <div class="bar-fill beginner-fill" :style="{ width: (courseStats.beginner / courseStats.total * 100) + '%' }"></div>
                </div>
              </div>
              
              <div class="difficulty-item intermediate">
                <div class="difficulty-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                    <line x1="9" y1="9" x2="9.01" y2="9"/>
                    <line x1="15" y1="9" x2="15.01" y2="9"/>
                    <path d="M12 6v6"/>
                  </svg>
                </div>
                <div class="difficulty-info">
                  <div class="difficulty-number">{{ courseStats.intermediate }}</div>
                  <div class="difficulty-label">Intermediate</div>
                </div>
                <div class="difficulty-bar">
                  <div class="bar-fill intermediate-fill" :style="{ width: (courseStats.intermediate / courseStats.total * 100) + '%' }"></div>
                </div>
              </div>
              
              <div class="difficulty-item advanced">
                <div class="difficulty-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                    <line x1="9" y1="9" x2="9.01" y2="9"/>
                    <line x1="15" y1="9" x2="15.01" y2="9"/>
                    <path d="M12 6v6"/>
                    <path d="M12 18v-6"/>
                  </svg>
                </div>
                <div class="difficulty-info">
                  <div class="difficulty-number">{{ courseStats.advanced }}</div>
                  <div class="difficulty-label">Advanced</div>
                </div>
                <div class="difficulty-bar">
                  <div class="bar-fill advanced-fill" :style="{ width: (courseStats.advanced / courseStats.total * 100) + '%' }"></div>
                </div>
              </div>
            </div>
        </div>
      </aside>

        <!-- Main Feed -->
        <main class="feed animate-slide-right" :class="{ 'animate-in': isLoaded }" style="animation-delay: 0.8s">
          <div class="feed-header animate-fade-up" :class="{ 'animate-in': isLoaded }" style="animation-delay: 1.0s">
            <h2 class="feed-title">
              {{ getFilterTitle() }}
              <span class="course-count">({{ filteredLessons.length }})</span>
            </h2>
            <p class="feed-subtitle">Discover courses tailored to your skill level and interests</p>
          </div>

          <!-- Courses Grid -->
          <div v-if="filteredLessons.length > 0" class="courses-grid">
            <article 
              v-for="(course, index) in filteredLessons" 
              :key="course.id"
              class="course-card animate-fade-up"
              :class="{ 'animate-in': isLoaded }"
              :style="`animation-delay: ${1.2 + index * 0.1}s`"
            >
              <div class="course-thumb" :class="`difficulty-${course.difficulty.toLowerCase()}`">
                <div class="course-badge">{{ course.difficulty }}</div>
                <div class="course-duration">{{ course.minutes }}m</div>
              </div>
              <div class="course-body">
                <div class="course-topic">{{ course.topic }}</div>
                <h3 class="course-title">{{ course.title }}</h3>
                <div class="course-progress">
                  <div class="progress-bar">
                    <div class="progress-fill" :style="{ width: (lessons.progress[course.id] || 0) + '%' }"></div>
                  </div>
                  <span class="progress-text">{{ lessons.progress[course.id] || 0 }}% complete</span>
              </div>
                <button 
                  class="btn btn-primary course-btn"
                  @click="router.push({ name: 'lesson-detail', params: { id: course.id } })"
                >
                  <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                  Start Learning
                </button>
            </div>
          </article>
        </div>

          <!-- Empty State -->
          <div v-else class="empty-state animate-fade-up" :class="{ 'animate-in': isLoaded }" style="animation-delay: 1.2s">
            <div class="empty-icon">📚</div>
            <h3 class="empty-title">No courses found</h3>
            <p class="empty-message">Try adjusting your filters to discover more courses.</p>
        </div>
      </main>
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

/* Hero Section */
.hero {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  padding: 80px 0;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.hero-content {
  position: relative;
  z-index: 1;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 800;
  margin: 0 0 16px 0;
  background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1.25rem;
  margin: 0 0 32px 0;
  opacity: 0.9;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.6;
}

/* Search Container */
.search-container {
  margin-bottom: 40px;
}

.search-box {
  display: inline-flex;
  align-items: center;
  background: white;
  border-radius: 50px;
  padding: 16px 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 2px solid transparent;
  transition: all 0.3s ease;
  max-width: 500px;
  width: 100%;
}

.search-box:focus-within {
  border-color: rgba(255, 255, 255, 0.3);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.search-icon {
  width: 20px;
  height: 20px;
  color: #6b7280;
  margin-right: 12px;
  flex-shrink: 0;
}

.search-input {
  border: none;
  outline: none;
  background: transparent;
  font-size: 1rem;
  color: #1f2937;
  width: 100%;
  min-width: 300px;
}

.search-input::placeholder {
  color: #9ca3af;
}

.hero-stats {
  display: flex;
  justify-content: center;
  gap: 48px;
  margin-top: 40px;
}

.hero-stats .stat-item {
  text-align: center;
}

.hero-stats .stat-number {
  font-size: 2.5rem;
  font-weight: 800;
  display: block;
  margin-bottom: 8px;
}

.hero-stats .stat-label {
  font-size: 0.875rem;
  opacity: 0.8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Main Content */
.main-content {
  padding: 48px 0;
}

.content-grid {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 32px;
  align-items: start;
}

/* Sidebar */
.sidebar-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.sidebar-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 20px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  margin-bottom: 8px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid transparent;
}

.filter-item:hover {
  background: var(--bg-light);
  transform: translateX(4px);
}

.filter-item.active {
  background: #10b981 !important;
  color: #ffffff !important;
  box-shadow: var(--shadow-md);
}

.filter-item.active .filter-icon svg {
  stroke: #ffffff !important;
}

.filter-item.active .filter-name {
  color: #ffffff !important;
  font-weight: 600;
}

.filter-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.filter-icon svg {
  width: 18px;
  height: 18px;
  stroke: currentColor;
  fill: none;
}

.filter-name {
  flex: 1;
  font-weight: 500;
  color: inherit;
}

.filter-count {
  background: rgba(255, 255, 255, 0.2);
  color: inherit;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  min-width: 24px;
  text-align: center;
}

.filter-item.active .filter-count {
  background: rgba(255, 255, 255, 0.3);
  color: #ffffff;
}

/* Course Overview */
.title-icon {
  width: 20px;
  height: 20px;
  color: var(--primary-color);
}

.overview-main {
  margin-bottom: 24px;
  text-align: center;
}

.overview-total {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  color: white;
  padding: 24px;
  border-radius: 16px;
  box-shadow: var(--shadow-md);
}

.total-number {
  font-size: 2.5rem;
  font-weight: 800;
  color: #000000;
  margin-bottom: 8px;
  line-height: 1;
}

.total-label {
  font-size: 0.875rem;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.difficulty-breakdown {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.difficulty-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
}

.difficulty-item:hover {
  background: #f1f5f9;
  transform: translateX(4px);
}

.difficulty-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 8px;
  box-shadow: var(--shadow-sm);
  flex-shrink: 0;
}

.difficulty-icon svg {
  width: 20px;
  height: 20px;
  stroke: var(--text-secondary);
}

.difficulty-item.beginner .difficulty-icon svg {
  stroke: #10b981;
}

.difficulty-item.intermediate .difficulty-icon svg {
  stroke: #f59e0b;
}

.difficulty-item.advanced .difficulty-icon svg {
  stroke: #ef4444;
}

.difficulty-info {
  flex: 1;
  min-width: 0;
}

.difficulty-number {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 2px;
  line-height: 1;
}

.difficulty-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  line-height: 1.2;
}

.difficulty-bar {
  width: 60px;
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
  flex-shrink: 0;
}

.bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.beginner-fill {
  background: linear-gradient(90deg, #10b981 0%, #059669 100%);
}

.intermediate-fill {
  background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%);
}

.advanced-fill {
  background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%);
}

/* Feed */
.feed-header {
  margin-bottom: 32px;
}

.feed-title {
  font-size: 2rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.course-count {
  font-size: 1rem;
  color: var(--text-secondary);
  font-weight: 400;
}

.feed-subtitle {
  color: var(--text-secondary);
  margin: 0;
  font-size: 1.125rem;
}

/* Courses Grid */
.courses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

.course-card {
  background: #ffffff;
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.course-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: var(--shadow-xl);
}

.course-thumb {
  height: 160px;
  position: relative;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.course-thumb.difficulty-beginner {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.course-thumb.difficulty-intermediate {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.course-thumb.difficulty-advanced {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.course-badge {
  position: absolute;
  top: 16px;
  left: 16px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.course-duration {
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
}

.course-body {
  padding: 24px;
}

.course-topic {
  display: inline-block;
  background: var(--primary-light);
  color: var(--primary-dark);
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 16px;
}

.course-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 16px 0;
  line-height: 1.4;
}

.course-progress {
  margin-bottom: 24px;
}

.progress-bar {
  height: 8px;
  background: var(--bg-light);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.course-btn {
  width: 100%;
  background: var(--primary-color);
  color: #000000;
  border: none;
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.course-btn:hover {
  background: var(--primary-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.btn-icon {
  width: 18px;
  height: 18px;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 80px 40px;
  background: #ffffff;
  border-radius: 24px;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
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
  margin: 0;
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

/* Enhanced hover animations */
.course-card:hover {
  transform: translateY(-8px) scale(1.02);
}

.sidebar-card:hover {
  transform: translateY(-2px) scale(1.01);
}

/* Responsive Design */
@media (max-width: 1024px) {
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
  
  .courses-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
}

@media (max-width: 768px) {
  .hero {
    padding: 60px 0;
  }
  
  .hero-title {
    font-size: 2.5rem;
  }
  
  .hero-stats {
    flex-direction: column;
    gap: 24px;
  }
  
  .main-content {
    padding: 32px 0;
  }
  
  .container {
    padding: 0 20px;
  }
  
  .sidebar-card {
    padding: 20px;
  }
  
  .course-card {
    padding: 20px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 12px;
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
  
  .course-card {
    padding: 16px;
  }
  
  .courses-grid {
    grid-template-columns: 1fr;
  }
}
</style>


