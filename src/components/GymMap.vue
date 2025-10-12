<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import Button from '@/components/Button.vue'

const props = defineProps({
  gyms: {
    type: Array,
    required: true
  },
  userLocation: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['selectGym', 'placesFound'])

const mapContainer = ref(null)
const map = ref(null)
const markers = ref([])
const userMarker = ref(null)
const directionsService = ref(null)
const directionsRenderer = ref(null)
const selectedGym = ref(null)
const routeInfo = ref(null)
const infoWindow = ref(null)
const isLoading = ref(true)
const mapError = ref(false)
const placesService = ref(null)
const searchingPlaces = ref(false)
const nearbyGyms = ref([]) // Store nearby gyms sorted by distance

// Google Maps API Key - should be in environment variable
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY_HERE'

// Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371 // Radius of Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  const distance = R * c
  return distance.toFixed(2) // in km
}

// Enrich gyms with distance information
const enrichedGyms = computed(() => {
  if (!props.userLocation) return props.gyms
  
  return props.gyms.map(gym => ({
    ...gym,
    distance: calculateDistance(
      props.userLocation.lat,
      props.userLocation.lng,
      gym.lat,
      gym.lng
    )
  })).sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance))
})

// Load Google Maps API
const loadGoogleMapsAPI = () => {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.google && window.google.maps && window.google.maps.Map) {
      resolve()
      return
    }

    // Check if script is already loading
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
    if (existingScript) {
      // Wait for existing script to load
      existingScript.addEventListener('load', () => {
        // Wait a bit for Google Maps to fully initialize
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

    // Create callback function name
    const callbackName = 'initGoogleMapsCallback_' + Date.now()
    window[callbackName] = () => {
      delete window[callbackName]
      resolve()
    }

    // Load the script with callback
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places,geometry&callback=${callbackName}`
    script.async = true
    script.defer = true
    script.onerror = () => {
      delete window[callbackName]
      reject(new Error('Failed to load Google Maps API'))
    }
    document.head.appendChild(script)
  })
}

// Initialize map
const initMap = async () => {
  try {
    await loadGoogleMapsAPI()
    
    const center = props.userLocation || { lat: -37.8136, lng: 144.9631 }
    
    map.value = new google.maps.Map(mapContainer.value, {
      center: center,
      zoom: 13,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      zoomControl: true,
    })

    directionsService.value = new google.maps.DirectionsService()
    directionsRenderer.value = new google.maps.DirectionsRenderer({
      map: map.value,
      suppressMarkers: false,
      polylineOptions: {
        strokeColor: '#16a34a',
        strokeWeight: 5,
        strokeOpacity: 0.8
      }
    })

    infoWindow.value = new google.maps.InfoWindow()
    placesService.value = new google.maps.places.PlacesService(map.value)

    // Add user location marker if available
    if (props.userLocation) {
      addUserMarker(props.userLocation)
      // Search for nearby real gyms using Places API
      searchNearbyGyms(props.userLocation)
    }

    // Add gym markers (fallback data)
    addGymMarkers(enrichedGyms.value)
    
    isLoading.value = false
  } catch (error) {
    console.error('Error initializing map:', error)
    mapError.value = true
    isLoading.value = false
  }
}

// Add user location marker
const addUserMarker = (location) => {
  if (userMarker.value) {
    userMarker.value.setMap(null)
  }

  userMarker.value = new google.maps.Marker({
    position: location,
    map: map.value,
    title: 'Your Location',
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 10,
      fillColor: '#4285F4',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 3,
    },
    zIndex: 1000
  })

  userMarker.value.addListener('click', () => {
    infoWindow.value.setContent(`
      <div style="padding: 8px;">
        <h3 style="margin: 0 0 8px 0; color: #16a34a;">Your Location</h3>
        <p style="margin: 0; color: #64748b;">Current position</p>
      </div>
    `)
    infoWindow.value.open(map.value, userMarker.value)
  })
}

// Add gym markers
const addGymMarkers = (gyms) => {
  // Clear existing markers
  markers.value.forEach(marker => marker.setMap(null))
  markers.value = []

  gyms.forEach((gym, index) => {
    const marker = new google.maps.Marker({
      position: { lat: gym.lat, lng: gym.lng },
      map: map.value,
      title: gym.name,
      animation: google.maps.Animation.DROP,
      icon: {
        url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
      }
    })

    marker.addListener('click', () => {
      const content = `
        <div style="padding: 12px; max-width: 250px;">
          <h3 style="margin: 0 0 8px 0; color: #16a34a; font-size: 16px;">${gym.name}</h3>
          <div style="margin: 4px 0; color: #64748b; font-size: 14px;">
            <strong>Rating:</strong> ⭐ ${gym.rating}/5
          </div>
          ${gym.distance ? `
            <div style="margin: 4px 0; color: #64748b; font-size: 14px;">
              <strong>Distance:</strong> ${gym.distance} km
            </div>
          ` : ''}
          <div style="margin-top: 12px;">
            <button 
              onclick="window.selectGymFromMap('${gym.id}')"
              style="background: #16a34a; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px; width: 100%;"
            >
              Show Route
            </button>
          </div>
        </div>
      `
      infoWindow.value.setContent(content)
      infoWindow.value.open(map.value, marker)
      
      // Highlight marker
      markers.value.forEach(m => m.setAnimation(null))
      marker.setAnimation(google.maps.Animation.BOUNCE)
      setTimeout(() => marker.setAnimation(null), 2000)
    })

    markers.value.push(marker)
  })
}

// Show route to gym
const showRoute = async (gym) => {
  if (!props.userLocation || !directionsService.value) {
    alert('Unable to get your location. Please enable location services.')
    return
  }

  selectedGym.value = gym
  routeInfo.value = null

  try {
    const request = {
      origin: props.userLocation,
      destination: { lat: gym.lat, lng: gym.lng },
      travelMode: google.maps.TravelMode.DRIVING
    }

    const result = await directionsService.value.route(request)
    directionsRenderer.value.setDirections(result)

    const route = result.routes[0]
    const leg = route.legs[0]
    
    // Format distance in English
    const distanceInKm = (leg.distance.value / 1000).toFixed(1)
    const distanceText = distanceInKm + ' km'
    
    // Format duration in English
    const durationInMinutes = Math.ceil(leg.duration.value / 60)
    const durationText = durationInMinutes === 1 
      ? '1 min' 
      : durationInMinutes + ' mins'
    
    routeInfo.value = {
      distance: distanceText,
      duration: durationText,
      steps: leg.steps.length
    }

    // Center map on route
    map.value.fitBounds(route.bounds)

  } catch (error) {
    console.error('Error calculating route:', error)
    alert('Unable to calculate route. Please try again.')
  }
}

// Clear route
const clearRoute = () => {
  if (directionsRenderer.value) {
    directionsRenderer.value.setDirections({ routes: [] })
  }
  selectedGym.value = null
  routeInfo.value = null
  
  // Reset map view
  if (props.userLocation) {
    map.value.setCenter(props.userLocation)
    map.value.setZoom(13)
  }
}

// Open in Google Maps
const openInGoogleMaps = () => {
  if (!selectedGym.value) return
  
  let url = 'https://www.google.com/maps/dir/?api=1'
  
  // Add origin if user location is available
  if (props.userLocation) {
    url += `&origin=${props.userLocation.lat},${props.userLocation.lng}`
  }
  
  // Add destination
  url += `&destination=${selectedGym.value.lat},${selectedGym.value.lng}`
  
  window.open(url, '_blank')
}

// Search for nearby gyms using Places API
const searchNearbyGyms = (location) => {
  if (!placesService.value) return
  
  searchingPlaces.value = true
  
  const request = {
    location: new google.maps.LatLng(location.lat, location.lng),
    radius: 5000, // 5km radius
    type: 'gym',
    keyword: 'fitness gym'
  }

  placesService.value.nearbySearch(request, (results, status) => {
    searchingPlaces.value = false
    
    if (status === google.maps.places.PlacesServiceStatus.OK && results) {
      console.log('Found real gyms:', results.length)
      
      // Calculate distances and prepare gym data
      const gymsWithDistance = results.map(place => {
        const distance = props.userLocation 
          ? calculateDistance(
              props.userLocation.lat,
              props.userLocation.lng,
              place.geometry.location.lat(),
              place.geometry.location.lng()
            )
          : null
        
        return {
          place,
          distance,
          name: place.name,
          rating: place.rating || 0,
          location: place.geometry.location
        }
      })
      
      // Sort by distance (nearest first)
      gymsWithDistance.sort((a, b) => {
        if (a.distance === null) return 1
        if (b.distance === null) return -1
        return parseFloat(a.distance) - parseFloat(b.distance)
      })
      
      // Store sorted gyms for the nearby list
      nearbyGyms.value = gymsWithDistance
      
      // Add markers for real gyms
      gymsWithDistance.forEach((gymData, index) => {
        const place = gymData.place
        const distance = gymData.distance
        
        if (place.geometry && place.geometry.location) {
          const marker = new google.maps.Marker({
            position: place.geometry.location,
            map: map.value,
            title: place.name,
            animation: google.maps.Animation.DROP,
            icon: {
              url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
            }
          })

          marker.addListener('click', () => {
            // Get more details about the place
            const detailsRequest = {
              placeId: place.place_id,
              fields: ['name', 'rating', 'formatted_address', 'opening_hours', 'formatted_phone_number', 'website', 'photos']
            }

            placesService.value.getDetails(detailsRequest, (placeDetails, status) => {
              if (status === google.maps.places.PlacesServiceStatus.OK) {
                const photoUrl = placeDetails.photos && placeDetails.photos[0] 
                  ? placeDetails.photos[0].getUrl({ maxWidth: 200, maxHeight: 150 })
                  : null

                const content = `
                  <div style="padding: 12px; max-width: 280px;">
                    ${photoUrl ? `<img src="${photoUrl}" style="width: 100%; border-radius: 8px; margin-bottom: 8px;">` : ''}
                    <h3 style="margin: 0 0 8px 0; color: #16a34a; font-size: 16px;">${placeDetails.name}</h3>
                    ${placeDetails.rating ? `
                      <div style="margin: 4px 0; color: #f59e0b; font-size: 14px;">
                        <strong>Rating:</strong> ⭐ ${placeDetails.rating}/5
                      </div>
                    ` : ''}
                    ${distance ? `
                      <div style="margin: 4px 0; color: #64748b; font-size: 14px;">
                        <strong>Distance:</strong> ${distance} km
                      </div>
                    ` : ''}
                    ${placeDetails.formatted_address ? `
                      <div style="margin: 4px 0; color: #64748b; font-size: 13px;">
                        📍 ${placeDetails.formatted_address}
                      </div>
                    ` : ''}
                    ${placeDetails.opening_hours ? `
                      <div style="margin: 4px 0; color: ${placeDetails.opening_hours.isOpen() ? '#16a34a' : '#dc2626'}; font-size: 13px;">
                        ${placeDetails.opening_hours.isOpen() ? '🟢 Open now' : '🔴 Closed'}
                      </div>
                    ` : ''}
                    ${placeDetails.formatted_phone_number ? `
                      <div style="margin: 4px 0; color: #64748b; font-size: 13px;">
                        📞 ${placeDetails.formatted_phone_number}
                      </div>
                    ` : ''}
                    <div style="margin-top: 12px; display: flex; gap: 8px;">
                      <button 
                        onclick="window.showRouteToPlace('${place.place_id}', ${place.geometry.location.lat()}, ${place.geometry.location.lng()}, '${place.name.replace(/'/g, "\\'")}')"
                        style="flex: 1; background: #16a34a; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 13px;"
                      >
                        Show Route
                      </button>
                      ${placeDetails.website ? `
                        <a href="${placeDetails.website}" target="_blank" rel="noopener"
                           style="flex: 1; background: #3b82f6; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 13px; text-align: center; text-decoration: none; display: block;">
                          Website
                        </a>
                      ` : ''}
                    </div>
                  </div>
                `
                infoWindow.value.setContent(content)
                infoWindow.value.open(map.value, marker)
              }
            })
            
            // Highlight marker
            markers.value.forEach(m => m.setAnimation(null))
            marker.setAnimation(google.maps.Animation.BOUNCE)
            setTimeout(() => marker.setAnimation(null), 2000)
          })

          markers.value.push(marker)
        }
      })
      
      // Emit the found gyms to parent component
      emit('placesFound', results.map(place => ({
        id: place.place_id,
        name: place.name,
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        rating: place.rating || 0,
        address: place.vicinity,
        isRealPlace: true
      })))
    } else {
      console.warn('Places API search failed:', status)
    }
  })
}

// Show route to a place from Places API (for real gyms)
const showRouteToRealGym = (gymData) => {
  showRoute({
    id: gymData.place.place_id,
    name: gymData.name,
    lat: gymData.location.lat(),
    lng: gymData.location.lng(),
    rating: gymData.rating
  })
}

// Show route to a place from Places API (from info window)
window.showRouteToPlace = (placeId, lat, lng, name) => {
  showRoute({
    id: placeId,
    name: name,
    lat: lat,
    lng: lng,
    rating: 0
  })
}

// Expose selectGym function globally for InfoWindow buttons
window.selectGymFromMap = (gymId) => {
  const gym = enrichedGyms.value.find(g => g.id === gymId)
  if (gym) {
    showRoute(gym)
  }
}

// Watch for changes in gyms or user location
watch(() => props.gyms, (newGyms) => {
  if (map.value) {
    addGymMarkers(enrichedGyms.value)
  }
}, { deep: true })

watch(() => props.userLocation, (newLocation) => {
  if (map.value && newLocation) {
    addUserMarker(newLocation)
    map.value.setCenter(newLocation)
  }
}, { deep: true })

onMounted(() => {
  initMap()
})
</script>

<template>
  <div class="map-wrapper">
    <div v-if="isLoading" class="map-loading">
      <div class="spinner"></div>
      <p>Loading map...</p>
    </div>

    <div v-if="searchingPlaces && !isLoading" class="places-searching">
      <div class="spinner-small"></div>
      <span>Searching nearby gyms...</span>
    </div>
    
    <div v-else-if="mapError" class="map-error">
      <p>⚠️ Unable to load map</p>
      <p class="error-detail">Please check your Google Maps API key configuration</p>
    </div>

    <div ref="mapContainer" class="map-container"></div>

    <!-- Route Info Panel -->
    <transition name="slide">
      <div v-if="routeInfo && selectedGym" class="route-panel">
        <div class="route-header">
          <h3>{{ selectedGym.name }}</h3>
          <button @click="clearRoute" class="close-btn" aria-label="Close route">×</button>
        </div>
        <div class="route-info">
          <div class="info-item">
            <span class="icon">📍</span>
            <div>
              <div class="label">Distance</div>
              <div class="value">{{ routeInfo.distance }}</div>
            </div>
          </div>
          <div class="info-item">
            <span class="icon">⏱️</span>
            <div>
              <div class="label">Duration</div>
              <div class="value">{{ routeInfo.duration }}</div>
            </div>
          </div>
          <div class="info-item">
            <span class="icon">⭐</span>
            <div>
              <div class="label">Rating</div>
              <div class="value">{{ selectedGym.rating }}/5</div>
            </div>
          </div>
        </div>
        <div class="route-actions">
          <Button 
            variant="primary" 
            size="medium" 
            @click="openInGoogleMaps"
          >
            Open in Google Maps
          </Button>
        </div>
      </div>
    </transition>

    <!-- Gym List Panel - Shows real nearby gyms sorted by distance -->
    <div class="gym-list-panel" v-if="nearbyGyms.length > 0 || enrichedGyms.length > 0">
      <div class="gym-list-header">
        <h3>📍 Nearby Gyms</h3>
        <span class="gym-count">{{ nearbyGyms.length > 0 ? nearbyGyms.length : enrichedGyms.length }}</span>
      </div>
      <div class="gym-list">
        <!-- Show real gyms from Places API if available -->
        <template v-if="nearbyGyms.length > 0">
          <div 
            v-for="(gymData, index) in nearbyGyms" 
            :key="gymData.place.place_id" 
            class="gym-item real-gym"
            :class="{ active: selectedGym?.id === gymData.place.place_id }"
            @click="showRouteToRealGym(gymData)"
          >
            <div class="gym-rank">{{ index + 1 }}</div>
            <div class="gym-info">
              <h4>{{ gymData.name }}</h4>
              <div class="gym-meta">
                <span v-if="gymData.rating" class="rating">⭐ {{ gymData.rating.toFixed(1) }}</span>
                <span v-if="gymData.distance" class="distance">📍 {{ gymData.distance }} km</span>
              </div>
            </div>
            <div class="gym-action">→</div>
          </div>
        </template>
        <!-- Fallback: show static gyms if no real data -->
        <template v-else>
          <div 
            v-for="(gym, index) in enrichedGyms" 
            :key="gym.id" 
            class="gym-item"
            :class="{ active: selectedGym?.id === gym.id }"
            @click="showRoute(gym)"
          >
            <div class="gym-rank">{{ index + 1 }}</div>
            <div class="gym-info">
              <h4>{{ gym.name }}</h4>
              <div class="gym-meta">
                <span>⭐ {{ gym.rating }}</span>
                <span v-if="gym.distance">📍 {{ gym.distance }} km</span>
              </div>
            </div>
            <div class="gym-action">→</div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.map-wrapper {
  position: relative;
  width: 100%;
  height: 600px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.map-container {
  width: 100%;
  height: 100%;
}

.map-loading,
.map-error {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--green-50);
  z-index: 10;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--green-100);
  border-top-color: var(--green-600);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.places-searching {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  padding: 12px 20px;
  border-radius: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 100;
  font-size: 14px;
  color: var(--green-700);
  font-weight: 500;
}

.spinner-small {
  width: 20px;
  height: 20px;
  border: 3px solid var(--green-100);
  border-top-color: var(--green-600);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.map-error {
  color: #dc2626;
}

.error-detail {
  font-size: 14px;
  color: #64748b;
  margin-top: 8px;
}

/* Route Panel */
.route-panel {
  position: absolute;
  top: 20px;
  right: 20px;
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  min-width: 280px;
  max-width: 320px;
  z-index: 100;
}

.route-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--green-100);
}

.route-header h3 {
  margin: 0;
  font-size: 18px;
  color: var(--green-700);
}

.close-btn {
  background: none;
  border: none;
  font-size: 28px;
  color: #64748b;
  cursor: pointer;
  padding: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: var(--green-100);
  color: var(--green-700);
}

.route-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.info-item .icon {
  font-size: 24px;
}

.info-item .label {
  font-size: 12px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-item .value {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-900);
}

.route-actions {
  margin-top: 12px;
}

/* Gym List Panel */
.gym-list-panel {
  position: absolute;
  bottom: 20px;
  left: 20px;
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  max-width: 320px;
  max-height: 400px;
  z-index: 100;
}

.gym-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--green-100);
}

.gym-list-panel h3 {
  margin: 0;
  font-size: 16px;
  color: var(--green-700);
  font-weight: 700;
}

.gym-count {
  background: var(--green-600);
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
}

.gym-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 320px;
  overflow-y: auto;
}

.gym-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--green-50);
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
  gap: 10px;
}

.gym-item:hover {
  background: var(--green-100);
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.gym-item.active {
  background: var(--green-100);
  border-color: var(--green-600);
  box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.2);
}

.gym-item.real-gym {
  background: #eff6ff;
  border-color: #bfdbfe;
}

.gym-item.real-gym:hover {
  background: #dbeafe;
  border-color: #93c5fd;
}

.gym-item.real-gym.active {
  background: #dbeafe;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.gym-rank {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: var(--green-600);
  color: white;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}

.gym-item.real-gym .gym-rank {
  background: #3b82f6;
}

.gym-info {
  flex: 1;
  min-width: 0;
}

.gym-info h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: var(--text-900);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.gym-meta {
  display: flex;
  gap: 8px;
  font-size: 11px;
  color: #64748b;
  flex-wrap: wrap;
}

.gym-meta .rating {
  color: #f59e0b;
  font-weight: 600;
}

.gym-meta .distance {
  color: var(--green-700);
  font-weight: 600;
}

.gym-action {
  font-size: 18px;
  color: var(--green-600);
  transition: transform 0.2s;
  flex-shrink: 0;
}

.gym-item:hover .gym-action {
  transform: translateX(4px);
}

.gym-item.real-gym .gym-action {
  color: #3b82f6;
}

/* Transitions */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .map-wrapper {
    height: 500px;
  }

  .route-panel,
  .gym-list-panel {
    position: static;
    max-width: 100%;
    margin-top: 12px;
    border-radius: 8px;
  }

  .gym-list-panel {
    max-height: 300px;
  }
}

/* Scrollbar styling */
.gym-list::-webkit-scrollbar {
  width: 6px;
}

.gym-list::-webkit-scrollbar-track {
  background: var(--green-50);
  border-radius: 3px;
}

.gym-list::-webkit-scrollbar-thumb {
  background: var(--green-300);
  border-radius: 3px;
}

.gym-list::-webkit-scrollbar-thumb:hover {
  background: var(--green-400);
}
</style>

