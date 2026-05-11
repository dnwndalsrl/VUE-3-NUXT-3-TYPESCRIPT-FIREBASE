<script setup lang="ts">
const authStore = useAuthStore()
const leaveStore = useLeaveStore()

const uid = computed(() => authStore.user?.uid)
const memberPage = ref(1)
const pageSize = 5

const formatDateKey = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

watch(
  uid,
  async (value) => {
    if (!value || !authStore.user) {
      return
    }

    await leaveStore.ensureUser(value, authStore.user)
    await Promise.all([
      leaveStore.load(value),
      leaveStore.fetchAllMembersOverview(new Date().getFullYear()),
      leaveStore.fetchAllPublicRecords()
    ])
  },
  { immediate: true }
)

const setting = computed(() => leaveStore.setting)
const summary = computed(() => leaveStore.summary)
const recentRecords = computed(() => leaveStore.sortedRecords.slice(0, 5))
const pendingCount = computed(() => leaveStore.records.filter((record) => getLeaveApprovalStatus(record) === 'pending').length)
const todayKey = computed(() => formatDateKey(new Date()))
const usageRate = computed(() => {
  if (!summary.value.total) {
    return 0
  }

  return Math.min(Math.round((summary.value.used / summary.value.total) * 100), 100)
})
const todayLeaveByUid = computed(() => {
  const map = new Map<string, string>()

  leaveStore.allPublicRecords.forEach((record) => {
    const start = record.startDate ?? record.date
    const end = record.endDate ?? record.startDate ?? record.date

    if (start <= todayKey.value && end >= todayKey.value) {
      map.set(record.uid, leaveTypeLabels[record.type])
    }
  })

  return map
})
const memberTodayStatuses = computed(() =>
  leaveStore.sortedAllMemberStatuses.map((member) => ({
    ...member,
    leaveLabel: todayLeaveByUid.value.get(member.uid) ?? '',
    onLeave: todayLeaveByUid.value.has(member.uid)
  }))
)
const paginatedMemberStatuses = computed(() => {
  const start = (memberPage.value - 1) * pageSize
  return memberTodayStatuses.value.slice(start, start + pageSize)
})
const todayOnLeaveCount = computed(() => memberTodayStatuses.value.filter((member) => member.onLeave).length)

watch(
  () => memberTodayStatuses.value.length,
  () => {
    memberPage.value = 1
  }
)
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

    <section class="dashboard-balance-layout">
      <article class="leave-balance-panel">
        <div>
          <span>잔여 연차</span>
          <strong>{{ formatLeaveDays(summary.remaining) }}</strong>
          <p>총 {{ formatLeaveDays(summary.total) }} 중 {{ formatLeaveDays(summary.used) }} 사용</p>
        </div>
        <div class="leave-progress" aria-hidden="true">
          <span :style="{ width: `${usageRate}%` }" />
        </div>
      </article>

      <div class="leave-metrics-grid">
        <article class="leave-metric-item">
          <span>총 연차</span>
          <strong>{{ formatLeaveDays(setting.totalDays) }}</strong>
        </article>
        <article class="leave-metric-item">
          <span>이월 연차</span>
          <strong>{{ formatLeaveDays(setting.carriedOverDays) }}</strong>
        </article>
        <article class="leave-metric-item">
          <span>실제 총 연차</span>
          <strong>{{ formatLeaveDays(summary.total) }}</strong>
        </article>
        <article class="leave-metric-item leave-metric-item--attention">
          <span>승인 대기</span>
          <strong>{{ pendingCount }}건</strong>
        </article>
      </div>
    </section>

    <section class="content-panel dashboard-members-panel">
      <div class="panel-header">
        <div>
          <h2>전체 현황</h2>
          <p>모든 회원 · 연차 중 {{ todayOnLeaveCount }}명</p>
        </div>
        <NuxtLink to="/member-status">
          <AppButton variant="secondary">팀별 현황</AppButton>
        </NuxtLink>
      </div>

      <div v-if="memberTodayStatuses.length" class="member-presence-list">
        <article v-for="member in paginatedMemberStatuses" :key="member.uid" class="member-presence-item">
          <div>
            <strong>{{ member.displayName }}</strong>
            <span>{{ member.team || '팀 없음' }}</span>
          </div>
          <span class="status-badge" :class="member.onLeave ? 'status-badge--pending' : 'status-badge--approved'">
            {{ member.onLeave ? `${member.leaveLabel} 중` : '근무 중' }}
          </span>
        </article>
      </div>
      <p v-else class="empty-state">조회할 회원 현황이 없습니다.</p>
      <AppPagination v-model:page="memberPage" :total="memberTodayStatuses.length" :page-size="pageSize" />
    </section>

    <section class="content-panel">
      <div class="panel-header">
        <h2>최근 사용 내역</h2>
        <NuxtLink to="/leave-history">
          <AppButton variant="secondary">전체 보기</AppButton>
        </NuxtLink>
      </div>

      <LeaveRecordList
        :records="recentRecords"
        empty-text="아직 등록한 연차 사용 내역이 없습니다."
      />
    </section>
  </section>
</template>