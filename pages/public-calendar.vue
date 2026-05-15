<template>
  <section class="page page--wide public-calendar-page">
    <header class="page-header calendar-header">
      <div>
        <p class="eyebrow">Shared Calendar</p>
        <h1>공용 연차 캘린더</h1>
      </div>
      <div class="calendar-controls">
        <AppButton variant="secondary" @click="addMonths(-1)">이전</AppButton>
        <label class="field calendar-month-field">
          <span class="field__label">월 선택</span>
          <input v-model="selectedMonth" class="field__control" type="month">
        </label>
        <AppButton variant="secondary" @click="addMonths(1)">다음</AppButton>
        <AppButton @click="goToday">오늘</AppButton>
      </div>
    </header>

    <section class="content-panel calendar-month-users-panel">
      <div class="panel-header">
        <div>
          <h2>{{ monthLabel }} 연차 사용자</h2>
          <p>승인된 연차만 표시됩니다.</p>
        </div>
        <span>{{ recordsForSelectedMonth.length }}건</span>
      </div>

      <AppLoading v-if="leaveStore.publicLoading" message="월별 연차 사용자를 불러오는 중입니다." variant="block" />
      <template v-else-if="recordsForSelectedMonth.length">
        <div class="record-list calendar-month-users-list">
          <article v-for="record in paginatedMonthlyUsers" :key="record.id" class="record-item calendar-upcoming-item">
            <div>
              <strong>{{ record.ownerName }}</strong>
              <p>{{ record.startDate ?? record.date }} ~ {{ record.endDate ?? record.startDate ?? record.date }}</p>
              <small>{{ leaveTypeLabels[record.type] }} · {{ record.reason || record.memo || '사유 없음' }}</small>
            </div>
            <span>{{ formatLeaveDays(Number(record.days ?? getLeaveDays(record.type))) }}</span>
          </article>
        </div>
        <AppPagination v-model:page="monthlyUserPage" :total="recordsForSelectedMonth.length" :page-size="pageSize" />
      </template>
      <p v-else class="empty-state">선택한 월에 공유된 연차 사용자가 없습니다.</p>
    </section>

    <section class="content-panel calendar-panel">
      <div class="panel-header">
        <h2>{{ monthLabel }}</h2>
        <AppLoading v-if="leaveStore.publicLoading" message="캘린더를 불러오는 중입니다." size="small" />
        <AppButton v-else variant="secondary" @click="refreshPublicCalendar">새로고침</AppButton>
      </div>

      <p v-if="leaveStore.publicError" class="form-error">{{ leaveStore.publicError }}</p>

      <AppLoading v-if="leaveStore.publicLoading" message="캘린더를 불러오는 중입니다." variant="block" />

      <div v-else class="calendar-weekdays">
        <span>일</span>
        <span>월</span>
        <span>화</span>
        <span>수</span>
        <span>목</span>
        <span>금</span>
        <span>토</span>
      </div>

      <div v-if="!leaveStore.publicLoading" class="calendar-grid">
        <article
          v-for="day in calendarDays"
          :key="day.key"
          class="calendar-day"
          :class="{ 'calendar-day--muted': !day.isCurrentMonth, 'calendar-day--today': day.isToday }"
        >
          <div class="calendar-day__top">
            <strong>{{ day.day }}</strong>
            <span v-if="day.records.length">{{ day.records.length }}</span>
          </div>
          <div class="calendar-events">
            <div v-for="record in day.records.slice(0, 3)" :key="`${day.key}-${record.id}`" class="calendar-event" :class="`calendar-event--${record.type}`">
              <span>{{ record.ownerName }}</span>
              <small>{{ leaveTypeLabels[record.type] }}</small>
            </div>
            <button v-if="day.records.length > 3" type="button" class="calendar-more">
              +{{ day.records.length - 3 }}건
            </button>
          </div>
        </article>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import type { PublicLeaveRecord } from '~/types/leave'

const authStore = useAuthStore()
const leaveStore = useLeaveStore()
const selectedMonth = ref(new Date().toISOString().slice(0, 7))
const monthlyUserPage = ref(1)
const pageSize = 5

watch(
  () => authStore.user?.uid,
  async (uid) => {
    if (uid) {
      await leaveStore.fetchPublicRecords()
    }
  },
  { immediate: true }
)

const monthDate = computed(() => new Date(`${selectedMonth.value}-01T00:00:00`))
const monthLabel = computed(() =>
  new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long' }).format(monthDate.value)
)

const formatDateKey = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const addMonths = (amount: number) => {
  const next = new Date(monthDate.value)
  next.setMonth(next.getMonth() + amount)
  selectedMonth.value = formatDateKey(next).slice(0, 7)
}

const goToday = () => {
  selectedMonth.value = new Date().toISOString().slice(0, 7)
}

const dateRange = (startDate: string, endDate: string) => {
  const dates: string[] = []
  const start = new Date(`${startDate}T00:00:00`)
  const end = new Date(`${endDate}T00:00:00`)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    return dates
  }

  const cursor = new Date(start)
  while (cursor <= end) {
    dates.push(formatDateKey(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }

  return dates
}

const recordsForSelectedMonth = computed(() => {
  const monthStart = `${selectedMonth.value}-01`
  const end = new Date(monthDate.value.getFullYear(), monthDate.value.getMonth() + 1, 0)
  const monthEnd = formatDateKey(end)

  return leaveStore.publicRecords
    .filter((record) => {
      const start = record.startDate ?? record.date
      const finish = record.endDate ?? record.startDate ?? record.date
      return start <= monthEnd && finish >= monthStart
    })
    .slice()
    .sort((a, b) => (a.startDate ?? a.date).localeCompare(b.startDate ?? b.date))
})

const paginatedMonthlyUsers = computed(() => {
  const start = (monthlyUserPage.value - 1) * pageSize
  return recordsForSelectedMonth.value.slice(start, start + pageSize)
})

watch(
  () => [recordsForSelectedMonth.value.length, selectedMonth.value],
  () => {
    monthlyUserPage.value = 1
  }
)

const recordsByDate = computed(() => {
  const map = new Map<string, PublicLeaveRecord[]>()

  recordsForSelectedMonth.value.forEach((record) => {
    const start = record.startDate ?? record.date
    const finish = record.endDate ?? record.startDate ?? record.date

    dateRange(start, finish).forEach((date) => {
      if (!date.startsWith(selectedMonth.value)) {
        return
      }

      const list = map.get(date) ?? []
      list.push(record)
      map.set(date, list)
    })
  })

  return map
})

const calendarDays = computed(() => {
  const first = new Date(monthDate.value.getFullYear(), monthDate.value.getMonth(), 1)
  const start = new Date(first)
  start.setDate(first.getDate() - first.getDay())

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    const key = formatDateKey(date)

    return {
      key,
      day: date.getDate(),
      isCurrentMonth: date.getMonth() === monthDate.value.getMonth(),
      isToday: key === formatDateKey(new Date()),
      records: recordsByDate.value.get(key) ?? []
    }
  })
})

const refreshPublicCalendar = async () => {
  await leaveStore.fetchPublicRecords()
}
</script>

<style lang="scss">
.public-calendar-page .calendar-header {
  align-items: end;
}

.public-calendar-page .calendar-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  justify-content: flex-end;
  gap: 10px;
}

.public-calendar-page .calendar-month-field {
  min-width: 180px;
}

.public-calendar-page .calendar-month-users-panel {
  margin-bottom: 18px;
}

.public-calendar-page .calendar-month-users-panel .panel-header p {
  margin: 4px 0 0;
  color: var(--color-muted);
  font-weight: 700;
}

.public-calendar-page .calendar-month-users-list {
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
}

.public-calendar-page .calendar-month-users-list .record-item {
  min-height: 96px;
}

.public-calendar-page .calendar-panel {
  overflow: hidden;
}

.public-calendar-page .calendar-weekdays,
.public-calendar-page .calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
}

.public-calendar-page .calendar-weekdays {
  margin-bottom: 8px;
  color: var(--color-muted);
  font-size: 13px;
  font-weight: 800;
  text-align: center;
}

.public-calendar-page .calendar-grid {
  border-top: 1px solid var(--color-line);
  border-left: 1px solid var(--color-line);
}

.public-calendar-page .calendar-day {
  display: grid;
  align-content: start;
  min-height: 132px;
  padding: 10px;
  border-right: 1px solid var(--color-line);
  border-bottom: 1px solid var(--color-line);
  background: #ffffff;
}

.public-calendar-page .calendar-day--muted {
  background: #f8fafc;
  color: #94a3b8;
}

.public-calendar-page .calendar-day--today {
  box-shadow: inset 0 0 0 2px rgba(37, 71, 147, 0.65);
}

.public-calendar-page .calendar-day__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.public-calendar-page .calendar-day__top strong {
  font-size: 15px;
}

.public-calendar-page .calendar-day__top span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  border-radius: 999px;
  background: rgba(37, 71, 147, 0.1);
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 900;
}

.public-calendar-page .calendar-events {
  display: grid;
  gap: 6px;
}

.public-calendar-page .calendar-event {
  display: grid;
  gap: 2px;
  padding: 7px 8px;
  border-left: 3px solid var(--color-primary);
  border-radius: 6px;
  background: #eef4ff;
  color: #1e3a8a;
}

.public-calendar-page .calendar-event span,
.public-calendar-page .calendar-event small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.public-calendar-page .calendar-event span {
  font-size: 12px;
  font-weight: 900;
}

.public-calendar-page .calendar-event small {
  font-size: 11px;
}

.public-calendar-page .calendar-event--morning {
  border-left-color: #0f766e;
  background: #ecfdf5;
  color: #115e59;
}

.public-calendar-page .calendar-event--afternoon {
  border-left-color: #b45309;
  background: #fff7ed;
  color: #92400e;
}

.public-calendar-page .calendar-event--reserveTraining {
  border-left-color: #64748b;
  background: #f1f5f9;
  color: #334155;
}

.public-calendar-page .calendar-more {
  min-height: 28px;
  border: 0;
  border-radius: 6px;
  background: #eef2f7;
  color: var(--color-muted);
  cursor: default;
  font-size: 12px;
  font-weight: 900;
}

.public-calendar-page .calendar-upcoming-item {
  align-items: flex-start;
}

@media (max-width: 860px) {
  .public-calendar-page .calendar-header {
    align-items: stretch;
  }

  .public-calendar-page .calendar-controls {
    justify-content: stretch;
  }

  .public-calendar-page .calendar-controls .app-button,
  .public-calendar-page .calendar-month-field {
    flex: 1 1 150px;
  }

  .public-calendar-page .calendar-grid {
    overflow: visible;
  }

  .public-calendar-page .calendar-panel {
    overflow-x: auto;
    overflow-y: visible;
  }

  .public-calendar-page .calendar-weekdays,
  .public-calendar-page .calendar-grid {
    width: 760px;
    min-width: 760px;
  }
}
</style>

