import { storeToRefs } from 'pinia'
import { usePetStore } from '~/stores/pet'
import { usePetProfileStore } from '~/stores/petProfile'
import type { Pet, Vaccination, Appointment } from '~/types'

/**
 * Composable that bridges the new petProfile store with the old pet data format
 * This allows existing components to work with the comprehensive pet profile data
 */
export const usePetProfile = () => {
  // Get both stores
  const petStore = usePetStore()
  const petProfileStore = usePetProfileStore()
  
  // Extract reactive state from petProfileStore
  const { petProfile } = storeToRefs(petProfileStore)
  
  // Extract policy verification state from old store
  const { isPolicyVerified } = storeToRefs(petStore)

  // Map comprehensive pet profile data to simple Pet format
  const pet = computed<Pet>(() => {
    const profile = petProfile.value
    
    // Calculate age from date of birth
    let ageDisplay = ''
    if (profile.pet.dateOfBirth) {
      const birthDate = new Date(profile.pet.dateOfBirth)
      const now = new Date()
      const ageYears = Math.floor((now.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25))
      const ageMonths = profile.pet.ageMonths % 12
      
      if (ageYears > 0) {
        ageDisplay = ageMonths > 0 ? `${ageYears} years ${ageMonths} months` : `${ageYears} years`
      } else {
        ageDisplay = `${ageMonths} months`
      }
    } else if (profile.pet.ageMonths > 0) {
      const years = Math.floor(profile.pet.ageMonths / 12)
      const months = profile.pet.ageMonths % 12
      if (years > 0) {
        ageDisplay = months > 0 ? `${years} years ${months} months` : `${years} years`
      } else {
        ageDisplay = `${months} months`
      }
    }
    
    // Format species with capital first letter
    const speciesDisplay = profile.pet.species 
      ? profile.pet.species.charAt(0).toUpperCase() + profile.pet.species.slice(1)
      : ''
    
    // Format gender
    const genderDisplay = profile.pet.sex 
      ? profile.pet.sex.charAt(0).toUpperCase() + profile.pet.sex.slice(1)
      : ''
    
    return {
      id: profile.pet.id || '',
      name: profile.pet.name || '',
      species: speciesDisplay,
      age: ageDisplay,
      gender: genderDisplay,
      avatar: profile.pet.photoUrl || '',
      policyId: profile.policy.policyId || '',
      coveragePlan: profile.policy.plan || ''
    }
  })

  // Map medical vaccinations to simple Vaccination format
  const vaccinations = computed<Vaccination[]>(() => {
    return petProfile.value.medical.vaccinations.map((vacc, index) => {
      // Determine status based on validUntil date
      let status: Vaccination['status'] = 'completed'
      if (vacc.validUntil) {
        const validDate = new Date(vacc.validUntil)
        const now = new Date()
        const daysUntilExpiry = Math.floor((validDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysUntilExpiry < 0) {
          status = 'overdue'
        } else if (daysUntilExpiry <= 30) {
          status = 'due'
        } else {
          status = 'completed'
        }
      }
      
      return {
        id: `vacc-${index}`,
        name: vacc.type,
        status
      }
    })
  })

  // Map upcoming appointments (for now, empty - can be populated later)
  const appointments = computed<Appointment[]>(() => {
    // TODO: Extract appointments from medical procedures or separate appointments data
    return []
  })

  // Update pet profile - delegates to both stores
  const updatePetProfile = (data: Partial<Pet>) => {
    // Update old store for immediate UI response
    petStore.updatePetProfile(data)
    
    // Update new store with mapped data
    if (data.name || data.species || data.gender || data.avatar) {
      petProfileStore.updatePet({
        name: data.name,
        species: data.species?.toLowerCase() as any,
        sex: data.gender?.toLowerCase() as any,
        photoUrl: data.avatar
      })
    }
    
    if (data.policyId || data.coveragePlan) {
      petProfileStore.updatePolicy({
        policyId: data.policyId,
        plan: data.coveragePlan
      })
    }
  }

  // Vaccination actions
  const addVaccination = (vaccination: Vaccination) => {
    petStore.addVaccination(vaccination)
    
    // Also add to petProfileStore
    petProfileStore.addVaccination({
      type: vaccination.name,
      date: new Date().toISOString(),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
      vetClinicId: ''
    })
  }

  const updateVaccinationStatus = (id: string, status: Vaccination['status']) => {
    petStore.updateVaccinationStatus(id, status)
  }

  // Appointment actions
  const addAppointment = (appointment: Appointment) => {
    petStore.addAppointment(appointment)
  }

  const removeAppointment = (id: string) => {
    petStore.removeAppointment(id)
  }

  // Unlock pet details
  const unlockPetDetails = () => {
    petStore.unlockPetDetails()
  }

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
