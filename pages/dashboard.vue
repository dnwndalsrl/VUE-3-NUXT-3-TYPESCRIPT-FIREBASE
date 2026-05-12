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

<style lang="scss">
.dashboard-members-panel {
  margin-bottom: 24px;
}

.dashboard-members-panel .panel-header p {
  margin: 4px 0 0;
  color: var(--color-muted);
  font-weight: 700;
}

.member-presence-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px;
}

.member-presence-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 72px;
  padding: 14px;
  border: 1px solid var(--color-line);
  border-radius: 8px;
  background: #ffffff;
}

.member-presence-item strong,
.member-presence-item span {
  display: block;
}

.member-presence-item div > span {
  margin-top: 4px;
  color: var(--color-muted);
  font-size: 13px;
  font-weight: 700;
}

.dashboard-balance-layout {
  display: grid;
  grid-template-columns: minmax(320px, 1.25fr) minmax(320px, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.leave-balance-panel,
.leave-metric-item {
  background: var(--color-panel);
  border: 1px solid var(--color-line);
  border-radius: 8px;
  box-shadow: var(--shadow-panel);
}

.leave-balance-panel {
  display: grid;
  align-content: space-between;
  min-height: 244px;
  padding: 28px;
  border-color: rgba(37, 71, 147, 0.28);
  background: linear-gradient(135deg, #ffffff 0%, #edf3ff 100%);
}

.leave-balance-panel span,
.leave-metric-item span {
  color: var(--color-muted);
  font-weight: 800;
}

.leave-balance-panel strong {
  display: block;
  margin-top: 12px;
  color: var(--color-primary);
  font-size: clamp(58px, 8vw, 92px);
  line-height: 0.95;
}

.leave-balance-panel p {
  margin: 14px 0 0;
  color: #344054;
  font-weight: 800;
}

.leave-progress {
  overflow: hidden;
  height: 12px;
  margin-top: 28px;
  border-radius: 999px;
  background: rgba(37, 71, 147, 0.12);
}

.leave-progress span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--color-primary);
}

.leave-metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.leave-metric-item {
  display: grid;
  align-content: center;
  min-height: 114px;
  padding: 20px;
}

.leave-metric-item strong {
  display: block;
  margin-top: 10px;
  color: var(--color-text);
  font-size: 30px;
  line-height: 1;
}

.leave-metric-item--attention {
  background: #fff7ed;
  border-color: rgba(180, 83, 9, 0.24);
}

.leave-metric-item--attention strong {
  color: #9a3412;
}

.panel-header :deep(.app-button) {
  min-height: 38px;
}

@media (max-width: 980px) {
  .dashboard-balance-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .member-presence-item {
    align-items: flex-start;
    flex-direction: column;
  }

  .leave-metrics-grid {
    grid-template-columns: 1fr;
  }

  .leave-balance-panel {
    min-height: 220px;
    padding: 24px;
  }
}
</style>

