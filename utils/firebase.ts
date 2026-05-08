import { getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  type Auth,
  type UserCredential
} from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

export let firebaseApp: FirebaseApp | null = null
export let auth: Auth | null = null
export let db: Firestore | null = null

export const requiredFirebaseEnvKeys = [
  'NUXT_PUBLIC_FIREBASE_API_KEY',
  'NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NUXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NUXT_PUBLIC_FIREBASE_APP_ID'
] as const

export class FirebaseConfigError extends Error {
  constructor(message = 'Firebase 환경변수가 설정되지 않았습니다. .env 파일을 확인해 주세요.') {
    super(message)
    this.name = 'FirebaseConfigError'
  }
}

const isFilled = (value: unknown) =>
  (typeof value === 'string' && value.trim().length > 0) || typeof value === 'number'

const toConfigString = (value: unknown) => String(value ?? '').trim()

export const getFirebaseConfigStatus = () => {
  const config = useRuntimeConfig()
  const values = {
    NUXT_PUBLIC_FIREBASE_API_KEY: config.public.firebaseApiKey,
    NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN: config.public.firebaseAuthDomain,
    NUXT_PUBLIC_FIREBASE_PROJECT_ID: config.public.firebaseProjectId,
    NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET: config.public.firebaseStorageBucket,
    NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: config.public.firebaseMessagingSenderId,
    NUXT_PUBLIC_FIREBASE_APP_ID: config.public.firebaseAppId
  }

  const missingKeys = requiredFirebaseEnvKeys.filter((key) => !isFilled(values[key]))

  return {
    ready: missingKeys.length === 0,
    missingKeys,
    values
  }
}

export const initFirebase = () => {
  if (firebaseApp && auth && db) {
    return { firebaseApp, auth, db }
  }

  const status = getFirebaseConfigStatus()

  if (!status.ready) {
    throw new FirebaseConfigError(`Firebase 환경변수가 비어 있습니다: ${status.missingKeys.join(', ')}`)
  }

  const firebaseConfig: FirebaseOptions = {
    apiKey: toConfigString(status.values.NUXT_PUBLIC_FIREBASE_API_KEY),
    authDomain: toConfigString(status.values.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
    projectId: toConfigString(status.values.NUXT_PUBLIC_FIREBASE_PROJECT_ID),
    storageBucket: toConfigString(status.values.NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
    messagingSenderId: toConfigString(status.values.NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
    appId: toConfigString(status.values.NUXT_PUBLIC_FIREBASE_APP_ID)
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


