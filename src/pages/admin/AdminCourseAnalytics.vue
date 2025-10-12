<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import { logout } from '@/lib/auth'
import { useRouter } from 'vue-router'
import Button from '@/components/Button.vue'
import { courseService, courseRatingService } from '@/lib/firebaseService'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js'
import { Bar, Doughnut } from 'vue-chartjs'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { saveAs } from 'file-saver'

const router = useRouter()

// 注册 Chart.js 组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

// 状态管理
const courses = ref([])
const allRatings = ref([])
const loading = ref(false)
const error = ref('')
const chartType = ref('topic') // 'topic' or 'difficulty'
const chartData = ref({})
const chartOptions = ref({})

// 导出状态
const exportLoading = ref(false)
const exportProgress = ref(0)
const showExportModal = ref(false)

// 计算属性
const totalRatings = computed(() => allRatings.value.length)
const coursesWithRatings = computed(() => courses.value.filter(c => c.ratingCount > 0).length)
const averageRating = computed(() => {
  if (allRatings.value.length === 0) return 0
  return (allRatings.value.reduce((sum, r) => sum + r.rating, 0) / allRatings.value.length).toFixed(1)
})

// 加载数据
async function loadData() {
  loading.value = true
  try {
    console.log('Loading courses and ratings for analytics...')
    
    // 并行加载课程和评分数据
    const [coursesData, ratingsData] = await Promise.all([
      courseService.getAllCourses(),
      courseRatingService.getAllRatings()
    ])
    
    courses.value = coursesData
    allRatings.value = ratingsData
    
    console.log(`Loaded ${coursesData.length} courses and ${ratingsData.length} ratings`)
    
    // 生成初始图表数据
    generateChartData()
    
  } catch (err) {
    console.error('Error loading analytics data:', err)
    error.value = 'Failed to load analytics data'
  } finally {
    loading.value = false
  }
}

// 生成图表数据
function generateChartData() {
  if (chartType.value === 'topic') {
    generateTopicChartData()
  } else {
    generateDifficultyChartData()
  }
}

// 按 topic 生成图表数据
function generateTopicChartData() {
  const topicStats = {}
  
  // 统计每个 topic 的评分分布
  allRatings.value.forEach(rating => {
    const course = courses.value.find(c => c.id === rating.courseId)
    if (course && course.topic) {
      const topic = course.topic
      if (!topicStats[topic]) {
        topicStats[topic] = {
          total: 0,
          sum: 0,
          ratings: [0, 0, 0, 0, 0] // 1-5星的数量
        }
      }
      
      topicStats[topic].total++
      topicStats[topic].sum += rating.rating
      if (rating.rating >= 1 && rating.rating <= 5) {
        topicStats[topic].ratings[rating.rating - 1]++
      }
    }
  })
  
  const labels = Object.keys(topicStats)
  const avgRatings = labels.map(topic => 
    topicStats[topic].total > 0 ? (topicStats[topic].sum / topicStats[topic].total).toFixed(1) : 0
  )
  
  chartData.value = {
    labels: labels,
    datasets: [
      {
        label: 'Average Rating',
        data: avgRatings,
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 205, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
          'rgba(255, 159, 64, 0.8)',
          'rgba(199, 199, 199, 0.8)',
          'rgba(83, 102, 255, 0.8)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 205, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(199, 199, 199, 1)',
          'rgba(83, 102, 255, 1)'
        ],
        borderWidth: 1
      }
    ]
  }
  
  chartOptions.value = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: 'Average Ratings by Topic',
        font: {
          size: 18,
          weight: 'bold'
        }
      },
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          afterLabel: function(context) {
            const topic = context.label
            const stats = topicStats[topic]
            return [
              `Total Ratings: ${stats.total}`,
              `5⭐: ${stats.ratings[4]}`,
              `4⭐: ${stats.ratings[3]}`,
              `3⭐: ${stats.ratings[2]}`,
              `2⭐: ${stats.ratings[1]}`,
              `1⭐: ${stats.ratings[0]}`
            ]
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 5,
        ticks: {
          stepSize: 0.5
        }
      }
    }
  }
}

// 按 difficulty 生成图表数据
function generateDifficultyChartData() {
  const difficultyStats = {
    'Beginner': { total: 0, sum: 0, ratings: [0, 0, 0, 0, 0] },
    'Intermediate': { total: 0, sum: 0, ratings: [0, 0, 0, 0, 0] },
    'Advanced': { total: 0, sum: 0, ratings: [0, 0, 0, 0, 0] }
  }
  
  // 统计每个 difficulty 的评分分布
  allRatings.value.forEach(rating => {
    const course = courses.value.find(c => c.id === rating.courseId)
    if (course && course.difficulty) {
      const difficulty = course.difficulty.charAt(0).toUpperCase() + course.difficulty.slice(1)
      if (difficultyStats[difficulty]) {
        difficultyStats[difficulty].total++
        difficultyStats[difficulty].sum += rating.rating
        if (rating.rating >= 1 && rating.rating <= 5) {
          difficultyStats[difficulty].ratings[rating.rating - 1]++
        }
      }
    }
  })
  
  const labels = ['Beginner', 'Intermediate', 'Advanced']
  const avgRatings = labels.map(difficulty => 
    difficultyStats[difficulty].total > 0 ? 
    (difficultyStats[difficulty].sum / difficultyStats[difficulty].total).toFixed(1) : 0
  )
  
  chartData.value = {
    labels: labels,
    datasets: [
      {
        label: 'Average Rating',
        data: avgRatings,
        backgroundColor: [
          'rgba(75, 192, 192, 0.8)', // Beginner - 绿色
          'rgba(255, 205, 86, 0.8)',  // Intermediate - 黄色
          'rgba(255, 99, 132, 0.8)'   // Advanced - 红色
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 205, 86, 1)',
          'rgba(255, 99, 132, 1)'
        ],
        borderWidth: 1
      }
    ]
  }
  
  chartOptions.value = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: 'Average Ratings by Difficulty',
        font: {
          size: 18,
          weight: 'bold'
        }
      },
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          afterLabel: function(context) {
            const difficulty = context.label
            const stats = difficultyStats[difficulty]
            return [
              `Total Ratings: ${stats.total}`,
              `5⭐: ${stats.ratings[4]}`,
              `4⭐: ${stats.ratings[3]}`,
              `3⭐: ${stats.ratings[2]}`,
              `2⭐: ${stats.ratings[1]}`,
              `1⭐: ${stats.ratings[0]}`
            ]
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 5,
        ticks: {
          stepSize: 0.5
        }
      }
    }
  }
}

// 切换图表类型
function switchChartType(type) {
  chartType.value = type
  generateChartData()
}

// 获取热门主题
function getTopTopics() {
  const topicStats = {}
  
  allRatings.value.forEach(rating => {
    const course = courses.value.find(c => c.id === rating.courseId)
    if (course && course.topic) {
      const topic = course.topic
      if (!topicStats[topic]) {
        topicStats[topic] = { total: 0, sum: 0 }
      }
      topicStats[topic].total++
      topicStats[topic].sum += rating.rating
    }
  })
  
  return Object.keys(topicStats)
    .map(topic => ({
      name: topic,
      average: topicStats[topic].total > 0 ? (topicStats[topic].sum / topicStats[topic].total).toFixed(1) : '0',
      count: topicStats[topic].total
    }))
    .sort((a, b) => parseFloat(b.average) - parseFloat(a.average))
    .slice(0, 5) // 只显示前5个
}

// 导出功能
function showExportOptions() {
  showExportModal.value = true
}

function closeExportModal() {
  showExportModal.value = false
  exportLoading.value = false
  exportProgress.value = 0
}

// CSV 导出功能
async function exportToCSV() {
  exportLoading.value = true
  exportProgress.value = 10
  
  try {
    // 准备数据
    const csvData = []
    
    // 添加标题行
    csvData.push([
      'Course Title',
      'Topic',
      'Difficulty',
      'Duration (min)',
      'Rating Count',
      'Average Rating',
      'Total Ratings',
      '5 Stars',
      '4 Stars',
      '3 Stars',
      '2 Stars',
      '1 Star'
    ])
    
    exportProgress.value = 30
    
    // 添加课程数据
    for (const course of courses.value) {
      const courseRatings = allRatings.value.filter(r => r.courseId === course.id)
      const ratingCount = courseRatings.length
      const averageRating = ratingCount > 0 ? 
        (courseRatings.reduce((sum, r) => sum + r.rating, 0) / ratingCount).toFixed(2) : '0.00'
      
      // 统计各星级数量
      const starCounts = [0, 0, 0, 0, 0] // 1-5星
      courseRatings.forEach(rating => {
        if (rating.rating >= 1 && rating.rating <= 5) {
          starCounts[rating.rating - 1]++
        }
      })
      
      csvData.push([
        course.title || '',
        course.topic || '',
        course.difficulty || '',
        course.minutes || 0,
        ratingCount,
        averageRating,
        allRatings.value.length,
        starCounts[4], // 5星
        starCounts[3], // 4星
        starCounts[2], // 3星
        starCounts[1], // 2星
        starCounts[0]  // 1星
      ])
    }
    
    exportProgress.value = 70
    
    // 转换为CSV格式
    const csvContent = csvData.map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n')
    
    exportProgress.value = 90
    
    // 创建并下载文件
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const timestamp = new Date().toISOString().split('T')[0]
    saveAs(blob, `course-analytics-${timestamp}.csv`)
    
    exportProgress.value = 100
    
    // 显示成功消息
    setTimeout(() => {
      closeExportModal()
      alert('✅ CSV file exported successfully!')
    }, 500)
    
  } catch (err) {
    console.error('CSV export failed:', err)
    alert('❌ CSV export failed: ' + err.message)
    closeExportModal()
  }
}

// PDF 导出功能
async function exportToPDF() {
  exportLoading.value = true
  exportProgress.value = 10
  
  try {
    // 创建PDF文档
    const doc = new jsPDF('landscape', 'mm', 'a4')
    
    exportProgress.value = 20
    
    // 添加标题
    doc.setFontSize(20)
    doc.setFont(undefined, 'bold')
    doc.text('Course Rating Analytics Report', 20, 25)
    
    exportProgress.value = 30
    
    // 添加生成时间
    doc.setFontSize(10)
    doc.setFont(undefined, 'normal')
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 35)
    
    exportProgress.value = 40
    
    // 添加统计概览
    doc.setFontSize(14)
    doc.setFont(undefined, 'bold')
    doc.text('Summary Statistics', 20, 50)
    
    doc.setFontSize(10)
    doc.setFont(undefined, 'normal')
    doc.text(`Total Courses: ${courses.value.length}`, 20, 60)
    doc.text(`Total Ratings: ${totalRatings.value}`, 20, 67)
    doc.text(`Courses with Ratings: ${coursesWithRatings.value}`, 20, 74)
    doc.text(`Average Rating: ${averageRating.value}`, 20, 81)
    
    exportProgress.value = 50
    
    // 准备表格数据
    const tableData = []
    const headers = ['Course Title', 'Topic', 'Difficulty', 'Duration', 'Rating Count', 'Average Rating']
    
    for (const course of courses.value) {
      const courseRatings = allRatings.value.filter(r => r.courseId === course.id)
      const ratingCount = courseRatings.length
      const avgRating = ratingCount > 0 ? 
        (courseRatings.reduce((sum, r) => sum + r.rating, 0) / ratingCount).toFixed(2) : '0.00'
      
      tableData.push([
        course.title || '',
        course.topic || '',
        course.difficulty || '',
        `${course.minutes || 0} min`,
        ratingCount.toString(),
        avgRating
      ])
    }
    
    exportProgress.value = 70
    
    // 添加表格
    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: 90,
      styles: {
        fontSize: 8,
        cellPadding: 2
      },
      headStyles: {
        fillColor: [22, 163, 74], // 绿色主题
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      margin: { left: 20, right: 20 },
      tableWidth: 'auto'
    })
    
    exportProgress.value = 85
    
    // 添加评分分布统计
    const finalY = doc.lastAutoTable.finalY + 20
    doc.setFontSize(14)
    doc.setFont(undefined, 'bold')
    doc.text('Rating Distribution', 20, finalY)
    
    doc.setFontSize(10)
    doc.setFont(undefined, 'normal')
    
    const ratingDistribution = [0, 0, 0, 0, 0] // 1-5星
    allRatings.value.forEach(rating => {
      if (rating.rating >= 1 && rating.rating <= 5) {
        ratingDistribution[rating.rating - 1]++
      }
    })
    
    let yPos = finalY + 10
    for (let i = 0; i < 5; i++) {
      const starLevel = `${i + 1} Star${i > 0 ? 's' : ''}`
      const count = ratingDistribution[i]
      const percentage = allRatings.value.length > 0 ? 
        ((count / allRatings.value.length) * 100).toFixed(1) : '0.0'
      doc.text(`${starLevel}: ${count} ratings (${percentage}%)`, 20, yPos)
      yPos += 7
    }
    
    exportProgress.value = 95
    
    // 保存PDF
    const timestamp = new Date().toISOString().split('T')[0]
    doc.save(`course-analytics-${timestamp}.pdf`)
    
    exportProgress.value = 100
    
    // 显示成功消息
    setTimeout(() => {
      closeExportModal()
      alert('✅ PDF report exported successfully!')
    }, 500)
    
  } catch (err) {
    console.error('PDF export failed:', err)
    alert('❌ PDF export failed: ' + err.message)
    closeExportModal()
  }
}

// 返回课程管理
function goBack() {
  router.push('/admin/courses')
}

// 登出
function handleLogout() {
  logout()
  router.push('/')
}

// 页面加载时获取数据
onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="admin">
    <header class="admin__bar">
      <div class="container admin__bar-inner">
        <router-link to="/admin" class="logo">ADMIN MANAGE SYSTEM</router-link>
        <div class="admin__actions">
          <Button variant="secondary" size="small" @click="goBack">
            ← Back to Courses
          </Button>
          <Button variant="primary" size="small" @click="showExportOptions">
            📥 Export Data
          </Button>
          <Button variant="danger" size="small" @click="handleLogout">
            Logout
          </Button>
        </div>
      </div>
    </header>

    <main class="admin__main">
      <div class="container">
        <!-- 页面标题 -->
        <div class="page-header">
          <h1>📊 Course Rating Analytics</h1>
          <p>Comprehensive analysis of course ratings and performance metrics</p>
        </div>

        <!-- 加载状态 -->
        <div v-if="loading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>Loading analytics data...</p>
        </div>

        <!-- 错误状态 -->
        <div v-else-if="error" class="error-state">
          <p>❌ {{ error }}</p>
          <Button @click="loadData" variant="primary">Retry</Button>
        </div>

        <!-- 主要内容 -->
        <div v-else class="analytics-content">
          <!-- 统计概览 -->
          <div class="stats-overview">
            <div class="stat-card">
              <div class="stat-icon">📚</div>
              <div class="stat-content">
                <div class="stat-number">{{ courses.length }}</div>
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
              <div class="stat-icon">📈</div>
              <div class="stat-content">
                <div class="stat-number">{{ coursesWithRatings }}</div>
                <div class="stat-label">Courses with Ratings</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">🎯</div>
              <div class="stat-content">
                <div class="stat-number">{{ averageRating }}⭐</div>
                <div class="stat-label">Average Rating</div>
              </div>
            </div>
          </div>

          <!-- 图表分析 -->
          <div class="charts-section">
            <div class="charts-header">
              <h2>Rating Distribution Analysis</h2>
              <div class="chart-type-selector">
                <button 
                  @click="switchChartType('topic')"
                  :class="['chart-type-btn', { active: chartType === 'topic' }]"
                >
                  By Topic
                </button>
                <button 
                  @click="switchChartType('difficulty')"
                  :class="['chart-type-btn', { active: chartType === 'difficulty' }]"
                >
                  By Difficulty
                </button>
              </div>
            </div>
            
            <div class="chart-container">
              <div class="chart-wrapper">
                <Bar 
                  v-if="chartData.labels && chartData.labels.length > 0"
                  :data="chartData" 
                  :options="chartOptions"
                />
                <div v-else class="no-data">
                  <p>No rating data available for {{ chartType === 'topic' ? 'topics' : 'difficulty levels' }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- 详细统计 -->
          <div class="detailed-stats">
            <h3>📋 Detailed Statistics</h3>
            <div class="stats-grid">
              <div class="stat-detail">
                <h4>Rating Distribution</h4>
                <div class="rating-breakdown">
                  <div v-for="star in 5" :key="star" class="rating-item">
                    <span class="rating-stars">{{ '⭐'.repeat(star) }}</span>
                    <span class="rating-count">
                      {{ allRatings.filter(r => r.rating === star).length }} ratings
                    </span>
                    <span class="rating-percentage">
                      {{ allRatings.length > 0 ? ((allRatings.filter(r => r.rating === star).length / allRatings.length) * 100).toFixed(1) : 0 }}%
                    </span>
                  </div>
                </div>
              </div>
              
              <div class="stat-detail">
                <h4>Top Performing Topics</h4>
                <div class="topic-list">
                  <div v-for="topic in getTopTopics()" :key="topic.name" class="topic-item">
                    <span class="topic-name">{{ topic.name }}</span>
                    <span class="topic-rating">{{ topic.average }}⭐</span>
                    <span class="topic-count">({{ topic.count }} ratings)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 导出模态框 -->
    <div v-if="showExportModal" class="modal-overlay" @click="closeExportModal">
      <div class="modal-content export-modal" @click.stop>
        <div class="modal-header">
          <h3>📥 Export Analytics Data</h3>
          <button class="modal-close" @click="closeExportModal" :disabled="exportLoading">×</button>
        </div>
        
        <div class="modal-body">
          <p class="export-description">
            Choose the format to export your course analytics data:
          </p>
          
          <div class="export-options">
            <div class="export-option">
              <div class="option-icon">📊</div>
              <div class="option-content">
                <h4>CSV Format</h4>
                <p>Spreadsheet-compatible format with detailed course and rating data</p>
                <ul>
                  <li>Course details (title, topic, difficulty, duration)</li>
                  <li>Rating statistics and distribution</li>
                  <li>Compatible with Excel, Google Sheets</li>
                </ul>
              </div>
              <Button 
                variant="primary" 
                size="medium" 
                @click="exportToCSV"
                :disabled="exportLoading"
              >
                {{ exportLoading ? 'Exporting...' : 'Export CSV' }}
              </Button>
            </div>
            
            <div class="export-option">
              <div class="option-icon">📄</div>
              <div class="option-content">
                <h4>PDF Report</h4>
                <p>Professional formatted report with charts and analysis</p>
                <ul>
                  <li>Summary statistics and overview</li>
                  <li>Complete course data table</li>
                  <li>Rating distribution analysis</li>
                </ul>
              </div>
              <Button 
                variant="primary" 
                size="medium" 
                @click="exportToPDF"
                :disabled="exportLoading"
              >
                {{ exportLoading ? 'Exporting...' : 'Export PDF' }}
              </Button>
            </div>
          </div>
          
          <!-- 导出进度 -->
          <div v-if="exportLoading" class="export-progress">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: exportProgress + '%' }"></div>
            </div>
            <p class="progress-text">{{ exportProgress }}% Complete</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
:root {
  --green-700: #15803d;
  --green-600: #16a34a;
  --green-50: #f0fdf4;
  --border: #e2e8f0;
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-600: #4b5563;
  --gray-700: #374151;
  --gray-800: #1f2937;
}

.admin {
  min-height: 100vh;
  background: var(--gray-50);
}

.admin__bar {
  background: white;
  border-bottom: 1px solid var(--border);
  padding: 1rem 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.admin__bar-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--green-700);
  text-decoration: none;
}

.admin__actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.admin__main {
  padding: 2rem 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.page-header {
  text-align: center;
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 2.5rem;
  color: var(--gray-800);
  margin: 0 0 0.5rem 0;
}

.page-header p {
  color: var(--gray-600);
  font-size: 1.1rem;
  margin: 0;
}

.loading-state, .error-state {
  text-align: center;
  padding: 3rem;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--gray-200);
  border-top: 4px solid var(--green-600);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.analytics-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* 统计概览 */
.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-icon {
  font-size: 2rem;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--green-50);
  border-radius: 12px;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  color: var(--green-700);
  line-height: 1;
}

.stat-label {
  color: var(--gray-600);
  font-size: 0.9rem;
  margin-top: 0.25rem;
}

/* 图表样式 */
.charts-section {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.charts-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--border);
}

.charts-header h2 {
  margin: 0;
  color: var(--gray-800);
  font-size: 1.75rem;
  font-weight: 600;
}

.chart-type-selector {
  display: flex;
  gap: 0.5rem;
  background: var(--gray-100);
  padding: 0.25rem;
  border-radius: 8px;
}

.chart-type-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  background: transparent;
  color: var(--gray-600);
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.chart-type-btn:hover {
  background: white;
  color: var(--gray-800);
}

.chart-type-btn.active {
  background: var(--green-600);
  color: white;
  box-shadow: 0 2px 4px rgba(22, 163, 74, 0.3);
}

.chart-container {
  width: 100%;
}

.chart-wrapper {
  background: var(--gray-50);
  padding: 2rem;
  border-radius: 12px;
  min-height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.no-data {
  text-align: center;
  color: var(--gray-500);
  font-style: italic;
  font-size: 1.1rem;
}

/* 详细统计 */
.detailed-stats {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.detailed-stats h3 {
  margin: 0 0 1.5rem 0;
  color: var(--gray-800);
  font-size: 1.5rem;
  font-weight: 600;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.stat-detail {
  background: var(--gray-50);
  padding: 1.5rem;
  border-radius: 12px;
}

.stat-detail h4 {
  margin: 0 0 1rem 0;
  color: var(--gray-700);
  font-size: 1.1rem;
  font-weight: 600;
}

.rating-breakdown {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.rating-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  background: white;
  border-radius: 8px;
  border: 1px solid var(--gray-200);
}

.rating-stars {
  font-size: 1.2rem;
  min-width: 80px;
}

.rating-count {
  font-weight: 500;
  color: var(--gray-700);
}

.rating-percentage {
  font-weight: 600;
  color: var(--green-700);
}

.topic-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.topic-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  background: white;
  border-radius: 8px;
  border: 1px solid var(--gray-200);
}

.topic-name {
  font-weight: 500;
  color: var(--gray-700);
}

.topic-rating {
  font-weight: 600;
  color: var(--green-700);
  font-size: 1.1rem;
}

.topic-count {
  font-size: 0.9rem;
  color: var(--gray-600);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .admin__bar-inner {
    flex-direction: column;
    gap: 1rem;
  }
  
  .admin__actions {
    justify-content: center;
  }
  
  .page-header h1 {
    font-size: 2rem;
  }
  
  .charts-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .chart-type-selector {
    justify-content: center;
  }
  
  .chart-wrapper {
    min-height: 400px;
    padding: 1rem;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .rating-item, .topic-item {
    flex-direction: column;
    gap: 0.5rem;
    text-align: center;
  }
}

/* 导出模态框样式 */
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
  padding: 1rem;
}

.export-modal {
  background: white;
  border-radius: 12px;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid var(--gray-200);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--gray-800);
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--gray-400);
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.modal-close:hover:not(:disabled) {
  background: var(--gray-100);
  color: var(--gray-600);
}

.modal-close:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-body {
  padding: 2rem;
}

.export-description {
  color: var(--gray-600);
  margin-bottom: 2rem;
  font-size: 1.1rem;
}

.export-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.export-option {
  border: 2px solid var(--gray-200);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: all 0.2s ease;
}

.export-option:hover {
  border-color: var(--green-300);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.export-option:first-child {
  border-color: var(--green-200);
  background: var(--green-50);
}

.option-icon {
  font-size: 2rem;
  text-align: center;
}

.option-content h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--gray-800);
}

.option-content p {
  margin: 0 0 1rem 0;
  color: var(--gray-600);
  font-size: 0.95rem;
}

.option-content ul {
  margin: 0;
  padding-left: 1.25rem;
  color: var(--gray-600);
  font-size: 0.9rem;
}

.option-content li {
  margin-bottom: 0.25rem;
}

.export-progress {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid var(--gray-200);
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: var(--gray-200);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--green-500), var(--green-600));
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  text-align: center;
  margin: 0;
  color: var(--gray-600);
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .modal-overlay {
    padding: 0.5rem;
  }
  
  .export-modal {
    max-height: 95vh;
  }
  
  .modal-header {
    padding: 1rem 1.5rem;
  }
  
  .modal-body {
    padding: 1.5rem;
  }
  
  .export-options {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .export-option {
    padding: 1rem;
  }
  
  .modal-header h3 {
    font-size: 1.25rem;
  }
}
</style>
