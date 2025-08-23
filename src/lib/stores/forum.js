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
        { id: 'p1', author: 'John Doe', topic: 'Nutrition', title: 'How do you stay consistent with cardio?', content: 'Share tips and routines that keep you going day after day.', createdAt: new Date().toISOString() },
        { id: 'p2', author: 'Ana Nelson', topic: 'Workout', title: 'Best beginner strength plan', content: 'Looking for a 3-days/week routine with progressive overload.', createdAt: new Date(Date.now()-3600e3).toISOString() },
        { id: 'p3', author: 'Sam Lee', topic: 'Weight loss', title: 'Meal prep ideas under 500 kcal', content: 'Share your favorite low-cal, high-protein meals.', createdAt: new Date(Date.now()-2*3600e3).toISOString() },
        { id: 'p4', author: 'Ivy Chen', topic: 'General', title: 'Daily habit that changed your health?', content: 'Water intake? Steps? Sleep? What worked for you?', createdAt: new Date(Date.now()-3*3600e3).toISOString() },
        { id: 'p5', author: 'Tom Parker', topic: 'Q & A', title: 'Is HIIT safe for beginners?', content: 'What to watch out for when starting HIIT?', createdAt: new Date(Date.now()-4*3600e3).toISOString() },
      ]
      save(this.posts)
    },
    create({ author, title, content, topic }) {
      const post = { id: crypto.randomUUID(), author, title, content, topic, createdAt: new Date().toISOString() }
      this.posts.unshift(post)
      save(this.posts)
      return post
    },
    getById(id) { return this.posts.find(p => p.id === id) },
    setTopic(topic) { this.activeTopic = topic || 'All' },
  }
})

// Getters defined outside options style would not have state; re-open with defineStore options getters
useForumStore.$id // no-op to avoid lint warning



