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
            :is-policy-verified="isPolicyVerified"
            @edit-profile="openModal"
            @action-click="handleQuickAction"
          />
        </div>
        
        <!-- Right Column: Chat Container (1 column on mobile, 2 columns on desktop) -->
        <div class="lg:col-span-2">
          <ChatContainer
            :messages="messages"
            :is-typing="isTyping"
            :error="error"
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
import type { SSEEvent } from '~/composables/useEventBus'

// Use composables
const { pet, vaccinations, appointments, isPolicyVerified, updatePetProfile, unlockPetDetails } = usePetProfile()
const { messages, isTyping, error, sendMessage } = useChat()
const { isOpen: isModalOpen, openModal, closeModal } = useModal()
const { emit: emitEvent, on: onEvent, events: eventHistory, getLatestEventByType } = useEventBus()

// Reactive state for displaying events
const latestClaimEvent = ref<SSEEvent | null>(null)
const latestPolicyEvent = ref<SSEEvent | null>(null)

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

// SSE subscription: logs every event to the console and cleans up on unmount
const sseUrl = 'https://asjkb24j5o4k4ilysst57irqy40ethca.lambda-url.us-east-1.on.aws/stream'
let eventSource: EventSource | null = null

onMounted(() => {
  try {
    eventSource = new EventSource(sseUrl)

    eventSource.onopen = () => {
      console.log('[SSE] connection opened')
    }

    eventSource.onmessage = (event) => {
      console.log('[SSE] message', event.data)
      
      try {
        // Parse the event data
        const eventData = JSON.parse(event.data)
        
        // Emit to Vue event bus
        emitEvent(eventData.type, eventData)
      } catch (error) {
        console.error('[SSE] Failed to parse event data:', error)
        console.log('[SSE] Raw event data:', event.data)
      }
    }

    // Set up Vue event bus listeners
    onEvent('claim_status', (event) => {
      console.log('[EventBus] Claim status update:', event)
      latestClaimEvent.value = event
      // Here you can add specific logic for claim status updates
      // For example, show a notification, update UI, etc.
    })

    onEvent('policy_update', (event) => {
      console.log('[EventBus] Policy update:', event)
      latestPolicyEvent.value = event
      // Set policy as verified when policy_update event is received
      unlockPetDetails()
    })

    // Listen to all events for debugging
    onEvent('*', (event) => {
      console.log('[EventBus] All events:', event.type, event)
    })

    eventSource.onerror = (error) => {
      console.error('[SSE] error', error)
    }
  } catch (error) {
    console.error('[SSE] initialization failed', error)
  }
})

onBeforeUnmount(() => {
  if (eventSource) {
    eventSource.close()
    eventSource = null
    console.log('[SSE] connection closed')
  }
})
</script>