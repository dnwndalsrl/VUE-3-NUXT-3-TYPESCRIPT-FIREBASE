import type { FirebaseApp } from 'firebase/app'
import type { Auth } from 'firebase/auth'
import type { Firestore } from 'firebase/firestore'
import { initFirebase } from '~/utils/firebase'

interface FirebasePluginProvide extends Record<string, unknown> {
  firebaseReady: boolean
  firebaseConfigError: string | null
  firebaseApp: FirebaseApp | null
  auth: Auth | null
  db: Firestore | null
}

export default defineNuxtPlugin(() => {
  const provide: FirebasePluginProvide = {
    firebaseReady: false,
    firebaseConfigError: null,
    firebaseApp: null,
    auth: null,
    db: null
  }

  try {
    const { firebaseApp, auth, db } = initFirebase()
    provide.firebaseReady = true
    provide.firebaseApp = firebaseApp
    provide.auth = auth
    provide.db = db
  } catch (error) {
    provide.firebaseConfigError = error instanceof Error ? error.message : 'Firebase 초기화에 실패했습니다.'
  }

  return { provide }
})

