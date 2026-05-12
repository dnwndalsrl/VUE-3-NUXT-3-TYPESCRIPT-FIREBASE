<template>
  <div
    v-if="show"
    class="app-loading"
    :class="[`app-loading--${variant}`, `app-loading--${size}`]"
    role="status"
    aria-live="polite"
  >
    <span class="app-loading__spinner" aria-hidden="true" />
    <span class="app-loading__message">{{ displayMessage }}</span>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    show?: boolean
    message?: string
    variant?: 'inline' | 'block' | 'overlay'
    size?: 'small' | 'medium'
  }>(),
  {
    show: true,
    message: '불러오는 중입니다.',
    variant: 'inline',
    size: 'medium'
  }
)

const displayMessage = computed(() => props.message.trim() || '불러오는 중입니다.')
</script>

<style lang="scss">
.app-loading {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--color-primary);
  font-weight: 800;
}

.app-loading--block {
  width: 100%;
  min-height: 120px;
  padding: 24px;
  border: 1px dashed rgba(37, 71, 147, 0.28);
  border-radius: 8px;
  background: #f8fbff;
}

.app-loading--overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: rgba(245, 247, 250, 0.78);
  backdrop-filter: blur(4px);
}

.app-loading--small {
  gap: 6px;
  font-size: 13px;
}

.app-loading__spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(37, 71, 147, 0.18);
  border-top-color: var(--color-primary);
  border-radius: 999px;
  animation: loading-spin 0.75s linear infinite;
}

.app-loading--small .app-loading__spinner {
  width: 14px;
  height: 14px;
}

.app-loading__message {
  line-height: 1.4;
}

@keyframes loading-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
