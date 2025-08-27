<script setup>
import { ref, onMounted, computed } from 'vue'
import SiteHeader from '@/components/SiteHeader.vue'
import { getCurrentUser } from '@/lib/auth.js'
import { useLessonsStore } from '@/lib/stores/lessons.js'

const currentUser = ref(null)
const lessons = useLessonsStore()

// 获取用户的课单课程
const userWishlistLessons = computed(() => {
  if (!currentUser.value) return []
  return lessons.getUserWishlistLessons(currentUser.value.id)
})

// 计算课单进度
const wishlistProgress = computed(() => {
  if (!currentUser.value || userWishlistLessons.value.length === 0) return 0
  const totalProgress = userWishlistLessons.value.reduce((sum, lesson) => {
    return sum + (lessons.progress[lesson.id] || 0)
  }, 0)
  return Math.round(totalProgress / userWishlistLessons.value.length)
})

onMounted(() => {
  currentUser.value = getCurrentUser()
  lessons.seedIfEmpty()
})
</script>

<template>
  <div class="page">
    <SiteHeader />
    <div class="container record">
      <section class="kpis">
        <div class="kpi">
          <div class="kpi__label">Current Weight</div>
          <div class="kpi__value">68.5 <span>KG</span></div>
        </div>
        <div class="kpi">
          <div class="kpi__label">Weekly Workouts</div>
          <div class="kpi__value">4 <span>Sessions</span></div>
        </div>
        <div class="kpi">
          <div class="kpi__label">Avg Calories</div>
          <div class="kpi__value">1,850 <span>Kcal</span></div>
        </div>
      </section>

      <section class="grid">
        <div class="panel profile">
          <div class="profile__row">
            <div class="avatar">
              {{ currentUser ? currentUser.username?.charAt(0).toUpperCase() || 'U' : 'U' }}
            </div>
            <div>
              <h3 class="title">{{ currentUser ? currentUser.username || 'Guest User' : 'Guest User' }}</h3>
              <div class="muted">{{ currentUser ? (currentUser.role === 'admin' ? 'Administrator' : 'Member') : 'Guest' }}</div>
              <div class="user-email" v-if="currentUser && currentUser.email">{{ currentUser.email }}</div>
            </div>
          </div>
          <div class="stats">
            <div class="stat"><span>BMI</span><div class="bar"><i style="width:42%"></i></div></div>
            <div class="stat"><span>Height</span><div class="bar"><i style="width:70%"></i></div></div>
            <div class="stat"><span>Weight</span><div class="bar"><i style="width:50%"></i></div></div>
            <div class="stat"><span>Basal metabolism</span><div class="bar"><i style="width:60%"></i></div></div>
            <div class="stat"><span>Heart rate</span><div class="bar"><i style="width:35%"></i></div></div>
          </div>
        </div>

        <div class="panel weight">
          <h3 class="title">Weight Log</h3>
          <div class="chart placeholder"></div>
          <div class="weight__now"><strong>68.50</strong> KG</div>
        </div>

        <div class="panel recipe">
          <h3 class="title">My Recipe</h3>
          <ul class="meal">
            <li><strong>Breakfast</strong><span>300 Kcal</span></li>
            <li><strong>Lunch</strong><span>500 Kcal</span></li>
            <li><strong>Dinner</strong><span>400 Kcal</span></li>
            <li><strong>Snack</strong><span>200 Kcal</span></li>
          </ul>
        </div>

        <div class="panel learning">
          <h3 class="title">My Courses</h3>
          <div class="learning-progress">
            <div class="progress-summary">
              <div class="progress-circle">
                <svg viewBox="0 0 36 36">
                  <path class="progress-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                  <path 
                    class="progress-fill" 
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    :stroke-dasharray="`${wishlistProgress * 1.1}, 100`"
                  />
                </svg>
                <div class="progress-text">{{ wishlistProgress }}%</div>
              </div>
              <div class="progress-info">
                <div class="progress-label">Overall Progress</div>
                <div class="course-count">{{ userWishlistLessons.length }} courses</div>
              </div>
            </div>
          </div>
          
          <div class="course-list" v-if="userWishlistLessons.length > 0">
            <div v-for="course in userWishlistLessons.slice(0, 3)" :key="course.id" class="course-item">
              <div class="course-info">
                <div class="course-title">{{ course.title }}</div>
                <div class="course-meta">{{ course.difficulty }} • {{ course.minutes }}m</div>
              </div>
              <div class="course-progress">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: `${lessons.progress[course.id] || 0}%` }"></div>
                </div>
                <span class="progress-text">{{ lessons.progress[course.id] || 0 }}%</span>
              </div>
            </div>
            <div v-if="userWishlistLessons.length > 3" class="more-courses">
              +{{ userWishlistLessons.length - 3 }} more courses
            </div>
          </div>
          
          <div v-else class="empty-wishlist">
            <div class="empty-icon">📚</div>
            <div class="empty-text">No courses added yet</div>
            <div class="empty-subtext">Add courses to your list to track progress</div>
          </div>
        </div>

        <div class="panel calories">
          <h3 class="title">Diet & Exercise Log</h3>
          <div class="macros">
            <div>Carb</div>
            <div class="macros__bar"><i style="width:90%"></i></div>
            <div>Proteins</div>
            <div class="macros__bar"><i style="width:65%"></i></div>
            <div>Fats</div>
            <div class="macros__bar"><i style="width:40%"></i></div>
          </div>
          <div class="total"><strong>1500</strong> Kcal / <span>2000</span> Kcal</div>
        </div>

        <div class="panel schedule">
          <div class="schedule__header">
            <h3 class="title">Schedule</h3>
            <a href="#">Calendar &gt;</a>
          </div>
          <div class="schedule__list">
            <div class="entry">
              <strong>40 min | 200 Kcal</strong>
              <div class="muted">Aerobic exercise</div>
            </div>
            <div class="entry">
              <strong>40 min | 200 Kcal</strong>
              <div class="muted">Anaerobic exercise</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.page { background: var(--green-50); min-height: 100vh; }
.record { padding: 24px 0; }
.kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 20px; }
.kpi { background: #fff; border: 1px solid var(--green-100); border-radius: 12px; padding: 16px; box-shadow: var(--shadow-md); }
.kpi__label { color: var(--gray-700); font-size: 12px; }
.kpi__value { font-size: 28px; font-weight: 700; letter-spacing: .4px; }
.kpi__value span { font-size: 12px; font-weight: 500; color: var(--gray-700); margin-left: 4px; }
.grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 20px; }

.panel { padding: 16px; }

.profile { grid-column: span 4; }
.weight { grid-column: span 4; }
.learning { grid-column: span 4; }
.recipe { grid-column: span 6; }
.calories { grid-column: span 6; }
.schedule { grid-column: span 12; }

.avatar { width: 48px; height: 48px; border-radius: 50%; background: var(--green-200); display: grid; place-content: center; font-weight: 700; }
.profile__row { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.title { margin: 0 0 10px 0; }
.muted { color: var(--gray-700); }
.user-email { color: var(--gray-600); font-size: 12px; margin-top: 4px; }

.stats { display: grid; gap: 8px; }
.stat { display: grid; grid-template-columns: 160px 1fr; align-items: center; gap: 10px; }
.bar { height: 8px; background: var(--gray-100); border-radius: 9999px; overflow: hidden; }
.bar i { display: block; height: 100%; background: linear-gradient(90deg, var(--green-200), var(--green-600)); }

.chart.placeholder { height: 120px; border-radius: 12px; background: #eafff1; border: 1px dashed var(--green-600); box-shadow: var(--shadow-sm); }
.weight__now { margin-top: 10px; }

.meal { list-style: none; padding: 0; margin: 0; display: grid; gap: 8px; }
.meal li { display: flex; align-items: center; justify-content: space-between; background: var(--green-100); border-radius: 8px; padding: 8px 12px; }

/* Learning Progress Styles */
.learning-progress { margin-bottom: 16px; }
.progress-summary { display: flex; align-items: center; gap: 16px; }
.progress-circle { position: relative; width: 60px; height: 60px; }
.progress-circle svg { width: 100%; height: 100%; transform: rotate(-90deg); }
.progress-bg { fill: none; stroke: var(--gray-100); stroke-width: 3; }
.progress-fill { fill: none; stroke: var(--green-600); stroke-width: 3; stroke-linecap: round; transition: stroke-dasharray 0.5s ease; }
.progress-text { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 12px; font-weight: 700; color: var(--green-600); }
.progress-info { flex: 1; }
.progress-label { font-size: 14px; font-weight: 600; color: var(--gray-700); margin-bottom: 4px; }
.course-count { font-size: 12px; color: var(--gray-600); }

.course-list { display: flex; flex-direction: column; gap: 12px; }
.course-item { display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--green-50); border-radius: 8px; border: 1px solid var(--green-100); }
.course-info { flex: 1; }
.course-title { font-size: 14px; font-weight: 600; color: var(--gray-800); margin-bottom: 4px; }
.course-meta { font-size: 12px; color: var(--gray-600); }
.course-progress { display: flex; align-items: center; gap: 8px; min-width: 80px; }
.course-progress .progress-bar { width: 50px; height: 4px; background: var(--gray-200); border-radius: 2px; overflow: hidden; }
.course-progress .progress-fill { height: 100%; background: var(--green-600); border-radius: 2px; transition: width 0.3s ease; }
.course-progress .progress-text { font-size: 11px; font-weight: 600; color: var(--green-600); }
.more-courses { text-align: center; font-size: 12px; color: var(--gray-600); padding: 8px; background: var(--green-50); border-radius: 6px; }

.empty-wishlist { text-align: center; padding: 20px; }
.empty-icon { font-size: 2rem; margin-bottom: 8px; }
.empty-text { font-size: 14px; font-weight: 600; color: var(--gray-700); margin-bottom: 4px; }
.empty-subtext { font-size: 12px; color: var(--gray-600); }

.macros { display: grid; grid-template-columns: 100px 1fr; align-items: center; gap: 8px 12px; margin: 8px 0 10px; }
.macros__bar { height: 8px; background: var(--gray-100); border-radius: 999px; overflow: hidden; }
.macros__bar i { display: block; height: 100%; background: linear-gradient(90deg, var(--green-200), var(--green-600)); }

.schedule__header { display: flex; align-items: center; justify-content: space-between; }
.schedule__list { display: grid; gap: 10px; margin-top: 8px; }
.entry { background: var(--green-100); border-radius: 8px; padding: 10px 12px; }

@media (max-width: 1100px) {
  .kpis { grid-template-columns: 1fr 1fr 1fr; }
  .profile, .weight, .learning { grid-column: span 6; }
  .recipe, .calories { grid-column: span 6; }
  .schedule { grid-column: span 12; }
}

@media (max-width: 700px) {
  .kpis { grid-template-columns: 1fr; }
  .grid { grid-template-columns: 1fr; }
  .profile, .weight, .learning, .recipe, .calories, .schedule { grid-column: span 1; }
}
</style>


