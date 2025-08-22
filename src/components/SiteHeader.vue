<template>
  <header class="site-topbar">
    <div class="container topbar__inner">
      <router-link class="logo" to="/">
        <img class="logo__img" src="/logo.png" alt="Healthy & Fitness" />
        <span class="brand__text">Healthy & Fitness</span>
      </router-link>
      <nav class="nav">
        <router-link class="nav__link" to="/" exact-active-class="active">Home</router-link>
        <a class="nav__link" href="#">Forum</a>
        <a class="nav__link" href="#">Learn</a>
        <a class="nav__link" href="#">Record</a>
        <a class="nav__link" href="#">About</a>
      </nav>
      <router-link class="btn btn--outline" to="/login">Log In</router-link>
    </div>
  </header>
</template>

<style scoped>
.site-topbar {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(255,255,255,0.9);
  border-bottom: 1px solid var(--green-100);
  backdrop-filter: saturate(1.2) blur(8px);
}
.topbar__inner { display: flex; align-items: center; justify-content: space-between; height: 64px; }
.logo { display: flex; align-items: center; gap: 12px; text-decoration: none; cursor: pointer; }
.logo__img { height: 36px; width: auto; display: block; }
.brand__text { font-family: 'Dancing Script', cursive; font-size: 24px; font-style: italic; color: #15803d; letter-spacing: .3px; }
.nav { display: none; gap: 20px; }
.nav__link { color: #0f172a; text-decoration: none; }
.nav__link.active { color: var(--green-700); font-weight: 600; }
.nav__link:hover { color: var(--green-700); text-decoration: underline; }
.btn.btn--outline { background: #fff; color: var(--green-700); border-color: var(--green-700); }
.btn.btn--outline:hover { background: var(--green-50); }

@media (min-width: 768px) { .nav { display: flex; } }
</style>


