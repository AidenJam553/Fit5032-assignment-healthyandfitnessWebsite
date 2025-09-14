import { defineStore } from 'pinia'
import { 
  courseService, 
  courseRatingService, 
  userProgressService, 
  wishlistService,
  realtimeService
} from '../firebaseService'

export const useLessonsStore = defineStore('lessons', {
  state: () => ({
    courses: [],
    ratings: {},
    comments: {},
    progress: {},
    userWishlist: {},
    loading: false,
    error: null,
    currentUser: null,
    realtimeListeners: {}
  }),
  actions: {
    // Set current user
    setCurrentUser(user) {
      this.currentUser = user
    },

    // Load courses from Firebase
    async loadCourses() {
      this.loading = true
      this.error = null
      try {
        console.log('Loading courses from Firebase...')
        const result = await courseService.getCourses()
        console.log('Course service result:', result)
        if (result.ok) {
          console.log('Setting courses from loadCourses:', result.courses, 'Type:', typeof result.courses, 'IsArray:', Array.isArray(result.courses))
          this.courses = Array.isArray(result.courses) ? result.courses : []
          console.log('Courses loaded successfully:', this.courses.length)
        } else {
          this.error = result.error
          this.courses = []
          console.error('Failed to load courses:', result.error)
        }
      } catch (err) {
        this.error = 'Failed to load courses'
        this.courses = []
        console.error('Error loading courses:', err)
      } finally {
        this.loading = false
      }
    },

    // Load user progress from Firebase
    async loadProgress(userId) {
      if (!userId) return
      
      try {
        const result = await userProgressService.getProgress(userId)
        if (result.ok) {
          // Convert array to object for easier access
          const progressObj = {}
          result.progress.forEach(progress => {
            progressObj[progress.courseId] = progress
          })
          this.progress = progressObj
        }
      } catch (err) {
        console.error('Failed to load progress:', err)
      }
    },

    // Save progress to Firebase
    async saveProgress(userId, courseId, progressData) {
      if (!userId || !courseId) return

      try {
        const result = await userProgressService.saveProgress(userId, courseId, progressData)
        if (result.ok) {
          this.progress[courseId] = { userId, courseId, ...progressData }
        }
        return result
      } catch (err) {
        console.error('Failed to save progress:', err)
        return { ok: false, error: err.message }
      }
    },

    // Load course ratings from Firebase
    async loadCourseRatings(courseId) {
      try {
        console.log('Loading course ratings for course:', courseId)
        const ratings = await courseRatingService.getCourseRatings(courseId)
        const averageRating = await courseRatingService.getAverageRating(courseId)
        console.log('Loaded ratings:', ratings)
        console.log('Average rating:', averageRating)
        console.log('Rating count:', ratings.length)
        
        this.ratings[courseId] = {
          ratings,
          average: averageRating,
          count: ratings.length
        }
        
        console.log('Stored rating data:', this.ratings[courseId])
      } catch (err) {
        console.error('Failed to load course ratings:', err)
        this.ratings[courseId] = {
          ratings: [],
          average: 0,
          count: 0
        }
      }
    },

    // Add or update course rating
    async addRating(courseId, userId, rating, comment = '') {
      if (!userId || !courseId) return

      try {
        const result = await courseRatingService.addRating(courseId, userId, rating, comment)
        if (result.ok) {
          // Reload ratings for this course
          await this.loadCourseRatings(courseId)
        }
        return result
      } catch (err) {
        console.error('Failed to add rating:', err)
        return { ok: false, error: err.message }
      }
    },

    // Delete user's rating
    async deleteRating(courseId, userId) {
      if (!userId || !courseId) return { ok: false, error: 'Missing required parameters' }

      try {
        const result = await courseRatingService.deleteUserRating(courseId, userId)
        if (result.ok) {
          // Reload ratings for this course
          await this.loadCourseRatings(courseId)
        }
        return result
      } catch (err) {
        console.error('Failed to delete rating:', err)
        return { ok: false, error: err.message }
      }
    },

    // Add comment only (separate from rating)
    async addComment(courseId, userId, comment) {
      if (!userId || !courseId || !comment) {
        return { ok: false, error: 'Missing required parameters' }
      }

      try {
        // Create a comment document in a separate collection
        const { addDoc, collection, serverTimestamp } = await import('firebase/firestore')
        const { db } = await import('@/lib/firebase.js')
        
        const docRef = await addDoc(collection(db, 'course_comments'), {
          courseId,
          userId,
          comment,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
        
        // Reload comments
        await this.loadCourseComments(courseId)
        
        return { ok: true, id: docRef.id }
      } catch (err) {
        console.error('Failed to add comment:', err)
        return { ok: false, error: err.message }
      }
    },

    // Load course comments
    async loadCourseComments(courseId) {
      try {
        const { query, collection, where, orderBy, getDocs } = await import('firebase/firestore')
        const { db } = await import('@/lib/firebase.js')
        
        // First try with orderBy, if it fails, try without
        try {
          const q = query(
            collection(db, 'course_comments'), 
            where('courseId', '==', courseId),
            orderBy('createdAt', 'desc')
          )
          const querySnapshot = await getDocs(q)
          const comments = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
          this.comments[courseId] = comments
        } catch (indexError) {
          console.warn('Index not available for course_comments, fetching without orderBy:', indexError.message)
          // Fallback: get all comments for course and sort in memory
          const q = query(
            collection(db, 'course_comments'), 
            where('courseId', '==', courseId)
          )
          const querySnapshot = await getDocs(q)
          const comments = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
          // Sort by createdAt in descending order
          const sortedComments = comments.sort((a, b) => {
            const aTime = a.createdAt?.toDate?.() || new Date(0)
            const bTime = b.createdAt?.toDate?.() || new Date(0)
            return bTime - aTime
          })
          this.comments[courseId] = sortedComments
        }
      } catch (err) {
        console.error('Failed to load course comments:', err)
        this.comments[courseId] = []
      }
    },

    // Delete comment
    async deleteComment(commentId) {
      if (!commentId) return { ok: false, error: 'Missing comment ID' }

      try {
        const { deleteDoc, doc } = await import('firebase/firestore')
        const { db } = await import('@/lib/firebase.js')
        
        await deleteDoc(doc(db, 'course_comments', commentId))
        
        return { ok: true }
      } catch (err) {
        console.error('Failed to delete comment:', err)
        return { ok: false, error: err.message }
      }
    },

    // Update comment
    async updateComment(commentId, newContent) {
      if (!commentId || !newContent) return { ok: false, error: 'Missing required parameters' }

      try {
        const { updateDoc, doc, serverTimestamp } = await import('firebase/firestore')
        const { db } = await import('@/lib/firebase.js')
        
        await updateDoc(doc(db, 'course_comments', commentId), {
          comment: newContent,
          updatedAt: serverTimestamp()
        })
        
        return { ok: true }
      } catch (err) {
        console.error('Failed to update comment:', err)
        return { ok: false, error: err.message }
      }
    },

    // Add comment reply
    async addCommentReply(commentId, replyContent) {
      if (!commentId || !replyContent) return { ok: false, error: 'Missing required parameters' }

      try {
        const { addDoc, collection, serverTimestamp } = await import('firebase/firestore')
        const { db } = await import('@/lib/firebase.js')
        
        const docRef = await addDoc(collection(db, 'comment_replies'), {
          commentId,
          content: replyContent,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
        
        return { ok: true, id: docRef.id }
      } catch (err) {
        console.error('Failed to add comment reply:', err)
        return { ok: false, error: err.message }
      }
    },

    // Load user wishlist from Firebase
    async loadWishlist(userId) {
      if (!userId) return

      try {
        const result = await wishlistService.getWishlist(userId)
        if (result.ok) {
          // Convert array to object for easier access
          const wishlistObj = {}
          result.wishlist.forEach(item => {
            wishlistObj[item.courseId] = item
          })
          this.userWishlist = wishlistObj
        }
      } catch (err) {
        console.error('Failed to load wishlist:', err)
      }
    },

    // Add course to wishlist
    async addToWishlist(userId, courseId) {
      if (!userId || !courseId) return

      try {
        const result = await wishlistService.addToWishlist(userId, courseId)
        if (result.ok) {
          this.userWishlist[courseId] = result
        }
        return result
      } catch (err) {
        console.error('Failed to add to wishlist:', err)
        return { ok: false, error: err.message }
      }
    },

    // Remove course from wishlist
    async removeFromWishlist(userId, courseId) {
      if (!userId || !courseId) return

      try {
        // Find the wishlist item to get its ID
        const wishlistItem = this.userWishlist[courseId]
        if (wishlistItem) {
          const result = await wishlistService.removeFromWishlist(wishlistItem.id)
          if (result) {
            delete this.userWishlist[courseId]
          }
          return { ok: result }
        }
        return { ok: false, error: 'Item not found in wishlist' }
      } catch (err) {
        console.error('Failed to remove from wishlist:', err)
        return { ok: false, error: err.message }
      }
    },

    // Save wishlist (bulk operation)
    async saveWishlist(userId, wishlistData) {
      if (!userId) return

      try {
        const result = await wishlistService.saveWishlist(userId, wishlistData)
        if (result.ok) {
          // Reload wishlist
          await this.loadWishlist(userId)
        }
        return result
      } catch (err) {
        console.error('Failed to save wishlist:', err)
        return { ok: false, error: err.message }
      }
    },

    // Initialize with seed data if no courses exist
    async initializeCourses() {
      try {
        if (this.courses.length === 0) {
          await this.seedCourses()
        } else {
          // If courses already exist, make sure they're loaded
          await this.loadCourses()
        }
      } catch (error) {
        console.error('Error initializing courses:', error)
        // Fallback: try to load courses anyway
        await this.loadCourses()
      }
    },

    // Seed courses to Firebase
    async seedCourses() {
      const seedData = [
        // Nutrition - Beginner (6 courses)
        { title: 'Fundamentals of Nutrition', topic: 'Nutrition', difficulty: 'Beginner', minutes: 18, description: 'Learn the basics of nutrition science, including essential nutrients, dietary guidelines, and how to make informed food choices for better health.' },
        { title: 'Understanding Macronutrients', topic: 'Nutrition', difficulty: 'Beginner', minutes: 20, description: 'Dive deep into proteins, carbohydrates, and fats - the building blocks of nutrition that fuel your body and support your fitness goals.' },
        { title: 'Reading Food Labels', topic: 'Nutrition', difficulty: 'Beginner', minutes: 15, description: 'Master the skill of reading and understanding nutrition labels to make healthier food choices and avoid hidden ingredients.' },
        { title: 'Meal Planning Basics', topic: 'Nutrition', difficulty: 'Beginner', minutes: 25, description: 'Discover how to plan balanced meals that support your health goals, save time, and reduce food waste.' },
        { title: 'Healthy Grocery Shopping', topic: 'Nutrition', difficulty: 'Beginner', minutes: 22, description: 'Learn strategies for navigating the grocery store to fill your cart with nutritious, budget-friendly foods.' },
        { title: 'Portion Control Guide', topic: 'Nutrition', difficulty: 'Beginner', minutes: 18, description: 'Understand proper portion sizes and learn practical techniques to manage your food intake without feeling deprived.' },

        // Nutrition - Intermediate (6 courses)
        { title: 'Advanced Macronutrient Ratios', topic: 'Nutrition', difficulty: 'Intermediate', minutes: 30, description: 'Explore advanced strategies for optimizing your macronutrient balance based on your specific fitness goals and body composition.' },
        { title: 'Supplements and Their Benefits', topic: 'Nutrition', difficulty: 'Intermediate', minutes: 28, description: 'Learn about essential supplements, their benefits, and how to safely incorporate them into your nutrition plan.' },
        { title: 'Metabolic Health Optimization', topic: 'Nutrition', difficulty: 'Intermediate', minutes: 35, description: 'Discover how to optimize your metabolism through nutrition, exercise, and lifestyle factors for better health outcomes.' },
        { title: 'Custom Meal Planning', topic: 'Nutrition', difficulty: 'Intermediate', minutes: 32, description: 'Create personalized meal plans that align with your dietary preferences, fitness goals, and lifestyle constraints.' },
        { title: 'Nutrient Timing Strategies', topic: 'Nutrition', difficulty: 'Intermediate', minutes: 27, description: 'Learn when and how to time your nutrient intake for maximum performance, recovery, and body composition results.' },
        { title: 'Food Allergies and Intolerances', topic: 'Nutrition', difficulty: 'Intermediate', minutes: 24, description: 'Understand how to identify, manage, and work around food allergies and intolerances while maintaining a balanced diet.' },

        // Nutrition - Advanced (6 courses)
        { title: 'Advanced Nutritional Biochemistry', topic: 'Nutrition', difficulty: 'Advanced', minutes: 45, description: 'Dive deep into the biochemical processes of nutrition and how they affect your body at the cellular level.' },
        { title: 'Performance Nutrition for Athletes', topic: 'Nutrition', difficulty: 'Advanced', minutes: 50, description: 'Learn specialized nutrition strategies for athletes to optimize performance, recovery, and competitive edge.' },
        { title: 'Gut Health and Microbiome', topic: 'Nutrition', difficulty: 'Advanced', minutes: 42, description: 'Explore the complex world of gut health and how your microbiome affects your overall health and nutrition.' },
        { title: 'Hormonal Balance Through Nutrition', topic: 'Nutrition', difficulty: 'Advanced', minutes: 48, description: 'Understand how nutrition affects hormone balance and learn strategies to optimize hormonal health.' },
        { title: 'Body Composition Optimization', topic: 'Nutrition', difficulty: 'Advanced', minutes: 55, description: 'Master advanced techniques for optimizing body composition through precise nutritional strategies.' },
        { title: 'Recovery Nutrition Strategies', topic: 'Nutrition', difficulty: 'Advanced', minutes: 40, description: 'Learn advanced recovery nutrition strategies to maximize muscle repair and adaptation.' },

        // Workout - Beginner (6 courses)
        { title: 'Beginner Strength Routine', topic: 'Workout', difficulty: 'Beginner', minutes: 22, description: 'Start your strength training journey with safe, effective exercises designed for beginners.' },
        { title: 'Basic Cardio Workout', topic: 'Workout', difficulty: 'Beginner', minutes: 25, description: 'Build cardiovascular fitness with simple, low-impact cardio exercises you can do anywhere.' },
        { title: 'Introduction to Yoga', topic: 'Workout', difficulty: 'Beginner', minutes: 30, description: 'Begin your yoga practice with fundamental poses, breathing techniques, and mindfulness principles.' },
        { title: 'Home Workout Essentials', topic: 'Workout', difficulty: 'Beginner', minutes: 20, description: 'Create an effective workout routine using minimal equipment and space in your own home.' },
        { title: 'Proper Warm-up Techniques', topic: 'Workout', difficulty: 'Beginner', minutes: 15, description: 'Learn essential warm-up exercises to prevent injury and prepare your body for optimal performance.' },
        { title: 'Stretching and Flexibility', topic: 'Workout', difficulty: 'Beginner', minutes: 18, description: 'Improve your flexibility and mobility with targeted stretching routines for better movement and injury prevention.' },

        // Workout - Intermediate (6 courses)
        { title: 'Advanced Strength Training', topic: 'Workout', difficulty: 'Intermediate', minutes: 35, description: 'Take your strength training to the next level with advanced techniques and progressive overload strategies.' },
        { title: 'High-Intensity Interval Training', topic: 'Workout', difficulty: 'Intermediate', minutes: 28, description: 'Maximize your fitness gains with time-efficient HIIT workouts that boost metabolism and cardiovascular health.' },
        { title: 'Power Yoga Flow', topic: 'Workout', difficulty: 'Intermediate', minutes: 40, description: 'Enhance your yoga practice with dynamic flows that build strength, flexibility, and mental focus.' },
        { title: 'Functional Fitness Training', topic: 'Workout', difficulty: 'Intermediate', minutes: 32, description: 'Train your body for real-world movements and activities with functional exercises that improve daily performance.' },
        { title: 'Circuit Training Methods', topic: 'Workout', difficulty: 'Intermediate', minutes: 30, description: 'Combine strength and cardio in efficient circuit workouts that burn calories and build muscle simultaneously.' },
        { title: 'Injury Prevention Techniques', topic: 'Workout', difficulty: 'Intermediate', minutes: 25, description: 'Learn proper form, recovery strategies, and injury prevention techniques to maintain long-term fitness.' },

        // Workout - Advanced (6 courses)
        { title: 'Elite Strength Conditioning', topic: 'Workout', difficulty: 'Advanced', minutes: 50, description: 'Master advanced strength training techniques used by elite athletes and fitness professionals.' },
        { title: 'Advanced HIIT Protocols', topic: 'Workout', difficulty: 'Advanced', minutes: 45, description: 'Push your limits with cutting-edge HIIT protocols designed for maximum performance and fat loss.' },
        { title: 'Advanced Yoga Asanas', topic: 'Workout', difficulty: 'Advanced', minutes: 55, description: 'Explore advanced yoga poses and sequences that challenge your strength, balance, and flexibility.' },
        { title: 'Olympic Weightlifting Techniques', topic: 'Workout', difficulty: 'Advanced', minutes: 60, description: 'Learn the fundamentals of Olympic weightlifting for explosive power and athletic performance.' },
        { title: 'Periodization Training Methods', topic: 'Workout', difficulty: 'Advanced', minutes: 48, description: 'Structure your training with periodization principles for continuous progress and peak performance.' },
        { title: 'Sports-Specific Performance', topic: 'Workout', difficulty: 'Advanced', minutes: 52, description: 'Tailor your training to specific sports and activities for improved performance and reduced injury risk.' },
      ]

      try {
        console.log('Checking if courses already exist...')
        // Check if courses already exist
        const result = await courseService.getCourses()
        console.log('Existing courses result:', result)
        if (result.ok && result.courses.length > 0) {
          console.log('Setting courses from seedCourses (existing):', result.courses, 'Type:', typeof result.courses, 'IsArray:', Array.isArray(result.courses))
          this.courses = Array.isArray(result.courses) ? result.courses : []
          console.log('Using existing courses:', this.courses.length)
          return
        }

        console.log('No existing courses found, seeding data...')
        // Add courses to Firebase
        for (const course of seedData) {
          console.log('Creating course:', course.title)
          await courseService.createCourse(course)
        }

        console.log('All courses created, reloading...')
        // Reload courses
        await this.loadCourses()
      } catch (error) {
        console.error('Error seeding courses:', error)
        // If seeding fails, try to load existing courses
        await this.loadCourses()
      }
    },

    // Legacy compatibility methods
    get lessons() {
      const result = Array.isArray(this.courses) ? this.courses : []
      console.log('lessons getter called, returning:', result.length, 'items, type:', typeof result)
      return result
    },

    set lessons(value) {
      console.log('Setting lessons.lessons to:', value, 'Type:', typeof value, 'IsArray:', Array.isArray(value))
      this.courses = Array.isArray(value) ? value : []
    },

    // Rate a course (legacy compatibility)
    rate(id, value) {
      if (!this.currentUser) return
      this.addRating(id, this.currentUser.id || this.currentUser.email, value)
    },

    // Set progress (legacy compatibility)
    setProgress(id, pct) {
      if (!this.currentUser) return
      this.saveProgress(this.currentUser.id || this.currentUser.email, id, { 
        progressPercentage: Math.max(0, Math.min(100, Number(pct))) 
      })
    },

    // Reset data (legacy compatibility)
    resetData() {
      this.courses = []
      this.ratings = {}
      this.progress = {}
      this.userWishlist = {}
    },

    // Check if course is in user wishlist
    isInWishlist(userId, courseId) {
      return !!this.userWishlist[courseId]
    },

    // Get user's wishlist course IDs
    getUserWishlist(userId) {
      return Object.keys(this.userWishlist)
    },

    // Get course details of user's wishlist
    getUserWishlistLessons(userId) {
      const wishlistIds = this.getUserWishlist(userId)
      return this.courses.filter(course => wishlistIds.includes(course.id))
    },

    // Real-time listeners
    startRealtimeListeners() {
      if (!this.currentUser) return

      const userId = this.currentUser.id || this.currentUser.email

      // Listen to courses changes
      this.realtimeListeners.courses = realtimeService.listenToCourses((courses) => {
        console.log('Setting courses from realtime listener:', courses, 'Type:', typeof courses, 'IsArray:', Array.isArray(courses))
        this.courses = Array.isArray(courses) ? courses : []
      })

      // Listen to user progress changes
      this.realtimeListeners.progress = realtimeService.listenToUserProgress(userId, (progress) => {
        const progressObj = {}
        progress.forEach(p => {
          progressObj[p.courseId] = p
        })
        this.progress = progressObj
      })

      // Listen to user wishlist changes
      this.realtimeListeners.wishlist = realtimeService.listenToUserWishlist(userId, (wishlist) => {
        const wishlistObj = {}
        wishlist.forEach(item => {
          wishlistObj[item.courseId] = item
        })
        this.userWishlist = wishlistObj
      })
    },

    // Stop real-time listeners
    stopRealtimeListeners() {
      Object.values(this.realtimeListeners).forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') {
          unsubscribe()
        }
      })
      this.realtimeListeners = {}
    },

    // Listen to specific course ratings
    listenToCourseRatings(courseId) {
      if (this.realtimeListeners[`ratings_${courseId}`]) {
        return // Already listening
      }

      this.realtimeListeners[`ratings_${courseId}`] = realtimeService.listenToCourseRatings(courseId, (ratings) => {
        const averageRating = ratings.length > 0 
          ? Math.round((ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length) * 10) / 10
          : 0
        
        this.ratings[courseId] = {
          ratings,
          average: averageRating,
          count: ratings.length
        }
      })
    },

    // Stop listening to specific course ratings
    stopListeningToCourseRatings(courseId) {
      const listenerKey = `ratings_${courseId}`
      if (this.realtimeListeners[listenerKey]) {
        this.realtimeListeners[listenerKey]()
        delete this.realtimeListeners[listenerKey]
      }
    },
  },
  getters: {
    // Get average rating for a course
    averageRating: (state) => (id) => {
      const ratingData = state.ratings[id]
      if (!ratingData) return 0
      return ratingData.average || 0
    },

    // Get rating count for a course
    ratingCount: (state) => (id) => {
      const ratingData = state.ratings[id]
      if (!ratingData) return 0
      return ratingData.count || 0
    },

    // Get user progress for a course
    getCourseProgress: (state) => (id) => {
      const progress = state.progress[id]
      if (!progress) return 0
      return progress.progressPercentage || 0
    }
  }
})


