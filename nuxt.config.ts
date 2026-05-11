import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const envPath = resolve(process.cwd(), '.env')

if (existsSync(envPath)) {
  const envFile = readFileSync(envPath, 'utf8')

  for (const line of envFile.split(/\r?\n/)) {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }

    const separatorIndex = trimmed.indexOf('=')

    if (separatorIndex === -1) {
      continue
    }

    const key = trimmed.slice(0, separatorIndex).trim()
    const rawValue = trimmed.slice(separatorIndex + 1).trim()
    const value = rawValue.replace(/^['"]|['"]$/g, '')

    process.env[key] ??= value
  }
}

const env = (key: string) => process.env[key] ?? ''

export default defineNuxtConfig({
  compatibilityDate: '2024-10-01',
  devtools: { enabled: true },
  modules: ['@pinia/nuxt'],
  css: ['~/assets/scss/main.scss'],
  typescript: {
    strict: true,
    typeCheck: true
  },
  runtimeConfig: {
    public: {
      firebaseApiKey: env('NUXT_PUBLIC_FIREBASE_API_KEY'),
      firebaseAuthDomain: env('NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
      firebaseProjectId: env('NUXT_PUBLIC_FIREBASE_PROJECT_ID'),
      firebaseStorageBucket: env('NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET'),
      firebaseMessagingSenderId: env('NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
      firebaseAppId: env('NUXT_PUBLIC_FIREBASE_APP_ID'),
      apiBaseUrl: env('NUXT_PUBLIC_API_BASE_URL')
    }
  },
  app: {
    head: {
      title: '휴가 관리 포털',
      htmlAttrs: { lang: 'ko' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '개인용 연차 사용 내역 기록 및 잔여 연차 확인 앱' }
      ]
    }
  }
})

