<template>
  <div class="bg-white rounded-xl shadow-soft p-6 space-y-6">
    <!-- LOCKED STATE: Show when policy not verified -->
    <div v-if="!isPolicyVerified" class="text-center py-12 space-y-4">
      <div class="w-20 h-20 mx-auto bg-slate-100 rounded-full flex items-center justify-center">
        <!-- Lock icon SVG -->
        <svg class="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <div>
        <h3 class="text-lg font-semibold text-slate-700">Pet Details Locked</h3>
        <p class="text-sm text-slate-500 mt-2 max-w-xs mx-auto">
          To view your pet's profile and insurance details, please share your policy ID in the chat.
        </p>
        <p class="text-xs text-mint-600 mt-3 font-medium">
          Example: "My policy ID is PS-2578412"
        </p>
      </div>
    </div>

    <!-- UNLOCKED STATE: Show when policy is verified -->
    <template v-else>
      <!-- Pet Avatar and Info -->
      <div class="flex items-start space-x-4">
        <PetAvatar 
          :avatar="pet.avatar" 
          :name="pet.name"
          @edit="$emit('edit-profile')"
        />
        <PetInfo 
          :name="pet.name"
          :species="pet.species"
          :age="pet.age"
          :gender="pet.gender"
        />
      </div>
      
      <!-- Policy Cards -->
      <PetPolicyCards 
        :policy-id="pet.policyId"
        :coverage-plan="pet.coveragePlan"
      />
      
      <!-- Vaccinations -->
      <PetVaccinations :vaccinations="vaccinations" />
      
      <!-- Upcoming Appointments -->
      <PetUpcoming :appointments="appointments" />
      
      <!-- Quick Actions -->
      <PetQuickActions 
        :actions="quickActions"
        @action-click="$emit('action-click', $event)"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Pet, Vaccination, Appointment, QuickAction } from '~/types'

interface Props {
  pet: Pet
  vaccinations: Vaccination[]
  appointments: Appointment[]
  quickActions: QuickAction[]
  isPolicyVerified: boolean
}

defineProps<Props>()

defineEmits<{
  'edit-profile': []
  'action-click': [actionId: string]
}>()
</script>
