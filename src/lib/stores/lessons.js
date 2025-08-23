import { defineStore } from 'pinia'

const LESSONS_KEY = 'hf_lessons_v1'

function load() {
  try { return JSON.parse(localStorage.getItem(LESSONS_KEY) || '[]') } catch { return [] }
}
function save(data) { localStorage.setItem(LESSONS_KEY, JSON.stringify(data)) }

export const useLessonsStore = defineStore('lessons', {
  state: () => ({
    lessons: load(),
    ratings: {},
    progress: {},
  }),
  actions: {
    seedIfEmpty() {
      if (this.lessons.length) return
      this.lessons = [
        { id: 'n1', title: 'Fundamentals of Nutrition', topic: 'Nutrition', minutes: 18 },
        { id: 'w1', title: 'Beginner Strength Routine', topic: 'Workout', minutes: 22 },
      ]
      save(this.lessons)
    },
    rate(id, value) {
      const arr = this.ratings[id] || []
      arr.push(Number(value))
      this.ratings[id] = arr
    },
    setProgress(id, pct) {
      this.progress[id] = Math.max(0, Math.min(100, Number(pct)))
    },
  },
  getters: {
    averageRating: (state) => (id) => {
      const arr = state.ratings[id] || []
      if (!arr.length) return 0
      return Math.round((arr.reduce((a,b)=>a+b,0)/arr.length) * 10) / 10
    }
  }
})


