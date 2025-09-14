import { defineStore } from 'pinia'
import { forumService } from '../firebaseService'

export const useForumStore = defineStore('forum', {
  state: () => ({ posts: [], activeTopic: 'All', loading: false, error: null }),
  actions: {
    async loadPosts() {
      this.loading = true
      this.error = null
      try {
        const result = await forumService.getPosts()
        if (result.ok) {
          this.posts = result.posts
        } else {
          this.error = result.error
        }
      } catch (err) {
        this.error = 'Failed to load posts'
      } finally {
        this.loading = false
      }
    },

    async createPost(postData) {
      this.loading = true
      this.error = null
      try {
        const result = await forumService.createPost(postData)
        if (result.ok) {
          this.posts.unshift(result.post)
        } else {
          this.error = result.error
        }
      } catch (err) {
        this.error = 'Failed to create post'
      } finally {
        this.loading = false
      }
    },

    async updatePost(postId, postData) {
      this.loading = true
      this.error = null
      try {
        const result = await forumService.updatePost(postId, postData)
        if (result.ok) {
          const index = this.posts.findIndex(p => p.id === postId)
          if (index !== -1) {
            this.posts[index] = result.post
          }
        } else {
          this.error = result.error
        }
      } catch (err) {
        this.error = 'Failed to update post'
      } finally {
        this.loading = false
      }
    },

    async deletePost(postId) {
      this.loading = true
      this.error = null
      try {
        const result = await forumService.deletePost(postId)
        if (result.ok) {
          this.posts = this.posts.filter(p => p.id !== postId)
        } else {
          this.error = result.error
        }
      } catch (err) {
        this.error = 'Failed to delete post'
      } finally {
        this.loading = false
      }
    },

    seedIfEmpty() {
      if (this.posts.length) return
      this.posts = [
        { 
          id: 'p1', 
          author: 'John Doe', 
          topic: 'Nutrition', 
          title: 'How do you stay consistent with cardio?', 
          content: 'Share tips and routines that keep you going day after day.', 
          createdAt: new Date().toISOString(),
          likes: 12,
          replies: 8,
          likedBy: [],
          replyCount: 8
        },
        { 
          id: 'p2', 
          author: 'Ana Nelson', 
          topic: 'Workout', 
          title: 'Best beginner strength plan', 
          content: 'Looking for a 3-days/week routine with progressive overload.', 
          createdAt: new Date(Date.now()-3600e3).toISOString(),
          likes: 25,
          replies: 15,
          likedBy: [],
          replyCount: 15
        },
        { 
          id: 'p3', 
          author: 'Sam Lee', 
          topic: 'Weight loss', 
          title: 'Meal prep ideas under 500 kcal', 
          content: 'Share your favorite low-cal, high-protein meals.', 
          createdAt: new Date(Date.now()-2*3600e3).toISOString(),
          likes: 38,
          replies: 22,
          likedBy: [],
          replyCount: 22
        },
        { 
          id: 'p4', 
          author: 'Ivy Chen', 
          topic: 'General', 
          title: 'Daily habit that changed your health?', 
          content: 'Water intake? Steps? Sleep? What worked for you?', 
          createdAt: new Date(Date.now()-3*3600e3).toISOString(),
          likes: 45,
          replies: 31,
          likedBy: [],
          replyCount: 31
        },
        { 
          id: 'p5', 
          author: 'Tom Parker', 
          topic: 'Q & A', 
          title: 'Is HIIT safe for beginners?', 
          content: 'What to watch out for when starting HIIT?', 
          createdAt: new Date(Date.now()-4*3600e3).toISOString(),
          likes: 18,
          replies: 12,
          likedBy: [],
          replyCount: 12
        },
      ]
    },
    create({ author, title, content, topic, images = [] }) {
      const post = { 
        id: crypto.randomUUID(), 
        author, 
        title, 
        content, 
        topic, 
        images,
        createdAt: new Date().toISOString(),
        likes: 0,
        replies: 0,
        likedBy: [],
        replyCount: 0
      }
      this.posts.unshift(post)
      return post
    },
    toggleLike(postId, userId) {
      const post = this.getById(postId)
      if (!post) return
      
      const likedIndex = post.likedBy.indexOf(userId)
      if (likedIndex > -1) {
        // Unlike
        post.likedBy.splice(likedIndex, 1)
        post.likes = Math.max(0, post.likes - 1)
      } else {
        // Like
        post.likedBy.push(userId)
        post.likes += 1
      }
    },
    addReply(postId) {
      const post = this.getById(postId)
      if (!post) return
      
      post.replyCount += 1
      post.replies = post.replyCount
    },
    deletePost(postId) {
      const index = this.posts.findIndex(p => p.id === postId)
      if (index > -1) {
        this.posts.splice(index, 1)
        return true
      }
      return false
    },
    editPost(postId, updates) {
      const postIndex = this.posts.findIndex(p => p.id === postId)
      if (postIndex === -1) {
        return false
      }

      const updatedPost = {
        ...this.posts[postIndex],
        ...updates,
        editedAt: new Date().toISOString()
      }

      this.posts[postIndex] = updatedPost
      return true
    },
    getById(id) { return this.posts.find(p => p.id === id) },
    setTopic(topic) { this.activeTopic = topic || 'All' },
  }
})

// Getters defined outside options style would not have state; re-open with defineStore options getters
useForumStore.$id // no-op to avoid lint warning



