import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './styles/theme.css'
import { createPinia } from 'pinia'
import './lib/firebase' // Initialize Firebase
import { autoMigrate } from './lib/migrateToFirebase'
import { initializeAuth } from './lib/auth'

const pinia = createPinia()

// Initialize auto-migration check
autoMigrate()

// Initialize Firebase Authentication
initializeAuth()

createApp(App)
  .use(router)
  .use(pinia)
  .mount('#app')
