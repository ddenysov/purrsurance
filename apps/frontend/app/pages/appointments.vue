<template>
  <div class="min-h-screen bg-gradient-to-br from-mint-50 to-brand-50">

    <!-- Page Header -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900">Veterinary Appointments</h1>
        <p class="mt-2 text-sm text-gray-600">View and manage all scheduled appointments</p>
        <NuxtLink
          to="/"
          class="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-mint-500 text-white hover:bg-mint-600 transition-colors duration-150 shadow-sm hover:shadow-md"
        >
          ← Back to Chat
        </NuxtLink>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-mint-500 border-t-transparent"></div>
        <p class="mt-4 text-gray-600">Loading appointments...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-red-200 p-8">
        <div class="flex items-center justify-center">
          <div class="text-center">
            <div class="text-red-500 text-5xl mb-4">⚠️</div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Error Loading Appointments</h3>
            <p class="text-gray-600 mb-4">{{ error }}</p>
            <button 
              @click="fetchAppointments"
              class="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-mint-500 text-white hover:bg-mint-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>

      <!-- Appointments Table -->
      <div v-else class="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <!-- Table Header -->
        <div class="px-6 py-4 border-b border-gray-200 bg-white/60">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-gray-900">All Appointments</h2>
            <div class="flex items-center gap-4">
              <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-brand-100 text-brand-800">
                {{ appointments.length }} appointments
              </span>
              <button 
                @click="fetchAppointments"
                class="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-mint-100 text-mint-700 hover:bg-mint-200 transition-colors"
                :disabled="loading"
              >
                <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="appointments.length === 0" class="p-12 text-center">
          <div class="text-gray-400 text-6xl mb-4">📅</div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">No Appointments Found</h3>
          <p class="text-gray-600">There are no appointments scheduled at this time.</p>
        </div>

        <!-- Table Content -->
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50/50">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pet & Owner
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Appointment
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clinic
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody class="bg-white/40 divide-y divide-gray-200">
              <tr v-for="appointment in appointments" :key="appointment.appointmentId" class="hover:bg-white/60 transition-colors duration-150">
                <!-- Pet & Owner -->
                <td class="px-6 py-6 whitespace-nowrap">
                  <div class="space-y-2">
                    <div>
                      <div class="text-sm font-bold text-gray-900">{{ appointment.pet.name }}</div>
                      <div class="text-xs text-gray-500 capitalize">{{ appointment.pet.species }} • {{ appointment.pet.breed }}</div>
                    </div>
                    <div class="pt-1 border-t border-gray-200">
                      <div class="text-sm font-medium text-gray-700">{{ appointment.owner.fullName }}</div>
                      <div class="text-xs text-gray-500">{{ appointment.owner.phone }}</div>
                    </div>
                  </div>
                </td>

                <!-- Appointment Details -->
                <td class="px-6 py-6">
                  <div class="space-y-1">
                    <div class="flex items-center gap-2">
                      <span 
                        class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                        :class="getAppointmentTypeClass(appointment.appointment.type)"
                      >
                        {{ appointment.appointment.type }}
                      </span>
                    </div>
                    <div class="text-sm text-gray-900 font-medium">{{ appointment.appointment.reason }}</div>
                    <div class="text-xs text-gray-500">Duration: {{ appointment.appointment.duration }} min</div>
                    <div class="text-xs text-gray-500">Conf: {{ appointment.appointment.confirmationNumber }}</div>
                  </div>
                </td>

                <!-- Clinic Info -->
                <td class="px-6 py-6">
                  <div class="space-y-1">
                    <div class="text-sm font-medium text-gray-900">{{ appointment.clinic.name }}</div>
                    <div class="text-xs text-gray-500">{{ appointment.clinic.address.city }}</div>
                    <div class="text-xs text-gray-500">{{ appointment.clinic.phone }}</div>
                    <div class="text-xs text-mint-600 capitalize">{{ appointment.clinic.specialty }}</div>
                  </div>
                </td>

                <!-- Date & Time -->
                <td class="px-6 py-6">
                  <div class="space-y-1">
                    <div class="text-sm font-medium text-gray-900">{{ formatDate(appointment.appointmentDate) }}</div>
                    <div class="text-sm text-gray-600">{{ formatTime(appointment.appointmentDate) }}</div>
                    <div class="text-xs text-gray-500">Arrive: {{ formatTime(appointment.appointment.arrivalTime) }}</div>
                  </div>
                </td>

                <!-- Status -->
                <td class="px-6 py-6 whitespace-nowrap">
                  <span 
                    class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                    :class="getStatusClass(appointment.status)"
                  >
                    {{ appointment.status }}
                  </span>
                  <div v-if="appointment.medicalContext" class="mt-2 text-xs text-gray-500">
                    <div class="font-medium text-gray-700">Medical:</div>
                    <div>{{ appointment.medicalContext.urgencyLevel }}</div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Reactive state
const appointments = ref<any[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

// Get backend API URL from runtime config
const config = useRuntimeConfig()
const backendApiUrl = config.public.backendApiUrl || 'http://localhost:3000/vet-appointments'

// Fetch appointments from backend
const fetchAppointments = async () => {
  loading.value = true
  error.value = null
  
  try {
    console.log('[Appointments] Fetching from:', backendApiUrl)
    
    const response = await fetch(backendApiUrl)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch appointments: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    console.log('[Appointments] Received data:', data)
    
    if (data.success && Array.isArray(data.data)) {
      appointments.value = data.data
      console.log('[Appointments] Loaded', appointments.value.length, 'appointments')
    } else {
      throw new Error('Invalid response format')
    }
  } catch (err: any) {
    console.error('[Appointments] Error fetching appointments:', err)
    error.value = err.message || 'Failed to load appointments'
  } finally {
    loading.value = false
  }
}

// Helper functions
const getStatusClass = (status: string) => {
  const classes = {
    scheduled: 'bg-blue-100 text-blue-800',
    confirmed: 'bg-mint-100 text-mint-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800'
  }
  return classes[status as keyof typeof classes] || classes.scheduled
}

const getAppointmentTypeClass = (type: string) => {
  const classes = {
    routine: 'bg-blue-50 text-blue-700',
    specialist: 'bg-purple-50 text-purple-700',
    urgent: 'bg-red-50 text-red-700',
    emergency: 'bg-red-100 text-red-800',
    'follow-up': 'bg-mint-50 text-mint-700'
  }
  return classes[type as keyof typeof classes] || classes.routine
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', { 
    year: 'numeric',
    month: 'short', 
    day: 'numeric'
  }).format(date)
}

const formatTime = (dateString: string) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false
  }).format(date)
}

// Set page title
useHead({
  title: 'Appointments - Purrsurance'
})

// Fetch appointments on mount
onMounted(() => {
  fetchAppointments()
})
</script>

<style scoped>
/* Custom animations */
@keyframes spin {
  to { transform: rotate(360deg); }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>

