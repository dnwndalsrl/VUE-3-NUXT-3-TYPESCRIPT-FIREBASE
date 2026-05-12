<template>
  <label class="field">
    <span class="field__label">{{ label }}</span>
    <input
      class="field__control"
      type="date"
      :value="modelValue"
      :disabled="disabled"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    >
  </label>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  modelValue: string
  disabled?: boolean
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<style lang="scss">
</style>

