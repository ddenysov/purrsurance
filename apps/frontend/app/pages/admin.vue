<template>
  <div class="min-h-screen bg-white">
    <!-- Page Header -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Адмін-панель улюбленців</h1>
          <p class="mt-2 text-sm text-gray-600">Перегляд і керування зареєстрованими улюбленцями</p>
        </div>
        <NuxtLink 
          to="/" 
          class="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-mint-500 text-white hover:bg-mint-600 transition-colors duration-150 shadow-sm hover:shadow-md"
        >
          ← До чату
        </NuxtLink>
      </div>

      <!-- Pets Table -->
      <div class="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <!-- Table Header -->
        <div class="px-6 py-4 border-b border-gray-200 bg-white/60">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-gray-900">Усі улюбленці</h2>
            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-brand-100 text-brand-800">
              {{ pets.length }} {{ pluralUliublentsiv(pets.length) }}
            </span>
          </div>
        </div>

        <!-- Table Content -->
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50/50">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Улюбленець
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Деталі
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Власник
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Поліс
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
              </tr>
            </thead>
            <tbody class="bg-white/40 divide-y divide-gray-200">
              <tr v-for="pet in pets" :key="pet.id" class="hover:bg-white/60 transition-colors duration-150">
                <!-- Pet Photo & Name -->
                <td class="px-6 py-6 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-16 w-16">
                      <img 
                        class="h-16 w-16 rounded-full object-cover ring-2 ring-white shadow-md" 
                        :src="pet.photoUrl" 
                        :alt="pet.name"
                        loading="lazy"
                      />
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-bold text-gray-900">{{ pet.name }}</div>
                      <div class="text-sm text-gray-500">{{ pet.breed }}</div>
                    </div>
                  </div>
                </td>

                <!-- Pet Details -->
                <td class="px-6 py-6">
                  <div class="space-y-1">
                    <div class="text-sm text-gray-900">
                      <span class="font-medium">Вид:</span> 
                      <span>{{ speciesLabel(pet.species) }}</span>
                    </div>
                    <div class="text-sm text-gray-500">
                      <span class="font-medium">Вік:</span> {{ Math.floor(pet.ageMonths / 12) }} р. {{ pet.ageMonths % 12 }} міс.
                    </div>
                    <div class="text-sm text-gray-500">
                      <span class="font-medium">Стать:</span> 
                      <span>{{ sexLabel(pet.sex) }}</span>
                    </div>
                    <div class="text-sm text-gray-500">
                      <span class="font-medium">Вага:</span> {{ pet.weight.currentKg }} кг
                    </div>
                  </div>
                </td>

                <!-- Owner Info -->
                <td class="px-6 py-6">
                  <div class="space-y-1">
                    <div class="text-sm font-medium text-gray-900">{{ pet.ownerName }}</div>
                    <div class="text-sm text-gray-500">{{ pet.ownerPhone }}</div>
                    <div class="text-sm text-gray-500">{{ pet.ownerEmail }}</div>
                    <div class="text-sm text-gray-500">{{ pet.ownerCity }}</div>
                  </div>
                </td>

                <!-- Policy Info -->
                <td class="px-6 py-6">
                  <div class="space-y-1">
                    <div class="text-sm font-medium text-gray-900">{{ pet.policyId }}</div>
                    <div class="text-sm text-gray-500">{{ pet.policyPlan }}</div>
                    <div class="text-sm text-gray-500">{{ formatCurrency(pet.policyLimit) }} грн</div>
                    <div class="text-sm text-gray-500">Франшиза: {{ formatCurrency(pet.policyDeductible) }} грн</div>
                  </div>
                </td>

                <!-- Status -->
                <td class="px-6 py-6 whitespace-nowrap">
                  <span 
                    class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                    :class="getStatusClass(pet.policyStatus)"
                  >
                    {{ policyStatusLabel(pet.policyStatus) }}
                  </span>
                  <div class="mt-2 text-xs text-gray-500">
                    <div v-if="pet.medicalConditions.length > 0">
                      <span class="font-medium">Діагнози:</span>
                      <div v-for="condition in pet.medicalConditions" :key="condition.code" class="mt-1">
                        {{ condition.name }}
                      </div>
                    </div>
                    <div v-else class="text-mint-600">Немає діагнозів</div>
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
// Static pets data from seeders
const petsData = [
  {
    policyId: "POL-2025-123456",
    pet: {
      id: "7f4f0c1a-6f3a-4497-9d6a-9f9d1a3a1e22",
      name: "Mittens",
      species: "cat",
      breed: "British Shorthair",
      sex: "female",
      dateOfBirth: "2021-04-15",
      ageMonths: 54,
      color: "blue",
      photoUrl: "https://images.unsplash.com/photo-1574158622682-e40e69881006",
      weight: { currentKg: 4.3 },
      spayedNeutered: true,
    },
    owner: {
      fullName: "Dmytro Denysov",
      phone: "+380671112233",
      email: "dmytro@example.com",
      address: { city: "Kyiv" }
    },
    policy: {
      policyId: "POL-2025-123456",
      status: "active",
      plan: "Premium",
      coverage: {
        annualLimitUAH: 150000,
        deductibleUAH: 1500,
      }
    },
    medical: {
      conditions: [{
        code: "ICD-11:ME81",
        name: "Feline asthma",
      }]
    }
  },
  {
    policyId: "POL-2025-234567",
    pet: {
      id: "8e5e1c2b-7f4a-5598-0e7b-0g0e2b4b2f33",
      name: "Max",
      species: "dog",
      breed: "Golden Retriever",
      sex: "male",
      dateOfBirth: "2020-06-20",
      ageMonths: 64,
      color: "golden",
      photoUrl: "https://images.unsplash.com/photo-1633722715463-d30f4f325e24",
      weight: { currentKg: 32.5 },
      spayedNeutered: true,
    },
    owner: {
      fullName: "Olena Kovalenko",
      phone: "+380672223344",
      email: "olena.k@example.com",
      address: { city: "Kyiv" }
    },
    policy: {
      policyId: "POL-2025-234567",
      status: "active",
      plan: "Standard",
      coverage: {
        annualLimitUAH: 100000,
        deductibleUAH: 2000,
      }
    },
    medical: {
      conditions: []
    }
  },
  {
    policyId: "POL-2025-345678",
    pet: {
      id: "9f6f2d3c-8g5b-6609-1f8c-1h1f3c5c3g44",
      name: "Luna",
      species: "cat",
      breed: "Persian",
      sex: "female",
      dateOfBirth: "2022-03-10",
      ageMonths: 43,
      color: "white",
      photoUrl: "https://images.unsplash.com/photo-1595433707802-6b2626ef1c91",
      weight: { currentKg: 3.8 },
      spayedNeutered: true,
    },
    owner: {
      fullName: "Andriy Petrenko",
      phone: "+380673334455",
      email: "andriy.p@example.com",
      address: { city: "Lviv" }
    },
    policy: {
      policyId: "POL-2025-345678",
      status: "active",
      plan: "Premium",
      coverage: {
        annualLimitUAH: 150000,
        deductibleUAH: 1500,
      }
    },
    medical: {
      conditions: [{
        code: "ICD-11:KA21",
        name: "Polycystic kidney disease",
      }]
    }
  },
  {
    policyId: "POL-2025-456789",
    pet: {
      id: "0g7g3e4d-9h6c-7710-2g9d-2i2g4d6d4h55",
      name: "Rocky",
      species: "dog",
      breed: "German Shepherd",
      sex: "male",
      dateOfBirth: "2019-08-12",
      ageMonths: 74,
      color: "black_tan",
      photoUrl: "https://images.unsplash.com/photo-1568572933382-74d440642117",
      weight: { currentKg: 38.2 },
      spayedNeutered: true,
    },
    owner: {
      fullName: "Iryna Shevchenko",
      phone: "+380674445566",
      email: "iryna.s@example.com",
      address: { city: "Odesa" }
    },
    policy: {
      policyId: "POL-2025-456789",
      status: "active",
      plan: "Standard",
      coverage: {
        annualLimitUAH: 100000,
        deductibleUAH: 2000,
      }
    },
    medical: {
      conditions: [{
        code: "ICD-11:FA71",
        name: "Hip dysplasia",
      }]
    }
  },
  {
    policyId: "POL-2025-567890",
    pet: {
      id: "1h8h4f5e-0i7d-8821-3h0e-3j3h5e7e5i66",
      name: "Whiskers",
      species: "cat",
      breed: "Maine Coon",
      sex: "male",
      dateOfBirth: "2020-11-25",
      ageMonths: 58,
      color: "brown_tabby",
      photoUrl: "https://images.unsplash.com/photo-1491485880348-85d48a9e5312",
      weight: { currentKg: 7.2 },
      spayedNeutered: true,
    },
    owner: {
      fullName: "Serhiy Bondarenko",
      phone: "+380675556677",
      email: "serhiy.b@example.com",
      address: { city: "Kharkiv" }
    },
    policy: {
      policyId: "POL-2025-567890",
      status: "active",
      plan: "Premium",
      coverage: {
        annualLimitUAH: 150000,
        deductibleUAH: 1500,
      }
    },
    medical: {
      conditions: []
    }
  },
  {
    policyId: "POL-2025-678901",
    pet: {
      id: "2i9i5g6f-1j8e-9932-4i1f-4k4i6f8f6j77",
      name: "Bella",
      species: "dog",
      breed: "Labrador Retriever",
      sex: "female",
      dateOfBirth: "2021-02-14",
      ageMonths: 56,
      color: "chocolate",
      photoUrl: "https://images.unsplash.com/photo-1587300003388-59208cc962cb",
      weight: { currentKg: 28.5 },
      spayedNeutered: true,
    },
    owner: {
      fullName: "Tetiana Moroz",
      phone: "+380676667788",
      email: "tetiana.m@example.com",
      address: { city: "Dnipro" }
    },
    policy: {
      policyId: "POL-2025-678901",
      status: "active",
      plan: "Standard",
      coverage: {
        annualLimitUAH: 100000,
        deductibleUAH: 2000,
      }
    },
    medical: {
      conditions: []
    }
  },
  {
    policyId: "POL-2025-789012",
    pet: {
      id: "3j0j6h7g-2k9f-0043-5j2g-5l5j7g9g7k88",
      name: "Shadow",
      species: "cat",
      breed: "Siamese",
      sex: "male",
      dateOfBirth: "2023-01-08",
      ageMonths: 33,
      color: "seal_point",
      photoUrl: "https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8",
      weight: { currentKg: 4.1 },
      spayedNeutered: true,
    },
    owner: {
      fullName: "Viktor Tkachenko",
      phone: "+380677778899",
      email: "viktor.t@example.com",
      address: { city: "Zaporizhzhia" }
    },
    policy: {
      policyId: "POL-2025-789012",
      status: "active",
      plan: "Basic",
      coverage: {
        annualLimitUAH: 50000,
        deductibleUAH: 3000,
      }
    },
    medical: {
      conditions: []
    }
  },
  {
    policyId: "POL-2025-890123",
    pet: {
      id: "4k1k7i8h-3l0g-1154-6k3h-6m6k8h0h8l99",
      name: "Charlie",
      species: "dog",
      breed: "Beagle",
      sex: "male",
      dateOfBirth: "2022-05-22",
      ageMonths: 41,
      color: "tricolor",
      photoUrl: "https://images.unsplash.com/photo-1505628346881-b72b27e84530",
      weight: { currentKg: 12.8 },
      spayedNeutered: true,
    },
    owner: {
      fullName: "Natalia Koval",
      phone: "+380678889900",
      email: "natalia.k@example.com",
      address: { city: "Poltava" }
    },
    policy: {
      policyId: "POL-2025-890123",
      status: "active",
      plan: "Standard",
      coverage: {
        annualLimitUAH: 100000,
        deductibleUAH: 2000,
      }
    },
    medical: {
      conditions: []
    }
  },
  {
    policyId: "POL-2025-901234",
    pet: {
      id: "5l2l8j9i-4m1h-2265-7l4i-7n7l9i1i9m00",
      name: "Fluffy",
      species: "cat",
      breed: "Ragdoll",
      sex: "female",
      dateOfBirth: "2021-09-30",
      ageMonths: 48,
      color: "blue_point",
      photoUrl: "https://images.unsplash.com/photo-1529778873920-4da4926a72c2",
      weight: { currentKg: 5.5 },
      spayedNeutered: true,
    },
    owner: {
      fullName: "Yuriy Savchenko",
      phone: "+380679990011",
      email: "yuriy.s@example.com",
      address: { city: "Chernivtsi" }
    },
    policy: {
      policyId: "POL-2025-901234",
      status: "active",
      plan: "Premium",
      coverage: {
        annualLimitUAH: 150000,
        deductibleUAH: 1500,
      }
    },
    medical: {
      conditions: []
    }
  },
  {
    policyId: "POL-2025-012345",
    pet: {
      id: "6m3m9k0j-5n2i-3376-8m5j-8o8m0j2j0n11",
      name: "Rex",
      species: "dog",
      breed: "Rottweiler",
      sex: "male",
      dateOfBirth: "2020-12-05",
      ageMonths: 58,
      color: "black_tan",
      photoUrl: "https://images.unsplash.com/photo-1567752881298-894bb81f9379",
      weight: { currentKg: 52.3 },
      spayedNeutered: true,
    },
    owner: {
      fullName: "Maksym Hryhorenko",
      phone: "+380670001122",
      email: "maksym.h@example.com",
      address: { city: "Ivano-Frankivsk" }
    },
    policy: {
      policyId: "POL-2025-012345",
      status: "active",
      plan: "Standard",
      coverage: {
        annualLimitUAH: 100000,
        deductibleUAH: 2000,
      }
    },
    medical: {
      conditions: [{
        code: "ICD-11:FA72",
        name: "Elbow dysplasia",
      }]
    }
  }
]

// Transform data for display
const pets = computed(() => {
  return petsData.map(item => ({
    id: item.pet.id,
    name: item.pet.name,
    species: item.pet.species,
    breed: item.pet.breed,
    sex: item.pet.sex,
    ageMonths: item.pet.ageMonths,
    photoUrl: item.pet.photoUrl,
    weight: item.pet.weight,
    ownerName: item.owner.fullName,
    ownerPhone: item.owner.phone,
    ownerEmail: item.owner.email,
    ownerCity: item.owner.address.city,
    policyId: item.policy.policyId,
    policyStatus: item.policy.status,
    policyPlan: item.policy.plan,
    policyLimit: item.policy.coverage.annualLimitUAH,
    policyDeductible: item.policy.coverage.deductibleUAH,
    medicalConditions: item.medical.conditions
  }))
})

// Helper functions
const getStatusClass = (status: string) => {
  const classes = {
    active: 'bg-mint-100 text-mint-800',
    inactive: 'bg-gray-100 text-gray-800',
    pending: 'bg-yellow-100 text-yellow-800',
    expired: 'bg-red-100 text-red-800'
  }
  return classes[status as keyof typeof classes] || classes.inactive
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('uk-UA').format(amount)
}

const pluralUliublentsiv = (n: number) => {
  const m = n % 10
  const k = n % 100
  if (k >= 11 && k <= 14) return 'улюбленців'
  if (m === 1) return 'улюбленець'
  if (m >= 2 && m <= 4) return 'улюбленці'
  return 'улюбленців'
}

const speciesLabel = (species: string) => {
  const map: Record<string, string> = {
    cat: 'Кіт',
    dog: 'Собака',
    bird: 'Птах',
    rabbit: 'Кролик',
    other: 'Інше'
  }
  return map[species.toLowerCase()] ?? species
}

const sexLabel = (sex: string) => {
  const map: Record<string, string> = {
    male: 'Самець',
    female: 'Самка'
  }
  return map[sex.toLowerCase()] ?? sex
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

useHead({
  title: 'Адмін улюбленців — Вет Експерт'
})
</script>

<style scoped>
/* Add any custom styles if needed */
</style>

