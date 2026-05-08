import type { FirebaseApp } from 'firebase/app'
import type { Auth } from 'firebase/auth'
import type { Firestore } from 'firebase/firestore'

declare module '#app' {
  interface NuxtApp {
    $firebaseReady: boolean
    $firebaseConfigError: string | null
    $firebaseApp: FirebaseApp | null
    $auth: Auth | null
    $db: Firestore | null
  }
}

export {}
