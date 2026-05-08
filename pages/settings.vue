<script setup lang="ts">
import type { LeaveSetting } from '~/types/leave'

const authStore = useAuthStore()
const leaveStore = useLeaveStore()
const saving = ref(false)
const saved = ref(false)
const errorMessage = ref('')

const form = reactive<LeaveSetting & { displayName: string }>({
  year: new Date().getFullYear(),
  totalDays: 15,
  carryOverDays: 0,
  carriedOverDays: 0,
  displayName: ''
})

watch(
  () => authStore.user?.uid,
  async (uid) => {
    if (!uid) {
      return
    }

    await Promise.all([
      leaveStore.fetchUser(uid),
      leaveStore.fetchSetting(uid, Number(form.year))
    ])

    form.year = leaveStore.setting.year
    form.totalDays = leaveStore.setting.totalDays
    form.carryOverDays = leaveStore.setting.carryOverDays ?? leaveStore.setting.carriedOverDays
    form.carriedOverDays = form.carryOverDays
    form.displayName = leaveStore.displayName || authStore.user?.displayName || ''
  },
  { immediate: true }
)

const save = async () => {
  if (!authStore.user) {
    errorMessage.value = '로그인 후 설정을 저장할 수 있습니다.'
    return
  }

  const year = Number(form.year)
  const totalDays = Number(form.totalDays)
  const carryOverDays = Number(form.carryOverDays ?? 0)

  if (!year || totalDays < 0 || carryOverDays < 0) {
    errorMessage.value = '연도와 연차 수치를 올바르게 입력해 주세요.'
    return
  }

  saving.value = true
  saved.value = false
  errorMessage.value = ''

  try {
    await Promise.all([
      leaveStore.saveSetting(authStore.user.uid, {
        year,
        totalDays,
        carryOverDays,
        carriedOverDays: carryOverDays
      }),
      leaveStore.saveDisplayName(authStore.user.uid, form.displayName.trim())
    ])

    saved.value = true
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="page page--narrow">
    <header class="page-header">
      <div>
        <p class="eyebrow">Settings</p>
        <h1>내 연차 설정</h1>
      </div>
    </header>

    <form class="form-card" @submit.prevent="save">
      <AppInput v-model="form.displayName" label="표시 이름" placeholder="대시보드에 표시할 이름" />
      <AppInput v-model="form.year" label="기준 연도" type="number" :min="2000" />
      <AppInput v-model="form.totalDays" label="올해 총 연차" type="number" :min="0" :step="0.5" />
      <AppInput v-model="form.carryOverDays" label="이월 연차" type="number" :min="0" :step="0.5" />

      <div class="readonly-field">
        <span>실제 총 연차</span>
        <strong>{{ formatLeaveDays(Number(form.totalDays || 0) + Number(form.carryOverDays || 0)) }}</strong>
      </div>

      <AppButton type="submit" :disabled="saving">설정 저장</AppButton>
    </form>

    <p v-if="saved" class="success-message">설정을 저장했습니다. 대시보드 계산에 바로 반영됩니다.</p>
    <p v-if="errorMessage" class="form-error">{{ errorMessage }}</p>
  </section>
</template>
