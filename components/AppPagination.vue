<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    page: number
    total: number
    pageSize?: number
  }>(),
  {
    pageSize: 5
  }
)

const emit = defineEmits<{
  'update:page': [page: number]
}>()

const totalPages = computed(() => Math.max(Math.ceil(props.total / props.pageSize), 1))
const start = computed(() => props.total === 0 ? 0 : (props.page - 1) * props.pageSize + 1)
const end = computed(() => Math.min(props.page * props.pageSize, props.total))

watch(totalPages, (value) => {
  if (props.page > value) {
    emit('update:page', value)
  }
})

const go = (page: number) => {
  emit('update:page', Math.min(Math.max(page, 1), totalPages.value))
}
</script>

<template>
  <div v-if="total > pageSize" class="pagination-bar">
    <span>{{ start }}-{{ end }} / {{ total }}</span>
    <div class="pagination-actions">
      <AppButton variant="ghost" :disabled="page <= 1" @click="go(page - 1)">이전</AppButton>
      <strong>{{ page }} / {{ totalPages }}</strong>
      <AppButton variant="ghost" :disabled="page >= totalPages" @click="go(page + 1)">다음</AppButton>
    </div>
  </div>
</template>