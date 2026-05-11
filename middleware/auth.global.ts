export default defineNuxtRouteMiddleware(async (to) => {
  if (!import.meta.client) {
    return
  }

  const publicRoutes = ['/login', '/signup']
  const authStore = useAuthStore()
  authStore.initAuth()

  while (!authStore.initialized && authStore.loading) {
    await new Promise((resolve) => setTimeout(resolve, 20))
  }

  if (!authStore.isLoggedIn && !publicRoutes.includes(to.path)) {
    return navigateTo('/login')
  }

  if (authStore.isLoggedIn && publicRoutes.includes(to.path)) {
    return navigateTo('/dashboard')
  }
})
