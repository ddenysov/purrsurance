<template>
  <header class="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Logo and Title -->
        <div class="flex items-center space-x-3">
          <!-- Paw Logo -->
          <div class="flex-shrink-0">
            <PawIcon 
              size="lg"
              :shadow="true"
            />
          </div>
          
          <!-- Title and Subtitle -->
          <div>
            <h1 class="text-xl font-bold text-gray-900">Purrsurance</h1>
            <p class="text-sm text-gray-500">AI Insurance Assistant</p>
          </div>
        </div>

        <!-- Badges (Desktop only) -->
        <div class="hidden md:flex items-center space-x-3">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-mint-100 text-mint-800">
            Clean UI
          </span>
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Light Theme
          </span>
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-100 text-brand-800">
            Pet Friendly
          </span>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import PawIcon from '@/components/icons/PawIcon.vue'
</script>
