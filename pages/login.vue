<script setup lang="ts">
import { getFirebaseConfigStatus } from '~/utils/firebase'

const authStore = useAuthStore()
const errorMessage = ref('')
const firebaseStatus = computed(() => getFirebaseConfigStatus())

const login = async () => {
  errorMessage.value = ''
  try {
    await authStore.loginWithGoogle()
  } catch (error) {
    errorMessage.value = error instanceof Error
      ? error.message
      : 'Google 로그인에 실패했습니다. Firebase 설정을 확인해 주세요.'
  }
}
</script>

<template>
  <section class="login-page">
    <div class="login-card">
      <p class="eyebrow">Personal Leave Tracker</p>
      <h1>연차 체크</h1>
      <p class="login-card__copy">내가 직접 기록하고, 남은 연차를 빠르게 확인하는 개인용 연차 관리 앱</p>

      <div v-if="!firebaseStatus.ready" class="setup-alert">
        <strong>Firebase 설정이 필요합니다</strong>
        <p>.env 파일에 아래 값들을 입력하면 Google 로그인을 사용할 수 있습니다.</p>
        <code v-for="key in firebaseStatus.missingKeys" :key="key">{{ key }}</code>
      </div>

      <AppButton block :disabled="!firebaseStatus.ready" @click="login">Google로 로그인</AppButton>
      <p v-if="errorMessage" class="form-error">{{ errorMessage }}</p>
    </div>
  </section>
</template>
