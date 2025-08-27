<script setup>
import SiteHeader from '@/components/SiteHeader.vue'
import { useRoute, useRouter } from 'vue-router'
import { computed, ref, onMounted, nextTick } from 'vue'
import { useLessonsStore } from '@/lib/stores/lessons'

const route = useRoute()
const router = useRouter()
const lessons = useLessonsStore()

lessons.seedIfEmpty()

const id = computed(() => route.params.id)
const lesson = computed(() => lessons.lessons.find(l => l.id === id.value) || { 
  title: 'Course Not Found', 
  minutes: 0, 
  topic: 'Unknown',
  difficulty: 'Beginner'
})

// 学习状态
const currentSection = ref(0)
const isLoaded = ref(false)
const showContent = ref(false)
const isCompleted = ref(false)

// 课程内容结构
const courseContent = computed(() => {
  const content = {
    'Fundamentals of Nutrition': [
      {
        title: 'Introduction to Nutrition',
        type: 'video',
        duration: '5 min',
        content: 'Learn about the fundamental principles of nutrition and why they matter for your health.'
      },
      {
        title: 'Essential Nutrients',
        type: 'text',
        duration: '8 min',
        content: 'Discover the six essential nutrients your body needs: carbohydrates, proteins, fats, vitamins, minerals, and water.'
      },
      {
        title: 'Reading Nutrition Labels',
        type: 'interactive',
        duration: '5 min',
        content: 'Practice reading and understanding nutrition labels to make informed food choices.'
      }
    ],
    'Understanding Macronutrients': [
      {
        title: 'What are Macronutrients?',
        type: 'video',
        duration: '6 min',
        content: 'Understand the three main macronutrients and their roles in your body.'
      },
      {
        title: 'Proteins: Building Blocks',
        type: 'text',
        duration: '7 min',
        content: 'Learn about proteins, their importance, and how to include them in your diet.'
      },
      {
        title: 'Carbohydrates: Energy Source',
        type: 'text',
        duration: '7 min',
        content: 'Explore different types of carbohydrates and their effects on your body.'
      }
    ],
    'Beginner Strength Routine': [
      {
        title: 'Safety First',
        type: 'video',
        duration: '4 min',
        content: 'Learn essential safety guidelines before starting any strength training program.'
      },
      {
        title: 'Basic Exercises',
        type: 'video',
        duration: '10 min',
        content: 'Master fundamental strength exercises: squats, push-ups, and planks.'
      },
      {
        title: 'Creating Your Routine',
        type: 'interactive',
        duration: '8 min',
        content: 'Design a personalized strength training routine that fits your schedule and goals.'
      }
    ],
    'Basic Cardio Workout': [
      {
        title: 'Cardio Basics',
        type: 'video',
        duration: '5 min',
        content: 'Understand what cardiovascular exercise is and why it\'s important for your health.'
      },
      {
        title: 'Low-Impact Options',
        type: 'video',
        duration: '12 min',
        content: 'Learn low-impact cardio exercises perfect for beginners: walking, cycling, and swimming.'
      },
      {
        title: 'Building Endurance',
        type: 'text',
        duration: '8 min',
        content: 'Discover strategies to gradually build your cardiovascular endurance safely.'
      }
    ]
  }
  
  return content[lesson.value.title] || [
    {
      title: 'Course Introduction',
      type: 'video',
      duration: '5 min',
      content: 'Welcome to this comprehensive course designed to help you achieve your health and fitness goals.'
    },
    {
      title: 'Core Concepts',
      type: 'text',
      duration: '10 min',
      content: 'Learn the fundamental concepts and principles that will guide your learning journey.'
    },
    {
      title: 'Practical Application',
      type: 'interactive',
      duration: '10 min',
      content: 'Apply what you\'ve learned through interactive exercises and real-world scenarios.'
    }
  ]
})

// 当前章节
const currentChapter = computed(() => courseContent.value[currentSection.value])

// 进度百分比
const progressPercentage = computed(() => {
  return Math.round(((currentSection.value + 1) / courseContent.value.length) * 100)
})

// 导航函数
function nextSection() {
  if (currentSection.value < courseContent.value.length - 1) {
    currentSection.value++
    updateProgress()
  } else {
    completeCourse()
  }
}

function prevSection() {
  if (currentSection.value > 0) {
    currentSection.value--
  }
}

function goToSection(index) {
  currentSection.value = index
  updateProgress()
}

// 更新进度
function updateProgress() {
  const progress = Math.max(lessons.progress[id.value] || 0, progressPercentage.value)
  lessons.setProgress(id.value, progress)
}

// 完成课程
function completeCourse() {
  lessons.setProgress(id.value, 100)
  isCompleted.value = true
}

// 返回课程详情
function backToDetail() {
  router.push({ name: 'lesson-detail', params: { id: id.value } })
}

// 获取章节图标
function getChapterIcon(type) {
  const icons = {
    video: '🎥',
    text: '📖',
    interactive: '🎯'
  }
  return icons[type] || '📝'
}

onMounted(async () => {
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
  <div class="page">
    <SiteHeader />
    
    <div class="learning-container">
      <!-- Header -->
      <div class="learning-header animate-fade-up" :class="{ 'animate-in': showContent }" style="animation-delay: 0.2s">
        <div class="header-content">
          <button class="back-btn" @click="backToDetail">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Course
          </button>
          
          <div class="course-info">
            <h1 class="course-title">{{ lesson.title }}</h1>
            <div class="course-meta">
              <span class="meta-item">{{ lesson.topic }}</span>
              <span class="meta-item">{{ lesson.difficulty }}</span>
              <span class="meta-item">{{ lesson.minutes }}m</span>
            </div>
          </div>
          
          <div class="progress-info">
            <div class="progress-text">{{ progressPercentage }}% Complete</div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="learning-content animate-fade-up" :class="{ 'animate-in': showContent }" style="animation-delay: 0.3s">
        <div class="content-layout">
          <!-- Sidebar -->
          <aside class="learning-sidebar">
            <div class="sidebar-header">
              <h3>Course Content</h3>
              <span class="chapter-count">{{ currentSection + 1 }} of {{ courseContent.length }}</span>
            </div>
            
            <div class="chapters-list">
              <div 
                v-for="(chapter, index) in courseContent" 
                :key="index"
                class="chapter-item"
                :class="{ 
                  'active': index === currentSection,
                  'completed': index < currentSection,
                  'upcoming': index > currentSection
                }"
                @click="goToSection(index)"
              >
                <div class="chapter-icon">{{ getChapterIcon(chapter.type) }}</div>
                <div class="chapter-info">
                  <h4 class="chapter-title">{{ chapter.title }}</h4>
                  <div class="chapter-meta">
                    <span class="chapter-type">{{ chapter.type }}</span>
                    <span class="chapter-duration">{{ chapter.duration }}</span>
                  </div>
                </div>
                <div class="chapter-status">
                  <div v-if="index < currentSection" class="status-completed">✓</div>
                  <div v-else-if="index === currentSection" class="status-current">●</div>
                  <div v-else class="status-upcoming">○</div>
                </div>
              </div>
            </div>
          </aside>

          <!-- Main Content Area -->
          <main class="main-content">
            <div v-if="!isCompleted" class="content-area">
              <div class="content-header">
                <div class="content-type-badge">{{ currentChapter.type }}</div>
                <h2 class="content-title">{{ currentChapter.title }}</h2>
                <div class="content-meta">
                  <span class="duration">{{ currentChapter.duration }}</span>
                  <span class="progress">Chapter {{ currentSection + 1 }} of {{ courseContent.length }}</span>
                </div>
              </div>
              
              <div class="content-body">
                <div class="content-placeholder">
                  <div class="placeholder-icon">{{ getChapterIcon(currentChapter.type) }}</div>
                  <h3>{{ currentChapter.title }}</h3>
                  <p>{{ currentChapter.content }}</p>
                  
                  <div v-if="currentChapter.type === 'video'" class="video-placeholder">
                    <div class="video-player">
                      <div class="play-button">▶</div>
                      <p>Video content would be displayed here</p>
                    </div>
                  </div>
                  
                  <div v-else-if="currentChapter.type === 'interactive'" class="interactive-placeholder">
                    <div class="interactive-content">
                      <h4>Interactive Exercise</h4>
                      <p>This would contain interactive elements like quizzes, drag-and-drop exercises, or simulations.</p>
                      <button class="btn-interactive">Start Exercise</button>
                    </div>
                  </div>
                  
                  <div v-else class="text-content">
                    <div class="text-body">
                      <p>{{ currentChapter.content }}</p>
                      <p>This is a comprehensive text-based lesson that covers all the important concepts and provides detailed explanations.</p>
                      <p>You can take your time to read through the material and absorb the information at your own pace.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="content-navigation">
                <button 
                  class="btn-nav btn-prev" 
                  @click="prevSection"
                  :disabled="currentSection === 0"
                >
                  <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M15 18l-6-6 6-6"/>
                  </svg>
                  Previous
                </button>
                
                <button 
                  class="btn-nav btn-next" 
                  @click="nextSection"
                >
                  {{ currentSection === courseContent.length - 1 ? 'Complete Course' : 'Next Chapter' }}
                  <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </button>
              </div>
            </div>
            
            <!-- Completion Screen -->
            <div v-else class="completion-screen">
              <div class="completion-content">
                <div class="completion-icon">🎉</div>
                <h2>Congratulations!</h2>
                <p>You've successfully completed <strong>{{ lesson.title }}</strong></p>
                
                <div class="completion-stats">
                  <div class="stat-item">
                    <div class="stat-value">{{ courseContent.length }}</div>
                    <div class="stat-label">Chapters Completed</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-value">{{ lesson.minutes }}</div>
                    <div class="stat-label">Minutes Spent</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-value">100%</div>
                    <div class="stat-label">Progress</div>
                  </div>
                </div>
                
                <div class="completion-actions">
                  <button class="btn-primary" @click="backToDetail">
                    Back to Course Details
                  </button>
                  <button class="btn-secondary" @click="router.push('/learn')">
                    Explore More Courses
                  </button>
                </div>
              </div>
            </div>
          </main>
        </div>
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

.learning-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
}

/* Header */
.learning-header {
  background: white;
  border-bottom: 1px solid var(--border-color);
  padding: 20px 0;
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
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
  white-space: nowrap;
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

.course-info {
  flex: 1;
  min-width: 0;
}

.course-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 8px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.course-meta {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.meta-item {
  font-size: 0.875rem;
  color: var(--text-secondary);
  background: var(--bg-light);
  padding: 4px 12px;
  border-radius: 12px;
}

.progress-info {
  text-align: right;
  min-width: 120px;
}

.progress-text {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: var(--bg-light);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  border-radius: 3px;
  transition: width 0.3s ease;
}

/* Main Content */
.learning-content {
  padding: 32px 0;
}

.content-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 32px;
  align-items: start;
}

/* Sidebar */
.learning-sidebar {
  background: white;
  border-radius: 20px;
  padding: 24px;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-color);
  position: sticky;
  top: 100px;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
}

.sidebar-header h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.chapter-count {
  font-size: 0.875rem;
  color: var(--text-secondary);
  background: var(--bg-light);
  padding: 4px 8px;
  border-radius: 8px;
}

.chapters-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chapter-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.chapter-item:hover {
  background: var(--bg-light);
}

.chapter-item.active {
  background: var(--primary-light);
  border-color: var(--primary-color);
}

.chapter-item.completed {
  background: #f0fdf4;
  border-color: var(--primary-color);
}

.chapter-icon {
  font-size: 1.5rem;
  width: 32px;
  text-align: center;
}

.chapter-info {
  flex: 1;
  min-width: 0;
}

.chapter-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 4px 0;
  line-height: 1.3;
}

.chapter-meta {
  display: flex;
  gap: 8px;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.chapter-type {
  text-transform: capitalize;
}

.chapter-status {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
}

.status-completed {
  color: var(--primary-color);
  font-weight: bold;
}

.status-current {
  color: var(--primary-color);
}

.status-upcoming {
  color: var(--text-muted);
}

/* Main Content Area */
.main-content {
  background: white;
  border-radius: 20px;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.content-area {
  padding: 32px;
}

.content-header {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--border-color);
}

.content-type-badge {
  display: inline-block;
  background: var(--primary-light);
  color: var(--primary-dark);
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 16px;
}

.content-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 16px 0;
}

.content-meta {
  display: flex;
  gap: 16px;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.content-body {
  margin-bottom: 32px;
}

.content-placeholder {
  text-align: center;
  padding: 48px 24px;
}

.placeholder-icon {
  font-size: 4rem;
  margin-bottom: 24px;
}

.content-placeholder h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 16px 0;
}

.content-placeholder p {
  font-size: 1.125rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0 0 32px 0;
}

.video-placeholder {
  background: var(--bg-light);
  border-radius: 16px;
  padding: 48px 24px;
  margin-top: 32px;
}

.video-player {
  position: relative;
  background: #000;
  border-radius: 12px;
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-bottom: 16px;
}

.play-button {
  font-size: 3rem;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.play-button:hover {
  transform: scale(1.1);
}

.interactive-placeholder {
  background: var(--bg-light);
  border-radius: 16px;
  padding: 32px;
  margin-top: 32px;
}

.interactive-content h4 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 16px 0;
}

.interactive-content p {
  color: var(--text-secondary);
  margin: 0 0 24px 0;
  line-height: 1.6;
}

.btn-interactive {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-interactive:hover {
  background: var(--primary-dark);
  transform: translateY(-1px);
}

.text-content {
  text-align: left;
  max-width: 800px;
  margin: 0 auto;
}

.text-body {
  font-size: 1.125rem;
  line-height: 1.8;
  color: var(--text-secondary);
}

.text-body p {
  margin: 0 0 24px 0;
}

/* Navigation */
.content-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 24px;
  border-top: 1px solid var(--border-color);
}

.btn-nav {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.btn-prev {
  background: var(--bg-light);
  color: var(--text-secondary);
}

.btn-prev:hover:not(:disabled) {
  background: var(--border-color);
  color: var(--text-primary);
}

.btn-prev:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-next {
  background: var(--primary-color);
  color: white;
}

.btn-next:hover {
  background: var(--primary-dark);
  transform: translateY(-1px);
}

.nav-icon {
  width: 16px;
  height: 16px;
}

/* Completion Screen */
.completion-screen {
  padding: 64px 32px;
  text-align: center;
}

.completion-content {
  max-width: 600px;
  margin: 0 auto;
}

.completion-icon {
  font-size: 4rem;
  margin-bottom: 24px;
}

.completion-screen h2 {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0 0 16px 0;
}

.completion-screen p {
  font-size: 1.25rem;
  color: var(--text-secondary);
  margin: 0 0 48px 0;
  line-height: 1.6;
}

.completion-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-bottom: 48px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 2rem;
  font-weight: 800;
  color: var(--primary-color);
  margin-bottom: 8px;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.completion-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 16px 32px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background: var(--primary-dark);
  transform: translateY(-1px);
}

.btn-secondary {
  background: white;
  color: var(--text-primary);
  border: 2px solid var(--border-color);
  padding: 16px 32px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
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

/* Responsive Design */
@media (max-width: 1024px) {
  .content-layout {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  
  .learning-sidebar {
    position: static;
    order: 2;
  }
  
  .main-content {
    order: 1;
  }
}

@media (max-width: 768px) {
  .learning-container {
    padding: 0 16px;
  }
  
  .header-content {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
  
  .course-title {
    font-size: 1.25rem;
  }
  
  .content-area {
    padding: 24px;
  }
  
  .content-title {
    font-size: 1.5rem;
  }
  
  .completion-stats {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .completion-actions {
    flex-direction: column;
  }
  
  .content-navigation {
    flex-direction: column;
    gap: 16px;
  }
  
  .btn-nav {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .content-area {
    padding: 16px;
  }
  
  .content-placeholder {
    padding: 32px 16px;
  }
  
  .completion-screen {
    padding: 32px 16px;
  }
  
  .completion-screen h2 {
    font-size: 2rem;
  }
}
</style>
