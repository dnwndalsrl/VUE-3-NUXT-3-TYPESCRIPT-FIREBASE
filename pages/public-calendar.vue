<template>
  <section class="page page--wide">
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

      <template v-if="recordsForSelectedMonth.length">
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
        <span v-if="leaveStore.publicLoading">불러오는 중</span>
        <AppButton v-else variant="secondary" @click="refreshPublicCalendar">새로고침</AppButton>
      </div>

      <p v-if="leaveStore.publicError" class="form-error">{{ leaveStore.publicError }}</p>

      <div class="calendar-weekdays">
        <span>일</span>
        <span>월</span>
        <span>화</span>
        <span>수</span>
        <span>목</span>
        <span>금</span>
        <span>토</span>
      </div>

      <div class="calendar-grid">
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

<style scoped lang="scss">
</style>

