<script setup lang="ts">
import type { LeaveRecord, LeaveType } from '~/types/leave'

const props = defineProps<{
  initialValue?: LeaveRecord
  submitLabel?: string
  busy?: boolean
}>()

const emit = defineEmits<{
  submit: [record: LeaveRecord]
  cancel: []
}>()

const form = reactive({
  type: (props.initialValue?.type ?? 'full') as LeaveType,
  startDate: props.initialValue?.startDate ?? props.initialValue?.date ?? '',
  endDate: props.initialValue?.endDate ?? props.initialValue?.startDate ?? props.initialValue?.date ?? '',
  memo: props.initialValue?.memo ?? props.initialValue?.note ?? ''
})

const typeOptions: Array<{ label: string; value: LeaveType }> = [
  { label: '연차', value: 'full' },
  { label: '오전 반차', value: 'morning' },
  { label: '오후 반차', value: 'afternoon' }
]

const isHalfDay = computed(() => form.type === 'morning' || form.type === 'afternoon')

const usedDays = computed(() => {
  if (isHalfDay.value) {
    return 0.5
  }

  return calculateLeaveRecordDays(form.startDate, form.endDate)
})

const canSubmit = computed(() => Boolean(form.startDate) && usedDays.value > 0 && !props.busy)

watch(
  () => props.initialValue,
  (value) => {
    form.type = value?.type ?? 'full'
    form.startDate = value?.startDate ?? value?.date ?? ''
    form.endDate = value?.endDate ?? value?.startDate ?? value?.date ?? ''
    form.memo = value?.memo ?? value?.note ?? ''
  }
)

watch(
  () => form.type,
  () => {
    if (isHalfDay.value) {
      form.endDate = form.startDate
    }
  }
)

watch(
  () => form.startDate,
  (value) => {
    if (isHalfDay.value) {
      form.endDate = value
    }
  }
)

const handleSubmit = () => {
  if (!canSubmit.value) {
    return
  }

  const endDate = isHalfDay.value ? form.startDate : form.endDate

  emit('submit', {
    date: form.startDate,
    startDate: form.startDate,
    endDate,
    type: form.type,
    days: usedDays.value,
    memo: form.memo,
    note: form.memo
  })
}
</script>

<template>
  <form class="form-card" @submit.prevent="handleSubmit">
    <div class="field">
      <span class="field__label">휴가 유형</span>
      <div class="segmented">
        <button
          v-for="option in typeOptions"
          :key="option.value"
          type="button"
          :class="{ active: form.type === option.value }"
          @click="form.type = option.value"
        >
          {{ option.label }}
        </button>
      </div>
    </div>

    <AppDatePicker v-model="form.startDate" label="시작일" />
    <AppDatePicker v-model="form.endDate" label="종료일" :disabled="isHalfDay" />

    <div class="readonly-field">
      <span>사용 일수</span>
      <strong>{{ formatLeaveDays(usedDays) }}</strong>
    </div>

    <label class="field">
      <span class="field__label">메모</span>
      <textarea
        v-model="form.memo"
        class="field__control field__control--textarea"
        placeholder="연차 사용 목적이나 참고할 내용을 적어두세요"
      />
    </label>

    <div class="form-actions">
      <AppButton v-if="initialValue" variant="secondary" @click="$emit('cancel')">취소</AppButton>
      <AppButton type="submit" :disabled="!canSubmit">{{ submitLabel || '저장' }}</AppButton>
    </div>
  </form>
</template>
