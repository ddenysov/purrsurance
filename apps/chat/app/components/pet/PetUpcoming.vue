<template>
  <div class="space-y-3">
    <h3 class="text-sm font-medium text-gray-900">Upcoming Appointments</h3>
    
    <div class="space-y-2">
      <div
        v-for="appointment in appointments"
        :key="appointment.id"
        class="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
      >
        <!-- Calendar Icon -->
        <div class="flex-shrink-0 w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center">
          <svg class="w-4 h-4 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        
        <!-- Appointment Details -->
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium text-gray-900">{{ appointment.title }}</div>
          <div class="text-xs text-gray-500">{{ appointment.location }}</div>
          <div class="text-xs text-gray-500">{{ appointment.date }} at {{ appointment.time }}</div>
        </div>
        
        <!-- Reschedule Button -->
        <button class="flex-shrink-0 text-xs text-brand-600 hover:text-brand-700 font-medium">
          Reschedule
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Appointment } from '~/types'

interface Props {
  appointments: Appointment[]
}

defineProps<Props>()
</script>
