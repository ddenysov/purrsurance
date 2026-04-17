<template>
  <div class="space-y-3">
    <h3 class="text-sm font-medium text-gray-900">Щеплення</h3>
    
    <div class="flex flex-wrap gap-2">
      <span
        v-for="vaccination in vaccinations"
        :key="vaccination.id"
        :class="getVaccinationClasses(vaccination.status)"
        class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
      >
        {{ vaccination.name }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Vaccination } from '~/types'

interface Props {
  vaccinations: Vaccination[]
}

defineProps<Props>()

const getVaccinationClasses = (status: Vaccination['status']) => {
  switch (status) {
    case 'completed':
      return 'bg-mint-100 text-mint-800'
    case 'due':
      return 'bg-yellow-100 text-yellow-800 line-through'
    case 'overdue':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}
</script>
