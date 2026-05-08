<script setup lang="ts">
defineProps<{
  label: string
  value: string
  tone?: 'primary' | 'muted'
  large?: boolean
}>()
</script>

<template>
  <article class="summary-card" :class="[{ 'summary-card--large': large }, tone && `summary-card--${tone}`]">
    <span>{{ label }}</span>
    <strong>{{ value }}</strong>
  </article>
</template>
