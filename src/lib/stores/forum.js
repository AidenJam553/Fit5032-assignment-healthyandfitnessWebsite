import { defineStore } from 'pinia'

const POSTS_KEY = 'hf_posts_v1'

function load() { try { return JSON.parse(localStorage.getItem(POSTS_KEY) || '[]') } catch { return [] } }
function save(data) { localStorage.setItem(POSTS_KEY, JSON.stringify(data)) }

export const useForumStore = defineStore('forum', {
  state: () => ({ posts: load(), activeTopic: 'All' }),
  actions: {
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
      save(this.posts)
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
      save(this.posts)
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
      save(this.posts)
    },
    addReply(postId) {
      const post = this.getById(postId)
      if (!post) return
      
      post.replyCount += 1
      post.replies = post.replyCount
      save(this.posts)
    },
    getById(id) { return this.posts.find(p => p.id === id) },
    setTopic(topic) { this.activeTopic = topic || 'All' },
  }
})

// Getters defined outside options style would not have state; re-open with defineStore options getters
useForumStore.$id // no-op to avoid lint warning



