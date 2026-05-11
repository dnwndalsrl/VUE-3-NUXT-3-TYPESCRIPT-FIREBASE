export const useLoading = (initialMessage = '') => {
  const isLoading = ref(false)
  const loadingMessage = ref(initialMessage)

  const startLoading = (message = initialMessage) => {
    loadingMessage.value = message
    isLoading.value = true
  }

  const stopLoading = () => {
    isLoading.value = false
    loadingMessage.value = initialMessage
  }

  return {
    isLoading,
    loadingMessage,
    startLoading,
    stopLoading
  }
}
