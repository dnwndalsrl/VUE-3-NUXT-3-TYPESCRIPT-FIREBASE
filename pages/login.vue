<script setup lang="ts">
import { getFirebaseConfigStatus } from '~/utils/firebase'

const authStore = useAuthStore()
const route = useRoute()
const errorMessage = ref('')
const noticeMessage = computed(() =>
  route.query.pending ? '회원가입이 완료되었습니다. 최고관리자 승인 후 로그인할 수 있습니다.' : ''
)
const firebaseStatus = computed(() => getFirebaseConfigStatus())

const form = reactive({
  userId: '',
  password: ''
})

const login = async () => {
  errorMessage.value = ''

  if (!form.userId.trim() || !form.password) {
    errorMessage.value = '아이디와 패스워드를 입력해 주세요.'
    return
  }

  try {
    await authStore.login(form.userId, form.password)
  } catch (error) {
    errorMessage.value = error instanceof Error
      ? error.message
      : '로그인에 실패했습니다. 아이디와 패스워드를 확인해 주세요.'
  }
}
</script>

<template>
  <section class="login-page">
    <div class="login-card">
      <p class="eyebrow">Personal Leave Tracker</p>
      <h1>휴가 관리 포털</h1>
      <p class="login-card__copy">팀별 권한으로 연차 현황을 확인하고 관리합니다.</p>

      <div v-if="!firebaseStatus.ready" class="setup-alert">
        <strong>Firebase 설정이 필요합니다</strong>
        <p>.env 파일에 Firebase 설정 값을 입력해 주세요.</p>
        <code v-for="key in firebaseStatus.missingKeys" :key="key">{{ key }}</code>
      </div>

      <form class="login-form" @submit.prevent="login">
        <AppInput v-model="form.userId" label="아이디" placeholder="아이디를 입력해 주세요" />
        <AppInput v-model="form.password" label="패스워드" type="password" placeholder="패스워드를 입력해 주세요" />
        <AppButton type="submit" block :disabled="!firebaseStatus.ready || authStore.loading">로그인</AppButton>
      </form>

      <p v-if="noticeMessage" class="success-message">{{ noticeMessage }}</p>
      <p class="login-card__link">
        계정이 없나요?
        <NuxtLink to="/signup">회원가입</NuxtLink>
      </p>
      <p v-if="errorMessage" class="form-error">{{ errorMessage }}</p>
    </div>
  </section>
</template>
