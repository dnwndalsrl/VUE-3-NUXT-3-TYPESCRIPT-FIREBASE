<template>
  <section class="page page--wide">
    <header class="page-header">
      <div>
        <p class="eyebrow">Team Status · {{ scopeLabel }}</p>
        <h1>팀별 현황</h1>
      </div>

      <div class="status-controls">
        <label class="field status-year-field">
          <span class="field__label">기준 연도</span>
          <input v-model.number="selectedYear" class="field__control" type="number" min="2000" max="2100">
        </label>
        <AppButton variant="secondary" @click="refreshStatuses">새로고침</AppButton>
      </div>
    </header>

    <div class="summary-grid status-summary-grid">
      <SummaryCard label="조회 범위" :value="scopeLabel" tone="primary" />
      <SummaryCard label="등록 회원" :value="`${totalMembers}명`" />
      <SummaryCard label="승인 대기" :value="`${pendingRecords}건`" tone="muted" />
      <SummaryCard label="전체 사용 연차" :value="formatLeaveDays(usedLeaveDays)" tone="muted" />
      <SummaryCard label="전체 잔여 연차" :value="formatLeaveDays(remainingLeaveDays)" tone="primary" />
    </div>

    <section class="content-panel">
      <div class="panel-header">
        <h2>회원별 현황</h2>
        <AppLoading v-if="leaveStore.memberStatusLoading" message="회원별 현황을 불러오는 중입니다." size="small" />
        <span v-else>{{ selectedYear }}년 기준 · 승인된 연차만 반영</span>
      </div>

      <p v-if="leaveStore.memberStatusError" class="form-error">{{ leaveStore.memberStatusError }}</p>

      <AppLoading v-if="leaveStore.memberStatusLoading" message="회원별 현황을 불러오는 중입니다." variant="block" />

      <div v-else-if="statuses.length" class="status-table-wrap">
        <table class="status-table">
          <thead>
            <tr>
              <th>회원</th>
              <th>팀</th>
              <th>총 연차</th>
              <th>사용일</th>
              <th>남은일</th>
              <th>승인 대기</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="member in paginatedStatuses" :key="member.uid">
              <td>
                <strong>{{ member.displayName }}</strong>
                <span>{{ member.userId || '아이디 없음' }}</span>
              </td>
              <td>{{ member.team || '팀 없음' }}</td>
              <td>{{ formatLeaveDays(member.summary.total) }}</td>
              <td>{{ formatLeaveDays(member.summary.used) }}</td>
              <td>
                <strong class="status-table__remaining">{{ formatLeaveDays(member.summary.remaining) }}</strong>
              </td>
              <td>{{ member.pendingRecordsCount }}건</td>
            </tr>
          </tbody>
        </table>
        <AppPagination v-model:page="statusPage" :total="statuses.length" :page-size="pageSize" />
      </div>

      <p v-else class="empty-state">아직 조회할 회원 연차 현황이 없습니다.</p>
    </section>
  </section>
</template>

<script setup lang="ts">
const authStore = useAuthStore()
const leaveStore = useLeaveStore()

const selectedYear = ref(new Date().getFullYear())
const statusPage = ref(1)
const pageSize = 5

watch(
  () => authStore.profile,
  async (profile) => {
    if (profile) {
      await leaveStore.fetchMemberStatuses(selectedYear.value)
    }
  },
  { immediate: true }
)

watch(selectedYear, async (year) => {
  if (authStore.profile) {
    statusPage.value = 1
    await leaveStore.fetchMemberStatuses(year)
  }
})

const statuses = computed(() => leaveStore.sortedMemberStatuses)
const paginatedStatuses = computed(() => {
  const start = (statusPage.value - 1) * pageSize
  return statuses.value.slice(start, start + pageSize)
})
const scopeLabel = computed(() => authStore.isAdmin ? '전체 팀' : authStore.profile?.team ?? '내 팀')
const totalMembers = computed(() => statuses.value.length)
const usedLeaveDays = computed(() => statuses.value.reduce((sum, member) => sum + member.summary.used, 0))
const remainingLeaveDays = computed(() => statuses.value.reduce((sum, member) => sum + member.summary.remaining, 0))
const pendingRecords = computed(() => statuses.value.reduce((sum, member) => sum + member.pendingRecordsCount, 0))

watch(
  () => statuses.value.length,
  () => {
    statusPage.value = 1
  }
)

const refreshStatuses = async () => {
  await leaveStore.fetchMemberStatuses(selectedYear.value)
}
</script>

<style scoped lang="scss">
</style>



