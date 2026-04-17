<template>
  <div class="flex items-center space-x-3 p-4 border-b border-gray-100">
    <!-- Agent Avatar -->
    <PawIcon 
      size="md"
      :show-online-status="true"
      :is-online="true"
    />
    
    <!-- Agent Info -->
    <div class="flex-1">
      <div class="flex items-center space-x-2">
        <h3 class="text-sm font-semibold text-gray-900">Агент Purrsurance</h3>
        <span class="text-xs text-green-600 font-medium">Онлайн</span>
      </div>
      <p class="text-xs text-gray-500">Дружній помічник, готовий до HIPAA</p>
    </div>
    
    <!-- Info Text (Desktop only) -->
    <div class="hidden lg:block text-xs text-gray-500 max-w-xs">
      Допоможу зі страхуванням улюбленця. Питайте що завгодно!
    </div>
  </div>
</template>

<script setup lang="ts">
import PawIcon from '@/components/icons/PawIcon.vue'
</script>
