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
      firebaseApiKey: process.env.NUXT_PUBLIC_FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.NUXT_PUBLIC_FIREBASE_APP_ID
    }
  },
  app: {
    head: {
      title: '연차 체크',
      htmlAttrs: { lang: 'ko' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '개인용 연차 사용 내역 기록 및 잔여 연차 확인 앱' }
      ]
    }
  }
})
