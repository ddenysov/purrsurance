<template>
    <AppLayout>
        <Head title="Адмін улюбленців — Вет Експерт" />

        <div class="min-h-screen bg-white">
    <!-- Page Header -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Адмін-панель улюбленців</h1>
          <p class="mt-2 text-sm text-gray-600">Перегляд і керування зареєстрованими улюбленцями</p>
        </div>
        <Link
            href="/"
            class="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-mint-500 text-white hover:bg-mint-600 transition-colors duration-150 shadow-sm hover:shadow-md"
        >
            ← До чату
        </Link>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-mint-500 border-t-transparent"></div>
        <p class="mt-4 text-gray-600">Завантаження улюбленців…</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-red-200 p-8">
        <div class="flex items-center justify-center">
          <div class="text-center">
            <div class="text-red-500 text-5xl mb-4">⚠️</div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Не вдалося завантажити дані</h3>
            <p class="text-gray-600 mb-4">{{ error }}</p>
            <button
              @click="fetchPolicies"
              class="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-mint-500 text-white hover:bg-mint-600 transition-colors"
            >
              Спробувати знову
            </button>
          </div>
        </div>
      </div>

      <!-- Pets Table -->
      <div v-else class="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <!-- Table Header -->
        <div class="px-6 py-4 border-b border-gray-200 bg-white/60">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-gray-900">Усі улюбленці</h2>
            <div class="flex items-center gap-4">
              <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-brand-100 text-brand-800">
                {{ pets.length }} {{ pluralUliublentsiv(pets.length) }}
              </span>
              <button
                @click="fetchPolicies"
                class="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-mint-100 text-mint-700 hover:bg-mint-200 transition-colors"
                :disabled="loading"
              >
                <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Оновити
              </button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="pets.length === 0" class="p-12 text-center">
          <div class="text-gray-400 text-6xl mb-4">🐾</div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Улюбленців не знайдено</h3>
          <p class="text-gray-600">Запустіть сидер: <code class="text-sm bg-gray-100 px-2 py-1 rounded">make seed</code></p>
        </div>

        <!-- Table Content -->
        <div v-else class="overflow-x-auto">
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
    </AppLayout>
</template>

<script setup lang="ts">
import { Head, Link, usePage } from '@inertiajs/vue3';
import { computed, onMounted, ref } from 'vue';
import AppLayout from '@/layouts/AppLayout.vue';
import type { SharedClientConfig } from '@/types/client';

interface PolicyRecord {
  policyId: string;
  pet: {
    id: string;
    name: string;
    species: string;
    breed: string;
    sex: string;
    ageMonths: number;
    photoUrl?: string;
    weight?: { currentKg?: number };
  };
  owner: {
    fullName: string;
    phone?: string;
    email?: string;
    address?: { city?: string };
  };
  policy: {
    policyId: string;
    status: string;
    plan?: string;
    coverage?: {
      annualLimitUAH?: number;
      deductibleUAH?: number;
    };
  };
  medical?: {
    conditions?: Array<{ code: string; name: string }>;
  };
}

const page = usePage();
const policiesApiUrl = computed(() => (page.props.client as SharedClientConfig).policiesApiUrl);

const policiesData = ref<PolicyRecord[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

const fetchPolicies = async () => {
  loading.value = true;
  error.value = null;

  try {
    const response = await fetch(policiesApiUrl.value);

    if (!response.ok) {
      throw new Error(`Не вдалося отримати поліси: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.success && Array.isArray(data.data)) {
      policiesData.value = data.data;
    } else {
      throw new Error('Некоректний формат відповіді');
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Не вдалося завантажити дані';
    error.value = message;
  } finally {
    loading.value = false;
  }
};

const pets = computed(() => {
  return policiesData.value.map((item) => ({
    id: item.pet.id,
    name: item.pet.name,
    species: item.pet.species,
    breed: item.pet.breed,
    sex: item.pet.sex,
    ageMonths: item.pet.ageMonths,
    photoUrl: item.pet.photoUrl ?? '',
    weight: item.pet.weight ?? { currentKg: 0 },
    ownerName: item.owner.fullName,
    ownerPhone: item.owner.phone ?? '',
    ownerEmail: item.owner.email ?? '',
    ownerCity: item.owner.address?.city ?? '',
    policyId: item.policy.policyId,
    policyStatus: item.policy.status,
    policyPlan: item.policy.plan ?? '',
    policyLimit: item.policy.coverage?.annualLimitUAH ?? 0,
    policyDeductible: item.policy.coverage?.deductibleUAH ?? 0,
    medicalConditions: item.medical?.conditions ?? [],
  }));
});

onMounted(() => {
  fetchPolicies();
});

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

  if (k >= 11 && k <= 14) {
return 'улюбленців'
}

  if (m === 1) {
return 'улюбленець'
}

  if (m >= 2 && m <= 4) {
return 'улюбленці'
}

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
</script>

<style scoped>
@keyframes spin {
  to { transform: rotate(360deg); }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>

