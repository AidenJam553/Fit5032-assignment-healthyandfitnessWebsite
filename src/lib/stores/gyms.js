import { defineStore } from 'pinia'

export const useGymsStore = defineStore('gyms', {
  state: () => ({
    location: null,
    gyms: [
      { id: 'g1', name: 'City Gym', lat: -37.8136, lng: 144.9631, rating: 4.5 },
      { id: 'g2', name: 'Riverside Fitness', lat: -37.8200, lng: 144.9800, rating: 4.2 },
    ],
    query: '',
  }),
  getters: {
    filtered: (s) => s.gyms.filter(g => g.name.toLowerCase().includes(s.query.toLowerCase()))
  },
  actions: {
    async locate() {
      if (!navigator.geolocation) return
      await new Promise((resolve) => navigator.geolocation.getCurrentPosition((pos) => {
        this.location = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        resolve()
      }, () => resolve()))
    }
  }
})


