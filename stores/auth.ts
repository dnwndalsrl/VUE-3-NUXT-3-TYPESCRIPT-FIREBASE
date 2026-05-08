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

      const { $auth } = useNuxtApp()
      this.loading = true

      onAuthStateChanged($auth, (user) => {
        this.user = user
        this.loading = false
        this.initialized = true
      })
    },
    async loginWithGoogle() {
      await signInWithGooglePopup()
      await navigateTo('/dashboard')
    },
    async logout() {
      const { $auth } = useNuxtApp()
      await signOut($auth)
      this.user = null
      await navigateTo('/login')
    }
  }
})
