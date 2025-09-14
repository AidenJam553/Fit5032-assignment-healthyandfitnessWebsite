// Firebase service functions
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore'
import { db } from './firebase.js'

// User Service
export const userService = {
  // Create a new user
  async createUser(userData) {
    try {
      const docRef = await addDoc(collection(db, 'users'), {
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      return { id: docRef.id, ...userData }
    } catch (error) {
      console.error('Error creating user:', error)
      throw error
    }
  },

  // Get user by ID
  async getUser(userId) {
    try {
      const docRef = doc(db, 'users', userId)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() }
      } else {
        return null
      }
    } catch (error) {
      console.error('Error getting user:', error)
      throw error
    }
  },

  // Update user
  async updateUser(userId, userData) {
    try {
      const docRef = doc(db, 'users', userId)
      await updateDoc(docRef, {
        ...userData,
        updatedAt: serverTimestamp()
      })
      return { id: userId, ...userData }
    } catch (error) {
      console.error('Error updating user:', error)
      throw error
    }
  },

  // Get all users
  async getAllUsers() {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'))
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    } catch (error) {
      console.error('Error getting all users:', error)
      throw error
    }
  },

  // Get user by email
  async getUserByEmail(email) {
    try {
      const q = query(collection(db, 'users'), where('email', '==', email))
      const querySnapshot = await getDocs(q)
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0]
        return { ok: true, user: { id: doc.id, ...doc.data() } }
      } else {
        return { ok: false, error: 'User not found' }
      }
    } catch (error) {
      console.error('Error getting user by email:', error)
      return { ok: false, error: error.message }
    }
  },

  // Save user (create or update)
  async saveUser(userData) {
    try {
      if (userData.id) {
        // Update existing user
        const result = await this.updateUser(userData.id, userData)
        return { ok: true, user: result }
      } else {
        // Create new user
        const result = await this.createUser(userData)
        return { ok: true, user: result }
      }
    } catch (error) {
      console.error('Error saving user:', error)
      return { ok: false, error: error.message }
    }
  }
}

// Forum Service
export const forumService = {
  // Create a new forum post
  async createPost(postData) {
    try {
      const docRef = await addDoc(collection(db, 'forum_posts'), {
        ...postData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      const post = { id: docRef.id, ...postData }
      return { ok: true, post }
    } catch (error) {
      console.error('Error creating forum post:', error)
      return { ok: false, error: error.message }
    }
  },

  // Get all forum posts
  async getAllPosts() {
    try {
      const q = query(collection(db, 'forum_posts'), orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    } catch (error) {
      console.error('Error getting forum posts:', error)
      throw error
    }
  },

  // Get posts (alias for getAllPosts with proper return format)
  async getPosts() {
    try {
      const posts = await this.getAllPosts()
      return { ok: true, posts }
    } catch (error) {
      console.error('Error getting posts:', error)
      return { ok: false, error: error.message }
    }
  },

  // Get post by ID
  async getPost(postId) {
    try {
      const docRef = doc(db, 'forum_posts', postId)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() }
      } else {
        return null
      }
    } catch (error) {
      console.error('Error getting forum post:', error)
      throw error
    }
  },

  // Update post
  async updatePost(postId, postData) {
    try {
      const docRef = doc(db, 'forum_posts', postId)
      await updateDoc(docRef, {
        ...postData,
        updatedAt: serverTimestamp()
      })
      const post = { id: postId, ...postData }
      return { ok: true, post }
    } catch (error) {
      console.error('Error updating forum post:', error)
      return { ok: false, error: error.message }
    }
  },

  // Delete post
  async deletePost(postId) {
    try {
      const docRef = doc(db, 'forum_posts', postId)
      await deleteDoc(docRef)
      return { ok: true }
    } catch (error) {
      console.error('Error deleting forum post:', error)
      return { ok: false, error: error.message }
    }
  }
}

// Lessons Service
export const lessonsService = {
  // Create a new lesson
  async createLesson(lessonData) {
    try {
      const docRef = await addDoc(collection(db, 'lessons'), {
        ...lessonData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      return { id: docRef.id, ...lessonData }
    } catch (error) {
      console.error('Error creating lesson:', error)
      throw error
    }
  },

  // Get all lessons
  async getAllLessons() {
    try {
      const q = query(collection(db, 'lessons'), orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    } catch (error) {
      console.error('Error getting lessons:', error)
      throw error
    }
  },

  // Get lesson by ID
  async getLesson(lessonId) {
    try {
      const docRef = doc(db, 'lessons', lessonId)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() }
      } else {
        return null
      }
    } catch (error) {
      console.error('Error getting lesson:', error)
      throw error
    }
  },

  // Update lesson
  async updateLesson(lessonId, lessonData) {
    try {
      const docRef = doc(db, 'lessons', lessonId)
      await updateDoc(docRef, {
        ...lessonData,
        updatedAt: serverTimestamp()
      })
      return { id: lessonId, ...lessonData }
    } catch (error) {
      console.error('Error updating lesson:', error)
      throw error
    }
  },

  // Get lessons (alias for getAllLessons with proper return format)
  async getLessons() {
    try {
      const lessons = await this.getAllLessons()
      return { ok: true, lessons }
    } catch (error) {
      console.error('Error getting lessons:', error)
      return { ok: false, error: error.message }
    }
  },

  // Get user progress
  async getUserProgress(userId) {
    try {
      const q = query(
        collection(db, 'user_progress'), 
        where('userId', '==', userId)
      )
      const querySnapshot = await getDocs(q)
      const progress = {}
      querySnapshot.docs.forEach(doc => {
        const data = doc.data()
        progress[data.lessonId] = data
      })
      return { ok: true, progress }
    } catch (error) {
      console.error('Error getting user progress:', error)
      return { ok: false, error: error.message }
    }
  },

  // Save progress
  async saveProgress(userId, lessonId, progressData) {
    try {
      const q = query(
        collection(db, 'user_progress'), 
        where('userId', '==', userId),
        where('lessonId', '==', lessonId)
      )
      const querySnapshot = await getDocs(q)
      
      if (!querySnapshot.empty) {
        // Update existing progress
        const docRef = querySnapshot.docs[0].ref
        await updateDoc(docRef, {
          ...progressData,
          updatedAt: serverTimestamp()
        })
      } else {
        // Create new progress
        await addDoc(collection(db, 'user_progress'), {
          userId,
          lessonId,
          ...progressData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
      }
      return { ok: true }
    } catch (error) {
      console.error('Error saving progress:', error)
      return { ok: false, error: error.message }
    }
  }
}

// Records Service
export const recordsService = {
  // Create a new record
  async createRecord(recordData) {
    try {
      const docRef = await addDoc(collection(db, 'records'), {
        ...recordData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      return { id: docRef.id, ...recordData }
    } catch (error) {
      console.error('Error creating record:', error)
      throw error
    }
  },

  // Get user records
  async getUserRecords(userId) {
    try {
      const q = query(
        collection(db, 'records'), 
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      )
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    } catch (error) {
      console.error('Error getting user records:', error)
      throw error
    }
  },

  // Get all records
  async getAllRecords() {
    try {
      const q = query(collection(db, 'records'), orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    } catch (error) {
      console.error('Error getting all records:', error)
      throw error
    }
  },

  // Update record
  async updateRecord(recordId, recordData) {
    try {
      const docRef = doc(db, 'records', recordId)
      await updateDoc(docRef, {
        ...recordData,
        updatedAt: serverTimestamp()
      })
      return { id: recordId, ...recordData }
    } catch (error) {
      console.error('Error updating record:', error)
      throw error
    }
  },

  // Delete record
  async deleteRecord(recordId) {
    try {
      const docRef = doc(db, 'records', recordId)
      await deleteDoc(docRef)
      return true
    } catch (error) {
      console.error('Error deleting record:', error)
      throw error
    }
  },

  // Get records (alias for getUserRecords with proper return format)
  async getRecords(userId) {
    try {
      const records = await this.getUserRecords(userId)
      return { ok: true, records }
    } catch (error) {
      console.error('Error getting records:', error)
      return { ok: false, error: error.message }
    }
  },

  // Save records
  async saveRecords(userId, recordsData) {
    try {
      const q = query(collection(db, 'records'), where('userId', '==', userId))
      const querySnapshot = await getDocs(q)
      
      if (!querySnapshot.empty) {
        // Update existing records
        const docRef = querySnapshot.docs[0].ref
        await updateDoc(docRef, {
          ...recordsData,
          updatedAt: serverTimestamp()
        })
      } else {
        // Create new records
        await addDoc(collection(db, 'records'), {
          userId,
          ...recordsData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
      }
      return { ok: true }
    } catch (error) {
      console.error('Error saving records:', error)
      return { ok: false, error: error.message }
    }
  }
}

// Course Service
export const courseService = {
  // Create a new course
  async createCourse(courseData) {
    try {
      const docRef = await addDoc(collection(db, 'courses'), {
        ...courseData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      return { id: docRef.id, ...courseData }
    } catch (error) {
      console.error('Error creating course:', error)
      throw error
    }
  },

  // Get all courses
  async getAllCourses() {
    try {
      const q = query(collection(db, 'courses'), orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)
      const courses = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      console.log('Raw courses from getAllCourses:', courses)
      return Array.isArray(courses) ? courses : []
    } catch (error) {
      console.error('Error getting courses:', error)
      return []
    }
  },

  // Get course by ID
  async getCourse(courseId) {
    try {
      const docRef = doc(db, 'courses', courseId)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() }
      } else {
        return null
      }
    } catch (error) {
      console.error('Error getting course:', error)
      throw error
    }
  },

  // Update course
  async updateCourse(courseId, courseData) {
    try {
      const docRef = doc(db, 'courses', courseId)
      await updateDoc(docRef, {
        ...courseData,
        updatedAt: serverTimestamp()
      })
      return { id: courseId, ...courseData }
    } catch (error) {
      console.error('Error updating course:', error)
      throw error
    }
  },

  // Delete course
  async deleteCourse(courseId) {
    try {
      const docRef = doc(db, 'courses', courseId)
      await deleteDoc(docRef)
      return true
    } catch (error) {
      console.error('Error deleting course:', error)
      throw error
    }
  },

  // Get courses (alias for getAllCourses with proper return format)
  async getCourses() {
    try {
      console.log('Getting courses from Firestore...')
      const courses = await this.getAllCourses()
      console.log('Raw courses from Firestore:', courses)
      const safeCourses = Array.isArray(courses) ? courses : []
      return { ok: true, courses: safeCourses }
    } catch (error) {
      console.error('Error getting courses:', error)
      return { ok: false, error: error.message, courses: [] }
    }
  }
}

// Course Rating Service
export const courseRatingService = {
  // Add or update course rating
  async addRating(courseId, userId, rating, comment = '') {
    try {
      // Check if user already rated this course
      const q = query(
        collection(db, 'course_ratings'), 
        where('courseId', '==', courseId),
        where('userId', '==', userId)
      )
      const querySnapshot = await getDocs(q)
      
      if (!querySnapshot.empty) {
        // Update existing rating
        const docRef = querySnapshot.docs[0].ref
        await updateDoc(docRef, {
          rating,
          comment,
          updatedAt: serverTimestamp()
        })
        return { ok: true, id: docRef.id, rating, comment }
      } else {
        // Create new rating
        const docRef = await addDoc(collection(db, 'course_ratings'), {
          courseId,
          userId,
          rating,
          comment,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
        return { ok: true, id: docRef.id, rating, comment }
      }
    } catch (error) {
      console.error('Error adding rating:', error)
      return { ok: false, error: error.message }
    }
  },

  // Get course ratings
  async getCourseRatings(courseId) {
    try {
      console.log('FirebaseService: Getting course ratings for courseId:', courseId)
      // First try with orderBy, if it fails, try without
      try {
        const q = query(
          collection(db, 'course_ratings'), 
          where('courseId', '==', courseId),
          orderBy('createdAt', 'desc')
        )
        const querySnapshot = await getDocs(q)
        const ratings = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        console.log('FirebaseService: Found ratings with orderBy:', ratings)
        return ratings
      } catch (indexError) {
        console.warn('Index not available, fetching without orderBy:', indexError.message)
        // Fallback: get all ratings for course and sort in memory
        const q = query(
          collection(db, 'course_ratings'), 
          where('courseId', '==', courseId)
        )
        const querySnapshot = await getDocs(q)
        const ratings = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        console.log('FirebaseService: Found ratings without orderBy:', ratings)
        // Sort by createdAt in descending order
        return ratings.sort((a, b) => {
          const aTime = a.createdAt?.toDate?.() || new Date(0)
          const bTime = b.createdAt?.toDate?.() || new Date(0)
          return bTime - aTime
        })
      }
    } catch (error) {
      console.error('Error getting course ratings:', error)
      throw error
    }
  },

  // Get user rating for a course
  async getUserRating(courseId, userId) {
    try {
      const q = query(
        collection(db, 'course_ratings'), 
        where('courseId', '==', courseId),
        where('userId', '==', userId)
      )
      const querySnapshot = await getDocs(q)
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0]
        return { id: doc.id, ...doc.data() }
      } else {
        return null
      }
    } catch (error) {
      console.error('Error getting user rating:', error)
      throw error
    }
  },

  // Get average rating for a course
  async getAverageRating(courseId) {
    try {
      console.log('FirebaseService: Getting average rating for courseId:', courseId)
      const ratings = await this.getCourseRatings(courseId)
      console.log('FirebaseService: Ratings for average calculation:', ratings)
      
      if (ratings.length === 0) {
        console.log('FirebaseService: No ratings found, returning 0')
        return 0
      }
      
      const totalRating = ratings.reduce((sum, rating) => sum + rating.rating, 0)
      const average = Math.round((totalRating / ratings.length) * 10) / 10
      console.log('FirebaseService: Calculated average rating:', average)
      return average
    } catch (error) {
      console.error('Error getting average rating:', error)
      return 0
    }
  },

  // Delete rating
  async deleteRating(ratingId) {
    try {
      const docRef = doc(db, 'course_ratings', ratingId)
      await deleteDoc(docRef)
      return true
    } catch (error) {
      console.error('Error deleting rating:', error)
      throw error
    }
  },

  // Delete user's rating for a specific course
  async deleteUserRating(courseId, userId) {
    try {
      // Find the user's rating for this course
      const q = query(
        collection(db, 'course_ratings'), 
        where('courseId', '==', courseId),
        where('userId', '==', userId)
      )
      const querySnapshot = await getDocs(q)
      
      if (!querySnapshot.empty) {
        // Delete the rating document
        const docRef = querySnapshot.docs[0].ref
        await deleteDoc(docRef)
        return { ok: true }
      } else {
        return { ok: false, error: 'Rating not found' }
      }
    } catch (error) {
      console.error('Error deleting user rating:', error)
      return { ok: false, error: error.message }
    }
  }
}

// User Course Progress Service
export const userProgressService = {
  // Save or update user progress
  async saveProgress(userId, courseId, progressData) {
    try {
      const q = query(
        collection(db, 'user_progress'), 
        where('userId', '==', userId),
        where('courseId', '==', courseId)
      )
      const querySnapshot = await getDocs(q)
      
      if (!querySnapshot.empty) {
        // Update existing progress
        const docRef = querySnapshot.docs[0].ref
        await updateDoc(docRef, {
          ...progressData,
          updatedAt: serverTimestamp()
        })
        return { ok: true, id: docRef.id, ...progressData }
      } else {
        // Create new progress
        const docRef = await addDoc(collection(db, 'user_progress'), {
          userId,
          courseId,
          ...progressData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
        return { ok: true, id: docRef.id, ...progressData }
      }
    } catch (error) {
      console.error('Error saving progress:', error)
      return { ok: false, error: error.message }
    }
  },

  // Get user progress for a specific course
  async getCourseProgress(userId, courseId) {
    try {
      const q = query(
        collection(db, 'user_progress'), 
        where('userId', '==', userId),
        where('courseId', '==', courseId)
      )
      const querySnapshot = await getDocs(q)
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0]
        return { id: doc.id, ...doc.data() }
      } else {
        return null
      }
    } catch (error) {
      console.error('Error getting course progress:', error)
      throw error
    }
  },

  // Get all user progress
  async getUserProgress(userId) {
    try {
      // First try with orderBy, if it fails, try without
      try {
        const q = query(
          collection(db, 'user_progress'), 
          where('userId', '==', userId),
          orderBy('updatedAt', 'desc')
        )
        const querySnapshot = await getDocs(q)
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      } catch (indexError) {
        console.warn('Index not available, fetching without orderBy:', indexError.message)
        // Fallback: get all progress for user and sort in memory
        const q = query(
          collection(db, 'user_progress'), 
          where('userId', '==', userId)
        )
        const querySnapshot = await getDocs(q)
        const progress = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        // Sort by updatedAt in descending order
        return progress.sort((a, b) => {
          const aTime = a.updatedAt?.toDate?.() || new Date(0)
          const bTime = b.updatedAt?.toDate?.() || new Date(0)
          return bTime - aTime
        })
      }
    } catch (error) {
      console.error('Error getting user progress:', error)
      throw error
    }
  },

  // Get progress (alias for getUserProgress with proper return format)
  async getProgress(userId) {
    try {
      const progress = await this.getUserProgress(userId)
      return { ok: true, progress }
    } catch (error) {
      console.error('Error getting progress:', error)
      return { ok: false, error: error.message }
    }
  },

  // Update course completion status
  async updateCompletion(userId, courseId, isCompleted = true, completionDate = null) {
    try {
      const progressData = {
        isCompleted,
        completionDate: completionDate || serverTimestamp(),
        progressPercentage: isCompleted ? 100 : 0
      }
      return await this.saveProgress(userId, courseId, progressData)
    } catch (error) {
      console.error('Error updating completion:', error)
      return { ok: false, error: error.message }
    }
  }
}

// Wishlist Service
export const wishlistService = {
  // Add to wishlist
  async addToWishlist(userId, courseId) {
    try {
      const docRef = await addDoc(collection(db, 'wishlist'), {
        userId,
        courseId,
        createdAt: serverTimestamp()
      })
      return { id: docRef.id, userId, courseId }
    } catch (error) {
      console.error('Error adding to wishlist:', error)
      throw error
    }
  },

  // Remove from wishlist
  async removeFromWishlist(wishlistId) {
    try {
      const docRef = doc(db, 'wishlist', wishlistId)
      await deleteDoc(docRef)
      return true
    } catch (error) {
      console.error('Error removing from wishlist:', error)
      throw error
    }
  },

  // Get user wishlist
  async getUserWishlist(userId) {
    try {
      // First try with orderBy, if it fails, try without
      try {
        const q = query(
          collection(db, 'wishlist'), 
          where('userId', '==', userId),
          orderBy('createdAt', 'desc')
        )
        const querySnapshot = await getDocs(q)
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      } catch (indexError) {
        console.warn('Index not available, fetching without orderBy:', indexError.message)
        // Fallback: get all wishlist items for user and sort in memory
        const q = query(
          collection(db, 'wishlist'), 
          where('userId', '==', userId)
        )
        const querySnapshot = await getDocs(q)
        const wishlist = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        // Sort by createdAt in descending order
        return wishlist.sort((a, b) => {
          const aTime = a.createdAt?.toDate?.() || new Date(0)
          const bTime = b.createdAt?.toDate?.() || new Date(0)
          return bTime - aTime
        })
      }
    } catch (error) {
      console.error('Error getting user wishlist:', error)
      throw error
    }
  },

  // Get wishlist (alias for getUserWishlist with proper return format)
  async getWishlist(userId) {
    try {
      const wishlist = await this.getUserWishlist(userId)
      return { ok: true, wishlist }
    } catch (error) {
      console.error('Error getting wishlist:', error)
      return { ok: false, error: error.message }
    }
  },

  // Save wishlist
  async saveWishlist(userId, wishlistData) {
    try {
      // First, remove all existing wishlist items for this user
      const q = query(collection(db, 'wishlist'), where('userId', '==', userId))
      const querySnapshot = await getDocs(q)
      
      // Delete existing items
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref))
      await Promise.all(deletePromises)
      
      // Add new items
      const addPromises = wishlistData.map(courseId => 
        addDoc(collection(db, 'wishlist'), {
          userId,
          courseId,
          createdAt: serverTimestamp()
        })
      )
      await Promise.all(addPromises)
      
      return { ok: true }
    } catch (error) {
      console.error('Error saving wishlist:', error)
      return { ok: false, error: error.message }
    }
  }
}

// Real-time listeners for live updates
export const realtimeService = {
  // Listen to course ratings changes
  listenToCourseRatings(courseId, callback) {
    const q = query(
      collection(db, 'course_ratings'), 
      where('courseId', '==', courseId),
      orderBy('createdAt', 'desc')
    )
    
    return onSnapshot(q, (querySnapshot) => {
      const ratings = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      callback(ratings)
    }, (error) => {
      console.warn('Index not available, using fallback listener:', error.message)
      // Fallback: listen without orderBy
      return this.listenToCourseRatingsFallback(courseId, callback)
    })
  },

  // Fallback listener without orderBy
  listenToCourseRatingsFallback(courseId, callback) {
    const q = query(
      collection(db, 'course_ratings'), 
      where('courseId', '==', courseId)
    )
    
    return onSnapshot(q, (querySnapshot) => {
      const ratings = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      // Sort by createdAt in descending order
      const sortedRatings = ratings.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(0)
        const bTime = b.createdAt?.toDate?.() || new Date(0)
        return bTime - aTime
      })
      callback(sortedRatings)
    }, (error) => {
      console.error('Error listening to course ratings (fallback):', error)
    })
  },

  // Listen to user progress changes
  listenToUserProgress(userId, callback) {
    const q = query(
      collection(db, 'user_progress'), 
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    )
    
    return onSnapshot(q, (querySnapshot) => {
      const progress = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      callback(progress)
    }, (error) => {
      console.warn('Index not available, using fallback listener:', error.message)
      // Fallback: listen without orderBy
      return this.listenToUserProgressFallback(userId, callback)
    })
  },

  // Fallback listener for user progress without orderBy
  listenToUserProgressFallback(userId, callback) {
    const q = query(
      collection(db, 'user_progress'), 
      where('userId', '==', userId)
    )
    
    return onSnapshot(q, (querySnapshot) => {
      const progress = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      // Sort by updatedAt in descending order
      const sortedProgress = progress.sort((a, b) => {
        const aTime = a.updatedAt?.toDate?.() || new Date(0)
        const bTime = b.updatedAt?.toDate?.() || new Date(0)
        return bTime - aTime
      })
      callback(sortedProgress)
    }, (error) => {
      console.error('Error listening to user progress (fallback):', error)
    })
  },

  // Listen to user wishlist changes
  listenToUserWishlist(userId, callback) {
    const q = query(
      collection(db, 'wishlist'), 
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    )
    
    return onSnapshot(q, (querySnapshot) => {
      const wishlist = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      callback(wishlist)
    }, (error) => {
      console.warn('Index not available, using fallback listener:', error.message)
      // Fallback: listen without orderBy
      return this.listenToUserWishlistFallback(userId, callback)
    })
  },

  // Fallback listener for user wishlist without orderBy
  listenToUserWishlistFallback(userId, callback) {
    const q = query(
      collection(db, 'wishlist'), 
      where('userId', '==', userId)
    )
    
    return onSnapshot(q, (querySnapshot) => {
      const wishlist = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      // Sort by createdAt in descending order
      const sortedWishlist = wishlist.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(0)
        const bTime = b.createdAt?.toDate?.() || new Date(0)
        return bTime - aTime
      })
      callback(sortedWishlist)
    }, (error) => {
      console.error('Error listening to user wishlist (fallback):', error)
    })
  },

  // Listen to all courses changes
  listenToCourses(callback) {
    const q = query(collection(db, 'courses'), orderBy('createdAt', 'desc'))
    
    return onSnapshot(q, (querySnapshot) => {
      const courses = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      callback(courses)
    }, (error) => {
      console.error('Error listening to courses:', error)
    })
  }
}
