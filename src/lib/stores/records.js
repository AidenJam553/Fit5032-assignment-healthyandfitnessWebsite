import { defineStore } from 'pinia'

const RECORDS_KEY = 'hf_records_v1'

function load() { try { return JSON.parse(localStorage.getItem(RECORDS_KEY) || '{}') } catch { return {} } }
function save(data) { localStorage.setItem(RECORDS_KEY, JSON.stringify(data)) }

export const useRecordsStore = defineStore('records', {
  state: () => ({
    profile: { name: 'You', heightCm: 170, weightKg: 68.5 },
    weightLog: [],
    dietLog: [],
    exerciseLog: [],
  }),
  actions: {
    loadPersisted() {
      const data = load()
      if (data && typeof data === 'object') Object.assign(this.$state, data)
    },
    savePersisted() { save(this.$state) },
    updateProfile(patch) { Object.assign(this.profile, patch); this.savePersisted() },
    addWeight(entry) { this.weightLog.push({ ...entry, id: crypto.randomUUID(), at: new Date().toISOString() }); this.savePersisted() },
    addDiet(entry) { this.dietLog.push({ ...entry, id: crypto.randomUUID(), at: new Date().toISOString() }); this.savePersisted() },
    addExercise(entry) { this.exerciseLog.push({ ...entry, id: crypto.randomUUID(), at: new Date().toISOString() }); this.savePersisted() },
  }
})


