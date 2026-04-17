import { defineStore } from 'pinia'
import type { Pet, Vaccination, Appointment } from '~/types'

export const usePetStore = defineStore('pet', () => {
  // Policy verification state — default true with first seeded policy (see petProfile store)
  const isPolicyVerified = ref<boolean>(true)

  // Legacy pet snapshot (UI uses petProfile store via usePetProfile)
  const pet = ref<Pet>({
    id: '7f4f0c1a-6f3a-4497-9d6a-9f9d1a3a1e22',
    name: 'Mittens',
    species: 'Cat',
    age: '4 years',
    gender: 'Female',
    avatar: 'https://images.unsplash.com/photo-1574158622682-e40e69881006',
    policyId: 'POL-2025-123456',
    coveragePlan: 'Premium'
  })

  const vaccinations = ref<Vaccination[]>([
    { id: '1', name: 'RCP', status: 'completed' }
  ])

  // Default appointments data
  const appointments = ref<Appointment[]>([
    {
      id: '1',
      title: 'Щорічний огляд',
      location: 'Клініка «Веселі лапки»',
      date: '2024-01-15',
      time: '10:00'
    },
    {
      id: '2',
      title: 'Чистка зубів',
      location: 'Клініка «Веселі лапки»',
      date: '2024-02-20',
      time: '14:00'
    }
  ])

  // Actions

  // Update pet profile
  const updatePetProfile = (data: Partial<Pet>) => {
    pet.value = { ...pet.value, ...data }
  }

  // Add new vaccination
  const addVaccination = (vaccination: Vaccination) => {
    vaccinations.value.push(vaccination)
  }

  // Update vaccination status
  const updateVaccinationStatus = (id: string, status: Vaccination['status']) => {
    const vaccination = vaccinations.value.find(v => v.id === id)
    if (vaccination) {
      vaccination.status = status
    }
  }

  // Add new appointment
  const addAppointment = (appointment: Appointment) => {
    appointments.value.push(appointment)
  }

  // Remove appointment
  const removeAppointment = (id: string) => {
    const index = appointments.value.findIndex(a => a.id === id)
    if (index > -1) {
      appointments.value.splice(index, 1)
    }
  }

  // Unlock pet details after policy verification
  const unlockPetDetails = () => {
    console.log('Unlocking pet profile')
    isPolicyVerified.value = true
  }

  return {
    // State
    pet,
    vaccinations,
    appointments,
    isPolicyVerified,
    // Actions
    updatePetProfile,
    addVaccination,
    updateVaccinationStatus,
    addAppointment,
    removeAppointment,
    unlockPetDetails
  }
})
