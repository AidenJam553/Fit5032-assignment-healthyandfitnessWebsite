<script setup>
import { ref, onMounted, watch } from 'vue'

const props = defineProps({
  location: {
    type: Object,
    default: null
  },
  gyms: {
    type: Array,
    default: () => []
  },
  height: {
    type: String,
    default: '200px'
  }
})

const emit = defineEmits(['click'])

const mapContainer = ref(null)
const map = ref(null)
const markers = ref([])
const userMarker = ref(null)
const isLoading = ref(true)
const mapError = ref(false)

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY_HERE'

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

// Initialize mini map
const initMap = async () => {
  try {
    await loadGoogleMapsAPI()
    
    const center = props.location || { lat: -37.8136, lng: 144.9631 }
    
    map.value = new google.maps.Map(mapContainer.value, {
      center: center,
      zoom: 13,
      disableDefaultUI: true,
      gestureHandling: 'none',
      zoomControl: false,
      mapTypeControl: false,
      scaleControl: false,
      streetViewControl: false,
      rotateControl: false,
      fullscreenControl: false,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    })

    // Add click listener to map
    map.value.addListener('click', () => {
      emit('click')
    })

    // Add user location marker if available
    if (props.location) {
      addUserMarker(props.location)
    }

    // Add gym markers
    addGymMarkers()
    
    isLoading.value = false
  } catch (error) {
    console.error('Error initializing mini map:', error)
    mapError.value = true
    isLoading.value = false
  }
}

// Add user location marker
const addUserMarker = (location) => {
  if (!map.value) return
  
  if (userMarker.value) {
    userMarker.value.setMap(null)
  }

  userMarker.value = new google.maps.Marker({
    position: location,
    map: map.value,
    title: 'Your Location',
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 8,
      fillColor: '#4285F4',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
    },
    zIndex: 1000
  })
}

// Add gym markers
const addGymMarkers = () => {
  if (!map.value || !props.gyms || props.gyms.length === 0) return

  // Clear existing markers
  markers.value.forEach(marker => marker.setMap(null))
  markers.value = []

  // Add up to 3 nearest gyms
  const gymsToShow = props.gyms.slice(0, 3)
  
  gymsToShow.forEach(gym => {
    const marker = new google.maps.Marker({
      position: { lat: gym.lat, lng: gym.lng },
      map: map.value,
      title: gym.name,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 6,
        fillColor: '#16a34a',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      }
    })
    
    markers.value.push(marker)
  })
}

// Watch for location changes
watch(() => props.location, (newLocation) => {
  if (map.value && newLocation) {
    map.value.setCenter(newLocation)
    addUserMarker(newLocation)
  }
}, { deep: true })

// Watch for gym changes
watch(() => props.gyms, () => {
  addGymMarkers()
}, { deep: true })

onMounted(() => {
  initMap()
})
</script>

<template>
  <div class="mini-map-wrapper" @click="emit('click')">
    <div v-if="isLoading" class="mini-map-loading">
      <div class="spinner-mini"></div>
      <p>Loading map...</p>
    </div>
    
    <div v-else-if="mapError" class="mini-map-error">
      <div class="error-icon">⚠️</div>
      <p>Map unavailable</p>
    </div>
    
    <div ref="mapContainer" class="mini-map-container" :style="{ height: height }"></div>
    
    <!-- Click overlay hint -->
    <div class="map-overlay">
      <div class="map-hint">
        <svg class="hint-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
        <span>Click to explore</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mini-map-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid var(--green-200);
  transition: all 0.3s ease;
}

.mini-map-wrapper:hover {
  border-color: var(--green-500);
  box-shadow: 0 4px 12px rgba(22, 163, 74, 0.2);
  transform: translateY(-2px);
}

.mini-map-container {
  width: 100%;
  height: 100%;
}

.mini-map-loading,
.mini-map-error {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  z-index: 10;
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

.mini-map-loading p,
.mini-map-error p {
  margin: 0;
  font-size: 0.75rem;
  color: var(--green-700);
  font-weight: 500;
}

.error-icon {
  font-size: 24px;
}

.map-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.6), transparent);
  padding: 12px;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.mini-map-wrapper:hover .map-overlay {
  opacity: 1;
}

.map-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
}

.hint-icon {
  width: 16px;
  height: 16px;
  stroke-width: 2;
}
</style>






