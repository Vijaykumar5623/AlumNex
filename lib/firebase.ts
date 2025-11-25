// Firebase initialization reading config from environment variables.
// Create a local `.env.local` with the values (see `.env.local.example`).
import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
}

let app
if (!getApps().length) {
  if (!firebaseConfig.apiKey) {
    // When running without config, initializeApp will fail — warn for clarity.
    // During development, create a `.env.local` with the Firebase values.
    // The app will still compile but Firebase operations will error until config is provided.
    // eslint-disable-next-line no-console
    console.warn('Firebase config missing. Add your keys to .env.local following .env.local.example')
  }
  try {
    app = initializeApp(firebaseConfig)
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Failed to initialize Firebase app (missing/invalid config).', e)
  }
}

export const auth = getAuth()
export const db = getFirestore()
export const storage = getStorage()

export default app
