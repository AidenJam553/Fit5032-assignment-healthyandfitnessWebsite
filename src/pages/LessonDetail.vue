<script setup>
import SiteHeader from '@/components/SiteHeader.vue'
import { useRoute } from 'vue-router'
import { computed, ref } from 'vue'
import { useLessonsStore } from '@/lib/stores/lessons'

const route = useRoute()
const lessons = useLessonsStore()
lessons.seedIfEmpty()
const id = computed(() => route.params.id)
const lesson = computed(() => lessons.lessons.find(l => l.id === id.value) || { title: 'Lesson', minutes: 0 })
const rating = ref(0)

function submitRating() {
  if (rating.value > 0) lessons.rate(id.value, rating.value)
}
</script>

<template>
  <div class="page">
    <SiteHeader />
    <div class="container detail">
      <h1>{{ lesson.title }}</h1>
      <p class="muted">Duration: {{ lesson.minutes }} mins · Avg rating: {{ lessons.averageRating(id) }}/5</p>
      <div class="panel">
        <label>Rate this lesson</label>
        <input type="range" min="1" max="5" v-model.number="rating" />
        <button class="btn btn--primary" @click="submitRating">Submit</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.detail { padding: 24px 0; }
.panel { background: #fff; border: 1px solid var(--green-100); border-radius: 12px; padding: 16px; box-shadow: var(--shadow-md); max-width: 720px; }
.muted { color: #64748b; }
</style>


