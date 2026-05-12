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
        <span class="field__label">사용 유형</span>
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

    <p v-if="errorMessage" class="form-error">{{ errorMessage }}</p>

    <div class="history-layout">
      <section class="content-panel">
        <div class="panel-header">
          <h2>전체 기록</h2>
          <span>{{ leaveStore.filteredRecords.length }}건</span>
        </div>

        <div v-if="leaveStore.filteredRecords.length" class="record-list-group">
          <div class="record-list">
            <article
              v-for="record in paginatedRecords"
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
                <span class="status-badge" :class="`status-badge--${getLeaveApprovalStatus(record)}`">
                  {{ leaveApprovalStatusLabels[getLeaveApprovalStatus(record)] }}
                </span>
                <small v-if="!canManageRecord(record)" class="approval-locked-text">
                  승인 후에는 최고관리자만 수정/삭제할 수 있습니다.
                </small>
              </div>
              <div v-if="canManageRecord(record)" class="record-actions">
                <AppButton variant="secondary" @click="startEdit(record)">수정</AppButton>
                <AppButton variant="danger" @click="removeRecord(record)">삭제</AppButton>
              </div>
            </article>
          </div>
          <AppPagination v-model:page="recordPage" :total="leaveStore.filteredRecords.length" :page-size="pageSize" />
        </div>
        <p v-else class="empty-state">조건에 맞는 사용 내역이 없습니다.</p>
      </section>

      <section v-if="editingRecord" class="content-panel">
        <div class="panel-header">
          <h2>내역 수정</h2>
        </div>
        <p v-if="!authStore.isAdmin" class="approval-edit-hint">수정한 연차는 다시 승인 대기 상태로 전환됩니다.</p>
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

<script setup lang="ts">
import type { LeaveRecord, LeaveType } from '~/types/leave'

const authStore = useAuthStore()
const leaveStore = useLeaveStore()
const editingRecord = ref<LeaveRecord | null>(null)
const busy = ref(false)
const errorMessage = ref('')
const recordPage = ref(1)
const pageSize = 5

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
  { label: '오후 반차', value: 'afternoon' },
  { label: '특별휴가', value: 'reserveTraining' }
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

const paginatedRecords = computed(() => {
  const start = (recordPage.value - 1) * pageSize
  return leaveStore.filteredRecords.slice(start, start + pageSize)
})

watch(
  () => [leaveStore.filteredRecords.length, leaveStore.historyFilters.year, leaveStore.historyFilters.month, leaveStore.historyFilters.type],
  () => {
    recordPage.value = 1
  }
)

const canManageRecord = (record: LeaveRecord) => authStore.isAdmin || getLeaveApprovalStatus(record) === 'pending'

const startEdit = (record: LeaveRecord) => {
  if (!canManageRecord(record)) {
    errorMessage.value = '승인된 연차는 최고관리자만 수정할 수 있습니다.'
    return
  }

  errorMessage.value = ''
  editingRecord.value = { ...record }
}

const updateRecord = async (record: LeaveRecord) => {
  if (!authStore.user || !editingRecord.value?.id) {
    return
  }

  busy.value = true
  errorMessage.value = ''
  try {
    await leaveStore.updateRecord(authStore.user.uid, editingRecord.value.id, record)
    editingRecord.value = null
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '사용 내역을 수정하지 못했습니다.'
  } finally {
    busy.value = false
  }
}

const removeRecord = async (record: LeaveRecord) => {
  if (!authStore.user || !record.id) {
    return
  }

  if (!canManageRecord(record)) {
    errorMessage.value = '승인된 연차는 최고관리자만 삭제할 수 있습니다.'
    return
  }

  if (!confirm('이 사용 내역을 삭제할까요?')) {
    return
  }

  errorMessage.value = ''
  try {
    await leaveStore.deleteRecord(authStore.user.uid, record.id)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '사용 내역을 삭제하지 못했습니다.'
  }
}
</script>

<style lang="scss">
.history-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
  gap: 18px;
  align-items: start;
}

.history-filter-panel {
  display: grid;
  grid-template-columns: repeat(3, minmax(160px, 1fr)) auto;
  gap: 12px;
  align-items: end;
  margin-bottom: 18px;
}

.approval-locked-text {
  display: block;
  margin-top: 8px;
  color: var(--color-muted);
  font-size: 13px;
  font-weight: 700;
}

@media (max-width: 860px) {
  .history-layout,
  .history-filter-panel {
    grid-template-columns: 1fr;
  }
}
</style>

