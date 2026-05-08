<script setup lang="ts">
import type { LeaveRecord, LeaveType } from '~/types/leave'

const authStore = useAuthStore()
const leaveStore = useLeaveStore()
const editingRecord = ref<LeaveRecord | null>(null)
const busy = ref(false)

const monthOptions = [
  { label: '전체 월', value: 'all' },
  ...Array.from({ length: 12 }, (_, index) => {
    const month = String(index + 1).padStart(2, '0')
    return { label: `${index + 1}월`, value: month }
  })
]

const typeOptions: Array<{ label: string; value: LeaveType | 'all' }> = [
  { label: '전체 유형', value: 'all' },
  { label: '연차', value: 'full' },
  { label: '오전 반차', value: 'morning' },
  { label: '오후 반차', value: 'afternoon' }
]

watch(
  () => authStore.user?.uid,
  async (uid) => {
    if (uid) {
      await leaveStore.load(uid)
    }
  },
  { immediate: true }
)

const startEdit = (record: LeaveRecord) => {
  editingRecord.value = { ...record }
}

const updateRecord = async (record: LeaveRecord) => {
  if (!authStore.user || !editingRecord.value?.id) {
    return
  }

  busy.value = true
  try {
    await leaveStore.updateRecord(authStore.user.uid, editingRecord.value.id, record)
    editingRecord.value = null
  } finally {
    busy.value = false
  }
}

const removeRecord = async (record: LeaveRecord) => {
  if (!authStore.user || !record.id || !confirm('이 사용 내역을 삭제할까요?')) {
    return
  }

  await leaveStore.deleteRecord(authStore.user.uid, record.id)
}
</script>

<template>
  <section class="page">
    <header class="page-header">
      <div>
        <p class="eyebrow">History</p>
        <h1>사용 내역</h1>
      </div>
      <NuxtLink to="/leave-record">
        <AppButton>연차 등록하기</AppButton>
      </NuxtLink>
    </header>

    <section class="content-panel history-filter-panel">
      <label class="field">
        <span class="field__label">연도</span>
        <select
          class="field__control"
          :value="leaveStore.historyFilters.year"
          @change="leaveStore.setHistoryFilter('year', ($event.target as HTMLSelectElement).value)"
        >
          <option value="all">전체 연도</option>
          <option v-for="year in leaveStore.availableYears" :key="year" :value="year">
            {{ year }}년
          </option>
        </select>
      </label>

      <label class="field">
        <span class="field__label">월</span>
        <select
          class="field__control"
          :value="leaveStore.historyFilters.month"
          @change="leaveStore.setHistoryFilter('month', ($event.target as HTMLSelectElement).value)"
        >
          <option v-for="month in monthOptions" :key="month.value" :value="month.value">
            {{ month.label }}
          </option>
        </select>
      </label>

      <label class="field">
        <span class="field__label">휴가 유형</span>
        <select
          class="field__control"
          :value="leaveStore.historyFilters.type"
          @change="leaveStore.setHistoryFilter('type', ($event.target as HTMLSelectElement).value as LeaveType | 'all')"
        >
          <option v-for="option in typeOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </label>

      <AppButton variant="secondary" @click="leaveStore.resetHistoryFilters">초기화</AppButton>
    </section>

    <div class="history-layout">
      <section class="content-panel">
        <div class="panel-header">
          <h2>전체 기록</h2>
          <span>{{ leaveStore.filteredRecords.length }}건</span>
        </div>

        <div v-if="leaveStore.filteredRecords.length" class="record-list">
          <article
            v-for="record in leaveStore.filteredRecords"
            :key="record.id"
            class="record-item record-item--editable"
          >
            <div>
              <strong>
                {{ record.startDate || record.date }}
                <template v-if="record.endDate && record.endDate !== (record.startDate || record.date)">
                  - {{ record.endDate }}
                </template>
              </strong>
              <p>{{ leaveTypeLabels[record.type] }} · {{ formatLeaveDays(record.days ?? getLeaveDays(record.type)) }}</p>
              <small v-if="record.memo || record.note">{{ record.memo || record.note }}</small>
            </div>
            <div class="record-actions">
              <AppButton variant="secondary" @click="startEdit(record)">수정</AppButton>
              <AppButton variant="danger" @click="removeRecord(record)">삭제</AppButton>
            </div>
          </article>
        </div>
        <p v-else class="empty-state">조건에 맞는 사용 내역이 없습니다.</p>
      </section>

      <section v-if="editingRecord" class="content-panel">
        <div class="panel-header">
          <h2>내역 수정</h2>
        </div>
        <LeaveRecordForm
          :initial-value="editingRecord"
          :busy="busy"
          submit-label="수정 저장"
          @submit="updateRecord"
          @cancel="editingRecord = null"
        />
      </section>
    </div>
  </section>
</template>
