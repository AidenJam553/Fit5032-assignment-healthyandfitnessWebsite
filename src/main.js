import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './styles/theme.css'
import { createPinia } from 'pinia'
import './lib/firebase' // Initialize Firebase
import { autoMigrate } from './lib/migrateToFirebase'

const pinia = createPinia()

// Initialize auto-migration check
autoMigrate()

createApp(App)
  .use(router)
  .use(pinia)
  .mount('#app')
