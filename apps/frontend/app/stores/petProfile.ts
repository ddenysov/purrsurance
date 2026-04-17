import { defineStore } from 'pinia'

// Types for the comprehensive pet profile
interface Microchip {
  number: string
  issuer: string
  dateImplanted: string
}

interface Identifiers {
  licenseTag: string
  passportNumber: string
}

interface WeightHistory {
  date: string
  kg: number
}

interface Weight {
  currentKg: number
  lastUpdated: string
  history: WeightHistory[]
}

interface Lifestyle {
  indoor: boolean
  outdoor: boolean
  activityLevel: 'low' | 'moderate' | 'high'
  diet: 'dry' | 'wet' | 'wet_dry_mix' | 'raw'
}

interface Pet {
  id: string
  name: string
  species: 'cat' | 'dog' | 'bird' | 'rabbit' | 'other'
  breed: string
  sex: 'male' | 'female'
  dateOfBirth: string
  ageMonths: number
  color: string
  microchip: Microchip
  identifiers: Identifiers
  photoUrl: string
  weight: Weight
  spayedNeutered: boolean
  lifestyle: Lifestyle
}

interface Address {
  country: string
  city: string
  street: string
  postalCode: string
}

interface Owner {
  id: string
  fullName: string
  phone: string
  email: string
  address: Address
}

interface Coverage {
  annualLimitUAH: number
  deductibleUAH: number
  copayPercent: number
  covered: string[]
  exclusions: string[]
}

interface Policy {
  policyId: string
  provider: string
  status: 'active' | 'inactive' | 'pending' | 'expired'
  startDate: string
  endDate: string
  plan: string
  coverage: Coverage
}

interface MedicalCondition {
  code: string
  name: string
  diagnosedAt: string
  status: 'active' | 'managed' | 'resolved'
}

interface Vaccination {
  type: string
  date: string
  validUntil: string
  vetClinicId: string
}

interface Medication {
  name: string
  dosage: string
  frequency: string
  since: string
}

interface VetClinic {
  id: string
  name: string
  phone: string
}

interface LastCheckup {
  date: string
  clinic: VetClinic
  notes: string
}

interface Procedure {
  id: string
  type: string
  date: string
  clinicId: string
}

interface Medical {
  allergies: string[]
  conditions: MedicalCondition[]
  vaccinations: Vaccination[]
  medications: Medication[]
  lastCheckup: LastCheckup
  procedures: Procedure[]
}

interface Document {
  type: string
  url: string
}

interface Claim {
  claimId: string
  submittedAt: string
  status: 'pending' | 'approved' | 'rejected' | 'paid'
  incidentDate: string
  amountBilledUAH: number
  amountApprovedUAH: number
  amountPaidUAH: number
  copayUAH: number
  documents: Document[]
}

interface VetContact {
  id: string
  name: string
  phone: string
  address: {
    city: string
    street: string
  }
}

interface Audit {
  createdAt: string
  updatedAt: string
  source: string
  version: number
}

export interface PetProfile {
  pet: Pet
  owner: Owner
  policy: Policy
  medical: Medical
  claims: Claim[]
  vetContacts: VetContact[]
  audit: Audit
}

/** Matches the first policy in `data/seeds/001_policies_seed.mjs` (POL-2025-123456). */
const DEFAULT_SEEDED_PET_PROFILE: PetProfile = {
  pet: {
    id: '7f4f0c1a-6f3a-4497-9d6a-9f9d1a3a1e22',
    name: 'Mittens',
    species: 'cat',
    breed: 'British Shorthair',
    sex: 'female',
    dateOfBirth: '2021-04-15',
    ageMonths: 54,
    color: 'blue',
    microchip: {
      number: '981000123456789',
      issuer: 'ISO11784/11785',
      dateImplanted: '2021-06-01'
    },
    identifiers: {
      licenseTag: 'KY-2025-00987',
      passportNumber: 'UA-PET-000112233'
    },
    photoUrl: 'https://images.unsplash.com/photo-1574158622682-e40e69881006',
    weight: {
      currentKg: 4.3,
      lastUpdated: '',
      history: []
    },
    spayedNeutered: true,
    lifestyle: {
      indoor: true,
      outdoor: false,
      activityLevel: 'moderate',
      diet: 'wet_dry_mix'
    }
  },
  owner: {
    id: 'c6c1c5b9-3c1c-4d2e-a4f1-8c1f2d9a0a55',
    fullName: 'Dmytro Denysov',
    phone: '+380671112233',
    email: 'dmytro@example.com',
    address: {
      country: 'Ukraine',
      city: 'Kyiv',
      street: 'Khreshchatyk 10',
      postalCode: '01001'
    }
  },
  policy: {
    policyId: 'POL-2025-123456',
    provider: 'Вет Експерт',
    status: 'active',
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    plan: 'Premium',
    coverage: {
      annualLimitUAH: 150000,
      deductibleUAH: 1500,
      copayPercent: 10,
      covered: ['accidents', 'illness', 'diagnostics', 'hospitalization', 'surgery', 'prescription_meds'],
      exclusions: ['pre_existing_conditions', 'cosmetic_procedures']
    }
  },
  medical: {
    allergies: ['chicken_protein'],
    conditions: [
      {
        code: 'ICD-11:ME81',
        name: 'Feline asthma',
        diagnosedAt: '2024-02-10',
        status: 'managed'
      }
    ],
    vaccinations: [
      {
        type: 'RCP',
        date: '2025-02-12',
        validUntil: '2026-02-12',
        vetClinicId: 'vet-kyiv-center'
      }
    ],
    medications: [
      {
        name: 'Fluticasone inhaler',
        dosage: '110 mcg',
        frequency: '2x/day',
        since: '2024-02-15'
      }
    ],
    lastCheckup: {
      date: '2025-09-20',
      clinic: {
        id: 'vet-kyiv-center',
        name: 'Kyiv Vet Center',
        phone: '+380442223344'
      },
      notes: 'Normal exam; asthma stable; weight slightly up.'
    },
    procedures: []
  },
  claims: [],
  vetContacts: [],
  audit: {
    createdAt: '2025-01-01T09:00:00Z',
    updatedAt: '2025-09-20T14:35:12Z',
    source: 'default-seed',
    version: 1
  }
}

export const usePetProfileStore = defineStore('petProfile', () => {
  const petProfile = ref<PetProfile>(structuredClone(DEFAULT_SEEDED_PET_PROFILE))

  // Actions

  // Update entire pet profile
  const updatePetProfile = (data: Partial<PetProfile>) => {
    petProfile.value = { ...petProfile.value, ...data }
    petProfile.value.audit.updatedAt = new Date().toISOString()
    petProfile.value.audit.version += 1
  }

  // Update pet information
  const updatePet = (data: Partial<Pet>) => {
    petProfile.value.pet = { ...petProfile.value.pet, ...data }
    petProfile.value.audit.updatedAt = new Date().toISOString()
    petProfile.value.audit.version += 1
  }

  // Update owner information
  const updateOwner = (data: Partial<Owner>) => {
    petProfile.value.owner = { ...petProfile.value.owner, ...data }
    petProfile.value.audit.updatedAt = new Date().toISOString()
    petProfile.value.audit.version += 1
  }

  // Update policy information
  const updatePolicy = (data: Partial<Policy>) => {
    petProfile.value.policy = { ...petProfile.value.policy, ...data }
    petProfile.value.audit.updatedAt = new Date().toISOString()
    petProfile.value.audit.version += 1
  }

  // Update medical information
  const updateMedical = (data: Partial<Medical>) => {
    petProfile.value.medical = { ...petProfile.value.medical, ...data }
    petProfile.value.audit.updatedAt = new Date().toISOString()
    petProfile.value.audit.version += 1
  }

  // Add new claim
  const addClaim = (claim: Claim) => {
    petProfile.value.claims.push(claim)
    petProfile.value.audit.updatedAt = new Date().toISOString()
    petProfile.value.audit.version += 1
  }

  // Update claim
  const updateClaim = (claimId: string, data: Partial<Claim>) => {
    const claimIndex = petProfile.value.claims.findIndex(c => c.claimId === claimId)
    if (claimIndex > -1) {
      petProfile.value.claims[claimIndex] = { ...petProfile.value.claims[claimIndex], ...data }
      petProfile.value.audit.updatedAt = new Date().toISOString()
      petProfile.value.audit.version += 1
    }
  }

  // Add vet contact
  const addVetContact = (vetContact: VetContact) => {
    petProfile.value.vetContacts.push(vetContact)
    petProfile.value.audit.updatedAt = new Date().toISOString()
    petProfile.value.audit.version += 1
  }

  // Update vet contact
  const updateVetContact = (id: string, data: Partial<VetContact>) => {
    const vetIndex = petProfile.value.vetContacts.findIndex(v => v.id === id)
    if (vetIndex > -1) {
      petProfile.value.vetContacts[vetIndex] = { ...petProfile.value.vetContacts[vetIndex], ...data }
      petProfile.value.audit.updatedAt = new Date().toISOString()
      petProfile.value.audit.version += 1
    }
  }

  // Add vaccination
  const addVaccination = (vaccination: Vaccination) => {
    petProfile.value.medical.vaccinations.push(vaccination)
    petProfile.value.audit.updatedAt = new Date().toISOString()
    petProfile.value.audit.version += 1
  }

  // Add medical condition
  const addMedicalCondition = (condition: MedicalCondition) => {
    petProfile.value.medical.conditions.push(condition)
    petProfile.value.audit.updatedAt = new Date().toISOString()
    petProfile.value.audit.version += 1
  }

  // Add medication
  const addMedication = (medication: Medication) => {
    petProfile.value.medical.medications.push(medication)
    petProfile.value.audit.updatedAt = new Date().toISOString()
    petProfile.value.audit.version += 1
  }

  // Add procedure
  const addProcedure = (procedure: Procedure) => {
    petProfile.value.medical.procedures.push(procedure)
    petProfile.value.audit.updatedAt = new Date().toISOString()
    petProfile.value.audit.version += 1
  }

  // Add weight history entry
  const addWeightEntry = (entry: WeightHistory) => {
    petProfile.value.pet.weight.history.push(entry)
    petProfile.value.audit.updatedAt = new Date().toISOString()
    petProfile.value.audit.version += 1
  }

  // Reset to empty state
  const resetProfile = () => {
    petProfile.value = {
      pet: {
        id: '',
        name: '',
        species: 'cat',
        breed: '',
        sex: 'female',
        dateOfBirth: '',
        ageMonths: 0,
        color: '',
        microchip: {
          number: '',
          issuer: '',
          dateImplanted: ''
        },
        identifiers: {
          licenseTag: '',
          passportNumber: ''
        },
        photoUrl: '',
        weight: {
          currentKg: 0,
          lastUpdated: '',
          history: []
        },
        spayedNeutered: false,
        lifestyle: {
          indoor: false,
          outdoor: false,
          activityLevel: 'moderate',
          diet: 'dry'
        }
      },
      owner: {
        id: '',
        fullName: '',
        phone: '',
        email: '',
        address: {
          country: '',
          city: '',
          street: '',
          postalCode: ''
        }
      },
      policy: {
        policyId: '',
        provider: '',
        status: 'inactive',
        startDate: '',
        endDate: '',
        plan: '',
        coverage: {
          annualLimitUAH: 0,
          deductibleUAH: 0,
          copayPercent: 0,
          covered: [],
          exclusions: []
        }
      },
      medical: {
        allergies: [],
        conditions: [],
        vaccinations: [],
        medications: [],
        lastCheckup: {
          date: '',
          clinic: {
            id: '',
            name: '',
            phone: ''
          },
          notes: ''
        },
        procedures: []
      },
      claims: [],
      vetContacts: [],
      audit: {
        createdAt: '',
        updatedAt: '',
        source: '',
        version: 1
      }
    }
  }

  return {
    // State
    petProfile,
    // Actions
    updatePetProfile,
    updatePet,
    updateOwner,
    updatePolicy,
    updateMedical,
    addClaim,
    updateClaim,
    addVetContact,
    updateVetContact,
    addVaccination,
    addMedicalCondition,
    addMedication,
    addProcedure,
    addWeightEntry,
    resetProfile
  }
})
