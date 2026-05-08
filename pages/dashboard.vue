<script setup lang="ts">
const authStore = useAuthStore()
const leaveStore = useLeaveStore()

const uid = computed(() => authStore.user?.uid)

watch(
  uid,
  async (value) => {
    if (!value || !authStore.user) {
      return
    }

    await leaveStore.ensureUser(value, authStore.user)
    await leaveStore.load(value)
  },
  { immediate: true }
)

const setting = computed(() => leaveStore.setting)
const summary = computed(() => leaveStore.summary)
const recentRecords = computed(() => leaveStore.sortedRecords.slice(0, 5))
</script>

<template>
  <section class="page dashboard-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">{{ setting.year }}년 기준</p>
        <h1>대시보드</h1>
      </div>
      <NuxtLink to="/leave-record">
        <AppButton>연차 등록하기</AppButton>
      </NuxtLink>
    </header>

    <div class="summary-grid summary-grid--dashboard">
      <SummaryCard
        label="잔여 연차"
        :value="formatLeaveDays(summary.remaining)"
        tone="primary"
        large
      />
      <SummaryCard label="기준 연도" :value="`${setting.year}년`" />
      <SummaryCard label="총 연차" :value="formatLeaveDays(setting.totalDays)" />
      <SummaryCard label="이월 연차" :value="formatLeaveDays(setting.carriedOverDays)" />
      <SummaryCard label="실제 총 연차" :value="formatLeaveDays(summary.total)" />
      <SummaryCard label="사용 연차" :value="formatLeaveDays(summary.used)" tone="muted" />
    </div>

    <section class="content-panel">
      <div class="panel-header">
        <h2>최근 사용 내역</h2>
        <NuxtLink to="/leave-history">전체 보기</NuxtLink>
      </div>

      <LeaveRecordList
        :records="recentRecords"
        empty-text="아직 등록된 연차 사용 내역이 없습니다."
      />
    </section>
  </section>
</template>
