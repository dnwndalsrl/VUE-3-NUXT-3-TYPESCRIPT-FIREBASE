import { defineStore } from 'pinia'
import {
  onAuthStateChanged,
  signOut,
  type User
} from 'firebase/auth'
import { loginWithGoogle as signInWithGooglePopup } from '~/utils/firebase'

interface AuthState {
  user: User | null
  loading: boolean
  initialized: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    loading: true,
    initialized: false
  }),
  getters: {
    isLoggedIn: (state) => Boolean(state.user)
  },
  actions: {
    initAuth() {
      if (this.initialized || !import.meta.client) {
        return
      }

      const { $auth, $firebaseConfigError } = useNuxtApp()

      if (!$auth) {
        this.user = null
        this.loading = false
        this.initialized = true
        if ($firebaseConfigError) {
          console.warn($firebaseConfigError)
        }
        return
      }

      this.loading = true

      onAuthStateChanged($auth, (user) => {
        this.user = user
        this.loading = false
        this.initialized = true
      })
    },
    async loginWithGoogle() {
      const { $firebaseReady, $firebaseConfigError } = useNuxtApp()

      if (!$firebaseReady) {
        throw new Error($firebaseConfigError ?? 'Firebase 설정이 필요합니다.')
      }

      await signInWithGooglePopup()
      await navigateTo('/dashboard')
    },
    async logout() {
      const { $auth } = useNuxtApp()

      if (!$auth) {
        this.user = null
        await navigateTo('/login')
        return
      }

      await signOut($auth)
      this.user = null
      await navigateTo('/login')
    }
  }
})
