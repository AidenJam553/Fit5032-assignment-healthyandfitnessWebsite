<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import SiteHeader from '@/components/SiteHeader.vue'
import { getCurrentUser } from '@/lib/auth'

const overlayOpacity = ref(0)
const isLoaded = ref(false)
const animatedElements = ref([])
const user = ref(null)

// Check if user is logged in
const isLoggedIn = computed(() => !!user.value)

function updateUser() {
  user.value = getCurrentUser()
}

function updateOpacity() {
  const max = Math.max(200, window.innerHeight * 0.8)
  const y = window.scrollY || 0
  overlayOpacity.value = Math.min(1, Math.max(0, y / max))
}

function observeElements() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in')
        observer.unobserve(entry.target)
      }
    })
  }, { 
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  })

  // Observe all animatable elements
  document.querySelectorAll('.animate-on-scroll').forEach(el => {
    observer.observe(el)
  })
}

onMounted(() => {
  updateUser()
  updateOpacity()
  window.addEventListener('scroll', updateOpacity, { passive: true })
  window.addEventListener('storage', updateUser)
  
  // Trigger initial hero animation
  setTimeout(() => {
    isLoaded.value = true
  }, 100)
  
  // Set up scroll animations
  setTimeout(() => {
    observeElements()
  }, 300)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateOpacity)
  window.removeEventListener('storage', updateUser)
})
</script>

<template>
  <div class="page">
    <SiteHeader />

    <section class="hero">
      <div class="container hero__inner" :class="{ 'hero-loaded': isLoaded }">
        <h1 class="hero__title" v-if="!isLoggedIn">Learn and manage your health here!</h1>
        <h1 class="hero__title" v-else>Welcome! {{ user.username || user.email }}</h1>
        <p class="hero__subtitle">
          Learn about health and nutrition, manage your weight and exercise,
          and become a better version of yourself.
        </p>
        <div class="hero__actions" v-if="!isLoggedIn">
          <router-link class="btn btn--primary" to="/login">Log In</router-link>
          <router-link class="btn btn--ghost" to="/register">Create Account</router-link>
        </div>
        <div class="hero__actions" v-else>
          <router-link class="btn btn--primary" to="/learn">Start Learning</router-link>
          <router-link class="btn btn--ghost" to="/record">Track Progress</router-link>
        </div>
      </div>
      <div class="hero__overlay" :style="{ opacity: overlayOpacity }"></div>
      <div class="scroll-cue" aria-hidden="true">Scroll</div>
    </section>

    <main class="container content">
      <section class="section courses animate-on-scroll">
        <div class="section__header">
          <h2 class="section__title">Courses</h2>
          <a class="section__more" href="#">View more &gt;&gt;</a>
        </div>
        <div class="card-grid">
          <div class="card-placeholder stagger-1" aria-label="Course placeholder"></div>
          <div class="card-placeholder stagger-2" aria-label="Course placeholder"></div>
          <div class="card-placeholder stagger-3" aria-label="Course placeholder"></div>
        </div>
      </section>

      <section class="section two-col animate-on-scroll">
        <div class="panel stagger-1">
          <h3 class="panel__title">My Record</h3>
          <ul class="list-placeholder">
            <li></li>
            <li></li>
            <li></li>
            <li></li>
            <li></li>
          </ul>
        </div>

        <div class="panel explore stagger-2">
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
  border-radius: 16px;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateY(0);
}
.btn:hover { 
  background: #0f8a43; 
  box-shadow: 0 6px 20px rgba(0,0,0,0.15); 
  transform: translateY(-2px);
}
.btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
}
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
@media (min-width: 992px) {
  .hero__inner { transform: translate(-3cm, -1.5cm); }
}
.hero__title {
  font-family: 'Manrope', ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
  font-size: 44px;
  line-height: 1.3;
  color: #0b1220;
  letter-spacing: .2px;
  font-weight: 800;
  margin: 0 0 14px 0;
}
.hero__subtitle {
  font-family: 'Manrope', ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
  color: #0b1220;
  max-width: 720px;
  font-size: 18px;
  line-height: 1.85;
}
.hero__actions { display: flex; gap: 12px; margin-top: 20px; }

.scroll-cue { 
  position: absolute; 
  bottom: 16px; 
  left: 50%; 
  transform: translateX(-50%); 
  color: var(--green-800); 
  font-size: 12px; 
  letter-spacing: .15em; 
  animation: float 3s ease-in-out infinite;
  opacity: 0.8;
}
.scroll-cue::after { 
  content: ''; 
  display: block; 
  width: 24px; 
  height: 24px; 
  margin: 6px auto 0; 
  border: 2px solid var(--green-700); 
  border-left: 0; 
  border-top: 0; 
  transform: rotate(45deg); 
  animation: bob 2s ease-in-out infinite; 
}

@keyframes bob { 
  0%, 100% { 
    transform: rotate(45deg) translate(0, 0); 
  } 
  50% { 
    transform: rotate(45deg) translate(4px, 4px); 
  } 
}

@keyframes float {
  0%, 100% {
    transform: translateX(-50%) translateY(0px);
  }
  50% {
    transform: translateX(-50%) translateY(-8px);
  }
}

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
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.card-placeholder:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.12);
  background: linear-gradient(135deg, var(--green-100), #e8f5e8);
}

.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 20px;
}
.panel { 
  background: #ffffff; 
  border: 1px solid var(--green-100); 
  border-radius: 12px; 
  padding: 16px; 
  box-shadow: 0 6px 18px rgba(0,0,0,0.08); 
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.panel:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0,0,0,0.12);
  border-color: var(--green-200);
}
.panel__title { margin: 0 0 12px 0; font-size: 18px; }

.list-placeholder { list-style: none; padding: 0; margin: 0; display: grid; gap: 10px; }
.list-placeholder li { height: 12px; background: var(--green-100); border-radius: 6px; }

.explore__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.map-card { 
  background: #eafff1; 
  border: 1px dashed var(--green-600); 
  border-radius: 12px; 
  padding: 24px; 
  display: grid; 
  place-content: center; 
  gap: 12px; 
  text-align: center; 
  box-shadow: 0 3px 10px rgba(0,0,0,0.06); 
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.map-card:hover {
  transform: scale(1.02);
  box-shadow: 0 8px 20px rgba(0,0,0,0.1);
  background: #e0fceb;
}

.map-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  transition: left 0.8s ease;
}

.map-card:hover::before {
  left: 100%;
}
.map-card__icon { font-size: 40px; }

.footer { border-top: 1px solid var(--green-100); padding: 20px 0; color: #2f4d3b; font-size: 14px; }

@media (min-width: 768px) {
  .nav { display: flex; }
}

@media (max-width: 767px) {
  .hero__inner {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .hero__title { 
    font-size: 32px; 
    line-height: 1.3; 
    margin-bottom: 20px;
    font-weight: 700;
    text-align: center;
  }
  
  .hero__subtitle {
    font-size: 17px;
    line-height: 1.6;
    margin-bottom: 32px;
    padding-right: 0;
    opacity: 0.9;
    text-align: center;
    max-width: 300px;
  }
  
  .hero__actions {
    flex-direction: column;
    gap: 16px;
    margin-top: 32px;
    width: 100%;
    max-width: 280px;
    align-items: center;
  }
  
  .hero__actions .btn {
    width: 100%;
    padding: 16px 24px;
    font-size: 16px;
    font-weight: 600;
    justify-content: center;
    min-height: 52px;
    border-radius: 12px;
    text-decoration: none;
    display: flex;
    align-items: center;
  }
  
  .hero__actions .btn--primary {
    box-shadow: 0 4px 14px rgba(22, 163, 74, 0.25);
  }
  
  .hero__actions .btn--ghost {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    border: 2px solid rgba(22, 163, 74, 0.2);
  }
  
  .card-grid { grid-template-columns: 1fr; }
  .two-col { grid-template-columns: 1fr; }
  .explore__grid { grid-template-columns: 1fr; }
}

/* Animation Styles */
.hero__inner {
  opacity: 0;
  transform: translate(-3cm, -1.5cm) translateY(40px);
  transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.hero__inner.hero-loaded {
  opacity: 1;
  transform: translate(-3cm, -1.5cm) translateY(0);
}

.hero__title {
  transition-delay: 0.1s;
}

.hero__subtitle {
  transition-delay: 0.2s;
}

.hero__actions {
  transition-delay: 0.3s;
}

.animate-on-scroll {
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.animate-on-scroll.animate-in {
  opacity: 1;
  transform: translateY(0);
}

.stagger-1 {
  transition-delay: 0.1s;
}

.stagger-2 {
  transition-delay: 0.2s;
}

.stagger-3 {
  transition-delay: 0.3s;
}

.card-placeholder,
.panel {
  transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.animate-in .card-placeholder,
.animate-in .panel {
  opacity: 1;
  transform: translateY(0);
}

@media (max-width: 991px) {
  .hero__inner {
    transform: translateY(40px);
    padding: 40px 0 48px;
  }
  
  .hero__inner.hero-loaded {
    transform: translateY(0);
  }
}

/* Extra small screens optimization */
@media (max-width: 480px) {
  .hero__title { 
    font-size: 28px; 
    line-height: 1.25;
    margin-bottom: 18px;
  }
  
  .hero__subtitle {
    font-size: 16px;
    line-height: 1.5;
    margin-bottom: 28px;
    padding-right: 0;
    max-width: 280px;
  }
  
  .hero__inner {
    padding: 40px 0 48px;
  }
  
  .hero__actions {
    margin-top: 28px;
    gap: 14px;
    max-width: 260px;
  }
  
  .hero__actions .btn {
    padding: 14px 20px;
    font-size: 15px;
    min-height: 48px;
    border-radius: 10px;
  }
  
  .container {
    padding: 0 16px;
  }
}
</style>


