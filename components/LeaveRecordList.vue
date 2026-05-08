<script setup lang="ts">
import type { LeaveRecord } from '~/types/leave'

defineProps<{
  records: LeaveRecord[]
  emptyText?: string
}>()
</script>

<template>
  <div v-if="records.length" class="record-list">
    <article v-for="record in records" :key="record.id || `${record.date}-${record.type}`" class="record-item">
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
      <span>{{ formatLeaveDays(record.days ?? getLeaveDays(record.type)) }}</span>
    </article>
  </div>
  <p v-else class="empty-state">{{ emptyText || '등록된 사용 내역이 없습니다.' }}</p>
</template>
