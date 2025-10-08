<template>
  <div class="flex gap-3 p-4">
    <!-- Assistant Avatar -->
    <AssistantAvatar class="flex-shrink-0" />
    
    <!-- Typing Bubble -->
    <div class="bg-gray-100 rounded-2xl px-4 py-3 flex items-center gap-2">
      <div class="flex gap-1">
        <span 
          v-for="dot in 3" 
          :key="dot"
          class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
          :style="{ animationDelay: `${dot * 0.15}s` }"
        />
      </div>
      <span class="text-sm text-gray-600 ml-2">
        AI is thinking...
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import AssistantAvatar from './AssistantAvatar.vue'
</script>

<style scoped>
@keyframes bounce {
  0%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-8px);
  }
}

.animate-bounce {
  animation: bounce 1.4s infinite ease-in-out;
}
</style>
