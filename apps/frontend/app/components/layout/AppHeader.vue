<template>
  <!-- Navigation Bar -->
  <nav class="bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <div class="flex items-center">
          <h1 class="text-xl font-bold text-gray-900">🐾 Purrsurance</h1>
        </div>
        <div class="flex items-center gap-4">
          <NuxtLink
            to="/appointments"
            class="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-brand-500 text-white hover:bg-brand-600 transition-colors duration-150 shadow-sm hover:shadow-md"
          >
            📅 Записи [адмін]
          </NuxtLink>
          <NuxtLink
            to="/admin"
            class="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-mint-500 text-white hover:bg-mint-600 transition-colors duration-150 shadow-sm hover:shadow-md"
          >
            🐶 Поліси [адмін]
          </NuxtLink>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import PawIcon from '@/components/icons/PawIcon.vue'
</script>
