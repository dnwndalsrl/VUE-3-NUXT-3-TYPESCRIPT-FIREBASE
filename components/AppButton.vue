<script setup lang="ts">
withDefaults(
  defineProps<{
    type?: 'button' | 'submit'
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
    block?: boolean
    disabled?: boolean
  }>(),
  {
    type: 'button',
    variant: 'primary',
    block: false,
    disabled: false
  }
)
</script>

<template>
  <button :type="type" class="app-button" :class="[`app-button--${variant}`, { 'app-button--block': block }]" :disabled="disabled">
    <slot />
  </button>
</template>
