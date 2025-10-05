import { storeToRefs } from 'pinia'
import { usePetStore } from '~/stores/pet'

/**
 * Composable wrapper around usePetStore for backward compatibility
 * This allows existing code to continue working while we migrate to Pinia
 */
export const usePetProfile = () => {
  // Get the Pinia store
  const petStore = usePetStore()

  // Extract reactive state using storeToRefs
  const { pet, vaccinations, appointments, isPolicyVerified } = storeToRefs(petStore)

  // Extract actions directly from store
  const {
    updatePetProfile,
    addVaccination,
    updateVaccinationStatus,
    addAppointment,
    removeAppointment,
    unlockPetDetails
  } = petStore

  return {
    pet: readonly(pet),
    vaccinations: readonly(vaccinations),
    appointments: readonly(appointments),
    isPolicyVerified: readonly(isPolicyVerified),
    updatePetProfile,
    addVaccination,
    updateVaccinationStatus,
    addAppointment,
    removeAppointment,
    unlockPetDetails
  }
}
