<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import AdminHeader from '@/components/AdminHeader.vue'
import Button from '@/components/Button.vue'
import { courseService, courseRatingService } from '@/lib/firebaseService'

const router = useRouter()

// Course management state
const courses = ref([])
const allRatings = ref([]) // Store all rating data
const loading = ref(false)
const error = ref('')
const searchQuery = ref('')
const selectedCourses = ref([])
const showRatingModal = ref(false)
const selectedCourse = ref(null)
const courseRatings = ref([])

// Column search state - BR (D.3): Individual column search
const columnSearch = ref({
  title: '',
  topic: '',
  difficulty: '',
  minutes: '',
  rating: ''
})

// Sort state - BR (D.3): Sort functionality
const sortColumn = ref('title')
const sortOrder = ref('asc') // 'asc' or 'desc'

// Pagination state - BR (D.3): Pagination with 10 rows per page
const currentPage = ref(1)
const itemsPerPage = 10

// Computed properties - filtering
const filteredCourses = computed(() => {
  let result = [...courses.value]
  
  // Global search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(course => 
      course.title?.toLowerCase().includes(query) ||
      course.topic?.toLowerCase().includes(query) ||
      course.difficulty?.toLowerCase().includes(query) ||
      course.description?.toLowerCase().includes(query)
    )
  }
  
  // Column search - BR (D.3): Search by individual column
  if (columnSearch.value.title) {
    const query = columnSearch.value.title.toLowerCase()
    result = result.filter(course => course.title?.toLowerCase().includes(query))
  }
  
  if (columnSearch.value.topic) {
    const query = columnSearch.value.topic.toLowerCase()
    result = result.filter(course => course.topic?.toLowerCase().includes(query))
  }
  
  if (columnSearch.value.difficulty) {
    const query = columnSearch.value.difficulty.toLowerCase()
    result = result.filter(course => course.difficulty?.toLowerCase().includes(query))
  }
  
  if (columnSearch.value.minutes) {
    const query = columnSearch.value.minutes.toLowerCase()
    result = result.filter(course => String(course.minutes || '').includes(query))
  }
  
  if (columnSearch.value.rating) {
    const query = columnSearch.value.rating.toLowerCase()
    result = result.filter(course => {
      const rating = (course.averageRating || 0).toFixed(1)
      return rating.includes(query)
    })
  }
  
  return result
})

// Computed properties - sorting - BR (D.3): Sort functionality
const sortedCourses = computed(() => {
  const result = [...filteredCourses.value]
  
  result.sort((a, b) => {
    let aVal = a[sortColumn.value]
    let bVal = b[sortColumn.value]
    
    // Special handling for ratings
    if (sortColumn.value === 'rating') {
      aVal = a.averageRating || 0
      bVal = b.averageRating || 0
    }
    
    // Special handling for difficulty levels - sort by actual difficulty
    if (sortColumn.value === 'difficulty') {
      const difficultyOrder = {
        'beginner': 1,
        'intermediate': 2,
        'advanced': 3
      }
      aVal = difficultyOrder[String(aVal).toLowerCase()] || 0
      bVal = difficultyOrder[String(bVal).toLowerCase()] || 0
      
      // Sort difficulty levels by number
      return sortOrder.value === 'asc' ? aVal - bVal : bVal - aVal
    }
    
    // Handle undefined/null values
    if (aVal === undefined || aVal === null) aVal = ''
    if (bVal === undefined || bVal === null) bVal = ''
    
    // Direct comparison for numbers, convert strings to lowercase for comparison
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortOrder.value === 'asc' ? aVal - bVal : bVal - aVal
    }
    
    aVal = String(aVal).toLowerCase()
    bVal = String(bVal).toLowerCase()
    
    if (sortOrder.value === 'asc') {
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0
    } else {
      return aVal < bVal ? 1 : aVal > bVal ? -1 : 0
    }
  })
  
  return result
})

// Computed properties - pagination - BR (D.3): Limit to 10 rows per page
const paginatedCourses = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return sortedCourses.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(sortedCourses.value.length / itemsPerPage)
})

const totalCourses = computed(() => courses.value.length)
const totalRatings = computed(() => {
  // Use allRatings array length to ensure consistency with Analytics page
  return allRatings.value.length
})
const averageRating = computed(() => {
  if (courses.value.length === 0) return 0
  const total = courses.value.reduce((sum, course) => sum + (course.averageRating || 0), 0)
  return (total / courses.value.length).toFixed(1)
})

// Load all courses
async function loadCourses() {
  loading.value = true
  error.value = ''
  
  try {
    const result = await courseService.getCourses()
    if (result.ok) {
      courses.value = result.courses || []
      
      // Load all rating data (consistent with Analytics page)
      allRatings.value = await courseRatingService.getAllRatings()
      
      // Load rating data for each course
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

// Load course rating data
async function loadCourseRatings(courseId) {
  try {
    const ratings = await courseRatingService.getCourseRatings(courseId)
    const average = await courseRatingService.getAverageRating(courseId)
    
    // Update course data
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

// Delete course (also delete all ratings)
async function deleteCourse(course) {
  // Calculate actual rating count for this course (use allRatings to ensure accuracy)
  const courseRatingCount = allRatings.value.filter(r => r.courseId === course.id).length
  
  const confirmMessage = `Are you sure you want to delete course "${course.title}"?\n\nThis will also delete all ${courseRatingCount} ratings for this course.\n\nThis action CANNOT be undone!`
  
  if (!confirm(confirmMessage)) {
    return
  }
  
  loading.value = true
  
  try {
    console.log(`Deleting course: ${course.title} (ID: ${course.id})`)
    
    // Step 1: Delete all ratings for this course
    let ratingsDeleted = 0
    try {
      const courseRatings = allRatings.value.filter(r => r.courseId === course.id)
      console.log(`Found ${courseRatings.length} ratings to delete`)
      
      for (const rating of courseRatings) {
        await courseRatingService.deleteRating(rating.id)
        ratingsDeleted++
      }
      
      // Update allRatings
      allRatings.value = allRatings.value.filter(r => r.courseId !== course.id)
      
      console.log(`✅ Deleted ${ratingsDeleted} ratings`)
    } catch (err) {
      console.warn('Error deleting ratings:', err.message)
    }
    
    // Step 2: Delete course
    const result = await courseService.deleteCourse(course.id)
    
    if (result.ok) {
      courses.value = courses.value.filter(c => c.id !== course.id)
      showSuccessMessage(`✅ Course "${course.title}" deleted successfully\n\nAlso deleted ${ratingsDeleted} ratings`)
    } else {
      showErrorMessage(`Failed to delete course: ${result.error}`)
    }
  } catch (err) {
    console.error('Error deleting course:', err)
    showErrorMessage(`Failed to delete course: ${err.message}`)
  } finally {
    loading.value = false
  }
}

// View course rating details
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

// Calculate rating distribution
function getRatingDistribution(ratings) {
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  ratings.forEach(rating => {
    if (rating.rating >= 1 && rating.rating <= 5) {
      distribution[rating.rating]++
    }
  })
  return distribution
}

// Get course rating distribution
function getCourseRatingDistribution(course) {
  if (!course.ratings) return { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  return getRatingDistribution(course.ratings)
}

// Sort functionality - BR (D.3): Sort functionality
function sortBy(column) {
  if (sortColumn.value === column) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn.value = column
    sortOrder.value = 'asc'
  }
  currentPage.value = 1
}

// Get sort icon
function getSortIcon(column) {
  if (sortColumn.value !== column) return '⇅'
  return sortOrder.value === 'asc' ? '↑' : '↓'
}

// Pagination functionality - BR (D.3): Pagination controls
function goToPage(page) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

// Clear all search
function clearAllSearch() {
  searchQuery.value = ''
  columnSearch.value = {
    title: '',
    topic: '',
    difficulty: '',
    minutes: '',
    rating: ''
  }
  currentPage.value = 1
}

// Clear column search
function clearColumnSearch(column) {
  columnSearch.value[column] = ''
  currentPage.value = 1
}

// Toggle course selection
function toggleCourseSelection(courseId) {
  const index = selectedCourses.value.indexOf(courseId)
  if (index > -1) {
    selectedCourses.value.splice(index, 1)
  } else {
    selectedCourses.value.push(courseId)
  }
}

// Select all/deselect all (current page)
function toggleSelectAll() {
  if (selectedCourses.value.length === paginatedCourses.value.length && paginatedCourses.value.length > 0) {
    selectedCourses.value = []
  } else {
    selectedCourses.value = paginatedCourses.value.map(course => course.id)
  }
}

// Batch delete courses (also delete all ratings)
async function deleteSelectedCourses() {
  if (selectedCourses.value.length === 0) return
  
  // Calculate total rating count (use allRatings to ensure accuracy)
  const ratingsToDelete = allRatings.value.filter(r => selectedCourses.value.includes(r.courseId))
  const totalRatingsCount = ratingsToDelete.length
  
  const confirmMessage = `Are you sure you want to delete ${selectedCourses.value.length} selected courses?\n\nThis will also delete ${totalRatingsCount} ratings.\n\nThis action CANNOT be undone!`
  
  if (!confirm(confirmMessage)) {
    return
  }
  
  loading.value = true
  let totalRatingsDeleted = 0
  
  try {
    for (const courseId of selectedCourses.value) {
      // Delete all ratings for this course
      try {
        const courseRatings = allRatings.value.filter(r => r.courseId === courseId)
        for (const rating of courseRatings) {
          await courseRatingService.deleteRating(rating.id)
          totalRatingsDeleted++
        }
      } catch (err) {
        console.warn(`Error deleting ratings for course ${courseId}:`, err.message)
      }
      
      // Delete course
      await courseService.deleteCourse(courseId)
    }
    
    const deletedCount = selectedCourses.value.length
    courses.value = courses.value.filter(course => !selectedCourses.value.includes(course.id))
    
    // Update allRatings, remove ratings for deleted courses
    allRatings.value = allRatings.value.filter(r => !selectedCourses.value.includes(r.courseId))
    
    selectedCourses.value = []
    
    showSuccessMessage(`✅ ${deletedCount} courses deleted successfully\n\nAlso deleted ${totalRatingsDeleted} ratings`)
  } catch (err) {
    console.error('Error deleting selected courses:', err)
    showErrorMessage('Failed to delete selected courses')
  } finally {
    loading.value = false
  }
}

// Format date
function formatDate(dateString) {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Get difficulty label style
function getDifficultyClass(difficulty) {
  switch (difficulty?.toLowerCase()) {
    case 'beginner': return 'difficulty-beginner'
    case 'intermediate': return 'difficulty-intermediate'
    case 'advanced': return 'difficulty-advanced'
    default: return 'difficulty-unknown'
  }
}

// Show success message
function showSuccessMessage(message) {
  alert(message)
}

// Show error message
function showErrorMessage(message) {
  alert(message)
}

// Navigate to analytics page
function goToAnalytics() {
  router.push('/admin/courses/analytics')
}

// Load course data when page loads
onMounted(() => {
  loadCourses()
})
</script>

<template>
  <div class="admin">
    <AdminHeader />

    <main class="container admin__content">
      <div class="page-header">
        <h1 class="page-title">Course Management</h1>
        <div class="page-actions">
          <Button variant="primary" size="medium" @click="loadCourses" :loading="loading">
            Refresh
          </Button>
        </div>
      </div>

      <!-- Statistics cards -->
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

      <!-- Search and action bar - BR (D.3): Search functionality -->
      <div class="toolbar">
        <div class="search-container">
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Global search (title, topic, difficulty, description)..."
            class="search-input"
          />
          <button 
            v-if="searchQuery || Object.values(columnSearch).some(v => v)"
            @click="clearAllSearch"
            class="clear-search-btn"
            title="Clear all search filters"
          >
            ✕ Clear All
          </button>
        </div>
        <div class="toolbar-actions">
          <Button 
            variant="primary" 
            size="medium" 
            @click="goToAnalytics"
          >
            📊 View Analytics
          </Button>
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

      <!-- Search results info - BR (D.3): Display filtered results -->
      <div class="search-info">
        <span>Showing {{ paginatedCourses.length }} of {{ sortedCourses.length }} courses (Total: {{ totalCourses }})</span>
      </div>

      <!-- Course list - BR (D.3): Interactive Table -->
      <div class="courses-container">
        <div v-if="loading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>Loading courses...</p>
        </div>

        <div v-else-if="error" class="error-state">
          <p>{{ error }}</p>
          <Button variant="primary" size="medium" @click="loadCourses">Retry</Button>
        </div>

        <div v-else-if="sortedCourses.length === 0" class="empty-state">
          <p>No courses found</p>
        </div>

        <div v-else class="courses-table">
          <table>
            <thead>
              <!-- BR (D.3): Sortable column headers -->
              <tr>
                <th class="checkbox-column">
                  <input 
                    type="checkbox" 
                    :checked="selectedCourses.length === paginatedCourses.length && paginatedCourses.length > 0"
                    @change="toggleSelectAll"
                  />
                </th>
                <th class="sortable" @click="sortBy('title')">
                  Course Title {{ getSortIcon('title') }}
                </th>
                <th class="sortable" @click="sortBy('topic')">
                  Topic {{ getSortIcon('topic') }}
                </th>
                <th class="sortable" @click="sortBy('difficulty')">
                  Difficulty {{ getSortIcon('difficulty') }}
                </th>
                <th class="sortable" @click="sortBy('minutes')">
                  Duration {{ getSortIcon('minutes') }}
                </th>
                <th class="sortable" @click="sortBy('rating')">
                  Rating {{ getSortIcon('rating') }}
                </th>
                <th>Actions</th>
              </tr>
              
              <!-- BR (D.3): Individual column search -->
              <tr class="column-search-row">
                <th class="checkbox-column"></th>
                <th>
                  <div class="column-search">
                    <input 
                      v-model="columnSearch.title"
                      type="text" 
                      placeholder="Search title..."
                      class="column-search-input"
                      @input="currentPage = 1"
                    />
                    <button 
                      v-if="columnSearch.title"
                      @click="clearColumnSearch('title')"
                      class="clear-column-btn"
                      title="Clear"
                    >
                      ✕
                    </button>
                  </div>
                </th>
                <th>
                  <div class="column-search">
                    <input 
                      v-model="columnSearch.topic"
                      type="text" 
                      placeholder="Search topic..."
                      class="column-search-input"
                      @input="currentPage = 1"
                    />
                    <button 
                      v-if="columnSearch.topic"
                      @click="clearColumnSearch('topic')"
                      class="clear-column-btn"
                      title="Clear"
                    >
                      ✕
                    </button>
                  </div>
                </th>
                <th>
                  <div class="column-search">
                    <input 
                      v-model="columnSearch.difficulty"
                      type="text" 
                      placeholder="Search..."
                      class="column-search-input"
                      @input="currentPage = 1"
                    />
                    <button 
                      v-if="columnSearch.difficulty"
                      @click="clearColumnSearch('difficulty')"
                      class="clear-column-btn"
                      title="Clear"
                    >
                      ✕
                    </button>
                  </div>
                </th>
                <th>
                  <div class="column-search">
                    <input 
                      v-model="columnSearch.minutes"
                      type="text" 
                      placeholder="Search..."
                      class="column-search-input"
                      @input="currentPage = 1"
                    />
                    <button 
                      v-if="columnSearch.minutes"
                      @click="clearColumnSearch('minutes')"
                      class="clear-column-btn"
                      title="Clear"
                    >
                      ✕
                    </button>
                  </div>
                </th>
                <th>
                  <div class="column-search">
                    <input 
                      v-model="columnSearch.rating"
                      type="text" 
                      placeholder="Search..."
                      class="column-search-input"
                      @input="currentPage = 1"
                    />
                    <button 
                      v-if="columnSearch.rating"
                      @click="clearColumnSearch('rating')"
                      class="clear-column-btn"
                      title="Clear"
                    >
                      ✕
                    </button>
                  </div>
                </th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <!-- BR (D.3): Display paginated results (10 per page) -->
              <tr v-for="course in paginatedCourses" :key="course.id" class="course-row">
                <td class="checkbox-column">
                  <input 
                    type="checkbox" 
                    :checked="selectedCourses.includes(course.id)"
                    @change="toggleCourseSelection(course.id)"
                  />
                </td>
                <td class="course-title-cell">
                  <div class="course-title-content">
                    <div class="course-title-text">{{ course.title }}</div>
                    <div class="course-description">{{ course.description }}</div>
                  </div>
                </td>
                <td class="course-topic">
                  <span class="topic-badge">{{ course.topic }}</span>
                </td>
                <td class="course-difficulty">
                  <span class="difficulty-badge" :class="getDifficultyClass(course.difficulty)">
                    {{ course.difficulty }}
                  </span>
                </td>
                <td class="course-duration">
                  <span class="duration-badge">{{ course.minutes }} min</span>
                </td>
                <td class="course-rating">
                  <div class="rating-display">
                    <div class="rating-stars-small">
                      <span v-for="i in 5" :key="i" class="star-small" :class="{ 'filled': i <= Math.round(course.averageRating || 0) }">
                        ★
                      </span>
                    </div>
                    <div class="rating-text-small">
                      {{ (course.averageRating || 0).toFixed(1) }} ({{ course.ratingCount || 0 }})
                    </div>
                  </div>
                </td>
                <td class="course-actions">
                  <Button 
                    variant="secondary" 
                    size="small" 
                    @click="viewCourseRatings(course)"
                  >
                    Ratings
                  </Button>
                  <Button 
                    variant="danger" 
                    size="small" 
                    @click="deleteCourse(course)"
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- BR (D.3): Pagination controls - 10 rows per page -->
      <div v-if="sortedCourses.length > 0" class="pagination">
        <div class="pagination-info">
          Page {{ currentPage }} of {{ totalPages }} 
          ({{ sortedCourses.length }} total {{ sortedCourses.length === 1 ? 'course' : 'courses' }})
        </div>
        <div class="pagination-controls">
          <button 
            @click="goToPage(1)" 
            :disabled="currentPage === 1"
            class="pagination-btn"
            title="First page"
          >
            ⟨⟨
          </button>
          <button 
            @click="prevPage" 
            :disabled="currentPage === 1"
            class="pagination-btn"
            title="Previous page"
          >
            ⟨
          </button>
          
          <!-- Page number buttons -->
          <template v-for="page in totalPages" :key="page">
            <button 
              v-if="page === 1 || page === totalPages || (page >= currentPage - 2 && page <= currentPage + 2)"
              @click="goToPage(page)"
              :class="['pagination-btn', { active: page === currentPage }]"
            >
              {{ page }}
            </button>
            <span v-else-if="page === currentPage - 3 || page === currentPage + 3" class="pagination-ellipsis">
              ...
            </span>
          </template>
          
          <button 
            @click="nextPage" 
            :disabled="currentPage === totalPages"
            class="pagination-btn"
            title="Next page"
          >
            ⟩
          </button>
          <button 
            @click="goToPage(totalPages)" 
            :disabled="currentPage === totalPages"
            class="pagination-btn"
            title="Last page"
          >
            ⟩⟩
          </button>
        </div>
      </div>


      <!-- Rating details modal -->
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

/* Page header */
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

/* Statistics cards */
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

/* Toolbar */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 16px;
}

.search-container {
  flex: 1;
  max-width: 500px;
  position: relative;
  display: flex;
  gap: 8px;
  align-items: center;
}

.search-input {
  flex: 1;
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

.clear-search-btn {
  padding: 8px 16px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
}

.clear-search-btn:hover {
  background: #dc2626;
}

.toolbar-actions {
  display: flex;
  gap: 12px;
}

/* Search results info */
.search-info {
  margin-bottom: 12px;
  padding: 8px 12px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 6px;
  color: #166534;
  font-size: 0.875rem;
  font-weight: 500;
}

/* Course container */
.courses-container {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Loading state */
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

/* BR (D.3): Course Table */
.courses-table {
  overflow-x: auto;
}

.courses-table table {
  width: 100%;
  border-collapse: collapse;
}

.courses-table th,
.courses-table td {
  padding: 16px;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

.courses-table th {
  background: #f8fafc;
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* BR (D.3): Sortable column headers */
.courses-table th.sortable {
  cursor: pointer;
  user-select: none;
  transition: background 0.2s;
}

.courses-table th.sortable:hover {
  background: #e2e8f0;
}

/* BR (D.3): Column search row */
.column-search-row th {
  padding: 8px 12px;
  background: #ffffff;
  border-bottom: 2px solid #10b981;
}

.column-search {
  position: relative;
  display: flex;
  align-items: center;
  gap: 4px;
}

.column-search-input {
  width: 100%;
  padding: 6px 28px 6px 8px;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  font-size: 0.75rem;
  transition: border-color 0.2s;
  text-transform: none;
  letter-spacing: normal;
}

.column-search-input:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.1);
}

.clear-column-btn {
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 3px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.75rem;
  line-height: 1;
  padding: 0;
  transition: background 0.2s;
}

.clear-column-btn:hover {
  background: #dc2626;
}

.checkbox-column {
  width: 40px;
  text-align: center;
}

/* Course title cell */
.course-title-cell {
  min-width: 250px;
}

.course-title-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.course-title-text {
  font-weight: 600;
  color: #111827;
  font-size: 1rem;
}

.course-description {
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Badge styles */
.topic-badge {
  display: inline-block;
  background: #f3f4f6;
  color: #374151;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.difficulty-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.difficulty-beginner {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.difficulty-intermediate {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fde68a;
}

.difficulty-advanced {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.difficulty-unknown {
  background: #f3f4f6;
  color: #6b7280;
  border: 1px solid #e5e7eb;
}

.duration-badge {
  display: inline-block;
  background: #e0e7ff;
  color: #3730a3;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
}

/* Rating display */
.rating-display {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rating-stars-small {
  display: flex;
  gap: 2px;
}

.star-small {
  color: #d1d5db;
  font-size: 0.875rem;
}

.star-small.filled {
  color: #fbbf24;
}

.rating-text-small {
  color: #6b7280;
  font-size: 0.75rem;
  font-weight: 500;
}

.course-actions {
  display: flex;
  gap: 8px;
}

.course-row:hover {
  background: #f8fafc;
}

/* BR (D.3): Pagination controls */
.pagination {
  margin-top: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.pagination-info {
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 500;
}

.pagination-controls {
  display: flex;
  gap: 6px;
  align-items: center;
}

.pagination-btn {
  padding: 8px 12px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  color: #374151;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 40px;
}

.pagination-btn:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #10b981;
  color: #10b981;
}

.pagination-btn.active {
  background: #10b981;
  border-color: #10b981;
  color: white;
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination-ellipsis {
  padding: 8px 4px;
  color: #9ca3af;
  font-size: 0.875rem;
}

/* Rating info */
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

/* Rating distribution chart */
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

/* Modal */
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

/* Responsive design */
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
    flex-direction: column;
  }
  
  .clear-search-btn {
    width: 100%;
  }
  
  .courses-table {
    font-size: 0.875rem;
  }
  
  .courses-table th,
  .courses-table td {
    padding: 12px 8px;
  }
  
  .column-search-input {
    font-size: 0.7rem;
    padding: 4px 24px 4px 6px;
  }
  
  .pagination {
    flex-direction: column;
    gap: 12px;
  }
  
  .pagination-controls {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .pagination-btn {
    padding: 6px 10px;
    font-size: 0.75rem;
    min-width: 36px;
  }
  
  .modal-content {
    margin: 20px;
    max-height: calc(100vh - 40px);
  }
}

</style>



