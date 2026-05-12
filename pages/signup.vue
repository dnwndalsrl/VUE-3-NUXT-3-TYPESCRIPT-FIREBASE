<template>
  <section class="login-page">
    <div class="login-card">
      <p class="eyebrow">Create Account</p>
      <h1>회원가입</h1>
      <p class="login-card__copy">팀 권한에 맞춰 휴가 현황을 확인할 계정을 만듭니다.</p>

      <div v-if="!firebaseStatus.ready" class="setup-alert">
        <strong>Firebase 설정이 필요합니다</strong>
        <p>.env 파일에 Firebase 설정 값을 입력해 주세요.</p>
        <code v-for="key in firebaseStatus.missingKeys" :key="key">{{ key }}</code>
      </div>

      <form class="login-form" @submit.prevent="signup">
        <label class="field">
          <span class="field__label">팀</span>
          <select v-model="form.team" class="field__control">
            <option v-for="team in signupTeamOptions" :key="team" :value="team">{{ team }}</option>
          </select>
        </label>
        <AppInput v-model="form.name" label="이름" placeholder="캘린더와 목록에 표시될 이름" />
        <AppInput v-model="form.userId" label="아이디" placeholder="예: cs01" />
        <AppInput v-model="form.password" label="패스워드" type="password" placeholder="6자 이상 입력해 주세요" />
        <AppButton type="submit" block :disabled="!firebaseStatus.ready || authStore.loading">회원가입</AppButton>
        <AppLoading :show="authStore.loading" message="회원가입을 처리하는 중입니다." variant="block" />
      </form>

      <p class="login-card__link">
        이미 계정이 있나요?
        <NuxtLink to="/login">로그인</NuxtLink>
      </p>
      <p v-if="errorMessage" class="form-error">{{ errorMessage }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { getFirebaseConfigStatus } from '~/utils/firebase'
import { isAdminTeam, teamOptions, type TeamRole } from '~/utils/team'

const authStore = useAuthStore()
const errorMessage = ref('')
const firebaseStatus = computed(() => getFirebaseConfigStatus())
const signupTeamOptions = computed(() => teamOptions.filter((team) => !isAdminTeam(team)))

const form = reactive({
  team: 'CS팀' as TeamRole,
  name: '',
  userId: '',
  password: ''
})

const signup = async () => {
  errorMessage.value = ''
  const userId = form.userId.trim().toLowerCase()
  const name = form.name.trim()

  if (!form.team || !name || !userId || !form.password) {
    errorMessage.value = '팀, 이름, 아이디, 패스워드를 모두 입력해 주세요.'
    return
  }

  if (isAdminTeam(form.team)) {
    errorMessage.value = '회원가입에서는 최고관리자 권한을 선택할 수 없습니다.'
    return
  }

  if (!/^[a-z0-9._-]{3,24}$/.test(userId)) {
    errorMessage.value = '아이디는 영문 소문자, 숫자, 점, 밑줄, 하이픈으로 3~24자까지 입력해 주세요.'
    return
  }

  if (form.password.length < 6) {
    errorMessage.value = '패스워드는 6자 이상 입력해 주세요.'
    return
  }

  try {
    await authStore.signup({
      team: form.team,
      name,
      userId,
      password: form.password
    })
  } catch (error: unknown) {
    console.error(error)
    errorMessage.value = error instanceof Error ? error.message : '회원가입에 실패했습니다.'
  }
}
</script>

<style lang="scss">
.login-page {
  display: grid;
  min-height: 100vh;
  place-items: center;
  padding: 24px;
}

.login-card {
  width: min(420px, 100%);
  padding: 32px;
}

.login-card h1 {
  margin: 8px 0 10px;
  color: var(--color-primary);
  font-size: 42px;
}

.login-card__copy {
  margin: 0 0 24px;
  color: var(--color-muted);
  line-height: 1.6;
}

.login-form {
  display: grid;
  gap: 14px;
}

.login-card__link {
  margin: 16px 0 0;
  color: var(--color-muted);
  font-size: 14px;
  font-weight: 700;
  text-align: center;
}

.login-card__link a {
  color: var(--color-primary);
  font-weight: 900;
}
</style>

