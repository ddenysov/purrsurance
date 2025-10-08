<template>
  <div class="space-y-3">
    <h3 class="text-sm font-medium text-gray-900">Quick Actions</h3>
    
    <div class="grid grid-cols-2 gap-2">
      <button
        v-for="action in actions"
        :key="action.id"
        @click="$emit('action-click', action.id)"
        class="flex items-center space-x-2 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
      >
        <!-- Colored Dot -->
        <div 
          :style="{ backgroundColor: action.color }"
          class="w-3 h-3 rounded-full flex-shrink-0"
        ></div>
        
        <!-- Action Label -->
        <span class="text-sm font-medium text-gray-900">{{ action.label }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { QuickAction } from '~/types'

interface Props {
  actions: QuickAction[]
}

defineProps<Props>()

defineEmits<{
  'action-click': [actionId: string]
}>()
</script>
