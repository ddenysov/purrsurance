<template>
    <AppLayout>
        <Head title="Клініки — Вет Експерт" />

        <div class="min-h-screen bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Партнерські ветклініки</h1>
          <p class="mt-2 text-sm text-gray-600">Перегляд клінік для запису на прийом</p>
        </div>
        <Link
            href="/"
            class="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-mint-500 text-white hover:bg-mint-600 transition-colors duration-150 shadow-sm hover:shadow-md"
        >
            ← До чату
        </Link>
      </div>

      <div v-if="loading" class="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-mint-500 border-t-transparent"></div>
        <p class="mt-4 text-gray-600">Завантаження клінік…</p>
      </div>

      <div v-else-if="error" class="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-red-200 p-8">
        <div class="flex items-center justify-center">
          <div class="text-center">
            <div class="text-red-500 text-5xl mb-4">⚠️</div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Не вдалося завантажити дані</h3>
            <p class="text-gray-600 mb-4">{{ error }}</p>
            <button
              @click="fetchClinics"
              class="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-mint-500 text-white hover:bg-mint-600 transition-colors"
            >
              Спробувати знову
            </button>
          </div>
        </div>
      </div>

      <div v-else class="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200 bg-white/60">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-gray-900">Усі клініки</h2>
            <div class="flex items-center gap-4">
              <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-brand-100 text-brand-800">
                {{ clinics.length }} {{ pluralKlinik(clinics.length) }}
              </span>
              <button
                @click="fetchClinics"
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

        <div v-if="clinics.length === 0" class="p-12 text-center">
          <div class="text-gray-400 text-6xl mb-4">🏥</div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Клінік не знайдено</h3>
          <p class="text-gray-600">Запустіть сидер: <code class="text-sm bg-gray-100 px-2 py-1 rounded">php artisan db:seed --class=VetClinicSeeder</code></p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50/50">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Клініка
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Адреса
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Контакти
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Спеціалізація
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Страхування
                </th>
              </tr>
            </thead>
            <tbody class="bg-white/40 divide-y divide-gray-200">
              <tr v-for="clinic in clinics" :key="clinic.id" class="hover:bg-white/60 transition-colors duration-150">
                <td class="px-6 py-6 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-14 w-14 rounded-xl bg-brand-100 flex items-center justify-center text-2xl ring-2 ring-white shadow-md">
                      🏥
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-bold text-gray-900">{{ clinic.name }}</div>
                      <div class="text-sm text-gray-500">{{ clinic.id }}</div>
                    </div>
                  </div>
                </td>

                <td class="px-6 py-6">
                  <div class="space-y-1">
                    <div class="text-sm font-medium text-gray-900">{{ clinic.address.street }}</div>
                    <div class="text-sm text-gray-500">
                      {{ clinic.address.city }}, {{ clinic.address.postalCode }}
                    </div>
                    <div class="text-sm text-gray-500">{{ clinic.address.country }}</div>
                  </div>
                </td>

                <td class="px-6 py-6">
                  <div class="space-y-1">
                    <div class="text-sm text-gray-900">
                      <a :href="`tel:${clinic.phone}`" class="hover:text-mint-600">{{ clinic.phone }}</a>
                    </div>
                    <div class="text-sm text-gray-500">
                      <a :href="`mailto:${clinic.email}`" class="hover:text-mint-600">{{ clinic.email }}</a>
                    </div>
                  </div>
                </td>

                <td class="px-6 py-6 whitespace-nowrap">
                  <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-800">
                    {{ clinic.specialty }}
                  </span>
                </td>

                <td class="px-6 py-6 whitespace-nowrap">
                  <span
                    class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                    :class="clinic.acceptsInsurance ? 'bg-mint-100 text-mint-800' : 'bg-gray-100 text-gray-800'"
                  >
                    {{ clinic.acceptsInsurance ? 'Приймає' : 'Не приймає' }}
                  </span>
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
import { onMounted, ref } from 'vue';
import AppLayout from '@/layouts/AppLayout.vue';
import type { SharedClientConfig } from '@/types/client';

interface ClinicAddress {
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

interface ClinicRecord {
  id: string;
  name: string;
  address: ClinicAddress;
  phone: string;
  email: string;
  specialty: string;
  acceptsInsurance: boolean;
}

const page = usePage();
const clinicsApiUrl = (page.props.client as SharedClientConfig).clinicsApiUrl;

const clinics = ref<ClinicRecord[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

const fetchClinics = async () => {
  loading.value = true;
  error.value = null;

  try {
    const response = await fetch(clinicsApiUrl);

    if (!response.ok) {
      throw new Error(`Не вдалося отримати клініки: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.success && Array.isArray(data.data)) {
      clinics.value = data.data;
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

const pluralKlinik = (n: number) => {
  const m = n % 10;
  const k = n % 100;

  if (k >= 11 && k <= 14) {
    return 'клінік';
  }

  if (m === 1) {
    return 'клініка';
  }

  if (m >= 2 && m <= 4) {
    return 'клініки';
  }

  return 'клінік';
};

onMounted(() => {
  fetchClinics();
});
</script>

<style scoped>
@keyframes spin {
  to { transform: rotate(360deg); }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
