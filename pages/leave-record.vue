<script setup lang="ts">
import type { LeaveRecord } from '~/types/leave'

const authStore = useAuthStore()
const leaveStore = useLeaveStore()
const saving = ref(false)
const errorMessage = ref('')

const handleSubmit = async (record: LeaveRecord) => {
  if (!authStore.user) {
    errorMessage.value = '로그인 후 연차를 등록할 수 있습니다.'
    return
  }

  if (!record.startDate) {
    errorMessage.value = '시작일을 선택해 주세요.'
    return
  }

  saving.value = true
  errorMessage.value = ''

  try {
    await leaveStore.addRecord(authStore.user.uid, record)
    await navigateTo('/leave-history')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="page page--narrow">
    <header class="page-header">
      <div>
        <p class="eyebrow">Record</p>
        <h1>연차 등록</h1>
      </div>
    </header>

    <LeaveRecordForm :busy="saving" submit-label="저장" @submit="handleSubmit" />
    <p v-if="errorMessage" class="form-error">{{ errorMessage }}</p>
  </section>
</template>
