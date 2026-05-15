<template>
  <section class="page page--narrow leave-record-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">Record</p>
        <h1>연차 등록</h1>
      </div>
    </header>

    <div class="content-panel approval-note">
      <strong>등록한 연차는 최고관리자 승인 후 반영됩니다.</strong>
      <p>승인 전에는 사용 내역에서 상태를 확인할 수 있고, 공용 캘린더와 전체 현황에는 표시되지 않습니다.</p>
    </div>

    <LeaveRecordForm :busy="isLoading" submit-label="저장" @submit="handleSubmit" />
    <AppLoading :show="isLoading" :message="loadingMessage" variant="block" />
    <p v-if="errorMessage" class="form-error">{{ errorMessage }}</p>
  </section>
</template>

<script setup lang="ts">
import type { LeaveRecord } from '~/types/leave'

const authStore = useAuthStore()
const leaveStore = useLeaveStore()
const { isLoading, loadingMessage, startLoading, stopLoading } = useLoading('연차를 등록하는 중입니다.')
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

  try {
    startLoading('연차를 등록하는 중입니다.')
    errorMessage.value = ''
    await leaveStore.addRecord(authStore.user.uid, record)
    await navigateTo('/leave-history')
  } catch (error: unknown) {
    console.error(error)
    errorMessage.value = error instanceof Error ? error.message : '연차 등록에 실패했습니다.'
  } finally {
    stopLoading()
  }
}
</script>

<style lang="scss">
.leave-record-page .approval-note {
  display: grid;
  gap: 6px;
  margin-bottom: 18px;
}

.leave-record-page .approval-note strong,
.leave-record-page .approval-note p {
  margin: 0;
}

.leave-record-page .approval-note p {
  color: var(--color-muted);
  line-height: 1.5;
}
</style>

