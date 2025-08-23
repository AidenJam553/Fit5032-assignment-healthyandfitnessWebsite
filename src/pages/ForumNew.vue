<script setup>
import SiteHeader from '@/components/SiteHeader.vue'
import { ref } from 'vue'
import { useForumStore } from '@/lib/stores/forum'
import { useRouter } from 'vue-router'

const store = useForumStore()
const router = useRouter()
const author = ref('You')
const title = ref('')
const content = ref('')
const topic = ref('General')
const error = ref('')

function submit() {
  error.value = ''
  if (!title.value || title.value.length < 4) { error.value = 'Title should be at least 4 characters'; return }
  if (!content.value || content.value.length < 10) { error.value = 'Content should be at least 10 characters'; return }
  const post = store.create({ author: author.value, title: title.value, content: content.value, topic: topic.value })
  router.push({ name: 'forum-detail', params: { id: post.id } })
}
</script>

<template>
  <div class="page">
    <SiteHeader />
    <div class="container compose">
      <h1>New Post</h1>
      <div class="panel">
        <label>Title</label>
        <input v-model="title" placeholder="Enter a clear, descriptive title" />
        <label>Topic</label>
        <select v-model="topic">
          <option>General</option>
          <option>Nutrition</option>
          <option>Workout</option>
          <option>Q & A</option>
        </select>
        <label>Content</label>
        <textarea v-model="content" rows="6" placeholder="Write your post..." />
        <div class="row">
          <button class="btn btn--primary" @click="submit">Publish</button>
          <span class="error" v-if="error">{{ error }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.compose { padding: 24px 0; }
.panel { background: #fff; border: 1px solid var(--green-100); border-radius: 12px; padding: 16px; box-shadow: var(--shadow-md); max-width: 760px; display: grid; gap: 10px; }
input, select, textarea { border: 1px solid var(--gray-200); border-radius: 8px; padding: 10px; }
.row { display: flex; gap: 10px; align-items: center; }
.error { color: #b91c1c; }
</style>


