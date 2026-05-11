<script setup lang="ts">
import type { LeaveRecord } from '~/types/leave'

const props = withDefaults(
  defineProps<{
    records: LeaveRecord[]
    emptyText?: string
    pageSize?: number
  }>(),
  {
    pageSize: 5
  }
)

const page = ref(1)
const paginatedRecords = computed(() => {
  const start = (page.value - 1) * props.pageSize
  return props.records.slice(start, start + props.pageSize)
})

watch(
  () => props.records.length,
  () => {
    page.value = 1
  }
)
</script>

<template>
  <div v-if="records.length" class="record-list-group">
    <div class="record-list">
      <article v-for="record in paginatedRecords" :key="record.id || `${record.date}-${record.type}`" class="record-item">
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
        <span class="status-badge" :class="`status-badge--${getLeaveApprovalStatus(record)}`">
          {{ leaveApprovalStatusLabels[getLeaveApprovalStatus(record)] }}
        </span>
      </article>
    </div>
    <AppPagination v-model:page="page" :total="records.length" :page-size="pageSize" />
  </div>
  <p v-else class="empty-state">{{ emptyText || '등록된 사용 내역이 없습니다.' }}</p>
</template>