<template>
  <div class="relative">
    <!-- Pet Image -->
    <div class="w-20 h-20 rounded-full overflow-hidden bg-gray-100">
      <img 
        :src="avatar" 
        :alt="`Фото ${name}`"
        class="w-full h-full object-cover"
      />
    </div>
    
    <!-- Edit Button -->
    <button
      @click="$emit('edit')"
      class="absolute -bottom-1 -right-1 w-6 h-6 bg-brand-500 text-white rounded-full flex items-center justify-center hover:bg-brand-600 transition-colors shadow-sm"
      aria-label="Редагувати профіль улюбленця"
    >
      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  avatar: string
  name: string
}

defineProps<Props>()

defineEmits<{
  edit: []
}>()
</script>
