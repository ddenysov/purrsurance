import { defineStore } from 'pinia'
import type { Pet, Vaccination, Appointment } from '~/types'

export const usePetStore = defineStore('pet', () => {
  // Policy verification state
  const isPolicyVerified = ref<boolean>(false)

  // Default pet data matching the mockup
  const pet = ref<Pet>({
    id: '1',
    name: 'Luna',
    species: 'Cat',
    age: '2 years',
    gender: 'Female',
    avatar: 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?q=80&w=480',
    policyId: 'PS-2578412',
    coveragePlan: 'Premium 80%'
  })

  // Default vaccinations data
  const vaccinations = ref<Vaccination[]>([
    { id: '1', name: 'Сказ', status: 'completed' },
    { id: '2', name: 'FVRCP', status: 'completed' },
    { id: '3', name: 'FeLV', status: 'due' },
    { id: '4', name: 'Бордетельоз', status: 'overdue' }
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
