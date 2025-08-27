import { defineStore } from 'pinia'

const LESSONS_KEY = 'hf_lessons_v1'
const WISHLIST_KEY = 'hf_wishlist_v1'

function load() {
  try { return JSON.parse(localStorage.getItem(LESSONS_KEY) || '[]') } catch { return [] }
}
function save(data) { localStorage.setItem(LESSONS_KEY, JSON.stringify(data)) }

function loadWishlist() {
  try { return JSON.parse(localStorage.getItem(WISHLIST_KEY) || '{}') } catch { return {} }
}
function saveWishlist(data) { localStorage.setItem(WISHLIST_KEY, JSON.stringify(data)) }

export const useLessonsStore = defineStore('lessons', {
  state: () => ({
    lessons: load(),
    ratings: {},
    progress: {},
    userWishlist: loadWishlist(), // 用户课单 { userId: [lessonId1, lessonId2, ...] }
  }),
  actions: {
    seedIfEmpty() {
      if (this.lessons.length) return
      this.seedData()
    },
    seedData() {
      this.lessons = [
        // Nutrition - Beginner (6 courses)
        { id: 'n1', title: 'Fundamentals of Nutrition', topic: 'Nutrition', difficulty: 'Beginner', minutes: 18 },
        { id: 'n2', title: 'Understanding Macronutrients', topic: 'Nutrition', difficulty: 'Beginner', minutes: 20 },
        { id: 'n3', title: 'Reading Food Labels', topic: 'Nutrition', difficulty: 'Beginner', minutes: 15 },
        { id: 'n4', title: 'Meal Planning Basics', topic: 'Nutrition', difficulty: 'Beginner', minutes: 25 },
        { id: 'n5', title: 'Healthy Grocery Shopping', topic: 'Nutrition', difficulty: 'Beginner', minutes: 22 },
        { id: 'n6', title: 'Portion Control Guide', topic: 'Nutrition', difficulty: 'Beginner', minutes: 18 },

        // Nutrition - Intermediate (6 courses)
        { id: 'n7', title: 'Advanced Macronutrient Ratios', topic: 'Nutrition', difficulty: 'Intermediate', minutes: 30 },
        { id: 'n8', title: 'Supplements and Their Benefits', topic: 'Nutrition', difficulty: 'Intermediate', minutes: 28 },
        { id: 'n9', title: 'Metabolic Health Optimization', topic: 'Nutrition', difficulty: 'Intermediate', minutes: 35 },
        { id: 'n10', title: 'Custom Meal Planning', topic: 'Nutrition', difficulty: 'Intermediate', minutes: 32 },
        { id: 'n11', title: 'Nutrient Timing Strategies', topic: 'Nutrition', difficulty: 'Intermediate', minutes: 27 },
        { id: 'n12', title: 'Food Allergies and Intolerances', topic: 'Nutrition', difficulty: 'Intermediate', minutes: 24 },

        // Nutrition - Advanced (6 courses)
        { id: 'n13', title: 'Advanced Nutritional Biochemistry', topic: 'Nutrition', difficulty: 'Advanced', minutes: 45 },
        { id: 'n14', title: 'Performance Nutrition for Athletes', topic: 'Nutrition', difficulty: 'Advanced', minutes: 50 },
        { id: 'n15', title: 'Gut Health and Microbiome', topic: 'Nutrition', difficulty: 'Advanced', minutes: 42 },
        { id: 'n16', title: 'Hormonal Balance Through Nutrition', topic: 'Nutrition', difficulty: 'Advanced', minutes: 48 },
        { id: 'n17', title: 'Body Composition Optimization', topic: 'Nutrition', difficulty: 'Advanced', minutes: 55 },
        { id: 'n18', title: 'Recovery Nutrition Strategies', topic: 'Nutrition', difficulty: 'Advanced', minutes: 40 },

        // Workout - Beginner (6 courses)
        { id: 'w1', title: 'Beginner Strength Routine', topic: 'Workout', difficulty: 'Beginner', minutes: 22 },
        { id: 'w2', title: 'Basic Cardio Workout', topic: 'Workout', difficulty: 'Beginner', minutes: 25 },
        { id: 'w3', title: 'Introduction to Yoga', topic: 'Workout', difficulty: 'Beginner', minutes: 30 },
        { id: 'w4', title: 'Home Workout Essentials', topic: 'Workout', difficulty: 'Beginner', minutes: 20 },
        { id: 'w5', title: 'Proper Warm-up Techniques', topic: 'Workout', difficulty: 'Beginner', minutes: 15 },
        { id: 'w6', title: 'Stretching and Flexibility', topic: 'Workout', difficulty: 'Beginner', minutes: 18 },

        // Workout - Intermediate (6 courses)
        { id: 'w7', title: 'Advanced Strength Training', topic: 'Workout', difficulty: 'Intermediate', minutes: 35 },
        { id: 'w8', title: 'High-Intensity Interval Training', topic: 'Workout', difficulty: 'Intermediate', minutes: 28 },
        { id: 'w9', title: 'Power Yoga Flow', topic: 'Workout', difficulty: 'Intermediate', minutes: 40 },
        { id: 'w10', title: 'Functional Fitness Training', topic: 'Workout', difficulty: 'Intermediate', minutes: 32 },
        { id: 'w11', title: 'Circuit Training Methods', topic: 'Workout', difficulty: 'Intermediate', minutes: 30 },
        { id: 'w12', title: 'Injury Prevention Techniques', topic: 'Workout', difficulty: 'Intermediate', minutes: 25 },

        // Workout - Advanced (6 courses)
        { id: 'w13', title: 'Elite Strength Conditioning', topic: 'Workout', difficulty: 'Advanced', minutes: 50 },
        { id: 'w14', title: 'Advanced HIIT Protocols', topic: 'Workout', difficulty: 'Advanced', minutes: 45 },
        { id: 'w15', title: 'Advanced Yoga Asanas', topic: 'Workout', difficulty: 'Advanced', minutes: 55 },
        { id: 'w16', title: 'Olympic Weightlifting Techniques', topic: 'Workout', difficulty: 'Advanced', minutes: 60 },
        { id: 'w17', title: 'Periodization Training Methods', topic: 'Workout', difficulty: 'Advanced', minutes: 48 },
        { id: 'w18', title: 'Sports-Specific Performance', topic: 'Workout', difficulty: 'Advanced', minutes: 52 },
      ]
      save(this.lessons)
    },
    rate(id, value) {
      const arr = this.ratings[id] || []
      arr.push(Number(value))
      this.ratings[id] = arr
      save(this.lessons)
    },
    setProgress(id, pct) {
      this.progress[id] = Math.max(0, Math.min(100, Number(pct)))
      save(this.lessons)
    },
    resetData() {
      localStorage.removeItem(LESSONS_KEY)
      this.lessons = []
      this.ratings = {}
      this.progress = {}
      this.userWishlist = {}
      this.seedData()
    },
    // 添加课程到用户课单
    addToWishlist(userId, lessonId) {
      if (!this.userWishlist[userId]) {
        this.userWishlist[userId] = []
      }
      if (!this.userWishlist[userId].includes(lessonId)) {
        this.userWishlist[userId].push(lessonId)
        saveWishlist(this.userWishlist)
      }
    },
    // 从用户课单移除课程
    removeFromWishlist(userId, lessonId) {
      if (this.userWishlist[userId]) {
        this.userWishlist[userId] = this.userWishlist[userId].filter(id => id !== lessonId)
        saveWishlist(this.userWishlist)
      }
    },
    // 检查课程是否在用户课单中
    isInWishlist(userId, lessonId) {
      return this.userWishlist[userId]?.includes(lessonId) || false
    },
    // 获取用户的课单
    getUserWishlist(userId) {
      return this.userWishlist[userId] || []
    },
    // 获取用户课单的课程详情
    getUserWishlistLessons(userId) {
      const wishlistIds = this.getUserWishlist(userId)
      return this.lessons.filter(lesson => wishlistIds.includes(lesson.id))
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


