<script setup>
import SiteHeader from '@/components/SiteHeader.vue'
import { useLessonsStore } from '@/lib/stores/lessons'
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const lessons = useLessonsStore()
const router = useRouter()
onMounted(() => lessons.seedIfEmpty())
</script>

<template>
  <div class="page">
    <SiteHeader />

    <section class="sub-hero">
      <div class="container hero-inner">
        <h1 class="title">Learn</h1>
        <p class="subtitle">Browse curated lessons on nutrition, training, and recovery.</p>
        <div class="search-hero">
          <input class="search__input" placeholder="Search courses, topics or coaches..." />
          <button class="btn btn--primary">Search</button>
        </div>
      </div>
    </section>

    <div class="container learn">
      <aside class="filters">
        <div class="panel">
          <h3 class="panel__title">Filter</h3>
          <div class="filter-chip">Beginner</div>
          <div class="filter-chip">Intermediate</div>
          <div class="filter-chip">Advanced</div>
          <div class="filter-chip">Nutrition</div>
          <div class="filter-chip">Workout</div>
        </div>
      </aside>

      <main class="courses">
        <div class="grid">
          <article class="course" v-for="l in lessons.lessons" :key="l.id">
            <div class="thumb" aria-hidden="true"></div>
            <div class="course__body">
              <h3 class="course__title">{{ l.title }}</h3>
              <p class="muted">Topic: {{ l.topic }} · {{ l.minutes }} mins</p>
              <div class="progress"><div class="progress__bar" :style="{ width: (lessons.progress[l.id] || 0) + '%' }"></div></div>
              <div class="row">
                <span class="progress__text">{{ lessons.progress[l.id] || 0 }}% complete</span>
                <button class="btn btn--ghost" @click="router.push({ name: 'lesson-detail', params: { id: l.id } })">Open</button>
              </div>
            </div>
          </article>
        </div>
      </main>
    </div>
  </div>
  </template>

<style scoped>
.page { background: var(--green-50); min-height: 100vh; }
.sub-hero { background: linear-gradient(180deg, rgba(240,253,244,.9), #fff); border-bottom: 1px solid var(--green-100); }
.hero-inner { padding: 32px 0; text-align: center; }
.subtitle { color: var(--gray-700); margin: 6px 0 14px 0; }
.search-hero { display: inline-flex; gap: 8px; background: #fff; border: 1px solid var(--green-100); padding: 8px 10px; border-radius: 999px; box-shadow: var(--shadow-sm); }
.search__input { border: 0; outline: none; font-size: 14px; min-width: 280px; }

.learn { display: grid; grid-template-columns: 260px 1fr; gap: 20px; padding: 24px 0; }
.panel { padding: 16px; }
.panel__title { margin-top: 0; }
.filter-chip { display: inline-block; margin: 6px 6px 0 0; background: #fff; border: 1px solid var(--green-100); padding: 6px 10px; border-radius: 999px; }

.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.course { background: #fff; border: 1px solid var(--green-100); border-radius: 12px; overflow: hidden; box-shadow: var(--shadow-md); display: grid; grid-template-rows: 140px 1fr; }
.course.placeholder { height: 240px; background: var(--green-100); border: 0; box-shadow: var(--shadow-sm); }
.thumb { background: linear-gradient(45deg, var(--green-200), var(--green-600)); opacity: .2; }
.course__body { padding: 16px; }
.course__title { margin: 0 0 6px 0; }
.row { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; }
.muted { color: var(--gray-700); }
.progress { height: 8px; background: var(--gray-100); border-radius: 999px; overflow: hidden; margin-top: 10px; box-shadow: inset 0 1px 2px rgba(0,0,0,.06); }
.progress__bar { height: 100%; background: linear-gradient(90deg, var(--green-200), var(--green-600)); }
.progress__text { font-size: 12px; color: var(--gray-700); }

@media (max-width: 1000px) { .grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 720px) {
  .learn { grid-template-columns: 1fr; }
  .grid { grid-template-columns: 1fr; }
}
</style>


