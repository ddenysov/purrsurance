<template>
  <header class="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Logo and Title -->
        <div class="flex items-center space-x-3">
          <!-- Paw Logo -->
          <div class="flex-shrink-0">
            <svg class="w-8 h-8 text-brand-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.5 2 6 4.5 6 8c0 1.5.5 2.8 1.3 3.8L12 22l4.7-10.2C17.5 10.8 18 9.5 18 8c0-3.5-2.5-6-6-6zm0 8c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
            </svg>
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
// No props or logic needed for this component
</script>
