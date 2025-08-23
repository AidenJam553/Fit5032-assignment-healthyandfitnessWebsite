<script setup>
import SiteHeader from '@/components/SiteHeader.vue'
</script>

<template>
  <div class="page">
    <SiteHeader />
    <div class="container record">
      <section class="kpis">
        <div class="kpi">
          <div class="kpi__label">Current Weight</div>
          <div class="kpi__value">68.5 <span>KG</span></div>
        </div>
        <div class="kpi">
          <div class="kpi__label">Weekly Workouts</div>
          <div class="kpi__value">4 <span>Sessions</span></div>
        </div>
        <div class="kpi">
          <div class="kpi__label">Avg Calories</div>
          <div class="kpi__value">1,850 <span>Kcal</span></div>
        </div>
      </section>

      <section class="grid">
        <div class="panel profile">
          <div class="profile__row">
            <div class="avatar">YOU</div>
            <div>
              <h3 class="title">Your Name</h3>
              <div class="muted">Member</div>
            </div>
          </div>
          <div class="stats">
            <div class="stat"><span>BMI</span><div class="bar"><i style="width:42%"></i></div></div>
            <div class="stat"><span>Height</span><div class="bar"><i style="width:70%"></i></div></div>
            <div class="stat"><span>Weight</span><div class="bar"><i style="width:50%"></i></div></div>
            <div class="stat"><span>Basal metabolism</span><div class="bar"><i style="width:60%"></i></div></div>
            <div class="stat"><span>Heart rate</span><div class="bar"><i style="width:35%"></i></div></div>
          </div>
        </div>

        <div class="panel weight">
          <h3 class="title">Weight Log</h3>
          <div class="chart placeholder"></div>
          <div class="weight__now"><strong>68.50</strong> KG</div>
        </div>

        <div class="panel recipe">
          <h3 class="title">My Recipe</h3>
          <ul class="meal">
            <li><strong>Breakfast</strong><span>300 Kcal</span></li>
            <li><strong>Lunch</strong><span>500 Kcal</span></li>
            <li><strong>Dinner</strong><span>400 Kcal</span></li>
            <li><strong>Snack</strong><span>200 Kcal</span></li>
          </ul>
        </div>

        <div class="panel learning">
          <h3 class="title">Learning Progress</h3>
          <div class="mini-courses">
            <div class="mini placeholder"></div>
            <div class="mini placeholder"></div>
            <div class="mini placeholder"></div>
          </div>
          <div class="muted"><strong>12</strong> courses</div>
        </div>

        <div class="panel calories">
          <h3 class="title">Diet & Exercise Log</h3>
          <div class="macros">
            <div>Carb</div>
            <div class="macros__bar"><i style="width:90%"></i></div>
            <div>Proteins</div>
            <div class="macros__bar"><i style="width:65%"></i></div>
            <div>Fats</div>
            <div class="macros__bar"><i style="width:40%"></i></div>
          </div>
          <div class="total"><strong>1500</strong> Kcal / <span>2000</span> Kcal</div>
        </div>

        <div class="panel schedule">
          <div class="schedule__header">
            <h3 class="title">Schedule</h3>
            <a href="#">Calendar &gt;</a>
          </div>
          <div class="schedule__list">
            <div class="entry">
              <strong>40 min | 200 Kcal</strong>
              <div class="muted">Aerobic exercise</div>
            </div>
            <div class="entry">
              <strong>40 min | 200 Kcal</strong>
              <div class="muted">Anaerobic exercise</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.page { background: var(--green-50); min-height: 100vh; }
.record { padding: 24px 0; }
.kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 20px; }
.kpi { background: #fff; border: 1px solid var(--green-100); border-radius: 12px; padding: 16px; box-shadow: var(--shadow-md); }
.kpi__label { color: var(--gray-700); font-size: 12px; }
.kpi__value { font-size: 28px; font-weight: 700; letter-spacing: .4px; }
.kpi__value span { font-size: 12px; font-weight: 500; color: var(--gray-700); margin-left: 4px; }
.grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 20px; }

.panel { padding: 16px; }

.profile { grid-column: span 4; }
.weight { grid-column: span 4; }
.learning { grid-column: span 4; }
.recipe { grid-column: span 6; }
.calories { grid-column: span 6; }
.schedule { grid-column: span 12; }

.avatar { width: 48px; height: 48px; border-radius: 50%; background: var(--green-200); display: grid; place-content: center; font-weight: 700; }
.profile__row { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.title { margin: 0 0 10px 0; }
.muted { color: var(--gray-700); }

.stats { display: grid; gap: 8px; }
.stat { display: grid; grid-template-columns: 160px 1fr; align-items: center; gap: 10px; }
.bar { height: 8px; background: var(--gray-100); border-radius: 9999px; overflow: hidden; }
.bar i { display: block; height: 100%; background: linear-gradient(90deg, var(--green-200), var(--green-600)); }

.chart.placeholder { height: 120px; border-radius: 12px; background: #eafff1; border: 1px dashed var(--green-600); box-shadow: var(--shadow-sm); }
.weight__now { margin-top: 10px; }

.meal { list-style: none; padding: 0; margin: 0; display: grid; gap: 8px; }
.meal li { display: flex; align-items: center; justify-content: space-between; background: var(--green-100); border-radius: 8px; padding: 8px 12px; }

.mini-courses { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 8px; }
.mini.placeholder { height: 60px; background: var(--green-100); border-radius: 8px; }

.macros { display: grid; grid-template-columns: 100px 1fr; align-items: center; gap: 8px 12px; margin: 8px 0 10px; }
.macros__bar { height: 8px; background: var(--gray-100); border-radius: 999px; overflow: hidden; }
.macros__bar i { display: block; height: 100%; background: linear-gradient(90deg, var(--green-200), var(--green-600)); }

.schedule__header { display: flex; align-items: center; justify-content: space-between; }
.schedule__list { display: grid; gap: 10px; margin-top: 8px; }
.entry { background: var(--green-100); border-radius: 8px; padding: 10px 12px; }

@media (max-width: 1100px) {
  .kpis { grid-template-columns: 1fr 1fr 1fr; }
  .profile, .weight, .learning { grid-column: span 6; }
  .recipe, .calories { grid-column: span 6; }
  .schedule { grid-column: span 12; }
}

@media (max-width: 700px) {
  .kpis { grid-template-columns: 1fr; }
  .grid { grid-template-columns: 1fr; }
  .profile, .weight, .learning, .recipe, .calories, .schedule { grid-column: span 1; }
}
</style>


