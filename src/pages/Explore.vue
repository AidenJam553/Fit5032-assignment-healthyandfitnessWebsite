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
  // If we have real gyms from Places API, use those
  const gymsToUse = realGyms.value.length > 0 ? realGyms.value : gyms.filtered
  
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

// Suggestions for autocomplete (show top 5 matches)
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
        <div class="search-box">
          <span class="search-icon">🔍</span>
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
            ×
          </button>
          
          <!-- Search Suggestions Dropdown -->
          <transition name="suggestions">
            <div 
              v-if="showSuggestions && searchSuggestions.length > 0" 
              class="search-suggestions"
            >
              <div class="suggestions-header">
                <span>{{ searchSuggestions.length }} result{{ searchSuggestions.length !== 1 ? 's' : '' }}</span>
              </div>
              <div 
                v-for="(gym, index) in searchSuggestions" 
                :key="gym.id || gym.place?.place_id"
                class="suggestion-item"
                :class="{ selected: index === selectedSuggestionIndex }"
                @click="selectSuggestion(gym)"
              >
                <div class="suggestion-icon">
                  {{ gym.isRealPlace ? '🔵' : '🏋️' }}
                </div>
                <div class="suggestion-content">
                  <div class="suggestion-name">{{ gym.name }}</div>
                  <div class="suggestion-meta">
                    <span v-if="gym.rating" class="suggestion-rating">⭐ {{ gym.rating }}</span>
                    <span v-if="gym.distance" class="suggestion-distance">📍 {{ gym.distance }} km</span>
                    <span v-if="gym.address" class="suggestion-address">{{ gym.address }}</span>
                  </div>
                </div>
                <div class="suggestion-arrow">→</div>
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
                <span class="no-results-icon">🔍</span>
                <p>No gyms found for "{{ gyms.query }}"</p>
                <small>Try a different search term</small>
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
          <div class="results-header">
            <h2>{{ enrichedGyms.length }} gym{{ enrichedGyms.length !== 1 ? 's' : '' }} found</h2>
            <div class="results-meta">
              <span v-if="realGyms.length > 0" class="real-data-badge">🔵 Real data from Places API</span>
              <span v-if="gyms.location" class="sort-indicator">Sorted by distance</span>
            </div>
      </div>
      <div class="grid">
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
                  <span class="rating-badge">⭐ {{ g.rating }}</span>
                </div>
          </template>
              <div class="card-content">
                <div class="info-row">
                  <span class="label">Rating:</span>
                  <span class="value">{{ g.rating }}/5</span>
                </div>
                <div class="info-row" v-if="g.distance">
                  <span class="label">Distance:</span>
                  <span class="value">{{ g.distance }} km away</span>
                </div>
                <div class="info-row">
                  <span class="label">Location:</span>
                  <span class="value coordinates">{{ g.lat.toFixed(4) }}, {{ g.lng.toFixed(4) }}</span>
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
        </div>
      </transition>

      <!-- Empty State -->
      <div v-if="gyms.filtered.length === 0" class="empty-state">
        <div class="empty-icon">🔍</div>
        <h3>No gyms found</h3>
        <p>Try adjusting your search query</p>
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

.search-box {
  position: relative;
  flex: 1;
  min-width: 250px;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 18px;
  pointer-events: none;
  z-index: 2;
}

.search-input { 
  width: 100%;
  border: 2px solid var(--green-200); 
  border-radius: 12px; 
  padding: 12px 40px 12px 44px;
  font-size: 15px;
  transition: all 0.2s;
  background: white;
}

.search-input:focus {
  outline: none;
  border-color: var(--green-600);
  box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
  border-radius: 12px 12px 0 0;
}

.search-input:focus + .search-suggestions {
  border-top: none;
}

.clear-search {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: #e5e7eb;
  border: none;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-size: 20px;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  z-index: 2;
}

.clear-search:hover {
  background: #d1d5db;
  color: var(--text-900);
  transform: translateY(-50%) scale(1.1);
}

/* Search Suggestions */
.search-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 2px solid var(--green-600);
  border-top: 1px solid var(--green-200);
  border-radius: 0 0 12px 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  z-index: 1000;
  max-height: 400px;
  overflow-y: auto;
  margin-top: -2px;
}

.suggestions-header {
  padding: 8px 16px;
  background: var(--green-50);
  border-bottom: 1px solid var(--green-100);
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 1px solid var(--green-50);
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-item:hover,
.suggestion-item.selected {
  background: var(--green-50);
}

.suggestion-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.suggestion-content {
  flex: 1;
  min-width: 0;
}

.suggestion-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-900);
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.suggestion-meta {
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: #64748b;
  flex-wrap: wrap;
}

.suggestion-rating {
  color: #f59e0b;
  font-weight: 600;
}

.suggestion-distance {
  color: var(--green-700);
  font-weight: 600;
}

.suggestion-address {
  color: #94a3b8;
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.suggestion-arrow {
  font-size: 18px;
  color: var(--green-600);
  flex-shrink: 0;
  transition: transform 0.2s;
}

.suggestion-item:hover .suggestion-arrow {
  transform: translateX(4px);
}

/* No results */
.search-suggestions.no-results {
  padding: 24px;
  text-align: center;
}

.no-results-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.no-results-icon {
  font-size: 48px;
  opacity: 0.3;
}

.no-results-content p {
  margin: 0;
  color: var(--text-900);
  font-weight: 600;
}

.no-results-content small {
  color: #64748b;
  font-size: 12px;
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
.search-suggestions::-webkit-scrollbar {
  width: 8px;
}

.search-suggestions::-webkit-scrollbar-track {
  background: var(--green-50);
  border-radius: 0 0 12px 0;
}

.search-suggestions::-webkit-scrollbar-thumb {
  background: var(--green-300);
  border-radius: 4px;
}

.search-suggestions::-webkit-scrollbar-thumb:hover {
  background: var(--green-400);
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

.info-row .coordinates {
  font-family: 'Courier New', monospace;
  font-size: 12px;
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
  
  .search-box {
    width: 100%;
  }
  
  .search-suggestions {
    max-height: 300px;
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


