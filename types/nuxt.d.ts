import type { FirebaseApp } from 'firebase/app'
import type { Auth } from 'firebase/auth'
import type { Firestore } from 'firebase/firestore'

declare module '#app' {
  interface NuxtApp {
    $firebaseApp: FirebaseApp
    $auth: Auth
    $db: Firestore
  }
}

export {}
