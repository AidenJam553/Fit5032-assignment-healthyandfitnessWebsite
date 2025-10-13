<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import SiteHeader from '@/components/SiteHeader.vue'
import Card from '@/components/Card.vue'
import Button from '@/components/Button.vue'
import MiniMap from '@/components/MiniMap.vue'
import { getCurrentUser } from '@/lib/auth'
import { useLessonsStore } from '@/lib/stores/lessons'
import { useGymsStore } from '@/lib/stores/gyms'
import { useRouter } from 'vue-router'

const overlayOpacity = ref(0)
const isLoaded = ref(false)
const animatedElements = ref([])
const user = ref(null)
const lessonsStore = useLessonsStore()
const gymsStore = useGymsStore()
const router = useRouter()
const nearbyGyms = ref([])
const loadingGyms = ref(false)
const placesService = ref(null)

// Check if user is logged in
const isLoggedIn = computed(() => !!user.value)

// Get top 3 nearest gyms
const top3NearestGyms = computed(() => {
  return nearbyGyms.value.slice(0, 3)
})

// Google Maps API Key
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY_HERE'

// Get top 3 courses by rating
const topRatedCourses = computed(() => {
  const courses = lessonsStore.courses || []
  
  if (courses.length === 0) {
    return []
  }
  
  // Create array with courses and their ratings
  const coursesWithRatings = courses.map(course => ({
    ...course,
    avgRating: lessonsStore.averageRating(course.id) || 0,
    ratingCount: lessonsStore.ratingCount(course.id) || 0
  }))
  
  // Sort by average rating (desc), then by rating count (desc)
  // If no ratings yet, sort by creation order
  const sorted = coursesWithRatings.sort((a, b) => {
    // If both have ratings, sort by rating
    if (b.avgRating !== a.avgRating) {
      return b.avgRating - a.avgRating
    }
    if (b.ratingCount !== a.ratingCount) {
      return b.ratingCount - a.ratingCount
    }
    // Fallback to original order if no ratings
    return 0
  })
  
  // Return top 3
  return sorted.slice(0, 3)
})

function updateUser() {
  user.value = getCurrentUser()
  if (user.value) {
    lessonsStore.setCurrentUser(user.value)
  }
}

function updateOpacity() {
  const max = Math.max(200, window.innerHeight * 0.8)
  const y = window.scrollY || 0
  overlayOpacity.value = Math.min(1, Math.max(0, y / max))
}

function observeElements() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in')
        observer.unobserve(entry.target)
      }
    })
  }, { 
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  })

  // Observe all animatable elements
  document.querySelectorAll('.animate-on-scroll').forEach(el => {
    observer.observe(el)
  })
}

function getDifficultyColor(difficulty) {
  const colors = {
    'Beginner': 'beginner',
    'Intermediate': 'intermediate',
    'Advanced': 'advanced'
  }
  return colors[difficulty] || 'beginner'
}

function goToCourse(courseId) {
  router.push({ name: 'lesson-detail', params: { id: courseId } })
}

// Handle gyms found from map
function handleGymsFound(gyms) {
  // Sort by distance and store
  if (gymsStore.location) {
    const gymsWithDistance = gyms.map(gym => ({
      ...gym,
      distance: calculateDistance(
        gymsStore.location.lat,
        gymsStore.location.lng,
        gym.lat,
        gym.lng
      )
    }))
    nearbyGyms.value = gymsWithDistance.sort((a, b) => 
      parseFloat(a.distance) - parseFloat(b.distance)
    )
  } else {
    nearbyGyms.value = gyms
  }
}

// Calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return (R * c).toFixed(2)
}

// Load Google Maps API
const loadGoogleMapsAPI = () => {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps && window.google.maps.Map) {
      resolve()
      return
    }

    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        setTimeout(() => {
          if (window.google && window.google.maps && window.google.maps.Map) {
            resolve()
          } else {
            reject(new Error('Google Maps API loaded but not initialized'))
          }
        }, 100)
      })
      existingScript.addEventListener('error', () => {
        reject(new Error('Failed to load Google Maps API'))
      })
      return
    }

    const callbackName = 'initGoogleMapsCallback_' + Date.now()
    window[callbackName] = () => {
      delete window[callbackName]
      resolve()
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places&callback=${callbackName}`
    script.async = true
    script.defer = true
    script.onerror = () => {
      delete window[callbackName]
      reject(new Error('Failed to load Google Maps API'))
    }
    document.head.appendChild(script)
  })
}

// Search for nearby gyms using Places API
async function searchNearbyGyms(location) {
  if (!location) return

  loadingGyms.value = true
  
  try {
    await loadGoogleMapsAPI()
    
    // Create a temporary div for the PlacesService
    if (!placesService.value) {
      const div = document.createElement('div')
      placesService.value = new google.maps.places.PlacesService(div)
    }

    const request = {
      location: new google.maps.LatLng(location.lat, location.lng),
      radius: 5000, // 5km radius
      type: 'gym',
      keyword: 'fitness gym'
    }

    placesService.value.nearbySearch(request, (results, status) => {
      loadingGyms.value = false
      
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        console.log('Found real gyms from Places API:', results.length)
        
        // Process and sort gyms by distance
        const gymsWithDistance = results.map(place => {
          const distance = calculateDistance(
            location.lat,
            location.lng,
            place.geometry.location.lat(),
            place.geometry.location.lng()
          )
          
          return {
            id: place.place_id,
            name: place.name,
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            rating: place.rating || 0,
            address: place.vicinity,
            distance: distance,
            isRealPlace: true
          }
        })
        
        // Sort by distance and take top results
        nearbyGyms.value = gymsWithDistance.sort((a, b) => 
          parseFloat(a.distance) - parseFloat(b.distance)
        )
        
        console.log('Top 3 nearest gyms:', nearbyGyms.value.slice(0, 3))
      } else {
        console.warn('Places API search failed:', status)
        nearbyGyms.value = []
      }
    })
  } catch (error) {
    console.error('Error searching for gyms:', error)
    loadingGyms.value = false
    nearbyGyms.value = []
  }
}

onMounted(async () => {
  updateUser()
  updateOpacity()
  window.addEventListener('scroll', updateOpacity, { passive: true })
  window.addEventListener('storage', updateUser)
  
  // Trigger initial hero animation immediately
  setTimeout(() => {
    isLoaded.value = true
  }, 100)
  
  // Set up scroll animations
  setTimeout(() => {
    observeElements()
  }, 300)
  
  // Load data in parallel for better performance
  Promise.all([
    // Load courses (fast)
    lessonsStore.initializeCourses().then(async () => {
      // Load ratings for top courses in parallel (not all courses)
      const courses = lessonsStore.courses || []
      if (courses.length > 0) {
        // Only load ratings for the first 10 courses in parallel
        // This is enough to find top 3 rated courses
        const topCourses = courses.slice(0, 10)
        await Promise.all(
          topCourses.map(course => lessonsStore.loadCourseRatings(course.id))
        )
      }
    }),
    
    // Load gym data in parallel (independent operation)
    gymsStore.locate().then(async (locationSuccess) => {
      if (locationSuccess && gymsStore.location) {
        await searchNearbyGyms(gymsStore.location)
      }
    })
  ]).catch(error => {
    console.error('Error loading homepage data:', error)
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateOpacity)
  window.removeEventListener('storage', updateUser)
  lessonsStore.stopRealtimeListeners()
})
</script>

<template>
  <div class="page">
    <SiteHeader />

    <section class="hero">
      <div class="container hero__inner" :class="{ 'hero-loaded': isLoaded }">
        <h1 class="hero__title" v-if="!isLoggedIn">Learn and manage your health here!</h1>
        <h1 class="hero__title" v-else>Welcome! {{ user.username || user.email }}</h1>
        <p class="hero__subtitle">
          Learn about health and nutrition, manage your weight and exercise,
          and become a better version of yourself.
        </p>
        <div class="hero__actions" v-if="!isLoggedIn">
          <Button variant="primary" size="medium" tag="router-link" to="/login">Log In</Button>
          <Button variant="secondary" size="medium" tag="router-link" to="/register">Create Account</Button>
        </div>
        <div class="hero__actions" v-else>
          <Button variant="primary" size="medium" tag="router-link" to="/learn">Start Learning</Button>
          <Button variant="secondary" size="medium" tag="router-link" to="/record">Track Progress</Button>
        </div>
      </div>
      <div class="hero__overlay" :style="{ opacity: overlayOpacity }"></div>
      <div class="scroll-cue" aria-hidden="true">Scroll</div>
    </section>

    <main class="container content">
      <section class="section courses animate-on-scroll">
        <div class="section__header">
          <h2 class="section__title">Top Rated Courses</h2>
          <router-link class="section__more" to="/learn">View more &gt;&gt;</router-link>
        </div>
        <div class="card-grid">
          <!-- Show placeholder only if loading and no courses -->
          <template v-if="lessonsStore.loading && topRatedCourses.length === 0">
            <Card variant="elevated" size="large" class="stagger-1">
              <div class="card-placeholder loading-shimmer" aria-label="Course placeholder"></div>
            </Card>
            <Card variant="elevated" size="large" class="stagger-2">
              <div class="card-placeholder loading-shimmer" aria-label="Course placeholder"></div>
            </Card>
            <Card variant="elevated" size="large" class="stagger-3">
              <div class="card-placeholder loading-shimmer" aria-label="Course placeholder"></div>
            </Card>
          </template>
          
          <!-- Show actual courses -->
          <template v-else>
            <Card 
              v-for="(course, index) in topRatedCourses" 
              :key="course.id"
              variant="elevated" 
              size="large" 
              :class="`stagger-${index + 1}`" 
              clickable 
              hover
              @click="goToCourse(course.id)"
            >
              <div class="course-card">
                <div class="course-header" :class="`difficulty-${getDifficultyColor(course.difficulty)}`">
                  <div class="course-badge">{{ course.difficulty }}</div>
                  <div class="course-duration">{{ course.minutes }}m</div>
                </div>
                <div class="course-content">
                  <div class="course-topic-badge">{{ course.topic }}</div>
                  <h3 class="course-title">{{ course.title }}</h3>
                  <div class="course-rating">
                    <div class="stars">
                      <span v-for="i in 5" :key="i" class="star" :class="{ 'filled': i <= course.avgRating }">★</span>
                    </div>
                    <span class="rating-text">{{ course.avgRating.toFixed(1) }}</span>
                    <span class="rating-count">({{ course.ratingCount }})</span>
                  </div>
                </div>
              </div>
            </Card>
          </template>
        </div>
      </section>

      <section class="section two-col animate-on-scroll">
        <Card variant="default" size="medium" class="stagger-1" clickable hover>
          <template #header>
            <h3 class="panel__title">My Record</h3>
          </template>
          <ul class="list-placeholder">
            <li></li>
            <li></li>
            <li></li>
            <li></li>
            <li></li>
          </ul>
        </Card>

        <Card variant="default" size="medium" class="explore stagger-2">
          <template #header>
            <div class="panel__header">
              <h3 class="panel__title">Find a Gym</h3>
              <router-link to="/explore" class="panel__link">View all &gt;</router-link>
            </div>
          </template>
          <div class="explore__content">
            <!-- Mini Map Section -->
            <div class="mini-map-section">
              <MiniMap 
                :location="gymsStore.location" 
                :gyms="nearbyGyms"
                height="200px"
                @click="router.push('/explore')"
              />
            </div>
            
            <!-- Nearby Gyms List -->
            <div class="nearby-gyms">
              <div class="gyms-header">
                <h4>Nearby Gyms</h4>
                <span v-if="top3NearestGyms.length > 0" class="gyms-count">{{ top3NearestGyms.length }}</span>
              </div>
              
              <!-- Loading State -->
              <div v-if="loadingGyms" class="gyms-loading">
                <div class="spinner-mini"></div>
                <p>Searching nearby gyms...</p>
              </div>
              
              <!-- Gyms List -->
              <div v-else-if="top3NearestGyms.length > 0" class="gyms-list">
                <div 
                  v-for="(gym, index) in top3NearestGyms" 
                  :key="gym.id"
                  class="gym-item-mini"
                  @click="router.push('/explore')"
                >
                  <div class="gym-rank-mini">{{ index + 1 }}</div>
                  <div class="gym-info-mini">
                    <h5>{{ gym.name }}</h5>
                    <div class="gym-meta-mini">
                      <span v-if="gym.rating" class="gym-rating">⭐ {{ gym.rating.toFixed(1) }}</span>
                      <span v-if="gym.distance" class="gym-distance">📍 {{ gym.distance }} km</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Empty State -->
              <div v-else class="no-gyms-mini">
                <div class="no-gyms-icon">🏋️</div>
                <p v-if="!gymsStore.location">Enable location to find nearby gyms</p>
                <p v-else>No gyms found nearby</p>
                <button 
                  v-if="!gymsStore.location"
                  @click="gymsStore.locate().then(loc => loc && searchNearbyGyms(gymsStore.location))"
                  class="retry-btn"
                >
                  Enable Location
                </button>
              </div>
            </div>
          </div>
        </Card>
      </section>
    </main>

    <footer class="footer">
      <div class="container">© 2025 Healthy & Fitness</div>
    </footer>
  </div>
</template>

<style scoped>
:root {
  --green-700: #15803d;
  --green-600: #16a34a;
  --green-500: #22c55e;
  --green-50: #f0fdf4;
  --green-100: #dcfce7;
  --text-900: #0f172a;
  --text-700: #334155;
  --muted: #64748b;
  --border: #e2e8f0;
}

.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 16px;
}

.topbar {
  background: #ffffff;
  border-bottom: 1px solid var(--green-100);
}
.topbar__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
}
.logo { display: flex; align-items: center; gap: 12px; }
.logo__img { height: 36px; width: auto; display: block; }
.brand__text {
  font-family: 'Dancing Script', cursive;
  font-size: 24px;
  font-style: italic;
  color: #15803d;
  letter-spacing: .3px;
}
.nav {
  display: none;
  gap: 20px;
}
.nav__link {
  color: #0f172a;
  text-decoration: none;
}
.nav__link.active {
  color: var(--green-700);
  font-weight: 600;
}
.nav__link:hover { color: var(--green-700); text-decoration: underline; }

.btn {
  border: 1px solid transparent;
  background: var(--green-700);
  color: #fff;
  padding: 10px 16px;
  border-radius: 16px;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateY(0);
}
/* Legacy button styles removed - now using Button component */
.btn:focus { outline: 2px solid var(--green-500); outline-offset: 2px; }

.btn--outline {
  background: #ffffff;
  color: var(--green-700);
  border-color: var(--green-700);
}
/* Legacy button styles removed - now using Button component */

.btn--ghost {
  background: white;
  color: var(--green-700);
  border-color: var(--green-100);
}
.btn--primary { background: var(--green-600); }

.page { background: var(--green-50); color: #000; }
.hero {
  position: relative;
  background: url('/hero.png') center/cover no-repeat;
  border-bottom: 1px solid var(--green-100);
  min-height: 100vh;
  display: flex;
  align-items: center;
}
.hero__inner {
  padding: 56px 0 64px;
  text-align: left;
}
@media (min-width: 992px) {
  .hero__inner { transform: translate(-3cm, -1.5cm); }
}
.hero__title {
  font-family: 'Manrope', ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
  font-size: 44px;
  line-height: 1.3;
  color: #0b1220;
  letter-spacing: .2px;
  font-weight: 800;
  margin: 0 0 14px 0;
}
.hero__subtitle {
  font-family: 'Manrope', ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
  color: #0b1220;
  max-width: 720px;
  font-size: 18px;
  line-height: 1.85;
}
.hero__actions { display: flex; gap: 12px; margin-top: 20px; }

.scroll-cue { 
  position: absolute; 
  bottom: 16px; 
  left: 50%; 
  transform: translateX(-50%); 
  color: var(--green-800); 
  font-size: 12px; 
  letter-spacing: .15em; 
  animation: float 3s ease-in-out infinite;
  opacity: 0.8;
}
.scroll-cue::after { 
  content: ''; 
  display: block; 
  width: 24px; 
  height: 24px; 
  margin: 6px auto 0; 
  border: 2px solid var(--green-700); 
  border-left: 0; 
  border-top: 0; 
  transform: rotate(45deg); 
  animation: bob 2s ease-in-out infinite; 
}

@keyframes bob { 
  0%, 100% { 
    transform: rotate(45deg) translate(0, 0); 
  } 
  50% { 
    transform: rotate(45deg) translate(4px, 4px); 
  } 
}

@keyframes float {
  0%, 100% {
    transform: translateX(-50%) translateY(0px);
  }
  50% {
    transform: translateX(-50%) translateY(-8px);
  }
}

/* bottom fade to reveal content on scroll */
.hero::after { content: ''; position: absolute; left: 0; right: 0; bottom: -1px; height: 160px; background: linear-gradient(to bottom, rgba(255,255,255,0), #ffffff 60%, #ffffff); pointer-events: none; }
.hero__overlay { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(240,253,244,0.8) 0%, rgba(255,255,255,0.9) 60%, #ffffff 100%); transition: opacity .2s linear; pointer-events: none; }

.content { padding: 28px 0 56px; }

.section { background: #ffffff; border: 1px solid var(--green-100); border-radius: 12px; padding: 16px; box-shadow: 0 6px 18px rgba(0,0,0,0.08); }
.section + .section { margin-top: 20px; }
.section__header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.section__title { margin: 0; font-size: 20px; color: #0f172a; }
.section__more { color: var(--green-700); text-decoration: none; }

.card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.card-placeholder {
  background: var(--green-100);
  border-radius: 12px;
  height: 160px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.card-placeholder.loading-shimmer {
  background: linear-gradient(90deg, 
    var(--green-100) 0%, 
    var(--green-200) 50%, 
    var(--green-100) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

/* Course Card Styles */
.course-card {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.course-header {
  height: 100px;
  position: relative;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-radius: 12px 12px 0 0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: -16px -16px 0 -16px;
}

.course-header.difficulty-beginner {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.course-header.difficulty-intermediate {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.course-header.difficulty-advanced {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.course-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(10px);
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.course-duration {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
}

.course-content {
  padding: 16px 0 0 0;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.course-topic-badge {
  display: inline-block;
  background: var(--green-100);
  color: var(--green-700);
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 10px;
  align-self: flex-start;
}

.course-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-900);
  margin: 0 0 12px 0;
  line-height: 1.4;
  flex: 1;
}

.course-rating {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid var(--green-100);
}

.stars {
  display: flex;
  gap: 2px;
}

.star {
  color: #d1d5db;
  font-size: 14px;
  transition: color 0.2s ease;
}

.star.filled {
  color: #fbbf24;
}

.rating-text {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-900);
  margin-left: 2px;
}

.rating-count {
  font-size: 0.75rem;
  color: var(--muted);
}

.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 20px;
}
.panel__title { margin: 0 0 12px 0; font-size: 18px; }

.list-placeholder { list-style: none; padding: 0; margin: 0; display: grid; gap: 10px; }
.list-placeholder li { height: 12px; background: var(--green-100); border-radius: 6px; }

.panel__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.panel__link {
  color: var(--green-700);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 600;
  transition: color 0.2s;
}

.panel__link:hover {
  color: var(--green-600);
  text-decoration: underline;
}

.explore__content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
}

/* Mini Map Styles */
.mini-map-section {
  min-height: 200px;
}

/* Nearby Gyms Styles */
.nearby-gyms {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.gyms-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--green-100);
}

.gyms-header h4 {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-900);
}

.gyms-count {
  background: var(--green-600);
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 700;
}

.gyms-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.gym-item-mini {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: var(--green-50);
  border-radius: 8px;
  border: 1px solid var(--green-100);
  transition: all 0.2s;
  cursor: pointer;
}

.gym-item-mini:hover {
  background: var(--green-100);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.gym-rank-mini {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: var(--green-600);
  color: white;
  border-radius: 50%;
  font-size: 0.7rem;
  font-weight: 700;
  flex-shrink: 0;
}

.gym-info-mini {
  flex: 1;
  min-width: 0;
}

.gym-info-mini h5 {
  margin: 0 0 3px 0;
  font-size: 0.8rem;
  color: var(--text-900);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}

.gym-meta-mini {
  display: flex;
  gap: 6px;
  font-size: 0.65rem;
  color: var(--muted);
}

.gym-rating {
  color: #f59e0b;
  font-weight: 600;
}

.gym-distance {
  color: var(--green-700);
  font-weight: 600;
}

.no-gyms-mini {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  text-align: center;
}

.no-gyms-icon {
  font-size: 32px;
  margin-bottom: 8px;
  opacity: 0.5;
}

.no-gyms-mini p {
  margin: 0;
  font-size: 0.875rem;
  color: var(--muted);
}

.gyms-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  gap: 10px;
}

.gyms-loading p {
  margin: 0;
  font-size: 0.875rem;
  color: var(--green-700);
  font-weight: 500;
}

.spinner-mini {
  width: 24px;
  height: 24px;
  border: 3px solid var(--green-100);
  border-top-color: var(--green-600);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.retry-btn {
  margin-top: 8px;
  padding: 8px 16px;
  background: var(--green-600);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.retry-btn:hover {
  background: var(--green-700);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(22, 163, 74, 0.2);
}

.footer { border-top: 1px solid var(--green-100); padding: 20px 0; color: #2f4d3b; font-size: 14px; }

@media (min-width: 768px) {
  .nav { display: flex; }
}

@media (max-width: 767px) {
  .hero__inner {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .hero__title { 
    font-size: 32px; 
    line-height: 1.3; 
    margin-bottom: 20px;
    font-weight: 700;
    text-align: center;
  }
  
  .hero__subtitle {
    font-size: 17px;
    line-height: 1.6;
    margin-bottom: 32px;
    padding-right: 0;
    opacity: 0.9;
    text-align: center;
    max-width: 300px;
  }
  
  .hero__actions {
    flex-direction: column;
    gap: 16px;
    margin-top: 32px;
    width: 100%;
    max-width: 280px;
    align-items: center;
  }
  
  .hero__actions .btn {
    width: 100%;
    padding: 16px 24px;
    font-size: 16px;
    font-weight: 600;
    justify-content: center;
    min-height: 52px;
    border-radius: 12px;
    text-decoration: none;
    display: flex;
    align-items: center;
  }
  
  .hero__actions .btn--primary {
    box-shadow: 0 4px 14px rgba(22, 163, 74, 0.25);
  }
  
  .hero__actions .btn--ghost {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    border: 2px solid rgba(22, 163, 74, 0.2);
  }
  
  .card-grid { grid-template-columns: 1fr; }
  .two-col { grid-template-columns: 1fr; }
  .explore__content { grid-template-columns: 1fr; }
}

/* Animation Styles */
.hero__inner {
  opacity: 0;
  transform: translate(-3cm, -1.5cm) translateY(40px);
  transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.hero__inner.hero-loaded {
  opacity: 1;
  transform: translate(-3cm, -1.5cm) translateY(0);
}

.hero__title {
  transition-delay: 0.1s;
}

.hero__subtitle {
  transition-delay: 0.2s;
}

.hero__actions {
  transition-delay: 0.3s;
}

.animate-on-scroll {
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.animate-on-scroll.animate-in {
  opacity: 1;
  transform: translateY(0);
}

.stagger-1 {
  transition-delay: 0.1s;
}

.stagger-2 {
  transition-delay: 0.2s;
}

.stagger-3 {
  transition-delay: 0.3s;
}

.card-placeholder,
.panel {
  transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.animate-in .card-placeholder,
.animate-in .panel {
  opacity: 1;
  transform: translateY(0);
}

@media (max-width: 991px) {
  .hero__inner {
    transform: translateY(40px);
    padding: 40px 0 48px;
  }
  
  .hero__inner.hero-loaded {
    transform: translateY(0);
  }
}

/* Extra small screens optimization */
@media (max-width: 480px) {
  .hero__title { 
    font-size: 28px; 
    line-height: 1.25;
    margin-bottom: 18px;
  }
  
  .hero__subtitle {
    font-size: 16px;
    line-height: 1.5;
    margin-bottom: 28px;
    padding-right: 0;
    max-width: 280px;
  }
  
  .hero__inner {
    padding: 40px 0 48px;
  }
  
  .hero__actions {
    margin-top: 28px;
    gap: 14px;
    max-width: 260px;
  }
  
  .hero__actions .btn {
    padding: 14px 20px;
    font-size: 15px;
    min-height: 48px;
    border-radius: 10px;
  }
  
  .container {
    padding: 0 16px;
  }
}
</style>


