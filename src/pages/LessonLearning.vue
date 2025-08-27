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
  <div class="learning-page">
    <SiteHeader />
    
    <!-- Hero Section -->
    <div class="hero-section animate-fade-up" :class="{ 'animate-in': showContent }" style="animation-delay: 0.2s">
      <div class="hero-background">
        <div class="hero-pattern"></div>
      </div>
      
      <div class="container">
        <div class="hero-content">
          <button class="back-btn animate-slide-left" :class="{ 'animate-in': showContent }" style="animation-delay: 0.3s" @click="backToDetail">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Course
          </button>
          
          <div class="course-hero animate-fade-up" :class="{ 'animate-in': showContent }" style="animation-delay: 0.4s">
            <div class="course-badge animate-scale-in" :class="{ 'animate-in': showContent }" style="animation-delay: 0.5s">
              {{ lesson.topic }}
            </div>
            <h1 class="course-title animate-fade-up" :class="{ 'animate-in': showContent }" style="animation-delay: 0.6s">
              {{ lesson.title }}
            </h1>
            <div class="course-meta animate-fade-up" :class="{ 'animate-in': showContent }" style="animation-delay: 0.7s">
              <div class="meta-item">
                <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                {{ lesson.difficulty }}
              </div>
              <div class="meta-item">
                <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12,6 12,12 16,14"/>
                </svg>
                {{ lesson.minutes }} minutes
              </div>
            </div>
          </div>
          
          <div class="progress-section animate-slide-up" :class="{ 'animate-in': showContent }" style="animation-delay: 0.8s">
            <div class="progress-header">
              <span class="progress-label">Course Progress</span>
              <span class="progress-percentage">{{ progressPercentage }}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Learning Interface -->
    <div class="learning-interface animate-fade-up" :class="{ 'animate-in': showContent }" style="animation-delay: 0.9s">
      <div class="container">
        <div class="interface-layout">
          <!-- Course Navigation -->
          <aside class="course-nav animate-slide-left" :class="{ 'animate-in': showContent }" style="animation-delay: 1.0s">
            <div class="nav-header">
              <h3>Course Content</h3>
              <div class="nav-progress">
                <span class="current-chapter">{{ currentSection + 1 }}</span>
                <span class="total-chapters">/ {{ courseContent.length }}</span>
              </div>
            </div>
            
            <div class="chapters-nav">
              <div 
                v-for="(chapter, index) in courseContent" 
                :key="index"
                class="chapter-nav-item"
                :class="{ 
                  'active': index === currentSection,
                  'completed': index < currentSection,
                  'upcoming': index > currentSection
                }"
                @click="goToSection(index)"
              >
                <div class="chapter-nav-icon">
                  <div class="icon-wrapper">
                    {{ getChapterIcon(chapter.type) }}
                  </div>
                  <div v-if="index < currentSection" class="completed-check">✓</div>
                </div>
                <div class="chapter-nav-content">
                  <h4 class="chapter-nav-title">{{ chapter.title }}</h4>
                  <div class="chapter-nav-meta">
                    <span class="chapter-type">{{ chapter.type }}</span>
                    <span class="chapter-duration">{{ chapter.duration }}</span>
                  </div>
                </div>
                <div class="chapter-nav-status">
                  <div v-if="index === currentSection" class="status-indicator active"></div>
                  <div v-else-if="index < currentSection" class="status-indicator completed"></div>
                  <div v-else class="status-indicator upcoming"></div>
                </div>
              </div>
            </div>
          </aside>

          <!-- Learning Content -->
          <main class="learning-main animate-slide-right" :class="{ 'animate-in': showContent }" style="animation-delay: 1.1s">
            <div v-if="!isCompleted" class="content-container">
              <!-- Content Header -->
              <div class="content-header animate-fade-up" :class="{ 'animate-in': showContent }" style="animation-delay: 1.2s">
                <div class="content-type-indicator">
                  <div class="type-icon">{{ getChapterIcon(currentChapter.type) }}</div>
                  <span class="type-label">{{ currentChapter.type }}</span>
                </div>
                <h2 class="content-title">{{ currentChapter.title }}</h2>
                <div class="content-info">
                  <div class="info-item">
                    <svg class="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12,6 12,12 16,14"/>
                    </svg>
                    {{ currentChapter.duration }}
                  </div>
                  <div class="info-item">
                    <svg class="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M9 12l2 2 4-4"/>
                    </svg>
                    Chapter {{ currentSection + 1 }} of {{ courseContent.length }}
                  </div>
                </div>
              </div>
              
              <!-- Content Body -->
              <div class="content-body animate-fade-up" :class="{ 'animate-in': showContent }" style="animation-delay: 1.3s">
                <div class="content-wrapper">
                  <!-- Video Content -->
                  <div v-if="currentChapter.type === 'video'" class="video-content">
                    <div class="video-container">
                      <div class="video-placeholder">
                        <div class="play-overlay">
                          <button class="play-btn">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          </button>
                          <p class="play-text">Click to start video</p>
                        </div>
                      </div>
                    </div>
                    <div class="video-info">
                      <h3>{{ currentChapter.title }}</h3>
                      <p>{{ currentChapter.content }}</p>
                    </div>
                  </div>
                  
                  <!-- Interactive Content -->
                  <div v-else-if="currentChapter.type === 'interactive'" class="interactive-content">
                    <div class="interactive-header">
                      <div class="interactive-icon">🎯</div>
                      <h3>Interactive Exercise</h3>
                    </div>
                    <div class="interactive-body">
                      <p>{{ currentChapter.content }}</p>
                      <div class="exercise-placeholder">
                        <div class="exercise-icon">📝</div>
                        <h4>Ready to Practice?</h4>
                        <p>This interactive exercise will help you apply what you've learned through hands-on practice.</p>
                        <button class="start-exercise-btn">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                          Start Exercise
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Text Content -->
                  <div v-else class="text-content">
                    <div class="text-header">
                      <div class="text-icon">📖</div>
                      <h3>Reading Material</h3>
                    </div>
                    <div class="text-body">
                      <div class="text-content-wrapper">
                        <p class="lead">{{ currentChapter.content }}</p>
                        <div class="text-sections">
                          <div class="text-section">
                            <h4>Key Concepts</h4>
                            <p>This comprehensive lesson covers all the essential concepts you need to understand. Take your time to read through the material and absorb the information at your own pace.</p>
                          </div>
                          <div class="text-section">
                            <h4>Learning Objectives</h4>
                            <ul>
                              <li>Understand the fundamental principles</li>
                              <li>Apply concepts to real-world scenarios</li>
                              <li>Develop practical skills and knowledge</li>
                            </ul>
                          </div>
                          <div class="text-section">
                            <h4>Summary</h4>
                            <p>By the end of this lesson, you'll have a solid understanding of the core concepts and be ready to move on to the next chapter.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Navigation Controls -->
              <div class="content-navigation animate-fade-up" :class="{ 'animate-in': showContent }" style="animation-delay: 1.4s">
                <button 
                  class="nav-btn prev-btn" 
                  @click="prevSection"
                  :disabled="currentSection === 0"
                >
                  <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M15 18l-6-6 6-6"/>
                  </svg>
                  Previous
                </button>
                
                <div class="nav-progress-dots">
                  <div 
                    v-for="(chapter, index) in courseContent" 
                    :key="index"
                    class="progress-dot"
                    :class="{ 
                      'active': index === currentSection,
                      'completed': index < currentSection
                    }"
                    @click="goToSection(index)"
                  ></div>
                </div>
                
                <button 
                  class="nav-btn next-btn" 
                  @click="nextSection"
                >
                  {{ currentSection === courseContent.length - 1 ? 'Complete Course' : 'Next Chapter' }}
                  <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </button>
              </div>
            </div>
            
            <!-- Completion Screen -->
            <div v-else class="completion-screen animate-scale-in" :class="{ 'animate-in': showContent }" style="animation-delay: 1.0s">
              <div class="completion-content">
                <div class="completion-animation">
                  <div class="celebration-icon">🎉</div>
                  <div class="success-checkmark">✓</div>
                </div>
                <h2 class="completion-title">Congratulations!</h2>
                <p class="completion-message">You've successfully completed <strong>{{ lesson.title }}</strong></p>
                
                <div class="achievement-stats">
                  <div class="achievement-item">
                    <div class="achievement-icon">📚</div>
                    <div class="achievement-value">{{ courseContent.length }}</div>
                    <div class="achievement-label">Chapters</div>
                  </div>
                  <div class="achievement-item">
                    <div class="achievement-icon">⏱️</div>
                    <div class="achievement-value">{{ lesson.minutes }}</div>
                    <div class="achievement-label">Minutes</div>
                  </div>
                  <div class="achievement-item">
                    <div class="achievement-icon">🏆</div>
                    <div class="achievement-value">100%</div>
                    <div class="achievement-label">Complete</div>
                  </div>
                </div>
                
                <div class="completion-actions">
                  <button class="action-btn primary" @click="backToDetail">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                    Back to Course
                  </button>
                  <button class="action-btn secondary" @click="router.push('/learn')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                    </svg>
                    Explore More
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
/* Modern Learning Interface Design */
:root {
  --primary-color: #10b981;
  --primary-dark: #059669;
  --primary-light: #d1fae5;
  --accent-color: #f59e0b;
  --accent-light: #fef3c7;
  --text-primary: #1f2937;
  --text-secondary: #6b7280;
  --text-muted: #9ca3af;
  --border-color: #e5e7eb;
  --bg-light: #f9fafb;
  --bg-white: #ffffff;
  --bg-gradient: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f0fdf4 100%);
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  --shadow-glow: 0 0 20px rgba(16, 185, 129, 0.15);
}

.learning-page {
  background: var(--bg-gradient);
  min-height: 100vh;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
}

/* Hero Section */
.hero-section {
  position: relative;
  padding: 60px 0 80px;
  overflow: hidden;
}

.hero-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, 
    rgba(16, 185, 129, 0.05) 0%, 
    rgba(5, 150, 105, 0.08) 50%, 
    rgba(16, 185, 129, 0.05) 100%);
}

.hero-pattern {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    radial-gradient(circle at 20% 20%, rgba(16, 185, 129, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(5, 150, 105, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 40% 60%, rgba(16, 185, 129, 0.05) 0%, transparent 50%);
}

.hero-content {
  position: relative;
  z-index: 2;
  text-align: center;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 10px 20px;
  border-radius: 25px;
  backdrop-filter: blur(10px);
  box-shadow: var(--shadow-md);
  margin-bottom: 40px;
}

.back-btn:hover {
  color: var(--primary-color);
  background: rgba(255, 255, 255, 1);
  border-color: var(--primary-color);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.back-btn svg {
  width: 16px;
  height: 16px;
}

.course-hero {
  margin-bottom: 40px;
}

.course-badge {
  display: inline-block;
  background: var(--primary-light);
  color: var(--primary-dark);
  padding: 8px 20px;
  border-radius: 25px;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 20px;
}

.course-title {
  font-size: 3rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0 0 24px 0;
  line-height: 1.2;
}

.course-meta {
  display: flex;
  justify-content: center;
  gap: 24px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1rem;
  color: var(--text-secondary);
  background: rgba(255, 255, 255, 0.8);
  padding: 12px 20px;
  border-radius: 20px;
  backdrop-filter: blur(10px);
  box-shadow: var(--shadow-sm);
}

.meta-icon {
  width: 18px;
  height: 18px;
  color: var(--primary-color);
}

.progress-section {
  max-width: 500px;
  margin: 0 auto;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.progress-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
}

.progress-percentage {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--primary-color);
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 4px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  border-radius: 4px;
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

/* Learning Interface */
.learning-interface {
  padding: 40px 0 80px;
}

.interface-layout {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 40px;
  align-items: start;
}

/* Course Navigation */
.course-nav {
  background: white;
  border-radius: 24px;
  padding: 32px;
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border-color);
  position: sticky;
  top: 120px;
}

.nav-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 2px solid var(--bg-light);
}

.nav-header h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.nav-progress {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.current-chapter {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--primary-color);
}

.total-chapters {
  font-size: 1rem;
  color: var(--text-secondary);
}

.chapters-nav {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chapter-nav-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  position: relative;
  overflow: hidden;
}

.chapter-nav-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.1), transparent);
  transition: left 0.5s ease;
}

.chapter-nav-item:hover::before {
  left: 100%;
}

.chapter-nav-item:hover {
  background: var(--bg-light);
  transform: translateX(4px);
}

.chapter-nav-item.active {
  background: var(--primary-light);
  border-color: var(--primary-color);
  box-shadow: var(--shadow-glow);
}

.chapter-nav-item.completed {
  background: #f0fdf4;
  border-color: var(--primary-color);
}

.chapter-nav-icon {
  position: relative;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-wrapper {
  font-size: 1.5rem;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-light);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.chapter-nav-item.active .icon-wrapper {
  background: var(--primary-color);
  color: white;
  transform: scale(1.1);
}

.completed-check {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 20px;
  height: 20px;
  background: var(--primary-color);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  border: 2px solid white;
}

.chapter-nav-content {
  flex: 1;
  min-width: 0;
}

.chapter-nav-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px 0;
  line-height: 1.4;
}

.chapter-nav-meta {
  display: flex;
  gap: 12px;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.chapter-type {
  text-transform: capitalize;
  font-weight: 500;
}

.chapter-nav-status {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.status-indicator.active {
  background: var(--primary-color);
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.2);
}

.status-indicator.completed {
  background: var(--primary-color);
}

.status-indicator.upcoming {
  background: var(--text-muted);
  opacity: 0.5;
}

/* Learning Main Content */
.learning-main {
  background: white;
  border-radius: 24px;
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.content-container {
  padding: 40px;
}

.content-header {
  margin-bottom: 40px;
  padding-bottom: 32px;
  border-bottom: 2px solid var(--bg-light);
}

.content-type-indicator {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  background: var(--primary-light);
  color: var(--primary-dark);
  padding: 12px 20px;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 24px;
}

.type-icon {
  font-size: 1.25rem;
}

.content-title {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0 0 24px 0;
  line-height: 1.2;
}

.content-info {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
  font-size: 1rem;
  font-weight: 500;
}

.info-icon {
  width: 18px;
  height: 18px;
  color: var(--primary-color);
}

.content-body {
  margin-bottom: 40px;
}

.content-wrapper {
  max-width: 900px;
}

/* Video Content */
.video-content {
  text-align: center;
}

.video-container {
  margin-bottom: 32px;
}

.video-placeholder {
  position: relative;
  background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
  border-radius: 20px;
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-shadow: var(--shadow-xl);
}

.play-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: white;
}

.play-btn {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.2);
  border: 3px solid white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.play-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.play-btn svg {
  width: 32px;
  height: 32px;
  margin-left: 4px;
}

.play-text {
  font-size: 1.125rem;
  font-weight: 500;
  margin: 0;
}

.video-info {
  text-align: left;
}

.video-info h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 16px 0;
}

.video-info p {
  font-size: 1.125rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
}

/* Interactive Content */
.interactive-content {
  text-align: center;
}

.interactive-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 32px;
}

.interactive-icon {
  font-size: 2rem;
}

.interactive-header h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.interactive-body p {
  font-size: 1.125rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0 0 32px 0;
}

.exercise-placeholder {
  background: var(--bg-light);
  border-radius: 20px;
  padding: 48px 32px;
  border: 2px dashed var(--border-color);
}

.exercise-icon {
  font-size: 3rem;
  margin-bottom: 24px;
}

.exercise-placeholder h4 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 16px 0;
}

.exercise-placeholder p {
  font-size: 1rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0 0 32px 0;
}

.start-exercise-btn {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  background: #10b981 !important;
  color: white !important;
  border: none;
  padding: 16px 32px;
  border-radius: 16px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-md);
}

.start-exercise-btn:hover {
  background: #059669 !important;
  color: white !important;
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.start-exercise-btn svg {
  width: 20px;
  height: 20px;
}

/* Text Content */
.text-content {
  text-align: left;
}

.text-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
}

.text-icon {
  font-size: 2rem;
}

.text-header h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.text-content-wrapper {
  max-width: 800px;
}

.lead {
  font-size: 1.25rem;
  font-weight: 500;
  color: var(--text-primary);
  line-height: 1.6;
  margin: 0 0 32px 0;
}

.text-sections {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.text-section h4 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 16px 0;
}

.text-section p {
  font-size: 1rem;
  color: var(--text-secondary);
  line-height: 1.7;
  margin: 0 0 16px 0;
}

.text-section ul {
  margin: 0;
  padding-left: 24px;
}

.text-section li {
  font-size: 1rem;
  color: var(--text-secondary);
  line-height: 1.7;
  margin-bottom: 8px;
}

/* Content Navigation */
.content-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 32px;
  border-top: 2px solid var(--bg-light);
}

.nav-btn {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 16px 32px;
  border-radius: 16px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  box-shadow: var(--shadow-md);
}

.prev-btn {
  background: var(--bg-light);
  color: var(--text-secondary);
  border: 2px solid var(--border-color);
}

.prev-btn:hover:not(:disabled) {
  background: white;
  color: var(--text-primary);
  border-color: var(--primary-color);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.prev-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.next-btn {
  background: #10b981 !important;
  color: white !important;
  border: 2px solid #10b981 !important;
}

.next-btn:hover {
  background: #059669 !important;
  color: white !important;
  border-color: #059669 !important;
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.btn-icon {
  width: 20px;
  height: 20px;
}

.nav-progress-dots {
  display: flex;
  gap: 8px;
  align-items: center;
}

.progress-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--text-muted);
  cursor: pointer;
  transition: all 0.3s ease;
}

.progress-dot.active {
  background: var(--primary-color);
  transform: scale(1.2);
}

.progress-dot.completed {
  background: var(--primary-color);
}

/* Completion Screen */
.completion-screen {
  padding: 80px 40px;
  text-align: center;
}

.completion-content {
  max-width: 700px;
  margin: 0 auto;
}

.completion-animation {
  position: relative;
  margin-bottom: 40px;
}

.celebration-icon {
  font-size: 5rem;
  margin-bottom: 20px;
  animation: bounce 2s infinite;
}

.success-checkmark {
  position: absolute;
  top: 20px;
  right: 50%;
  transform: translateX(50%);
  width: 60px;
  height: 60px;
  background: var(--primary-color);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: bold;
  border: 4px solid white;
  box-shadow: var(--shadow-lg);
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

.completion-title {
  font-size: 3rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0 0 20px 0;
  line-height: 1.2;
}

.completion-message {
  font-size: 1.25rem;
  color: var(--text-secondary);
  margin: 0 0 60px 0;
  line-height: 1.6;
}

.achievement-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px;
  margin-bottom: 60px;
}

.achievement-item {
  text-align: center;
  padding: 32px 24px;
  background: var(--bg-light);
  border-radius: 20px;
  border: 2px solid var(--border-color);
  transition: all 0.3s ease;
}

.achievement-item:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--primary-color);
}

.achievement-icon {
  font-size: 2.5rem;
  margin-bottom: 16px;
}

.achievement-value {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--primary-color);
  margin-bottom: 8px;
}

.achievement-label {
  font-size: 1rem;
  color: var(--text-secondary);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.completion-actions {
  display: flex;
  gap: 20px;
  justify-content: center;
  flex-wrap: wrap;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 18px 36px;
  border-radius: 16px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  box-shadow: var(--shadow-md);
}

.action-btn.primary {
  background: #10b981 !important;
  color: white !important;
  border: 2px solid #10b981 !important;
}

.action-btn.primary:hover {
  background: #059669 !important;
  color: white !important;
  border-color: #059669 !important;
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.action-btn.secondary {
  background: white;
  color: var(--text-primary);
  border: 2px solid var(--border-color);
}

.action-btn.secondary:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.action-btn svg {
  width: 20px;
  height: 20px;
}

/* Animation Classes */
.animate-fade-up {
  opacity: 0 !important;
  transform: translateY(30px) !important;
  transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1) !important;
}

.animate-fade-up.animate-in {
  opacity: 1 !important;
  transform: translateY(0) !important;
}

.animate-slide-left {
  opacity: 0 !important;
  transform: translateX(-30px) !important;
  transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1) !important;
}

.animate-slide-left.animate-in {
  opacity: 1 !important;
  transform: translateX(0) !important;
}

.animate-slide-right {
  opacity: 0 !important;
  transform: translateX(30px) !important;
  transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1) !important;
}

.animate-slide-right.animate-in {
  opacity: 1 !important;
  transform: translateX(0) !important;
}

.animate-slide-up {
  opacity: 0 !important;
  transform: translateY(20px) !important;
  transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1) !important;
}

.animate-slide-up.animate-in {
  opacity: 1 !important;
  transform: translateY(0) !important;
}

.animate-scale-in {
  opacity: 0 !important;
  transform: scale(0.9) !important;
  transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1) !important;
}

.animate-scale-in.animate-in {
  opacity: 1 !important;
  transform: scale(1) !important;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .interface-layout {
    grid-template-columns: 320px 1fr;
    gap: 32px;
  }
}

@media (max-width: 1024px) {
  .interface-layout {
    grid-template-columns: 1fr;
    gap: 32px;
  }
  
  .course-nav {
    position: static;
    order: 2;
  }
  
  .learning-main {
    order: 1;
  }
}

@media (max-width: 768px) {
  .container {
    padding: 0 16px;
  }
  
  .hero-section {
    padding: 40px 0 60px;
  }
  
  .course-title {
    font-size: 2rem;
  }
  
  .course-meta {
    gap: 16px;
  }
  
  .meta-item {
    padding: 10px 16px;
    font-size: 0.875rem;
  }
  
  .content-container {
    padding: 24px;
  }
  
  .content-title {
    font-size: 2rem;
  }
  
  .content-info {
    gap: 16px;
  }
  
  .video-placeholder {
    height: 250px;
  }
  
  .achievement-stats {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .completion-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .action-btn {
    width: 100%;
    max-width: 300px;
    justify-content: center;
  }
  
  .content-navigation {
    flex-direction: column;
    gap: 20px;
  }
  
  .nav-btn {
    width: 100%;
    justify-content: center;
  }
  
  .nav-progress-dots {
    order: -1;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .hero-section {
    padding: 30px 0 40px;
  }
  
  .course-title {
    font-size: 1.75rem;
  }
  
  .course-meta {
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }
  
  .content-container {
    padding: 20px;
  }
  
  .content-title {
    font-size: 1.75rem;
  }
  
  .video-placeholder {
    height: 200px;
  }
  
  .play-btn {
    width: 60px;
    height: 60px;
  }
  
  .play-btn svg {
    width: 24px;
    height: 24px;
  }
  
  .completion-screen {
    padding: 40px 20px;
  }
  
  .completion-title {
    font-size: 2rem;
  }
  
  .achievement-item {
    padding: 24px 16px;
  }
  
  .achievement-value {
    font-size: 2rem;
  }
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  .animate-fade-up,
  .animate-slide-left,
  .animate-slide-right,
  .animate-slide-up,
  .animate-scale-in {
    transition: opacity 0.3s ease !important;
    animation: none !important;
  }
  
  .celebration-icon {
    animation: none !important;
  }
  
  .chapter-nav-item::before {
    display: none;
  }
  
  .chapter-nav-item:hover,
  .nav-btn:hover,
  .action-btn:hover,
  .achievement-item:hover {
    transform: none !important;
  }
}
</style>
