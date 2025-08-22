<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import SiteHeader from '@/components/SiteHeader.vue'

const overlayOpacity = ref(0)

function updateOpacity() {
  const max = Math.max(200, window.innerHeight * 0.8)
  const y = window.scrollY || 0
  overlayOpacity.value = Math.min(1, Math.max(0, y / max))
}

onMounted(() => {
  updateOpacity()
  window.addEventListener('scroll', updateOpacity, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateOpacity)
})
</script>

<template>
  <div class="page">
    <SiteHeader />

    <section class="hero">
      <div class="container hero__inner">
        <h1 class="hero__title">Learn and manage your health here!</h1>
        <p class="hero__subtitle">
          Learn about health and nutrition, manage your weight and exercise,
          and become a better version of yourself.
        </p>
        <div class="hero__actions">
          <router-link class="btn btn--primary" to="/login">Log In</router-link>
          <router-link class="btn btn--ghost" to="/register">Create Account</router-link>
        </div>
      </div>
      <div class="hero__overlay" :style="{ opacity: overlayOpacity }"></div>
      <div class="scroll-cue" aria-hidden="true">Scroll</div>
    </section>

    <main class="container content">
      <section class="section courses">
        <div class="section__header">
          <h2 class="section__title">Courses</h2>
          <a class="section__more" href="#">View more &gt;&gt;</a>
        </div>
        <div class="card-grid">
          <div class="card-placeholder" aria-label="Course placeholder"></div>
          <div class="card-placeholder" aria-label="Course placeholder"></div>
          <div class="card-placeholder" aria-label="Course placeholder"></div>
        </div>
      </section>

      <section class="section two-col">
        <div class="panel">
          <h3 class="panel__title">My Record</h3>
          <ul class="list-placeholder">
            <li></li>
            <li></li>
            <li></li>
            <li></li>
            <li></li>
          </ul>
        </div>

        <div class="panel explore">
          <h3 class="panel__title">Explore</h3>
          <div class="explore__grid">
            <div class="map-card">
              <div class="map-card__icon">🗺️</div>
              <button class="btn btn--ghost">Find a gym &gt;</button>
            </div>
            <ul class="list-placeholder">
              <li></li>
              <li></li>
              <li></li>
              <li></li>
              <li></li>
            </ul>
          </div>
        </div>
      </section>
    </main>

    <footer class="footer">
      <div class="container">© 2025 Healthy & Fitness</div>
    </footer>
  </div>
</template>

<style scoped>
:root {
  --green-700: #15803d;
  --green-600: #16a34a;
  --green-500: #22c55e;
  --green-50: #f0fdf4;
  --green-100: #dcfce7;
  --text-900: #0f172a;
  --text-700: #334155;
  --muted: #64748b;
  --border: #e2e8f0;
}

.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 16px;
}

.topbar {
  background: #ffffff;
  border-bottom: 1px solid var(--green-100);
}
.topbar__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
}
.logo { display: flex; align-items: center; gap: 12px; }
.logo__img { height: 36px; width: auto; display: block; }
.brand__text {
  font-family: 'Dancing Script', cursive;
  font-size: 24px;
  font-style: italic;
  color: #15803d;
  letter-spacing: .3px;
}
.nav {
  display: none;
  gap: 20px;
}
.nav__link {
  color: #0f172a;
  text-decoration: none;
}
.nav__link.active {
  color: var(--green-700);
  font-weight: 600;
}
.nav__link:hover { color: var(--green-700); text-decoration: underline; }

.btn {
  border: 1px solid transparent;
  background: var(--green-700);
  color: #fff;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
  transition: background .15s ease, color .15s ease, border-color .15s ease, box-shadow .15s ease;
}
.btn:hover { background: #0f8a43; box-shadow: 0 4px 12px rgba(0,0,0,0.12); }
.btn:focus { outline: 2px solid var(--green-500); outline-offset: 2px; }

.btn--outline {
  background: #ffffff;
  color: var(--green-700);
  border-color: var(--green-700);
}
.btn--outline:hover { background: var(--green-50); }

.btn--ghost {
  background: white;
  color: var(--green-700);
  border-color: var(--green-100);
}
.btn--primary { background: var(--green-600); }

.page { background: var(--green-50); color: #000; }
.hero {
  position: relative;
  background: url('/hero.png') center/cover no-repeat;
  border-bottom: 1px solid var(--green-100);
  min-height: 100vh;
  display: flex;
  align-items: center;
}
.hero__inner {
  padding: 56px 0 64px;
  text-align: left;
}
.hero__title {
  font-size: 36px;
  line-height: 1.2;
  color: #000;
  margin: 0 0 12px 0;
}
.hero__subtitle {
  color: #000;
  max-width: 680px;
}
.hero__actions { display: flex; gap: 12px; margin-top: 20px; }

.scroll-cue { position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%); color: var(--green-800); font-size: 12px; letter-spacing: .15em; }
.scroll-cue::after { content: ''; display: block; width: 24px; height: 24px; margin: 6px auto 0; border: 2px solid var(--green-700); border-left: 0; border-top: 0; transform: rotate(45deg); animation: bob 1.5s infinite; }

@keyframes bob { 0%, 100% { transform: rotate(45deg) translate(0, 0); } 50% { transform: rotate(45deg) translate(4px, 4px); } }

/* bottom fade to reveal content on scroll */
.hero::after { content: ''; position: absolute; left: 0; right: 0; bottom: -1px; height: 160px; background: linear-gradient(to bottom, rgba(255,255,255,0), #ffffff 60%, #ffffff); pointer-events: none; }
.hero__overlay { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(240,253,244,0.8) 0%, rgba(255,255,255,0.9) 60%, #ffffff 100%); transition: opacity .2s linear; pointer-events: none; }

.content { padding: 28px 0 56px; }

.section { background: #ffffff; border: 1px solid var(--green-100); border-radius: 12px; padding: 16px; box-shadow: 0 6px 18px rgba(0,0,0,0.08); }
.section + .section { margin-top: 20px; }
.section__header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.section__title { margin: 0; font-size: 20px; color: #0f172a; }
.section__more { color: var(--green-700); text-decoration: none; }

.card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.card-placeholder {
  background: var(--green-100);
  border-radius: 12px;
  height: 160px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 20px;
}
.panel { background: #ffffff; border: 1px solid var(--green-100); border-radius: 12px; padding: 16px; box-shadow: 0 6px 18px rgba(0,0,0,0.08); }
.panel__title { margin: 0 0 12px 0; font-size: 18px; }

.list-placeholder { list-style: none; padding: 0; margin: 0; display: grid; gap: 10px; }
.list-placeholder li { height: 12px; background: var(--green-100); border-radius: 6px; }

.explore__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.map-card { background: #eafff1; border: 1px dashed var(--green-600); border-radius: 12px; padding: 24px; display: grid; place-content: center; gap: 12px; text-align: center; box-shadow: 0 3px 10px rgba(0,0,0,0.06); }
.map-card__icon { font-size: 40px; }

.footer { border-top: 1px solid var(--green-100); padding: 20px 0; color: #2f4d3b; font-size: 14px; }

@media (min-width: 768px) {
  .nav { display: flex; }
}

@media (max-width: 767px) {
  .hero__title { font-size: 28px; }
  .card-grid { grid-template-columns: 1fr; }
  .two-col { grid-template-columns: 1fr; }
  .explore__grid { grid-template-columns: 1fr; }
}
</style>


