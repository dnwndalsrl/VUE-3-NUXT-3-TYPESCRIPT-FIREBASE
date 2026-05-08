import { getApps, initializeApp, type FirebaseApp } from 'firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  type Auth,
  type UserCredential
} from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

export let firebaseApp: FirebaseApp
export let auth: Auth
export let db: Firestore

export const initFirebase = () => {
  if (firebaseApp && auth && db) {
    return { firebaseApp, auth, db }
  }

  const config = useRuntimeConfig()

  const firebaseConfig = {
    apiKey: config.public.firebaseApiKey,
    authDomain: config.public.firebaseAuthDomain,
    projectId: config.public.firebaseProjectId,
    storageBucket: config.public.firebaseStorageBucket,
    messagingSenderId: config.public.firebaseMessagingSenderId,
    appId: config.public.firebaseAppId
  }

  firebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
  auth = getAuth(firebaseApp)
  db = getFirestore(firebaseApp)

  return { firebaseApp, auth, db }
}

export const googleProvider = new GoogleAuthProvider()

export const loginWithGoogle = async (): Promise<UserCredential> => {
  const { auth: firebaseAuth } = initFirebase()
  return signInWithPopup(firebaseAuth, googleProvider)
}
