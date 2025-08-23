<script setup>
import SiteHeader from '@/components/SiteHeader.vue'
import { useGymsStore } from '@/lib/stores/gyms'

const gyms = useGymsStore()
gyms.locate()
</script>

<template>
  <div class="page">
    <SiteHeader />
    <div class="container explore">
      <h1>Explore Gyms</h1>
      <div class="toolbar">
        <input placeholder="Search gyms" v-model="gyms.query" />
        <button class="btn btn--ghost" @click="gyms.locate">Locate me</button>
      </div>
      <div class="grid">
        <div class="card" v-for="g in gyms.filtered" :key="g.id">
          <h3>{{ g.name }}</h3>
          <div class="muted">Rating: {{ g.rating }}</div>
          <a :href="`https://www.google.com/maps/dir/?api=1&destination=${g.lat},${g.lng}`" target="_blank" rel="noopener">Get route</a>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.explore { padding: 24px 0; }
.toolbar { display: flex; gap: 10px; align-items: center; margin-bottom: 12px; }
input { border: 1px solid var(--gray-200); border-radius: 8px; padding: 10px; }
.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.card { background: #fff; border: 1px solid var(--green-100); border-radius: 12px; padding: 16px; box-shadow: var(--shadow-md); }
@media (max-width: 900px) { .grid { grid-template-columns: 1fr; } }
</style>


