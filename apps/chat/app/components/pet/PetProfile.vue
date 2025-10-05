<template>
  <div class="bg-white rounded-xl shadow-soft p-6 space-y-6">
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
  </div>
</template>

<script setup lang="ts">
import type { Pet, Vaccination, Appointment, QuickAction } from '~/types'

interface Props {
  pet: Pet
  vaccinations: Vaccination[]
  appointments: Appointment[]
  quickActions: QuickAction[]
}

defineProps<Props>()

defineEmits<{
  'edit-profile': []
  'action-click': [actionId: string]
}>()
</script>
