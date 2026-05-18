import { readonly, ref } from 'vue';

export const useModal = () => {
  // Modal visibility state
  const isOpen = ref(false)

  // Open modal
  const openModal = () => {
    isOpen.value = true
  }

  // Close modal
  const closeModal = () => {
    isOpen.value = false
  }

  // Toggle modal
  const toggleModal = () => {
    isOpen.value = !isOpen.value
  }

  return {
    isOpen: readonly(isOpen),
    openModal,
    closeModal,
    toggleModal
  }
}
