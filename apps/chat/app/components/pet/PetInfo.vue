<template>
  <div class="space-y-2">
    <!-- Name and Species -->
    <div class="flex items-center space-x-2">
      <h2 class="text-lg font-semibold text-gray-900">{{ name }}</h2>
      <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-mint-100 text-mint-800">
        {{ species }}
      </span>
    </div>
    
    <!-- Age and Gender -->
    <div class="flex items-center space-x-4 text-sm text-gray-500">
      <span>{{ age }}</span>
      <span>•</span>
      <span>{{ gender }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  name: string
  species: string
  age: string
  gender: string
}

defineProps<Props>()
</script>
