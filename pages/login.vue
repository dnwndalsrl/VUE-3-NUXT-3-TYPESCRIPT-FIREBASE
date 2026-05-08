<script setup lang="ts">
const authStore = useAuthStore()
const errorMessage = ref('')

const login = async () => {
  errorMessage.value = ''
  try {
    await authStore.loginWithGoogle()
  } catch {
    errorMessage.value = 'Google 로그인에 실패했습니다. Firebase 설정을 확인해 주세요.'
  }
}
</script>

<template>
  <section class="login-page">
    <div class="login-card">
      <p class="eyebrow">Personal Leave Tracker</p>
      <h1>연차 체크</h1>
      <p class="login-card__copy">내가 직접 기록하고, 남은 연차를 빠르게 확인하는 개인용 연차 관리 앱</p>
      <AppButton block @click="login">Google로 로그인</AppButton>
      <p v-if="errorMessage" class="form-error">{{ errorMessage }}</p>
    </div>
  </section>
</template>
