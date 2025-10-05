<template>
  <div class="flex items-start space-x-3 max-w-xs lg:max-w-md mr-auto">
    <!-- Avatar -->
    <AssistantAvatar size="sm" />
    
    <!-- Typing Animation -->
    <div class="flex-1">
      <div class="bg-gray-100 px-4 py-3 rounded-2xl">
        <div class="flex items-center space-x-1">
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AssistantAvatar from './AssistantAvatar.vue'
</script>

<style scoped>
.typing-dot {
  @apply w-2 h-2 bg-gray-400 rounded-full;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-dot:nth-child(1) {
  animation-delay: -0.32s;
}

.typing-dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes typing {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
