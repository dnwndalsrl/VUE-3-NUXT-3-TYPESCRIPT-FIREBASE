import { defineStore } from 'pinia'
import {
  onAuthStateChanged,
  signOut,
  type User
} from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { loginWithPassword, signupWithPassword } from '~/utils/firebase'
import type { UserProfile } from '~/types/user'
import type { TeamRole } from '~/utils/team'

interface AuthState {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  initialized: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    profile: null,
    loading: true,
    initialized: false
  }),
  getters: {
    isLoggedIn: (state) => Boolean(state.user),
    isAdmin: (state) => state.profile?.team === '최고관리자',
    team: (state) => state.profile?.team ?? ''
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

      onAuthStateChanged($auth, async (user) => {
        this.user = user
        this.profile = user ? await this.fetchProfile(user.uid) : null
        this.loading = false
        this.initialized = true
      })
    },
    async fetchProfile(uid: string) {
      const { $db } = useNuxtApp()

      if (!$db) {
        return null
      }

      const snap = await getDoc(doc($db, 'users', uid))
      if (!snap.exists()) {
        return null
      }

      return {
        uid,
        ...snap.data()
      } as UserProfile
    },
    async login(userId: string, password: string) {
      const { $auth, $firebaseReady, $firebaseConfigError } = useNuxtApp()

      if (!$firebaseReady) {
        throw new Error($firebaseConfigError ?? 'Firebase 설정이 필요합니다.')
      }

      const credential = await loginWithPassword(userId, password)
      this.user = credential.user
      this.profile = await this.fetchProfile(credential.user.uid)

      if (!this.profile) {
        if ($auth) {
          await signOut($auth)
        }
        this.user = null
        throw new Error('회원 정보를 찾을 수 없습니다. 관리자에게 문의해 주세요.')
      }

      if (!this.profile.approved && this.profile.team !== '최고관리자') {
        if ($auth) {
          await signOut($auth)
        }
        this.user = null
        this.profile = null
        throw new Error('최고관리자 승인 후 사용할 수 있습니다.')
      }

      await navigateTo('/dashboard')
    },
    async signup(form: { team: TeamRole; userId: string; name: string; password: string }) {
      const { $auth, $firebaseReady, $firebaseConfigError, $db } = useNuxtApp()

      if (!$firebaseReady || !$db) {
        throw new Error($firebaseConfigError ?? 'Firebase 설정이 필요합니다.')
      }

      const userId = form.userId.trim().toLowerCase()
      const name = form.name.trim()
      const credential = await signupWithPassword(userId, form.password, name)
      const profile: UserProfile = {
        uid: credential.user.uid,
        userId,
        name,
        team: form.team,
        displayName: name,
        email: credential.user.email ?? '',
        approved: false
      }

      await setDoc(doc($db, 'users', credential.user.uid), {
        userId: profile.userId,
        name: profile.name,
        team: profile.team,
        displayName: profile.displayName,
        email: profile.email,
        approved: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      if ($auth) {
        await signOut($auth)
      }
      this.user = null
      this.profile = null
      await navigateTo('/login?pending=1')
    },
    async logout() {
      const { $auth } = useNuxtApp()

      if (!$auth) {
        this.user = null
        this.profile = null
        await navigateTo('/login')
        return
      }

      await signOut($auth)
      this.user = null
      this.profile = null
      await navigateTo('/login')
    }
  }
})
