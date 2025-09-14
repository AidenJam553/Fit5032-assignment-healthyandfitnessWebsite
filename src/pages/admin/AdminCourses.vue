<script setup>
import { ref, onMounted, computed } from 'vue'
import { logout } from '@/lib/auth'
import { useRouter } from 'vue-router'
import Button from '@/components/Button.vue'
import { courseService, courseRatingService } from '@/lib/firebaseService'

const router = useRouter()

// 课程管理状态
const courses = ref([])
const loading = ref(false)
const error = ref('')
const searchQuery = ref('')
const selectedCourses = ref([])
const showRatingModal = ref(false)
const selectedCourse = ref(null)
const courseRatings = ref([])

// 计算属性
const filteredCourses = computed(() => {
  if (!searchQuery.value) return courses.value
  
  const query = searchQuery.value.toLowerCase()
  return courses.value.filter(course => 
    course.title?.toLowerCase().includes(query) ||
    course.topic?.toLowerCase().includes(query) ||
    course.difficulty?.toLowerCase().includes(query)
  )
})

const totalCourses = computed(() => courses.value.length)
const totalRatings = computed(() => {
  return courses.value.reduce((sum, course) => sum + (course.ratingCount || 0), 0)
})
const averageRating = computed(() => {
  if (courses.value.length === 0) return 0
  const total = courses.value.reduce((sum, course) => sum + (course.averageRating || 0), 0)
  return (total / courses.value.length).toFixed(1)
})

// 加载所有课程
async function loadCourses() {
  loading.value = true
  error.value = ''
  
  try {
    const result = await courseService.getCourses()
    if (result.ok) {
      courses.value = result.courses || []
      
      // 为每个课程加载评分数据
      for (const course of courses.value) {
        await loadCourseRatings(course.id)
      }
    } else {
      error.value = 'Failed to load courses'
    }
  } catch (err) {
    console.error('Error loading courses:', err)
    error.value = 'Failed to load courses'
  } finally {
    loading.value = false
  }
}

// 加载课程评分数据
async function loadCourseRatings(courseId) {
  try {
    const ratings = await courseRatingService.getCourseRatings(courseId)
    const average = await courseRatingService.getAverageRating(courseId)
    
    // 更新课程数据
    const courseIndex = courses.value.findIndex(c => c.id === courseId)
    if (courseIndex !== -1) {
      courses.value[courseIndex].ratings = ratings
      courses.value[courseIndex].averageRating = average
      courses.value[courseIndex].ratingCount = ratings.length
    }
  } catch (err) {
    console.error('Error loading course ratings:', err)
  }
}

// 删除课程
async function deleteCourse(course) {
  if (!confirm(`Are you sure you want to delete course "${course.title}"?`)) {
    return
  }
  
  try {
    const result = await courseService.deleteCourse(course.id)
    if (result.ok) {
      courses.value = courses.value.filter(c => c.id !== course.id)
      showSuccessMessage(`Course "${course.title}" deleted successfully`)
    } else {
      showErrorMessage(`Failed to delete course: ${result.error}`)
    }
  } catch (err) {
    console.error('Error deleting course:', err)
    showErrorMessage('Failed to delete course')
  }
}

// 查看课程评分详情
async function viewCourseRatings(course) {
  selectedCourse.value = course
  try {
    const ratings = await courseRatingService.getCourseRatings(course.id)
    courseRatings.value = ratings
    showRatingModal.value = true
  } catch (err) {
    console.error('Error loading course ratings:', err)
    showErrorMessage('Failed to load course ratings')
  }
}

// 计算评分分布
function getRatingDistribution(ratings) {
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  ratings.forEach(rating => {
    if (rating.rating >= 1 && rating.rating <= 5) {
      distribution[rating.rating]++
    }
  })
  return distribution
}

// 获取课程评分分布
function getCourseRatingDistribution(course) {
  if (!course.ratings) return { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  return getRatingDistribution(course.ratings)
}

// 切换课程选择
function toggleCourseSelection(courseId) {
  const index = selectedCourses.value.indexOf(courseId)
  if (index > -1) {
    selectedCourses.value.splice(index, 1)
  } else {
    selectedCourses.value.push(courseId)
  }
}

// 全选/取消全选
function toggleSelectAll() {
  if (selectedCourses.value.length === filteredCourses.value.length) {
    selectedCourses.value = []
  } else {
    selectedCourses.value = filteredCourses.value.map(course => course.id)
  }
}

// 批量删除课程
async function deleteSelectedCourses() {
  if (selectedCourses.value.length === 0) return
  
  if (!confirm(`Are you sure you want to delete ${selectedCourses.value.length} selected courses?`)) {
    return
  }
  
  try {
    for (const courseId of selectedCourses.value) {
      await courseService.deleteCourse(courseId)
    }
    
    courses.value = courses.value.filter(course => !selectedCourses.value.includes(course.id))
    selectedCourses.value = []
    showSuccessMessage(`${selectedCourses.value.length} courses deleted successfully`)
  } catch (err) {
    console.error('Error deleting selected courses:', err)
    showErrorMessage('Failed to delete selected courses')
  }
}

// 格式化日期
function formatDate(dateString) {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// 获取难度标签样式
function getDifficultyClass(difficulty) {
  switch (difficulty?.toLowerCase()) {
    case 'beginner': return 'difficulty-beginner'
    case 'intermediate': return 'difficulty-intermediate'
    case 'advanced': return 'difficulty-advanced'
    default: return 'difficulty-unknown'
  }
}

// 显示成功消息
function showSuccessMessage(message) {
  alert(message)
}

// 显示错误消息
function showErrorMessage(message) {
  alert(message)
}

function handleLogout() {
  logout()
  router.push('/')
}

// 页面加载时获取课程数据
onMounted(() => {
  loadCourses()
})
</script>

<template>
  <div class="admin">
    <header class="admin__bar">
      <div class="container admin__bar-inner">
        <router-link to="/admin" class="logo">ADMIN MANAGE SYSTEM</router-link>
        <div class="admin__actions">
          <Button variant="secondary" size="medium" @click="handleLogout">Log out</Button>
          <div class="chip">
            <span class="chip__avatar">A</span>
            <span>Admin</span>
          </div>
        </div>
      </div>
    </header>

    <main class="container admin__content">
      <div class="page-header">
        <h1 class="page-title">Course Management</h1>
        <div class="page-actions">
          <Button variant="primary" size="medium" @click="loadCourses" :loading="loading">
            Refresh
          </Button>
        </div>
      </div>

      <!-- 统计卡片 -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📚</div>
          <div class="stat-content">
            <div class="stat-number">{{ totalCourses }}</div>
            <div class="stat-label">Total Courses</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⭐</div>
          <div class="stat-content">
            <div class="stat-number">{{ totalRatings }}</div>
            <div class="stat-label">Total Ratings</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-content">
            <div class="stat-number">{{ averageRating }}</div>
            <div class="stat-label">Average Rating</div>
          </div>
        </div>
      </div>

      <!-- 搜索和操作栏 -->
      <div class="toolbar">
        <div class="search-container">
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Search courses by title, topic, or difficulty..."
            class="search-input"
          />
        </div>
        <div class="toolbar-actions">
          <Button 
            v-if="selectedCourses.length > 0"
            variant="danger" 
            size="medium" 
            @click="deleteSelectedCourses"
          >
            Delete Selected ({{ selectedCourses.length }})
          </Button>
        </div>
      </div>

      <!-- 课程列表 -->
      <div class="courses-container">
        <div v-if="loading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>Loading courses...</p>
        </div>

        <div v-else-if="error" class="error-state">
          <p>{{ error }}</p>
          <Button variant="primary" size="medium" @click="loadCourses">Retry</Button>
        </div>

        <div v-else-if="filteredCourses.length === 0" class="empty-state">
          <p>No courses found</p>
        </div>

        <div v-else class="courses-grid">
          <div v-for="course in filteredCourses" :key="course.id" class="course-card">
            <div class="course-header">
              <div class="course-checkbox">
                <input 
                  type="checkbox" 
                  :checked="selectedCourses.includes(course.id)"
                  @change="toggleCourseSelection(course.id)"
                />
              </div>
              <div class="course-actions">
                <Button 
                  variant="secondary" 
                  size="small" 
                  @click="viewCourseRatings(course)"
                >
                  View Ratings
                </Button>
                <Button 
                  variant="danger" 
                  size="small" 
                  @click="deleteCourse(course)"
                >
                  Delete
                </Button>
              </div>
            </div>

            <div class="course-content">
              <h3 class="course-title">{{ course.title }}</h3>
              <p class="course-description">{{ course.description }}</p>
              
              <div class="course-meta">
                <span class="course-topic">{{ course.topic }}</span>
                <span class="course-difficulty" :class="getDifficultyClass(course.difficulty)">
                  {{ course.difficulty }}
                </span>
                <span class="course-duration">{{ course.minutes }} min</span>
              </div>

              <!-- 评分信息 -->
              <div class="course-ratings">
                <div class="rating-summary">
                  <div class="rating-stars">
                    <span v-for="i in 5" :key="i" class="star" :class="{ 'filled': i <= Math.round(course.averageRating || 0) }">
                      ★
                    </span>
                  </div>
                  <span class="rating-text">
                    {{ (course.averageRating || 0).toFixed(1) }} ({{ course.ratingCount || 0 }} ratings)
                  </span>
                </div>

                <!-- 评分分布图 -->
                <div class="rating-distribution">
                  <div v-for="star in [5, 4, 3, 2, 1]" :key="star" class="rating-bar">
                    <span class="star-label">{{ star }}★</span>
                    <div class="bar-container">
                      <div 
                        class="bar-fill" 
                        :style="{ 
                          width: course.ratingCount > 0 ? `${(getCourseRatingDistribution(course)[star] / course.ratingCount) * 100}%` : '0%' 
                        }"
                      ></div>
                    </div>
                    <span class="bar-count">{{ getCourseRatingDistribution(course)[star] }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 评分详情模态框 -->
      <div v-if="showRatingModal" class="modal-overlay" @click="showRatingModal = false">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>Rating Details - {{ selectedCourse?.title }}</h3>
            <button class="modal-close" @click="showRatingModal = false">×</button>
          </div>
          
          <div class="modal-body">
            <div class="rating-stats">
              <div class="rating-stat">
                <span class="stat-label">Total Ratings:</span>
                <span class="stat-value">{{ courseRatings.length }}</span>
              </div>
              <div class="rating-stat">
                <span class="stat-label">Average Rating:</span>
                <span class="stat-value">{{ (selectedCourse?.averageRating || 0).toFixed(1) }}</span>
              </div>
            </div>

            <div class="rating-distribution-modal">
              <h4>Rating Distribution</h4>
              <div v-for="star in [5, 4, 3, 2, 1]" :key="star" class="rating-bar-modal">
                <span class="star-label">{{ star }}★</span>
                <div class="bar-container">
                  <div 
                    class="bar-fill" 
                    :style="{ 
                      width: courseRatings.length > 0 ? `${(getRatingDistribution(courseRatings)[star] / courseRatings.length) * 100}%` : '0%' 
                    }"
                  ></div>
                </div>
                <span class="bar-count">{{ getRatingDistribution(courseRatings)[star] }}</span>
              </div>
            </div>

            <div class="rating-list">
              <h4>Recent Ratings</h4>
              <div v-if="courseRatings.length === 0" class="no-ratings">
                No ratings yet
              </div>
              <div v-else class="ratings-list">
                <div v-for="rating in courseRatings.slice(0, 10)" :key="rating.id" class="rating-item">
                  <div class="rating-user">
                    <div class="rating-stars">
                      <span v-for="i in 5" :key="i" class="star" :class="{ 'filled': i <= rating.rating }">
                        ★
                      </span>
                    </div>
                    <span class="rating-date">{{ formatDate(rating.createdAt) }}</span>
                  </div>
                  <p v-if="rating.comment" class="rating-comment">{{ rating.comment }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
:root {
  --green-700: #15803d;
  --green-600: #16a34a;
  --green-50: #f0fdf4;
  --border: #e2e8f0;
  --muted: #64748b;
}
.container { max-width: 1200px; margin: 0 auto; padding: 0 16px; }

.admin__bar { background: #fff; border-bottom: 1px solid var(--gray-200); position: sticky; top: 0; z-index: 10; backdrop-filter: blur(6px); }
.admin__bar-inner { height: 64px; display: flex; align-items: center; justify-content: space-between; }
.logo { 
  font-weight: 800; 
  color: var(--green-800); 
  text-decoration: none;
  cursor: pointer;
}
.logo:hover { 
  color: var(--green-600); 
  text-decoration: none;
}
.admin__actions { display: flex; align-items: center; gap: 12px; }

/* Legacy button styles removed - now using Button component */
.chip { display: inline-flex; align-items: center; gap: 8px; background: var(--green-50); color: var(--green-800); border: 1px solid var(--green-200); padding: 6px 10px; border-radius: 999px; box-shadow: var(--shadow-sm); }
.chip__avatar { width: 22px; height: 22px; border-radius: 50%; background: var(--green-600); color: white; display: grid; place-content: center; font-weight: 700; }

.admin__content { padding: 24px 0 40px; }

/* 页面头部 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title { 
  margin: 0; 
  color: #15803d; 
  font-size: 2rem;
  font-weight: 700;
}

.page-actions {
  display: flex;
  gap: 12px;
}

/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  font-size: 2rem;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0fdf4;
  border-radius: 12px;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: #15803d;
  margin-bottom: 4px;
}

.stat-label {
  color: #64748b;
  font-size: 0.875rem;
}

/* 工具栏 */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  gap: 16px;
}

.search-container {
  flex: 1;
  max-width: 400px;
}

.search-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.toolbar-actions {
  display: flex;
  gap: 12px;
}

/* 课程容器 */
.courses-container {
  margin-bottom: 24px;
}

/* 加载状态 */
.loading-state, .error-state, .empty-state {
  padding: 40px;
  text-align: center;
  color: #64748b;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e2e8f0;
  border-top: 3px solid #10b981;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 课程网格 */
.courses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
}

/* 课程卡片 */
.course-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.2s;
}

.course-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.course-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.course-checkbox input {
  margin-right: 8px;
}

.course-actions {
  display: flex;
  gap: 8px;
}

.course-content {
  flex: 1;
}

.course-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 8px 0;
}

.course-description {
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 0 0 16px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.course-meta {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.course-topic {
  background: #f3f4f6;
  color: #374151;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
}

.course-difficulty {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
}

.difficulty-beginner {
  background: #dcfce7;
  color: #166534;
}

.difficulty-intermediate {
  background: #fef3c7;
  color: #92400e;
}

.difficulty-advanced {
  background: #fee2e2;
  color: #991b1b;
}

.difficulty-unknown {
  background: #f3f4f6;
  color: #6b7280;
}

.course-duration {
  background: #e0e7ff;
  color: #3730a3;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
}

/* 评分信息 */
.course-ratings {
  border-top: 1px solid #e5e7eb;
  padding-top: 16px;
}

.rating-summary {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.rating-stars {
  display: flex;
  gap: 2px;
}

.star {
  color: #d1d5db;
  font-size: 1rem;
}

.star.filled {
  color: #fbbf24;
}

.rating-text {
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 500;
}

/* 评分分布图 */
.rating-distribution {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.rating-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.75rem;
}

.star-label {
  width: 24px;
  color: #6b7280;
  font-weight: 500;
}

.bar-container {
  flex: 1;
  height: 8px;
  background: #f3f4f6;
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #34d399);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.bar-count {
  width: 20px;
  text-align: right;
  color: #6b7280;
  font-weight: 500;
}

/* 模态框 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  color: #111827;
  font-size: 1.25rem;
  font-weight: 600;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6b7280;
  cursor: pointer;
  padding: 4px;
  line-height: 1;
}

.modal-close:hover {
  color: #374151;
}

.modal-body {
  padding: 20px;
}

.rating-stats {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
}

.rating-stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rating-stat .stat-label {
  color: #6b7280;
  font-size: 0.875rem;
}

.rating-stat .stat-value {
  color: #111827;
  font-size: 1.25rem;
  font-weight: 600;
}

.rating-distribution-modal {
  margin-bottom: 24px;
}

.rating-distribution-modal h4 {
  margin: 0 0 16px 0;
  color: #111827;
  font-size: 1rem;
  font-weight: 600;
}

.rating-bar-modal {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.rating-bar-modal .star-label {
  width: 32px;
  color: #6b7280;
  font-weight: 500;
}

.rating-bar-modal .bar-container {
  flex: 1;
  height: 12px;
  background: #f3f4f6;
  border-radius: 6px;
  overflow: hidden;
}

.rating-bar-modal .bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #34d399);
  border-radius: 6px;
  transition: width 0.3s ease;
}

.rating-bar-modal .bar-count {
  width: 24px;
  text-align: right;
  color: #6b7280;
  font-weight: 500;
}

.rating-list h4 {
  margin: 0 0 16px 0;
  color: #111827;
  font-size: 1rem;
  font-weight: 600;
}

.no-ratings {
  color: #6b7280;
  font-style: italic;
  text-align: center;
  padding: 20px;
}

.ratings-list {
  max-height: 300px;
  overflow-y: auto;
}

.rating-item {
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 8px;
}

.rating-user {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.rating-date {
  color: #6b7280;
  font-size: 0.75rem;
}

.rating-comment {
  color: #374151;
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-container {
    max-width: none;
  }
  
  .courses-grid {
    grid-template-columns: 1fr;
  }
  
  .course-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .course-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .modal-content {
    margin: 20px;
    max-height: calc(100vh - 40px);
  }
}
</style>



