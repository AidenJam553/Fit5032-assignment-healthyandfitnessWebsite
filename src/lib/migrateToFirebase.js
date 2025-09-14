// Data migration script to move from localStorage to Firebase
import { userService, forumService, lessonsService, recordsService, wishlistService } from './firebaseService'

// Migration functions
export const migrationService = {
  // Migrate user data
  async migrateUsers() {
    try {
      const users = JSON.parse(localStorage.getItem('users') || '[]')
      console.log(`Migrating ${users.length} users to Firebase...`)
      
      for (const user of users) {
        const result = await userService.createUser(user)
        if (result.ok) {
          console.log(`✓ Migrated user: ${user.email}`)
        } else {
          console.error(`✗ Failed to migrate user ${user.email}:`, result.error)
        }
      }
      
      return { ok: true, message: `Migrated ${users.length} users` }
    } catch (error) {
      console.error('Error migrating users:', error)
      return { ok: false, error: error.message }
    }
  },

  // Migrate forum posts
  async migratePosts() {
    try {
      const posts = JSON.parse(localStorage.getItem('hf_posts_v1') || '[]')
      console.log(`Migrating ${posts.length} posts to Firebase...`)
      
      for (const post of posts) {
        const result = await forumService.createPost(post)
        if (result.ok) {
          console.log(`✓ Migrated post: ${post.title}`)
        } else {
          console.error(`✗ Failed to migrate post ${post.title}:`, result.error)
        }
      }
      
      return { ok: true, message: `Migrated ${posts.length} posts` }
    } catch (error) {
      console.error('Error migrating posts:', error)
      return { ok: false, error: error.message }
    }
  },

  // Migrate lessons
  async migrateLessons() {
    try {
      const lessons = JSON.parse(localStorage.getItem('hf_lessons_v1') || '[]')
      console.log(`Migrating ${lessons.length} lessons to Firebase...`)
      
      for (const lesson of lessons) {
        const result = await lessonsService.createLesson(lesson)
        if (result.ok) {
          console.log(`✓ Migrated lesson: ${lesson.title}`)
        } else {
          console.error(`✗ Failed to migrate lesson ${lesson.title}:`, result.error)
        }
      }
      
      return { ok: true, message: `Migrated ${lessons.length} lessons` }
    } catch (error) {
      console.error('Error migrating lessons:', error)
      return { ok: false, error: error.message }
    }
  },

  // Migrate user records
  async migrateRecords() {
    try {
      const records = JSON.parse(localStorage.getItem('hf_records_v1') || '{}')
      console.log('Migrating user records to Firebase...')
      
      // Get all users to migrate their records
      const users = JSON.parse(localStorage.getItem('users') || '[]')
      
      for (const user of users) {
        if (records[user.id]) {
          const result = await recordsService.saveRecords(user.id, records[user.id])
          if (result.ok) {
            console.log(`✓ Migrated records for user: ${user.email}`)
          } else {
            console.error(`✗ Failed to migrate records for ${user.email}:`, result.error)
          }
        }
      }
      
      return { ok: true, message: 'Migrated user records' }
    } catch (error) {
      console.error('Error migrating records:', error)
      return { ok: false, error: error.message }
    }
  },

  // Migrate wishlists
  async migrateWishlists() {
    try {
      const wishlists = JSON.parse(localStorage.getItem('hf_wishlist_v1') || '{}')
      console.log('Migrating wishlists to Firebase...')
      
      for (const [userId, wishlistData] of Object.entries(wishlists)) {
        const result = await wishlistService.saveWishlist(userId, wishlistData)
        if (result.ok) {
          console.log(`✓ Migrated wishlist for user: ${userId}`)
        } else {
          console.error(`✗ Failed to migrate wishlist for ${userId}:`, result.error)
        }
      }
      
      return { ok: true, message: 'Migrated wishlists' }
    } catch (error) {
      console.error('Error migrating wishlists:', error)
      return { ok: false, error: error.message }
    }
  },

  // Run full migration
  async runFullMigration() {
    console.log('🚀 Starting full data migration to Firebase...')
    
    const results = {
      users: await this.migrateUsers(),
      posts: await this.migratePosts(),
      lessons: await this.migrateLessons(),
      records: await this.migrateRecords(),
      wishlists: await this.migrateWishlists()
    }
    
    const successCount = Object.values(results).filter(r => r.ok).length
    const totalCount = Object.keys(results).length
    
    console.log(`\n📊 Migration completed: ${successCount}/${totalCount} successful`)
    
    return {
      ok: successCount === totalCount,
      results,
      message: `Migration completed: ${successCount}/${totalCount} successful`
    }
  },

  // Clear localStorage after successful migration
  clearLocalStorage() {
    const keysToRemove = [
      'users',
      'hf_posts_v1',
      'hf_lessons_v1',
      'hf_records_v1',
      'hf_wishlist_v1'
    ]
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key)
    })
    
    console.log('🧹 Cleared localStorage data')
  }
}

// Auto-migration on app start (optional)
export function autoMigrate() {
  // Check if migration is needed
  const hasLocalData = localStorage.getItem('users') || 
                      localStorage.getItem('hf_posts_v1') || 
                      localStorage.getItem('hf_lessons_v1')
  
  if (hasLocalData) {
    console.log('🔄 Local data detected. Run migrationService.runFullMigration() to migrate to Firebase.')
  }
}

