// Firebase configuration and initialization
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDZqgFcjZoezN7uTbLfCcpe4XJLfCjidA4",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "fit5032-46960.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "fit5032-46960",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "fit5032-46960.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "932482057735",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:932482057735:web:a6213d43e47a7bbf278ca2"
}


// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase services
export const db = getFirestore(app)
export const auth = getAuth(app)

// Export the app instance as well
export default app
