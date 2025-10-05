<template>
  <div class="flex items-start space-x-3 max-w-xs lg:max-w-md mr-auto">
    <!-- Avatar -->
    <div class="flex-shrink-0">
      <div class="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center">
        <svg class="w-4 h-4 text-brand-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C8.5 2 6 4.5 6 8c0 1.5.5 2.8 1.3 3.8L12 22l4.7-10.2C17.5 10.8 18 9.5 18 8c0-3.5-2.5-6-6-6zm0 8c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
        </svg>
      </div>
    </div>
    
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
// No props or logic needed for this component
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
