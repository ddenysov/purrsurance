<template>
  <div class="p-6 bg-white rounded-lg shadow-soft">
    <h2 class="text-2xl font-bold text-gray-800 mb-4">API Client Example</h2>
    
    <!-- Auth Section -->
    <div class="mb-6 p-4 border rounded-lg">
      <h3 class="text-lg font-semibold mb-3">Authentication</h3>
      <div class="space-y-2">
        <input 
          v-model="loginForm.email" 
          type="email" 
          placeholder="Email" 
          class="w-full p-2 border rounded"
        />
        <input 
          v-model="loginForm.password" 
          type="password" 
          placeholder="Password" 
          class="w-full p-2 border rounded"
        />
        <button 
          @click="handleLogin" 
          :disabled="authLoading"
          class="px-4 py-2 bg-brand-500 text-white rounded hover:bg-brand-600 disabled:opacity-50"
        >
          {{ authLoading ? 'Logging in...' : 'Login' }}
        </button>
      </div>
      <div v-if="authError" class="mt-2 text-red-600 text-sm">{{ authError }}</div>
    </div>

    <!-- Chat Section -->
    <div class="mb-6 p-4 border rounded-lg">
      <h3 class="text-lg font-semibold mb-3">Chat API</h3>
      <div class="space-y-2">
        <input 
          v-model="chatMessage" 
          type="text" 
          placeholder="Type a message..." 
          class="w-full p-2 border rounded"
          @keyup.enter="handleSendMessage"
        />
        <button 
          @click="handleSendMessage" 
          :disabled="chatLoading"
          class="px-4 py-2 bg-mint-500 text-white rounded hover:bg-mint-600 disabled:opacity-50"
        >
          {{ chatLoading ? 'Sending...' : 'Send Message' }}
        </button>
      </div>
      <div v-if="chatError" class="mt-2 text-red-600 text-sm">{{ chatError }}</div>
      <div v-if="lastChatResponse" class="mt-2 p-2 bg-gray-100 rounded text-sm">
        <strong>Response:</strong> {{ lastChatResponse }}
      </div>
    </div>

    <!-- Pet Section -->
    <div class="mb-6 p-4 border rounded-lg">
      <h3 class="text-lg font-semibold mb-3">Pet API</h3>
      <div class="space-y-2">
        <input 
          v-model="petForm.name" 
          type="text" 
          placeholder="Pet name" 
          class="w-full p-2 border rounded"
        />
        <input 
          v-model="petForm.species" 
          type="text" 
          placeholder="Species" 
          class="w-full p-2 border rounded"
        />
        <button 
          @click="handleCreatePet" 
          :disabled="petLoading"
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {{ petLoading ? 'Creating...' : 'Create Pet' }}
        </button>
      </div>
      <div v-if="petError" class="mt-2 text-red-600 text-sm">{{ petError }}</div>
      <div v-if="lastPetResponse" class="mt-2 p-2 bg-gray-100 rounded text-sm">
        <strong>Created Pet:</strong> {{ lastPetResponse.name }} ({{ lastPetResponse.species }})
      </div>
    </div>

    <!-- Loading States -->
    <div class="text-sm text-gray-600">
      <div>Auth Loading: {{ authLoading }}</div>
      <div>Chat Loading: {{ chatLoading }}</div>
      <div>Pet Loading: {{ petLoading }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthApi, useChatApi, usePetApi } from '~/composables/useApi'

// Auth composable
const { login, isLoading: authLoading, error: authError } = useAuthApi()

// Chat composable
const { sendMessage, isLoading: chatLoading, error: chatError } = useChatApi()

// Pet composable
const { createPet, isLoading: petLoading, error: petError } = usePetApi()

// Form data
const loginForm = ref({
  email: '',
  password: ''
})

const chatMessage = ref('')
const lastChatResponse = ref('')

const petForm = ref({
  name: '',
  species: ''
})
const lastPetResponse = ref<any>(null)

// Methods
const handleLogin = async () => {
  if (!loginForm.value.email || !loginForm.value.password) return
  
  const response = await login(loginForm.value.email, loginForm.value.password)
  if (response) {
    console.log('Login successful:', response.data)
  }
}

const handleSendMessage = async () => {
  if (!chatMessage.value.trim()) return
  
  const response = await sendMessage(chatMessage.value, 'user-123', 'conv-456')
  if (response) {
    lastChatResponse.value = response.data.message
    chatMessage.value = ''
  }
}

const handleCreatePet = async () => {
  if (!petForm.value.name || !petForm.value.species) return
  
  const response = await createPet('user-123', {
    name: petForm.value.name,
    species: petForm.value.species,
    age: '2 years',
    gender: 'Unknown',
    coveragePlan: 'Basic'
  })
  
  if (response) {
    lastPetResponse.value = response.data
    petForm.value = { name: '', species: '' }
  }
}
</script>
