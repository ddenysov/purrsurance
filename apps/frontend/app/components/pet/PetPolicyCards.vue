<template>
  <div class="grid grid-cols-2 gap-3">
    <!-- Policy ID Card -->
    <div class="bg-gray-50 rounded-lg p-3">
      <div class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
        Policy ID
      </div>
      <div class="text-sm font-semibold text-gray-900">
        {{ policyId }}
      </div>
    </div>
    
    <!-- Coverage Plan Card -->
    <div class="bg-gray-50 rounded-lg p-3">
      <div class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
        Coverage
      </div>
      <div class="text-sm font-semibold text-gray-900">
        {{ coveragePlan }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  policyId: string
  coveragePlan: string
}

defineProps<Props>()
</script>
