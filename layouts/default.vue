<script setup lang="ts">
const authStore = useAuthStore()

const navItems = [
  { label: '대시보드', to: '/dashboard' },
  { label: '연차 등록', to: '/leave-record' },
  { label: '사용 내역', to: '/leave-history' },
  { label: '설정', to: '/settings' }
]
</script>

<template>
  <div class="app-shell">
    <aside v-if="authStore.isLoggedIn" class="sidebar">
      <NuxtLink to="/dashboard" class="brand">연차 체크</NuxtLink>
      <nav class="nav">
        <NuxtLink v-for="item in navItems" :key="item.to" :to="item.to" class="nav__link">
          {{ item.label }}
        </NuxtLink>
      </nav>
      <div class="sidebar__profile">
        <p>{{ authStore.user?.displayName || '사용자' }}</p>
        <span>{{ authStore.user?.email }}</span>
        <AppButton variant="ghost" block @click="authStore.logout">로그아웃</AppButton>
      </div>
    </aside>

    <main class="main">
      <slot />
    </main>
  </div>
</template>
