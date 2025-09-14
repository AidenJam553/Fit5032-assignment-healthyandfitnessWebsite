<script setup>
import SiteHeader from '@/components/SiteHeader.vue'
import Card from '@/components/Card.vue'
import Button from '@/components/Button.vue'
</script>

<template>
  <div class="page">
    <SiteHeader />
    <section class="hero">
      <div class="container hero__inner">
        <h1 class="title">About Healthy & Fitness</h1>
        <p class="subtitle">We blend learning, habit tracking and community to make health simple and delightful.</p>
      </div>
    </section>

    <main class="container about">
      <Card variant="default" size="large" class="statement">
        <template #header>
          <h2>Our mission</h2>
        </template>
        <p>Help everyone build sustainable habits with a clear plan and a supportive community.</p>
      </Card>

      <div class="grid">
        <Card variant="default" size="medium" class="feature" hover>
          <div class="icon" aria-hidden="true">📚</div>
          <h3>Learn</h3>
          <p>Curated courses on nutrition, training and recovery with progress tracking.</p>
        </Card>
        <Card variant="default" size="medium" class="feature" hover>
          <div class="icon" aria-hidden="true">📈</div>
          <h3>Record</h3>
          <p>Log weight, meals and workouts with clean visuals that highlight your progress.</p>
        </Card>
        <Card variant="default" size="medium" class="feature" hover>
          <div class="icon" aria-hidden="true">💬</div>
          <h3>Forum</h3>
          <p>Ask questions, share wins, and get feedback from supportive peers.</p>
        </Card>
      </div>

      <div class="cta">
        <Button variant="primary" size="medium" tag="router-link" to="/register">Create an account</Button>
        <Button variant="secondary" size="medium" tag="router-link" to="/learn">Browse courses</Button>
      </div>
    </main>
  </div>
</template>

<style scoped>
.page { background: var(--green-50); min-height: 100vh; }
.hero { background: linear-gradient(180deg, rgba(240,253,244,.9), #fff); border-bottom: 1px solid var(--green-100); }
.hero__inner { padding: 48px 0; text-align: center; }
.title { margin: 0 0 8px 0; }
.subtitle { margin: 0 auto; max-width: 720px; color: var(--gray-700); }

.about { padding: 24px 0 56px; }
.statement { margin-bottom: 20px; }
.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.feature { text-align: center; }
.icon { font-size: 36px; margin-bottom: 6px; }
.cta { display: flex; gap: 12px; justify-content: center; margin-top: 24px; }

@media (max-width: 900px) { .grid { grid-template-columns: 1fr; } }
</style>


