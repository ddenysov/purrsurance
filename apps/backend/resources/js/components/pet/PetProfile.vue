<template>
  <div class="bg-white rounded-xl shadow-soft p-6 space-y-6">
    <!-- LOCKED STATE: Show when policy not verified and no policy loaded in profile -->
    <div v-if="!isPolicyVerified" class="text-center py-12 space-y-4">
      <div class="w-20 h-20 mx-auto bg-slate-100 rounded-full flex items-center justify-center">
        <!-- Lock icon SVG -->
        <svg class="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <div>
        <h3 class="text-lg font-semibold text-slate-700">Дані улюбленця заблоковано</h3>
        <p class="text-sm text-slate-500 mt-2 max-w-xs mx-auto">
          Щоб переглянути профіль і страхові дані, вкажіть номер полісу в чаті.
        </p>
        <p class="text-xs text-mint-600 mt-3 font-medium">
          Наприклад: «Мій номер полісу POL-2025-123456»
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
      
      <!-- Owner Information (from petProfileStore) -->
      <div v-if="petProfileStore.petProfile.owner.fullName" class="space-y-3">
        <h3 class="text-sm font-medium text-gray-900">Дані власника</h3>
        <div class="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
          <div>
            <span class="text-gray-500">Ім’я:</span>
            <span class="ml-2 font-medium text-gray-900">{{ petProfileStore.petProfile.owner.fullName }}</span>
          </div>
          <div v-if="petProfileStore.petProfile.owner.email">
            <span class="text-gray-500">Email:</span>
            <span class="ml-2 text-gray-900">{{ petProfileStore.petProfile.owner.email }}</span>
          </div>
          <div v-if="petProfileStore.petProfile.owner.phone">
            <span class="text-gray-500">Телефон:</span>
            <span class="ml-2 text-gray-900">{{ petProfileStore.petProfile.owner.phone }}</span>
          </div>
        </div>
      </div>
      
      <!-- Medical Conditions -->
      <div v-if="petProfileStore.petProfile.medical.conditions.length > 0" class="space-y-3">
        <h3 class="text-sm font-medium text-gray-900">Медичні стани</h3>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="(condition, index) in petProfileStore.petProfile.medical.conditions"
            :key="index"
            :class="getMedicalConditionClasses(condition.status)"
            class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
          >
            {{ condition.name }}
          </span>
        </div>
      </div>
      
      <!-- Current Medications -->
      <div v-if="petProfileStore.petProfile.medical.medications.length > 0" class="space-y-3">
        <h3 class="text-sm font-medium text-gray-900">Поточні препарати</h3>
        <div class="bg-gray-50 rounded-lg p-3 space-y-2">
          <div 
            v-for="(medication, index) in petProfileStore.petProfile.medical.medications" 
            :key="index"
            class="text-sm"
          >
            <div class="font-medium text-gray-900">{{ medication.name }}</div>
            <div class="text-gray-500 text-xs">
              {{ medication.dosage }} - {{ medication.frequency }}
            </div>
          </div>
        </div>
      </div>
      
      <!-- Vaccinations -->
      <PetVaccinations :vaccinations="vaccinations" />
      
      <!-- Policy Status -->
      <div v-if="petProfileStore.petProfile.policy.status !== 'inactive'" class="space-y-3">
        <h3 class="text-sm font-medium text-gray-900">Статус полісу</h3>
        <div class="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
          <div class="flex items-center justify-between">
            <span class="text-gray-500">Статус:</span>
            <span 
              :class="getPolicyStatusClasses(petProfileStore.petProfile.policy.status)"
              class="px-2 py-1 rounded-full text-xs font-medium"
            >
              {{ policyStatusLabel(petProfileStore.petProfile.policy.status) }}
            </span>
          </div>
          <div v-if="petProfileStore.petProfile.policy.startDate" class="flex items-center justify-between">
            <span class="text-gray-500">Початок:</span>
            <span class="text-gray-900">{{ formatDate(petProfileStore.petProfile.policy.startDate) }}</span>
          </div>
          <div v-if="petProfileStore.petProfile.policy.endDate" class="flex items-center justify-between">
            <span class="text-gray-500">Кінець:</span>
            <span class="text-gray-900">{{ formatDate(petProfileStore.petProfile.policy.endDate) }}</span>
          </div>
        </div>
      </div>
      
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
import { usePetProfileStore } from '@/stores/petProfile';
import type { Pet, Vaccination, Appointment, QuickAction } from '@/types';
import PetAvatar from './PetAvatar.vue';
import PetInfo from './PetInfo.vue';
import PetPolicyCards from './PetPolicyCards.vue';
import PetQuickActions from './PetQuickActions.vue';
import PetUpcoming from './PetUpcoming.vue';
import PetVaccinations from './PetVaccinations.vue';

interface Props {
  pet: Pet
  vaccinations: Vaccination[]
  appointments: Appointment[]
  quickActions: QuickAction[]
  isPolicyVerified: boolean
}

defineProps<Props>();

defineEmits<{
  'edit-profile': []
  'action-click': [actionId: string]
}>()

const petProfileStore = usePetProfileStore();

// Helper functions
const getMedicalConditionClasses = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-red-100 text-red-800'
    case 'managed':
      return 'bg-yellow-100 text-yellow-800'
    case 'resolved':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getPolicyStatusClasses = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800'
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'expired':
      return 'bg-red-100 text-red-800'
    case 'inactive':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const formatDate = (dateString: string) => {
  if (!dateString) {
    return '';
  }

  try {
    const date = new Date(dateString)

    return date.toLocaleDateString('uk-UA', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  } catch {
    return dateString
  }
}

const policyStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    active: 'Активний',
    inactive: 'Неактивний',
    pending: 'Очікує',
    expired: 'Закінчився'
  }

  return map[status] ?? status
}
</script>
