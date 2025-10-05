import type { Pet, Vaccination, Appointment } from '~/types'

export const usePetProfile = () => {
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
    { id: '1', name: 'Rabies', status: 'completed' },
    { id: '2', name: 'FVRCP', status: 'completed' },
    { id: '3', name: 'FeLV', status: 'due' },
    { id: '4', name: 'Bordetella', status: 'overdue' }
  ])

  // Default appointments data
  const appointments = ref<Appointment[]>([
    {
      id: '1',
      title: 'Annual Checkup',
      location: 'Happy Paws Vet Clinic',
      date: '2024-01-15',
      time: '10:00 AM'
    },
    {
      id: '2',
      title: 'Dental Cleaning',
      location: 'Happy Paws Vet Clinic',
      date: '2024-02-20',
      time: '2:00 PM'
    }
  ])

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

  return {
    pet: readonly(pet),
    vaccinations: readonly(vaccinations),
    appointments: readonly(appointments),
    updatePetProfile,
    addVaccination,
    updateVaccinationStatus,
    addAppointment,
    removeAppointment
  }
}
