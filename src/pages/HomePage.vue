<script setup>
// Home page is currently static
</script>

<template>
  <div class="page">
    <header class="topbar">
      <div class="container topbar__inner">
        <div class="logo">LOGO</div>
        <nav class="nav">
          <a href="#" class="nav__link active">Home</a>
          <a href="#" class="nav__link">Forum</a>
          <a href="#" class="nav__link">Learn</a>
          <a href="#" class="nav__link">Record</a>
          <a href="#" class="nav__link">About</a>
        </nav>
        <button class="btn btn--outline">Log In</button>
      </div>
    </header>

    <section class="hero">
      <div class="container hero__inner">
        <h1 class="hero__title">Learn and manage your health here!</h1>
        <p class="hero__subtitle">
          Learn about health and nutrition, manage your weight and exercise,
          and become a better version of yourself.
        </p>
        <div class="hero__actions">
          <button class="btn btn--primary">Log In</button>
          <button class="btn btn--ghost">Create Account</button>
        </div>
      </div>
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
  background: white;
  border-bottom: 1px solid var(--border);
}
.topbar__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
}
.logo {
  font-weight: 800;
  font-size: 20px;
  color: var(--green-700);
}
.nav {
  display: none;
  gap: 20px;
}
.nav__link {
  color: var(--text-700);
  text-decoration: none;
}
.nav__link.active {
  color: var(--green-700);
  font-weight: 600;
}

.btn {
  border: 1px solid transparent;
  background: var(--green-600);
  color: white;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: background .15s ease, color .15s ease, border-color .15s ease;
}
.btn:hover { background: var(--green-700); }
.btn:focus { outline: 2px solid var(--green-500); outline-offset: 2px; }

.btn--outline {
  background: white;
  color: var(--green-700);
  border-color: var(--green-600);
}
.btn--outline:hover { background: var(--green-50); }

.btn--ghost {
  background: white;
  color: var(--green-700);
  border-color: var(--green-100);
}
.btn--primary { background: var(--green-600); }

.hero {
  background: linear-gradient(180deg, var(--green-50), white 80%);
  border-bottom: 1px solid var(--border);
}
.hero__inner {
  padding: 56px 0 64px;
  text-align: left;
}
.hero__title {
  font-size: 36px;
  line-height: 1.2;
  color: var(--text-900);
  margin: 0 0 12px 0;
}
.hero__subtitle {
  color: var(--muted);
  max-width: 680px;
}
.hero__actions { display: flex; gap: 12px; margin-top: 20px; }

.content { padding: 28px 0 56px; }

.section { background: white; border: 1px solid var(--border); border-radius: 12px; padding: 16px; }
.section + .section { margin-top: 20px; }
.section__header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.section__title { margin: 0; font-size: 20px; }
.section__more { color: var(--green-700); text-decoration: none; }

.card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.card-placeholder {
  background: #e5e7eb;
  border-radius: 12px;
  height: 160px;
}

.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 20px;
}
.panel { background: white; border: 1px solid var(--border); border-radius: 12px; padding: 16px; }
.panel__title { margin: 0 0 12px 0; font-size: 18px; }

.list-placeholder { list-style: none; padding: 0; margin: 0; display: grid; gap: 10px; }
.list-placeholder li { height: 12px; background: #e5e7eb; border-radius: 6px; }

.explore__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.map-card { background: var(--green-50); border: 1px dashed var(--green-100); border-radius: 12px; padding: 24px; display: grid; place-content: center; gap: 12px; text-align: center; }
.map-card__icon { font-size: 40px; }

.footer { border-top: 1px solid var(--border); padding: 20px 0; color: var(--muted); font-size: 14px; }

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


