<script setup>
import { ref, computed } from 'vue'
import SiteHeader from '@/components/SiteHeader.vue'
import Card from '@/components/Card.vue'
import Button from '@/components/Button.vue'
import GymMap from '@/components/GymMap.vue'
import { useGymsStore } from '@/lib/stores/gyms'

const gyms = useGymsStore()
gyms.locate()

const viewMode = ref('map') // 'map' or 'grid'
const realGyms = ref([]) // Real gyms from Places API
const showSuggestions = ref(false) // Show search suggestions
const selectedSuggestionIndex = ref(-1) // For keyboard navigation
const searchInputRef = ref(null)

const toggleView = (mode) => {
  viewMode.value = mode
}

// Handle real gyms found from Places API
const handlePlacesFound = (places) => {
  realGyms.value = places
}

const enrichedGyms = computed(() => {
  // Only use real gyms from Places API
  const gymsToUse = realGyms.value
  
  if (!gyms.location) return gymsToUse
  
  return gymsToUse.map(gym => ({
    ...gym,
    distance: gym.distance || calculateDistance(
      gyms.location.lat,
      gyms.location.lng,
      gym.lat,
      gym.lng
    )
  })).sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance))
})

// Suggestions for autocomplete (show top 5 matches from real gyms only)
const searchSuggestions = computed(() => {
  if (!gyms.query || gyms.query.length < 1) {
    return []
  }
  
  const query = gyms.query.toLowerCase()
  const matches = enrichedGyms.value.filter(gym => 
    gym.name.toLowerCase().includes(query) ||
    (gym.address && gym.address.toLowerCase().includes(query))
  )
  
  // Return top 5 matches
  return matches.slice(0, 5)
})

// Calculate distance using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
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

// Handle search input focus
const handleSearchFocus = () => {
  if (gyms.query) {
    showSuggestions.value = true
  }
}

// Handle search input
const handleSearchInput = () => {
  showSuggestions.value = true
  selectedSuggestionIndex.value = -1
}

// Handle search blur (with delay to allow click on suggestions)
const handleSearchBlur = () => {
  setTimeout(() => {
    showSuggestions.value = false
    selectedSuggestionIndex.value = -1
  }, 200)
}

// Select a suggestion
const selectSuggestion = (gym) => {
  gyms.query = gym.name
  showSuggestions.value = false
  selectedSuggestionIndex.value = -1
  
  // Switch to map view and show the gym
  viewMode.value = 'map'
  
  // Emit event to select gym on map (if needed)
  // You could add more logic here to highlight the gym on the map
}

// Handle keyboard navigation in suggestions
const handleKeyDown = (event) => {
  if (!showSuggestions.value || searchSuggestions.value.length === 0) return
  
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    selectedSuggestionIndex.value = 
      (selectedSuggestionIndex.value + 1) % searchSuggestions.value.length
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    selectedSuggestionIndex.value = 
      selectedSuggestionIndex.value <= 0 
        ? searchSuggestions.value.length - 1 
        : selectedSuggestionIndex.value - 1
  } else if (event.key === 'Enter' && selectedSuggestionIndex.value >= 0) {
    event.preventDefault()
    selectSuggestion(searchSuggestions.value[selectedSuggestionIndex.value])
  } else if (event.key === 'Escape') {
    showSuggestions.value = false
    selectedSuggestionIndex.value = -1
  }
}

// Clear search
const clearSearch = () => {
  gyms.query = ''
  showSuggestions.value = false
  selectedSuggestionIndex.value = -1
}
</script>

<template>
  <div class="page">
    <SiteHeader />
    <div class="container explore">
      <div class="header-section">
        <div class="header-content">
          <h1>🗺️ Explore Gyms</h1>
          <p class="subtitle">Find the best gyms near you with interactive maps and route planning</p>
        </div>
      </div>

      <div class="toolbar">
        <div class="search-container">
          <div class="search-box">
            <div class="search-icon-wrapper">
              <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            </div>
            <input 
              ref="searchInputRef"
              placeholder="Search gyms by name or address..." 
              v-model="gyms.query" 
              class="search-input"
              @focus="handleSearchFocus"
              @input="handleSearchInput"
              @blur="handleSearchBlur"
              @keydown="handleKeyDown"
              autocomplete="off"
            />
            <button 
              v-if="gyms.query" 
              class="clear-search"
              @click="clearSearch"
              aria-label="Clear search"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          <!-- Search Suggestions Dropdown -->
          <transition name="suggestions">
            <div 
              v-if="showSuggestions && searchSuggestions.length > 0" 
              class="search-suggestions"
            >
              <div class="suggestions-header">
                <div class="suggestions-count">
                  <svg class="count-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  </svg>
                  <span>{{ searchSuggestions.length }} result{{ searchSuggestions.length !== 1 ? 's' : '' }}</span>
                </div>
              </div>
              <div class="suggestions-list">
                <div 
                  v-for="(gym, index) in searchSuggestions" 
                  :key="gym.id || gym.place?.place_id"
                  class="suggestion-item"
                  :class="{ selected: index === selectedSuggestionIndex }"
                  @click="selectSuggestion(gym)"
                >
                  <div class="suggestion-icon">
                    <div class="icon-circle" :class="{ 'real-place': gym.isRealPlace }">
                      <svg v-if="gym.isRealPlace" class="place-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                      <svg v-else class="gym-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <path d="M16 10a4 4 0 0 1-8 0"></path>
                      </svg>
                    </div>
                  </div>
                  <div class="suggestion-content">
                    <div class="suggestion-name">{{ gym.name }}</div>
                    <div class="suggestion-meta">
                      <span v-if="gym.rating" class="suggestion-rating">
                        <svg class="star-icon" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
                        </svg>
                        {{ gym.rating }}
                      </span>
                      <span v-if="gym.distance" class="suggestion-distance">
                        <svg class="location-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                          <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        {{ gym.distance }} km
                      </span>
                      <span v-if="gym.address" class="suggestion-address">{{ gym.address }}</span>
                    </div>
                  </div>
                  <div class="suggestion-arrow">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12,5 19,12 12,19"></polyline>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </transition>
          
          <!-- No results message -->
          <transition name="suggestions">
            <div 
              v-if="showSuggestions && gyms.query && searchSuggestions.length === 0" 
              class="search-suggestions no-results"
            >
              <div class="no-results-content">
                <div class="no-results-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                  </svg>
                </div>
                <h4>No gyms found</h4>
                <p>No results for "{{ gyms.query }}"</p>
                <small>Try searching with different keywords</small>
              </div>
            </div>
          </transition>
        </div>
        <div class="toolbar-actions">
          <Button 
            :variant="gyms.location ? 'primary' : 'secondary'" 
            size="medium" 
            @click="gyms.locate"
          >
            <span v-if="gyms.location">📍 Located</span>
            <span v-else>📍 Locate me</span>
          </Button>
          <div class="view-toggle">
            <button 
              class="toggle-btn" 
              :class="{ active: viewMode === 'map' }"
              @click="toggleView('map')"
              aria-label="Map view"
            >
              🗺️ Map
            </button>
            <button 
              class="toggle-btn" 
              :class="{ active: viewMode === 'grid' }"
              @click="toggleView('grid')"
              aria-label="Grid view"
            >
              📋 List
            </button>
          </div>
        </div>
      </div>

      <!-- Map View -->
      <transition name="fade">
        <div v-if="viewMode === 'map'" class="map-view">
          <GymMap 
            :gyms="gyms.filtered" 
            :user-location="gyms.location"
            @places-found="handlePlacesFound"
          />
          <div class="map-info" v-if="gyms.location">
            <p>✅ Your location detected. <strong>Blue markers</strong> show real gyms nearby (via Places API). Click markers to see details and routes.</p>
          </div>
          <div class="map-info warning" v-else>
            <p>⚠️ Enable location services to see real nearby gyms, distances and get directions.</p>
          </div>
        </div>
      </transition>

      <!-- Grid View -->
      <transition name="fade">
        <div v-if="viewMode === 'grid'" class="grid-view">
          <div v-if="enrichedGyms.length > 0" class="results-header">
            <h2>{{ enrichedGyms.length }} gym{{ enrichedGyms.length !== 1 ? 's' : '' }} found</h2>
            <div class="results-meta">
              <span class="real-data-badge">🔵 Real data from Places API</span>
              <span v-if="gyms.location" class="sort-indicator">Sorted by distance</span>
            </div>
          </div>
          <div v-if="enrichedGyms.length > 0" class="grid">
            <Card 
              variant="elevated" 
              size="medium" 
              v-for="g in enrichedGyms" 
              :key="g.id" 
              clickable 
              hover
              class="gym-card"
            >
          <template #header>
                <div class="card-header">
            <h3>{{ g.name }}</h3>
                  <span class="rating-badge">⭐ {{ g.rating.toFixed(1) }}</span>
                </div>
          </template>
              <div class="card-content">
                <div class="info-row">
                  <span class="label">Rating:</span>
                  <span class="value">{{ g.rating.toFixed(1) }}/5</span>
                </div>
                <div class="info-row" v-if="g.distance">
                  <span class="label">Distance:</span>
                  <span class="value">{{ g.distance }} km away</span>
                </div>
                <div class="info-row" v-if="g.address">
                  <span class="label">Address:</span>
                  <span class="value address">{{ g.address }}</span>
                </div>
              </div>
          <template #footer>
                <div class="card-actions">
                  <a 
                    :href="`https://www.google.com/maps/dir/?api=1&destination=${g.lat},${g.lng}`" 
                    target="_blank" 
                    rel="noopener"
                    class="action-link primary"
                  >
                    Get Directions →
                  </a>
                  <button 
                    @click="() => { viewMode = 'map' }"
                    class="action-link secondary"
                  >
                    View on Map
                  </button>
                </div>
          </template>
        </Card>
          </div>
          
          <!-- No gyms found in grid view -->
          <div v-else class="empty-state">
            <div class="empty-icon">🏋️</div>
            <h3>No gyms found</h3>
            <p>Try dragging the map to explore different areas or enable location services</p>
          </div>
        </div>
      </transition>

      <!-- Empty State for search -->
      <div v-if="gyms.query && enrichedGyms.length === 0 && !searchingPlaces" class="empty-state">
        <div class="empty-icon">🔍</div>
        <h3>No gyms found</h3>
        <p>No results for "{{ gyms.query }}"</p>
        <small>Try adjusting your search query or explore different areas</small>
      </div>
    </div>
  </div>
</template>

<style scoped>
.explore { 
  padding: 24px 0 48px; 
  min-height: calc(100vh - 64px);
}

.header-section {
  margin-bottom: 24px;
}

.header-content h1 {
  font-size: 36px;
  color: var(--green-700);
  margin: 0 0 8px 0;
  font-weight: 800;
}

.subtitle {
  color: #64748b;
  font-size: 16px;
  margin: 0;
}

.toolbar { 
  display: flex; 
  gap: 12px; 
  align-items: center; 
  margin-bottom: 24px;
  flex-wrap: wrap;
}

/* Search Container */
.search-container {
  position: relative;
  flex: 1;
  min-width: 280px;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 16px;
  padding: 4px;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.search-box:focus-within {
  border-color: var(--green-600);
  box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1), 0 4px 12px rgba(22, 163, 74, 0.15);
  transform: translateY(-1px);
}

.search-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  margin-left: 8px;
  color: #9ca3af;
  transition: color 0.2s ease;
}

.search-box:focus-within .search-icon-wrapper {
  color: var(--green-600);
}

.search-icon {
  width: 20px;
  height: 20px;
  stroke-width: 2;
}

.search-input { 
  flex: 1;
  border: none;
  outline: none;
  padding: 12px 8px 12px 4px;
  font-size: 15px;
  background: transparent;
  color: var(--text-900);
}

.search-input::placeholder {
  color: #9ca3af;
  transition: color 0.2s ease;
}

.search-box:focus-within .search-input::placeholder {
  color: #d1d5db;
}

.clear-search {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  margin-right: 8px;
  background: #f3f4f6;
  border: none;
  border-radius: 8px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
  opacity: 0.7;
}

.clear-search:hover {
  background: #e5e7eb;
  color: var(--text-900);
  opacity: 1;
  transform: scale(1.05);
}

.clear-search svg {
  width: 16px;
  height: 16px;
  stroke-width: 2;
}

/* Search Suggestions */
.search-suggestions {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  z-index: 1000;
  max-height: 400px;
  overflow: hidden;
}

.suggestions-header {
  padding: 12px 16px 8px;
  border-bottom: 1px solid #f3f4f6;
}

.suggestions-count {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #6b7280;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.count-icon {
  width: 14px;
  height: 14px;
  stroke-width: 2;
}

.suggestions-list {
  max-height: 320px;
  overflow-y: auto;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid #f8fafc;
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-item:hover,
.suggestion-item.selected {
  background: #f8fafc;
}

.suggestion-icon {
  flex-shrink: 0;
}

.icon-circle {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  color: #6b7280;
  transition: all 0.2s ease;
}

.icon-circle.real-place {
  background: #eff6ff;
  color: #3b82f6;
}

.place-icon,
.gym-icon {
  width: 20px;
  height: 20px;
  stroke-width: 2;
}

.suggestion-content {
  flex: 1;
  min-width: 0;
}

.suggestion-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-900);
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.suggestion-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #6b7280;
  flex-wrap: wrap;
}

.suggestion-rating {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #f59e0b;
  font-weight: 600;
}

.suggestion-distance {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--green-700);
  font-weight: 600;
}

.suggestion-address {
  color: #9ca3af;
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.star-icon,
.location-icon {
  width: 12px;
  height: 12px;
}

.star-icon {
  fill: currentColor;
}

.location-icon {
  stroke-width: 2;
}

.suggestion-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #f8fafc;
  color: var(--green-600);
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.suggestion-item:hover .suggestion-arrow {
  background: var(--green-50);
  transform: translateX(2px);
}

.suggestion-arrow svg {
  width: 16px;
  height: 16px;
  stroke-width: 2;
}

/* No results */
.search-suggestions.no-results {
  padding: 32px 24px;
  text-align: center;
}

.no-results-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.no-results-icon {
  width: 48px;
  height: 48px;
  color: #d1d5db;
  margin-bottom: 4px;
}

.no-results-icon svg {
  width: 100%;
  height: 100%;
  stroke-width: 1.5;
}

.no-results-content h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-900);
}

.no-results-content p {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
}

.no-results-content small {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 4px;
}

/* Suggestions animation */
.suggestions-enter-active,
.suggestions-leave-active {
  transition: all 0.2s ease;
}

.suggestions-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.suggestions-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}

/* Scrollbar styling for suggestions */
.suggestions-list::-webkit-scrollbar {
  width: 6px;
}

.suggestions-list::-webkit-scrollbar-track {
  background: transparent;
}

.suggestions-list::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

.suggestions-list::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

.toolbar-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.view-toggle {
  display: flex;
  background: white;
  border-radius: 12px;
  padding: 4px;
  gap: 4px;
  border: 2px solid var(--green-200);
}

.toggle-btn {
  padding: 8px 16px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  transition: all 0.2s;
  white-space: nowrap;
}

.toggle-btn:hover {
  background: var(--green-50);
  color: var(--green-700);
}

.toggle-btn.active {
  background: var(--green-600);
  color: white;
  box-shadow: 0 2px 8px rgba(22, 163, 74, 0.2);
}

/* Map View */
.map-view {
  animation: fadeIn 0.3s ease;
}

.map-info {
  margin-top: 16px;
  padding: 12px 16px;
  background: var(--green-50);
  border-left: 4px solid var(--green-600);
  border-radius: 8px;
  font-size: 14px;
  color: var(--green-700);
}

.map-info.warning {
  background: #fef3c7;
  border-left-color: #f59e0b;
  color: #92400e;
}

/* Grid View */
.grid-view {
  animation: fadeIn 0.3s ease;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--green-100);
  flex-wrap: wrap;
  gap: 12px;
}

.results-header h2 {
  margin: 0;
  font-size: 20px;
  color: var(--text-900);
}

.results-meta {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.sort-indicator {
  font-size: 14px;
  color: #64748b;
  background: var(--green-50);
  padding: 4px 12px;
  border-radius: 20px;
}

.real-data-badge {
  font-size: 13px;
  color: #1e40af;
  background: #dbeafe;
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 600;
  border: 1px solid #93c5fd;
}

.grid { 
  display: grid; 
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); 
  gap: 20px; 
}

.gym-card {
  transition: all 0.3s ease;
}

.gym-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  color: var(--green-700);
  font-weight: 600;
  flex: 1;
}

.rating-badge {
  background: #fef3c7;
  color: #92400e;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 12px 0;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid var(--green-50);
}

.info-row:last-child {
  border-bottom: none;
}

.info-row .label {
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
}

.info-row .value {
  font-size: 14px;
  color: var(--text-900);
  font-weight: 600;
}

.info-row .address {
  font-size: 13px;
  color: #64748b;
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.action-link {
  flex: 1;
  text-align: center;
  padding: 10px 16px;
  border-radius: 8px;
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s;
  cursor: pointer;
  border: none;
  background: none;
}

.action-link.primary {
  background: var(--green-600);
  color: white;
}

.action-link.primary:hover {
  background: var(--green-700);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);
}

.action-link.secondary {
  background: var(--green-50);
  color: var(--green-700);
  border: 1px solid var(--green-200);
}

.action-link.secondary:hover {
  background: var(--green-100);
  border-color: var(--green-300);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 64px 20px;
  color: #64748b;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state h3 {
  margin: 0 0 8px 0;
  color: var(--text-900);
}

.empty-state p {
  margin: 0;
  font-size: 14px;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive */
@media (max-width: 900px) { 
  .grid { 
    grid-template-columns: 1fr; 
  }
  
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-container {
    width: 100%;
  }
  
  .search-suggestions {
    max-height: 300px;
  }
  
  .suggestions-list {
    max-height: 240px;
  }
  
  .toolbar-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .view-toggle {
    flex: 1;
  }
  
  .toggle-btn {
    flex: 1;
  }
  
  .header-content h1 {
    font-size: 28px;
  }
  
  .results-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}

@media (max-width: 480px) {
  .card-actions {
    flex-direction: column;
  }
  
  .action-link {
    width: 100%;
  }
}
</style>


