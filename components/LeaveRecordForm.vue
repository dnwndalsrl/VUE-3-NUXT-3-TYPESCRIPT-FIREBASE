<template>
  <form class="form-card" novalidate @submit.prevent="handleSubmit">
    <div class="field">
      <span class="field__label">사용 유형</span>
      <div class="segmented segmented--leave-types">
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
      <span>{{ isNonDeductible ? '연차 차감' : '사용 일수' }}</span>
      <strong>{{ isNonDeductible ? '차감 없음' : formatLeaveDays(usedDays) }}</strong>
    </div>

    <label class="field">
      <span class="field__label">{{ isNonDeductible ? '사유' : '메모' }}</span>
      <textarea
        v-model="form.memo"
        class="field__control field__control--textarea"
        :required="isNonDeductible"
        :aria-invalid="showMemoError"
        :placeholder="isNonDeductible ? '특별휴가 사유를 입력해주세요' : '연차 사용 목적이나 참고할 내용을 적어주세요'"
      />
      <span v-if="showMemoError" class="field__error">특별휴가 등록 시 사유를 입력해주세요.</span>
    </label>

    <div class="form-actions">
      <AppButton v-if="initialValue" variant="secondary" @click="$emit('cancel')">취소</AppButton>
      <AppButton type="submit" :disabled="!canSubmit">{{ submitLabel || '저장' }}</AppButton>
    </div>
  </form>
</template>

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
const submitAttempted = ref(false)

const typeOptions: Array<{ label: string; value: LeaveType }> = [
  { label: '연차', value: 'full' },
  { label: '오전 반차', value: 'morning' },
  { label: '오후 반차', value: 'afternoon' },
  { label: '특별휴가', value: 'reserveTraining' }
]

const isHalfDay = computed(() => form.type === 'morning' || form.type === 'afternoon')
const isNonDeductible = computed(() => form.type === 'reserveTraining')
const hasRequiredMemo = computed(() => !isNonDeductible.value || form.memo.trim().length > 0)
const showMemoError = computed(() => submitAttempted.value && !hasRequiredMemo.value)

const usedDays = computed(() => {
  if (isNonDeductible.value) {
    return 0
  }

  if (isHalfDay.value) {
    return 0.5
  }

  return calculateLeaveRecordDays(form.startDate, form.endDate)
})

const canSubmit = computed(() => {
  const hasValidDate = Boolean(form.startDate) && Boolean(form.endDate)
  return hasValidDate && (usedDays.value > 0 || isNonDeductible.value) && !props.busy
})

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
  submitAttempted.value = true

  if (!canSubmit.value || !hasRequiredMemo.value) {
    return
  }

  const endDate = isHalfDay.value ? form.startDate : form.endDate

  emit('submit', {
    date: form.startDate,
    startDate: form.startDate,
    endDate,
    type: form.type,
    days: usedDays.value,
    memo: form.memo.trim(),
    note: form.memo.trim()
  })
}
</script>

<style lang="scss">
</style>

