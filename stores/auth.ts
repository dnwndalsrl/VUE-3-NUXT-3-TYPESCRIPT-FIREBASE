import { defineStore } from 'pinia'
import { onAuthStateChanged, type User } from 'firebase/auth'
import {
  createAccountWithPassword,
  createUserProfile,
  fetchUserProfile,
  signInWithUserId,
  signOutAuth,
  type SignupPayload
} from '~/services/auth.service'
import type { UserProfile } from '~/types/user'

interface AuthState {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  initialized: boolean
  errorMessage: string
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    profile: null,
    loading: true,
    initialized: false,
    errorMessage: ''
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

      const { $auth, $db, $firebaseConfigError } = useNuxtApp()

      if (!$auth || !$db) {
        this.user = null
        this.loading = false
        this.initialized = true
        if ($firebaseConfigError) {
          console.warn($firebaseConfigError)
        }
        return
      }

      this.loading = true
      this.errorMessage = ''

      onAuthStateChanged($auth, async (user) => {
        try {
          this.user = user
          this.profile = user ? await fetchUserProfile($db, user.uid) : null
          this.errorMessage = ''
        } catch (error: unknown) {
          console.error(error)
          this.user = null
          this.profile = null
          this.errorMessage = error instanceof Error ? error.message : '회원 정보를 불러오지 못했습니다.'
        } finally {
          this.loading = false
          this.initialized = true
        }
      })
    },
    async fetchProfile(uid: string): Promise<UserProfile | null> {
      const { $db } = useNuxtApp()

      if (!$db) {
        return null
      }

      try {
        this.loading = true
        this.errorMessage = ''
        const profile = await fetchUserProfile($db, uid)
        this.profile = profile
        return profile
      } catch (error: unknown) {
        console.error(error)
        this.errorMessage = error instanceof Error ? error.message : '회원 정보를 불러오지 못했습니다.'
        return null
      } finally {
        this.loading = false
      }
    },
    async login(userId: string, password: string): Promise<void> {
      const { $auth, $firebaseReady, $firebaseConfigError } = useNuxtApp()

      try {
        this.loading = true
        this.errorMessage = ''

        if (!$firebaseReady) {
          throw new Error($firebaseConfigError ?? 'Firebase 설정이 필요합니다.')
        }

        const credential = await signInWithUserId(userId, password)
        this.user = credential.user
        this.profile = await this.fetchProfile(credential.user.uid)

        if (!this.profile) {
          if ($auth) {
            await signOutAuth($auth)
          }
          this.user = null
          throw new Error('회원 정보를 찾을 수 없습니다. 관리자에게 문의해 주세요.')
        }

        if (!this.profile.approved && this.profile.team !== '최고관리자') {
          if ($auth) {
            await signOutAuth($auth)
          }
          this.user = null
          this.profile = null
          throw new Error('최고관리자 승인 후 사용할 수 있습니다.')
        }

        await navigateTo('/dashboard')
      } catch (error: unknown) {
        console.error(error)
        this.errorMessage = error instanceof Error ? error.message : '로그인에 실패했습니다.'
        throw error
      } finally {
        this.loading = false
      }
    },
    async signup(form: SignupPayload): Promise<void> {
      const { $auth, $firebaseReady, $firebaseConfigError, $db } = useNuxtApp()

      try {
        this.loading = true
        this.errorMessage = ''

        if (!$firebaseReady || !$db) {
          throw new Error($firebaseConfigError ?? 'Firebase 설정이 필요합니다.')
        }

        const userId = form.userId.trim().toLowerCase()
        const name = form.name.trim()
        const credential = await createAccountWithPassword({
          ...form,
          userId,
          name
        })

        await createUserProfile($db, {
          uid: credential.user.uid,
          userId,
          name,
          team: form.team,
          email: credential.user.email ?? ''
        })

        if ($auth) {
          await signOutAuth($auth)
        }
        this.user = null
        this.profile = null
        await navigateTo('/login?pending=1')
      } catch (error: unknown) {
        console.error(error)
        this.errorMessage = error instanceof Error ? error.message : '회원가입에 실패했습니다.'
        throw error
      } finally {
        this.loading = false
      }
    },
    async logout(): Promise<void> {
      const { $auth } = useNuxtApp()

      try {
        this.loading = true
        this.errorMessage = ''

        if ($auth) {
          await signOutAuth($auth)
        }

        this.user = null
        this.profile = null
        await navigateTo('/login')
      } catch (error: unknown) {
        console.error(error)
        this.errorMessage = error instanceof Error ? error.message : '로그아웃에 실패했습니다.'
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})
