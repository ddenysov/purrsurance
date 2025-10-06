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
const { sessionId } = useSession()

// Use pet profile store
const petProfileStore = usePetProfileStore()

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

// Validate and populate pet profile from policy_updated event
const handlePolicyUpdated = (event: SSEEvent) => {
  console.log('[PetProfile] Processing policy_updated event:', event)
  
  try {
    // Validate event structure
    if (!event || typeof event !== 'object') {
      console.error('[PetProfile] Invalid event structure:', event)
      return
    }
    
    // Extract data from SSE event structure
    // SSE events have: { type, id, timestamp, payload }
    // policy_updated payload contains: { eventType, timestamp, data }
    let eventData = null
    
    // Type guard to check for payload property
    const eventWithPayload = event as any
    
    if (eventWithPayload.payload && typeof eventWithPayload.payload === 'object') {
      // Data is in payload.data (SSE structure)
      eventData = eventWithPayload.payload.data || eventWithPayload.payload
    } else if (event.data && typeof event.data === 'object') {
      // Fallback: data is directly in event.data
      eventData = event.data
    } else {
      // Last fallback: use event itself
      eventData = event
    }
    
    // Check if data exists
    if (!eventData || typeof eventData !== 'object') {
      console.error('[PetProfile] Missing or invalid event data:', eventData)
      return
    }
    
    // Validate that we have at least some required fields
    if (!eventData.pet && !eventData.policy && !eventData.owner) {
      console.warn('[PetProfile] Event data is missing all primary fields:', eventData)
      return
    }
    
    // Build validated profile data
    const profileData: any = {}
    
    // Validate and add pet data
    if (eventData.pet && typeof eventData.pet === 'object') {
      profileData.pet = {
        id: eventData.pet.id || '',
        name: eventData.pet.name || '',
        species: ['cat', 'dog', 'bird', 'rabbit', 'other'].includes(eventData.pet.species) 
          ? eventData.pet.species 
          : 'cat',
        breed: eventData.pet.breed || '',
        sex: ['male', 'female'].includes(eventData.pet.sex) ? eventData.pet.sex : 'female',
        dateOfBirth: eventData.pet.dateOfBirth || '',
        ageMonths: typeof eventData.pet.ageMonths === 'number' ? eventData.pet.ageMonths : 0,
        color: eventData.pet.color || '',
        microchip: eventData.pet.microchip || { number: '', issuer: '', dateImplanted: '' },
        identifiers: eventData.pet.identifiers || { licenseTag: '', passportNumber: '' },
        photoUrl: eventData.pet.photoUrl || '',
        weight: eventData.pet.weight || { currentKg: 0, lastUpdated: '', history: [] },
        spayedNeutered: Boolean(eventData.pet.spayedNeutered),
        lifestyle: eventData.pet.lifestyle || { 
          indoor: false, 
          outdoor: false, 
          activityLevel: 'moderate', 
          diet: 'dry' 
        }
      }
      console.log('[PetProfile] Validated pet data:', profileData.pet)
    }
    
    // Validate and add owner data
    if (eventData.owner && typeof eventData.owner === 'object') {
      profileData.owner = {
        id: eventData.owner.id || '',
        fullName: eventData.owner.fullName || '',
        phone: eventData.owner.phone || '',
        email: eventData.owner.email || '',
        address: eventData.owner.address || { 
          country: '', 
          city: '', 
          street: '', 
          postalCode: '' 
        }
      }
      console.log('[PetProfile] Validated owner data:', profileData.owner)
    }
    
    // Validate and add policy data
    if (eventData.policy && typeof eventData.policy === 'object') {
      profileData.policy = {
        policyId: eventData.policy.policyId || '',
        provider: eventData.policy.provider || '',
        status: ['active', 'inactive', 'pending', 'expired'].includes(eventData.policy.status)
          ? eventData.policy.status
          : 'inactive',
        startDate: eventData.policy.startDate || '',
        endDate: eventData.policy.endDate || '',
        plan: eventData.policy.plan || '',
        coverage: eventData.policy.coverage || {
          annualLimitUAH: 0,
          deductibleUAH: 0,
          copayPercent: 0,
          covered: [],
          exclusions: []
        }
      }
      console.log('[PetProfile] Validated policy data:', profileData.policy)
    }
    
    // Validate and add medical data
    if (eventData.medical && typeof eventData.medical === 'object') {
      profileData.medical = {
        allergies: Array.isArray(eventData.medical.allergies) ? eventData.medical.allergies : [],
        conditions: Array.isArray(eventData.medical.conditions) ? eventData.medical.conditions : [],
        vaccinations: Array.isArray(eventData.medical.vaccinations) ? eventData.medical.vaccinations : [],
        medications: Array.isArray(eventData.medical.medications) ? eventData.medical.medications : [],
        lastCheckup: eventData.medical.lastCheckup || {
          date: '',
          clinic: { id: '', name: '', phone: '' },
          notes: ''
        },
        procedures: Array.isArray(eventData.medical.procedures) ? eventData.medical.procedures : []
      }
      console.log('[PetProfile] Validated medical data:', profileData.medical)
    }
    
    // Validate and add claims
    if (Array.isArray(eventData.claims)) {
      profileData.claims = eventData.claims
      console.log('[PetProfile] Added claims data:', profileData.claims)
    }
    
    // Validate and add vet contacts
    if (Array.isArray(eventData.vetContacts)) {
      profileData.vetContacts = eventData.vetContacts
      console.log('[PetProfile] Added vet contacts:', profileData.vetContacts)
    }
    
    // Validate and add audit data
    if (eventData.audit && typeof eventData.audit === 'object') {
      profileData.audit = {
        createdAt: eventData.audit.createdAt || new Date().toISOString(),
        updatedAt: eventData.audit.updatedAt || new Date().toISOString(),
        source: eventData.audit.source || 'sse-event',
        version: typeof eventData.audit.version === 'number' ? eventData.audit.version : 1
      }
      console.log('[PetProfile] Validated audit data:', profileData.audit)
    }
    
    // Update the store if we have valid data
    if (Object.keys(profileData).length > 0) {
      petProfileStore.updatePetProfile(profileData)
      console.log('[PetProfile] Successfully updated pet profile store')
      
      // Unlock pet details in the UI
      unlockPetDetails()
      console.log('[PetProfile] Unlocked pet details in UI')
    } else {
      console.warn('[PetProfile] No valid data to update')
    }
    
  } catch (error) {
    console.error('[PetProfile] Error processing policy_updated event:', error)
  }
}

// Set page title
useHead({
  title: 'Purrsurance - AI Pet Insurance Assistant'
})

// SSE subscription: logs every event to the console and cleans up on unmount
const sseBaseUrl = 'https://asjkb24j5o4k4ilysst57irqy40ethca.lambda-url.us-east-1.on.aws/stream'
let eventSource: EventSource | null = null

onMounted(() => {
  try {
    // Append sessionId to SSE URL
    const sseUrl = `${sseBaseUrl}?sessionId=${sessionId.value}`
    console.log('[SSE] Connecting with session ID:', sessionId.value)
    
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

    onEvent('policy_updated', (event) => {
      console.log('[EventBus] Policy updated event received:', event)
      latestPolicyEvent.value = event
      // Process and validate policy_updated event
      handlePolicyUpdated(event)
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