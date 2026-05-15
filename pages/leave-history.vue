<template>
  <section class="page leave-history-page">
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

      <aside class="history-side-stack">
        <section class="content-panel history-insight-panel">
          <div class="panel-header">
            <div>
              <h2>기록 요약</h2>
              <p>현재 필터 기준</p>
            </div>
            <span>{{ historyInsight.totalCount }}건</span>
          </div>

          <div class="history-insight-main">
            <span>승인 반영 일수</span>
            <strong>{{ formatLeaveDays(historyInsight.approvedDays) }}</strong>
            <p>승인된 기록만 잔여 연차와 캘린더에 반영됩니다.</p>
          </div>

          <div class="history-insight-grid">
            <article>
              <span>승인 대기</span>
              <strong>{{ historyInsight.pendingCount }}건</strong>
            </article>
            <article>
              <span>비승인</span>
              <strong>{{ historyInsight.rejectedCount }}건</strong>
            </article>
            <article>
              <span>특별휴가</span>
              <strong>{{ historyInsight.specialCount }}건</strong>
            </article>
          </div>

          <div class="history-guidance">
            <strong>{{ guidanceTitle }}</strong>
            <p>{{ guidanceDescription }}</p>
          </div>
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
      </aside>
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
const historyInsight = computed(() => {
  const records = leaveStore.filteredRecords

  return records.reduce(
    (summary, record) => {
      const status = getLeaveApprovalStatus(record)

      if (status === 'approved') {
        summary.approvedDays += record.days ?? getLeaveDays(record.type)
      }

      if (status === 'pending') {
        summary.pendingCount += 1
      }

      if (status === 'rejected') {
        summary.rejectedCount += 1
      }

      if (record.type === 'reserveTraining') {
        summary.specialCount += 1
      }

      summary.totalCount += 1

      return summary
    },
    {
      totalCount: 0,
      approvedDays: 0,
      pendingCount: 0,
      rejectedCount: 0,
      specialCount: 0
    }
  )
})
const guidanceTitle = computed(() => {
  if (!historyInsight.value.totalCount) {
    return '조회된 기록이 없습니다.'
  }

  if (historyInsight.value.pendingCount) {
    return '승인 대기 기록을 확인해 주세요.'
  }

  if (historyInsight.value.rejectedCount) {
    return '비승인 기록은 필요 시 다시 등록할 수 있습니다.'
  }

  return '현재 필터의 기록이 모두 정리되어 있습니다.'
})
const guidanceDescription = computed(() => {
  if (!historyInsight.value.totalCount) {
    return '연도, 월, 사용 유형 필터를 조정하거나 새 연차를 등록해 주세요.'
  }

  if (historyInsight.value.pendingCount) {
    return '승인 전 기록은 잔여 연차와 공용 캘린더에 반영되지 않습니다.'
  }

  if (historyInsight.value.rejectedCount) {
    return '비승인된 기록은 관리자 검토 결과를 확인한 뒤 다시 신청하는 흐름이 좋습니다.'
  }

  return '승인된 사용 일수만 실제 사용 연차로 계산되고 있습니다.'
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
  } catch (error: unknown) {
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
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : '사용 내역을 삭제하지 못했습니다.'
  }
}
</script>

<style lang="scss">
.leave-history-page .history-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
  gap: 18px;
  align-items: start;
}

.leave-history-page .history-filter-panel {
  display: grid;
  grid-template-columns: repeat(3, minmax(160px, 1fr)) auto;
  gap: 12px;
  align-items: end;
  margin-bottom: 18px;
}

.leave-history-page .approval-locked-text {
  display: block;
  margin-top: 8px;
  color: var(--color-muted);
  font-size: 13px;
  font-weight: 700;
}

.leave-history-page .history-side-stack {
  display: grid;
  gap: 18px;
}

.leave-history-page .history-insight-panel .panel-header p {
  margin: 4px 0 0;
  color: var(--color-muted);
  font-weight: 700;
}

.leave-history-page .history-insight-main {
  display: grid;
  gap: 8px;
  padding: 20px;
  border: 1px solid rgba(37, 71, 147, 0.22);
  border-radius: 8px;
  background: linear-gradient(135deg, #ffffff 0%, #edf3ff 100%);
}

.leave-history-page .history-insight-main span,
.leave-history-page .history-insight-grid span {
  color: var(--color-muted);
  font-size: 13px;
  font-weight: 800;
}

.leave-history-page .history-insight-main strong {
  color: var(--color-primary);
  font-size: 42px;
  line-height: 1;
}

.leave-history-page .history-insight-main p {
  margin: 0;
  color: #344054;
  font-weight: 700;
  line-height: 1.5;
}

.leave-history-page .history-insight-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 12px;
}

.leave-history-page .history-insight-grid article {
  display: grid;
  gap: 8px;
  min-height: 92px;
  padding: 16px;
  border: 1px solid var(--color-line);
  border-radius: 8px;
  background: #ffffff;
}

.leave-history-page .history-insight-grid strong {
  color: var(--color-text);
  font-size: 22px;
  line-height: 1;
}

.leave-history-page .history-guidance {
  display: grid;
  gap: 6px;
  margin-top: 12px;
  padding: 16px;
  border-radius: 8px;
  background: #f8fafc;
}

.leave-history-page .history-guidance p {
  margin: 0;
  color: var(--color-muted);
  font-weight: 700;
  line-height: 1.5;
}

@media (max-width: 860px) {
  .leave-history-page .history-layout,
  .leave-history-page .history-filter-panel {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 520px) {
  .leave-history-page .history-insight-grid {
    grid-template-columns: 1fr;
  }
}
</style>

