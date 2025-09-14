import { defineStore } from 'pinia'
import { recordsService } from '../firebaseService'

export const useRecordsStore = defineStore('records', {
  state: () => ({
    profile: { name: 'You', heightCm: 170, weightKg: 68.5 },
    weightLog: [],
    dietLog: [],
    exerciseLog: [],
    loading: false,
    error: null
  }),
  actions: {
    async loadRecords(userId) {
      this.loading = true
      this.error = null
      try {
        const result = await recordsService.getRecords(userId)
        if (result.ok) {
          const data = result.records
          if (data && typeof data === 'object') {
            Object.assign(this.$state, data)
          }
        } else {
          this.error = result.error
        }
      } catch (err) {
        this.error = 'Failed to load records'
      } finally {
        this.loading = false
      }
    },

    async saveRecords(userId) {
      try {
        const recordsData = {
          profile: this.profile,
          weightLog: this.weightLog,
          dietLog: this.dietLog,
          exerciseLog: this.exerciseLog
        }
        await recordsService.saveRecords(userId, recordsData)
      } catch (err) {
        console.error('Failed to save records:', err)
      }
    },

    async updateProfile(userId, patch) {
      Object.assign(this.profile, patch)
      await this.saveRecords(userId)
    },

    async addWeight(userId, entry) {
      this.weightLog.push({ ...entry, id: crypto.randomUUID(), at: new Date().toISOString() })
      await this.saveRecords(userId)
    },

    async addDiet(userId, entry) {
      this.dietLog.push({ ...entry, id: crypto.randomUUID(), at: new Date().toISOString() })
      await this.saveRecords(userId)
    },

    async addExercise(userId, entry) {
      this.exerciseLog.push({ ...entry, id: crypto.randomUUID(), at: new Date().toISOString() })
      await this.saveRecords(userId)
    },

    // Legacy methods for backward compatibility
    loadPersisted() {
      // This method is kept for backward compatibility but does nothing
      // Data is now loaded from Firebase
    },
    savePersisted() {
      // This method is kept for backward compatibility but does nothing
      // Data is now saved to Firebase
    }
  }
})


