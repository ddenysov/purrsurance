<template>
  <div class="min-h-screen bg-gradient-to-br from-mint-50 to-brand-50">
    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Left Column: Pet Profile (1 column on mobile, 1 column on desktop) -->
        <div class="lg:col-span-1">
          <PetProfile
            :pet="pet"
            :vaccinations="vaccinations"
            :appointments="appointments"
            :quick-actions="quickActions"
            @edit-profile="openModal"
            @action-click="handleQuickAction"
          />
        </div>
        
        <!-- Right Column: Chat Container (1 column on mobile, 2 columns on desktop) -->
        <div class="lg:col-span-2">
          <ChatContainer
            :messages="messages"
            :is-typing="isTyping"
            @send="handleSendMessage"
            @suggestion-click="handleSuggestionClick"
          />
        </div>
      </div>
    </main>
    
    <!-- Footer -->
    <AppFooter />
    
    <!-- Pet Profile Modal -->
    <PetProfileModal
      :is-open="isModalOpen"
      :pet="pet"
      @close="closeModal"
      @save="handleSaveProfile"
    />
  </div>
</template>

<script setup lang="ts">
import type { QuickAction } from '~/types'

// Use composables
const { pet, vaccinations, appointments, updatePetProfile } = usePetProfile()
const { messages, isTyping, sendMessage } = useChat()
const { isOpen: isModalOpen, openModal, closeModal } = useModal()

// Quick actions data
const quickActions = ref<QuickAction[]>([
  {
    id: '1',
    label: 'Check Policy',
    color: '#10B981',
    prompt: 'Tell me about my policy coverage'
  },
  {
    id: '2',
    label: 'Find Vet',
    color: '#3B82F6',
    prompt: 'Help me find a veterinarian near me'
  },
  {
    id: '3',
    label: 'Submit Claim',
    color: '#F59E0B',
    prompt: 'I need to submit a claim'
  },
  {
    id: '4',
    label: 'Emergency',
    color: '#EF4444',
    prompt: 'This is a pet emergency'
  }
])

// Handle quick action clicks
const handleQuickAction = (actionId: string) => {
  const action = quickActions.value.find(a => a.id === actionId)
  if (action) {
    // For now, just send the prompt as a message
    // In a real app, you might want to populate the chat input instead
    sendMessage(action.prompt)
  }
}

// Handle suggestion clicks
const handleSuggestionClick = (suggestion: string) => {
  sendMessage(suggestion)
}

// Handle sending messages
const handleSendMessage = (message: string) => {
  sendMessage(message)
}

// Handle saving pet profile
const handleSaveProfile = (petData: typeof pet.value) => {
  updatePetProfile(petData)
  closeModal()
}

// Set page title
useHead({
  title: 'Purrsurance - AI Pet Insurance Assistant'
})
</script>