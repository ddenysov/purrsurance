<template>
  <div class="flex items-center space-x-3 p-4 border-b border-gray-100">
    <!-- Agent Avatar -->
    <div class="relative">
      <div class="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center">
        <svg class="w-5 h-5 text-brand-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C8.5 2 6 4.5 6 8c0 1.5.5 2.8 1.3 3.8L12 22l4.7-10.2C17.5 10.8 18 9.5 18 8c0-3.5-2.5-6-6-6zm0 8c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
        </svg>
      </div>
      <!-- Online Status Indicator -->
      <div class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
    </div>
    
    <!-- Agent Info -->
    <div class="flex-1">
      <div class="flex items-center space-x-2">
        <h3 class="text-sm font-semibold text-gray-900">Purrsurance Agent</h3>
        <span class="text-xs text-green-600 font-medium">Online</span>
      </div>
      <p class="text-xs text-gray-500">Friendly & HIPAA-ready</p>
    </div>
    
    <!-- Info Text (Desktop only) -->
    <div class="hidden lg:block text-xs text-gray-500 max-w-xs">
      I'm here to help with your pet insurance needs. Ask me anything!
    </div>
  </div>
</template>

<script setup lang="ts">
// No props or logic needed for this component
</script>
