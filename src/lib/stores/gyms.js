import { defineStore } from 'pinia'

export const useGymsStore = defineStore('gyms', {
  state: () => ({
    location: null,
    gyms: [
      { id: 'g1', name: 'City Gym', lat: -37.8136, lng: 144.9631, rating: 4.5, address: '123 Collins St, Melbourne VIC 3000' },
      { id: 'g2', name: 'Riverside Fitness', lat: -37.8200, lng: 144.9800, rating: 4.2, address: '45 Southbank Blvd, Melbourne VIC 3006' },
      { id: 'g3', name: 'Fitness First Melbourne', lat: -37.8100, lng: 144.9700, rating: 4.7, address: '200 Bourke St, Melbourne VIC 3000' },
      { id: 'g4', name: 'Anytime Fitness Docklands', lat: -37.8183, lng: 144.9450, rating: 4.4, address: '888 Collins St, Docklands VIC 3008' },
      { id: 'g5', name: 'Goodlife Health Clubs', lat: -37.8070, lng: 144.9600, rating: 4.6, address: '350 Lonsdale St, Melbourne VIC 3000' },
    ],
    query: '',
    isLocating: false,
    locationError: null,
  }),
  getters: {
    filtered: (s) => s.gyms.filter(g => g.name.toLowerCase().includes(s.query.toLowerCase())),
    
    // Get gyms sorted by distance from user location
    sortedByDistance(state) {
      if (!state.location) return this.filtered
      
      const gymsWithDistance = this.filtered.map(gym => ({
        ...gym,
        distance: this.calculateDistance(
          state.location.lat,
          state.location.lng,
          gym.lat,
          gym.lng
        )
      }))
      
      return gymsWithDistance.sort((a, b) => a.distance - b.distance)
    },
    
    hasLocation: (s) => s.location !== null,
  },
  actions: {
    // Get user's current location
    async locate() {
      if (!navigator.geolocation) {
        this.locationError = 'Geolocation is not supported by your browser'
        return false
      }

      this.isLocating = true
      this.locationError = null

      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve(pos),
            (err) => reject(err),
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 300000, // Cache position for 5 minutes
            }
          )
        })

        this.location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        }
        
        this.isLocating = false
        return true
      } catch (error) {
        this.locationError = this.getLocationErrorMessage(error.code)
        this.isLocating = false
        return false
      }
    },

    // Calculate distance between two coordinates (Haversine formula)
    calculateDistance(lat1, lon1, lat2, lon2) {
      const R = 6371 // Earth's radius in kilometers
      const dLat = this.toRad(lat2 - lat1)
      const dLon = this.toRad(lon2 - lon1)
      
      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
      
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      const distance = R * c
      
      return parseFloat(distance.toFixed(2))
    },

    // Convert degrees to radians
    toRad(degrees) {
      return degrees * (Math.PI / 180)
    },

    // Get human-readable error message
    getLocationErrorMessage(code) {
      switch (code) {
        case 1: // PERMISSION_DENIED
          return 'Location access denied. Please enable location permissions.'
        case 2: // POSITION_UNAVAILABLE
          return 'Location information unavailable.'
        case 3: // TIMEOUT
          return 'Location request timed out. Please try again.'
        default:
          return 'An unknown error occurred while getting your location.'
      }
    },

    // Clear location
    clearLocation() {
      this.location = null
      this.locationError = null
    },

    // Add a new gym (for admin purposes)
    addGym(gym) {
      const newGym = {
        id: `g${this.gyms.length + 1}`,
        ...gym
      }
      this.gyms.push(newGym)
      return newGym
    },

    // Update gym information
    updateGym(id, updates) {
      const index = this.gyms.findIndex(g => g.id === id)
      if (index !== -1) {
        this.gyms[index] = { ...this.gyms[index], ...updates }
        return true
      }
      return false
    },

    // Remove a gym
    removeGym(id) {
      const index = this.gyms.findIndex(g => g.id === id)
      if (index !== -1) {
        this.gyms.splice(index, 1)
        return true
      }
      return false
    }
  }
})


