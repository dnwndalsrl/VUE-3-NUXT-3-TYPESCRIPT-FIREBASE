<template>
  <label class="field">
    <span class="field__label">{{ label }}</span>
    <input
      class="field__control"
      :type="type || 'text'"
      :value="modelValue"
      :placeholder="placeholder"
      :min="min"
      :step="step"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    >
  </label>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  modelValue: string | number | undefined
  type?: string
  placeholder?: string
  min?: number
  step?: number
}>()

defineEmits<{
  'update:modelValue': [value: string | number]
}>()
</script>

<style scoped lang="scss">
</style>

