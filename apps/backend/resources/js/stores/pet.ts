import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Pet, Vaccination, Appointment } from '@/types';

export const usePetStore = defineStore('pet', () => {
  const isPolicyVerified = ref<boolean>(false)

  const pet = ref<Pet>({
    id: '',
    name: '',
    species: '',
    age: '',
    gender: '',
    avatar: '',
    policyId: '',
    coveragePlan: ''
  })

  const vaccinations = ref<Vaccination[]>([])

  const appointments = ref<Appointment[]>([])

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
