<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 overflow-y-auto"
    @click.self="$emit('close')"
  >
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"></div>
    
    <!-- Modal -->
    <div class="flex min-h-full items-center justify-center p-4">
      <div class="relative bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Редагувати профіль улюбленця</h2>
          <button
            @click="$emit('close')"
            class="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Закрити вікно"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <!-- Form -->
        <form @submit.prevent="handleSave" class="p-6 space-y-4">
          <!-- Name -->
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700 mb-1">
              Ім’я улюбленця *
            </label>
            <input
              id="name"
              v-model="formData.name"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mint-500 focus:border-transparent"
            />
          </div>
          
          <!-- Species -->
          <div>
            <label for="species" class="block text-sm font-medium text-gray-700 mb-1">
              Вид *
            </label>
            <select
              id="species"
              v-model="formData.species"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mint-500 focus:border-transparent"
            >
              <option value="">Оберіть вид</option>
              <option value="Cat">Кіт</option>
              <option value="Dog">Собака</option>
              <option value="Bird">Птах</option>
              <option value="Rabbit">Кролик</option>
              <option value="Other">Інше</option>
            </select>
          </div>
          
          <!-- Age -->
          <div>
            <label for="age" class="block text-sm font-medium text-gray-700 mb-1">
              Вік *
            </label>
            <input
              id="age"
              v-model="formData.age"
              type="text"
              placeholder="наприклад: 2 роки, 6 місяців"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mint-500 focus:border-transparent"
            />
          </div>
          
          <!-- Gender -->
          <div>
            <label for="gender" class="block text-sm font-medium text-gray-700 mb-1">
              Стать *
            </label>
            <select
              id="gender"
              v-model="formData.gender"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mint-500 focus:border-transparent"
            >
              <option value="">Оберіть стать</option>
              <option value="Male">Самець</option>
              <option value="Female">Самка</option>
            </select>
          </div>
          
          <!-- Policy ID -->
          <div>
            <label for="policyId" class="block text-sm font-medium text-gray-700 mb-1">
              Номер полісу *
            </label>
            <input
              id="policyId"
              v-model="formData.policyId"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mint-500 focus:border-transparent"
            />
          </div>
          
          <!-- Coverage Plan -->
          <div>
            <label for="coveragePlan" class="block text-sm font-medium text-gray-700 mb-1">
              Тариф *
            </label>
            <select
              id="coveragePlan"
              v-model="formData.coveragePlan"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mint-500 focus:border-transparent"
            >
              <option value="">Оберіть тариф</option>
              <option value="Basic 60%">Basic 60%</option>
              <option value="Standard 70%">Standard 70%</option>
              <option value="Premium 80%">Premium 80%</option>
              <option value="Ultimate 90%">Ultimate 90%</option>
            </select>
          </div>
          
          <!-- Avatar URL -->
          <div>
            <label for="avatar" class="block text-sm font-medium text-gray-700 mb-1">
              URL фото
            </label>
            <input
              id="avatar"
              v-model="formData.avatar"
              type="url"
              placeholder="https://example.com/pet-image.jpg"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mint-500 focus:border-transparent"
            />
          </div>
        </form>
        
        <!-- Footer -->
        <div class="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            @click="$emit('close')"
            class="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Скасувати
          </button>
          <button
            @click="handleSave"
            class="px-4 py-2 bg-mint-500 text-white rounded-lg hover:bg-mint-600 transition-colors"
          >
            Зберегти
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Pet } from '~/types'

interface Props {
  isOpen: boolean
  pet: Pet
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  save: [petData: Pet]
}>()

// Form data
const formData = ref<Pet>({
  id: '',
  name: '',
  species: '',
  age: '',
  gender: '',
  avatar: '',
  policyId: '',
  coveragePlan: ''
})

// Initialize form data when modal opens
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    formData.value = { ...props.pet }
  }
})

// Handle save
const handleSave = () => {
  // Validate required fields
  if (!formData.value.name || !formData.value.species || !formData.value.age || 
      !formData.value.gender || !formData.value.policyId || !formData.value.coveragePlan) {
    return
  }
  
  emit('save', { ...formData.value })
  emit('close')
}
</script>
