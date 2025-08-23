<script setup>
// Static admin dashboard skeleton
</script>

<template>
  <div class="admin">
    <header class="admin__bar">
      <div class="container admin__bar-inner">
        <div class="logo">LOGO</div>
        <div class="admin__actions">
          <button class="btn btn--outline">Log out</button>
          <div class="chip">
            <span class="chip__avatar">A</span>
            <span>Admin</span>
          </div>
        </div>
      </div>
    </header>

    <main class="container admin__content">
      <h1 class="greeting">Welcome, Administrator!</h1>

      <div class="grid">
        <section class="panel panel--menu">
          <h3>Manage Dashboard</h3>
          <ul>
            <li><router-link to="/admin/users">Users</router-link></li>
            <li><router-link to="/admin/courses">Courses</router-link></li>
            <li><router-link to="/admin/posts">Posts</router-link></li>
            <li><router-link to="/admin/bookings">Bookings</router-link></li>
            <li><router-link to="/admin/email-centre">Email Centre</router-link></li>
            <li><router-link to="/admin/maps-poi">Maps/POI</router-link></li>
            <li><router-link to="/admin/tables">Tables</router-link></li>
            <li><router-link to="/admin/system-settings">System/Settings</router-link></li>
            <li><router-link to="/admin/audit-logs">Audit Logs</router-link></li>
          </ul>
        </section>

        <section class="panel stat">
          <h3>DAU/WAU</h3>
          <div class="placeholder"></div>
        </section>

        <section class="panel stat">
          <h3>New registrations</h3>
          <div class="bars">
            <div class="bar" style="height:30%"></div>
            <div class="bar" style="height:60%"></div>
            <div class="bar" style="height:40%"></div>
            <div class="bar" style="height:80%"></div>
            <div class="bar" style="height:55%"></div>
            <div class="bar" style="height:65%"></div>
            <div class="bar" style="height:25%"></div>
          </div>
        </section>

        <section class="panel stat pie">
          <h3>Course completion rate</h3>
          <div class="pie__wrap">
            <div class="pie__chart"></div>
            <div class="pie__value">32%</div>
          </div>
        </section>

        <section class="panel stat">
          <h3>Average course rating</h3>
          <div class="placeholder"></div>
        </section>

        <section class="panel">
          <h3>Choose data from</h3>
          <div class="date-placeholder">XXXX/XX/XX - XXXX/XX/XX</div>
        </section>

        <section class="panel"><h3>XXXX</h3><div class="placeholder"></div></section>
        <section class="panel"><h3>XXXX</h3><div class="placeholder"></div></section>
      </div>
    </main>
  </div>
</template>

<style scoped>
:root {
  --green-700: #15803d;
  --green-600: #16a34a;
  --green-50: #f0fdf4;
  --border: #e2e8f0;
  --muted: #64748b;
}
.container { max-width: 1200px; margin: 0 auto; padding: 0 16px; }

.admin__bar { background: #fff; border-bottom: 1px solid var(--gray-200); position: sticky; top: 0; z-index: 10; backdrop-filter: blur(6px); }
.admin__bar-inner { height: 64px; display: flex; align-items: center; justify-content: space-between; }
.logo { font-weight: 800; color: var(--green-800); }
.admin__actions { display: flex; align-items: center; gap: 12px; }

.btn { border: 1px solid var(--green-700); background: #fff; color: var(--green-800); padding: 8px 12px; border-radius: 8px; box-shadow: var(--shadow-sm); }
.btn:hover { background: var(--green-50); box-shadow: var(--shadow-md); }
.chip { display: inline-flex; align-items: center; gap: 8px; background: var(--green-50); color: var(--green-800); border: 1px solid var(--green-200); padding: 6px 10px; border-radius: 999px; box-shadow: var(--shadow-sm); }
.chip__avatar { width: 22px; height: 22px; border-radius: 50%; background: var(--green-600); color: white; display: grid; place-content: center; font-weight: 700; }

.admin__content { padding: 24px 0 40px; }
.greeting { margin: 0 0 16px 0; }

.grid { display: grid; grid-template-columns: 1.1fr 1fr 1fr; gap: 18px; }
.panel { background: #fff; border: 1px solid var(--green-100); border-radius: 12px; padding: 16px; box-shadow: var(--shadow-md); }
.panel h3 { margin: 0 0 10px 0; }
.panel--menu ul { margin: 0; padding-left: 20px; color: var(--muted); }
.panel--menu a { color: var(--green-700); text-decoration: none; }
.panel--menu a:hover { text-decoration: underline; }

.stat .placeholder { height: 140px; background: #eef2f7; border-radius: 10px; }
.bars { display: grid; grid-auto-flow: column; align-items: end; gap: 8px; height: 140px; padding: 8px; background: #eef2f7; border-radius: 10px; }
.bar { width: 20px; background: var(--green-600); border-radius: 6px 6px 0 0; opacity: .8; }

.pie__wrap { display: grid; grid-template-columns: 120px 1fr; align-items: center; gap: 12px; }
.pie__chart { width: 120px; height: 120px; border-radius: 50%; background: conic-gradient(var(--green-600) 0 32%, #d1fae5 32% 100%); border: 6px solid white; box-shadow: inset 0 0 0 1px var(--border); }
.pie__value { font-size: 24px; color: var(--green-700); font-weight: 700; }

@media (max-width: 900px) {
  .grid { grid-template-columns: 1fr; }
}
</style>


