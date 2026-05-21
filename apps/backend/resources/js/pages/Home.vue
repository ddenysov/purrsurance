<template>
    <AppLayout>
        <Head title="Вет Експерт — ШІ-помічник зі страхування улюбленців" />

        <div class="min-h-screen bg-white">
            <!-- Content (not a nested <main> — layout already has one from AppLayout) -->
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    <!-- Pet profile: second on mobile, left column on lg+ -->
                    <div class="order-2 min-w-0 lg:order-1 lg:col-span-1">
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

                    <!-- Chat: first on mobile so it is visible without scrolling -->
                    <div class="order-1 min-w-0 lg:order-2 lg:col-span-2">
                        <ChatContainer
                            :messages="messages"
                            :is-typing="isTyping"
                            :error="error"
                            @send="handleSendMessage"
                            @suggestion-click="handleSuggestionClick"
                        />
                    </div>
                </div>
            </div>
        </div>
    </AppLayout>
</template>

<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import { onMounted, ref, watch } from 'vue';
import ChatContainer from '@/components/chat/ChatContainer.vue';
import PetProfile from '@/components/pet/PetProfile.vue';
import { useChat } from '@/composables/useChat';
import type { SSEEvent } from '@/composables/useEventBus';
import { useEventBus } from '@/composables/useEventBus';
import { useModal } from '@/composables/useModal';
import { usePetProfile } from '@/composables/usePetProfile';
import { usePolicyDetailsFromEvent } from '@/composables/usePolicyDetailsFromEvent';
import { useSession } from '@/composables/useSession';
import AppLayout from '@/layouts/AppLayout.vue';
import { useEventQueueStore } from '@/stores/eventQueue';
import type { QuickAction } from '@/types';

const { pet, vaccinations, appointments, isPolicyVerified } = usePetProfile();
const { applyPolicyDetailsFromEvent } = usePolicyDetailsFromEvent();
const { messages, isTyping, error, sendMessage, addMessage } = useChat();
const { openModal } = useModal();
const { emit: emitEvent, on: onEvent, publishToListeners } = useEventBus();
const { sessionId } = useSession();

const eventQueueStore = useEventQueueStore();

// Reactive state for displaying events
const latestClaimEvent = ref<SSEEvent | null>(null)
const latestPolicyEvent = ref<SSEEvent | null>(null)

// Quick actions data
const quickActions = ref<QuickAction[]>([
  {
    id: '1',
    label: 'Перевірити поліс',
    color: '#10B981',
    prompt: 'Мій номер полісу POL-2025-123456'
  },
  {
    id: '2',
    label: 'Знайти ветеринара',
    color: '#3B82F6',
    prompt: 'Допоможіть знайти ветеринара поруч зі мною'
  },
  {
    id: '3',
    label: 'Подати заяву',
    color: '#F59E0B',
    prompt: 'Мені потрібно подати заяву на відшкодування'
  },
  {
    id: '4',
    label: 'Надзвичайна ситуація',
    color: '#EF4444',
    prompt: 'Моєму улюбленцю потрібна термінова допомога. Знайдіть клініку.'
  }
])

// Handle quick action clicks
const handleQuickAction = (actionId: string) => {
  const action = quickActions.value.find(a => a.id === actionId)

  if (action) {
    // Check if this is Check Policy action
    if (actionId === '1') {
      // Emit RequestPolicyDetails event to event bus
      emitEvent('RequestPolicyDetails', {
        id: generateEventId(),
        timestamp: new Date().toISOString(),
        type: 'RequestPolicyDetails',
        data: {
          source: 'check_policy_button',
          sessionId: sessionId.value
        }
      })
      console.log('[Policy] RequestPolicyDetails event emitted')
    }
    
    // Check if this is Emergency action
    if (actionId === '4') {
      // Emit RequestEmergency event to event bus
      emitEvent('RequestEmergency', {
        id: generateEventId(),
        timestamp: new Date().toISOString(),
        type: 'RequestEmergency',
        data: {
          source: 'emergency_button',
          sessionId: sessionId.value
        }
      })
      console.log('[Emergency] RequestEmergency event emitted')
    }
    
    // For now, just send the prompt as a message
    // In a real app, you might want to populate the chat input instead
    sendMessage(action.prompt, true)
  }
}

// Helper function to generate event ID
const generateEventId = (): string => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9)
}

// Handle suggestion clicks
const handleSuggestionClick = (suggestion: string) => {
  sendMessage(suggestion)
}

// Handle sending messages
const handleSendMessage = (message: string) => {
  sendMessage(message)
}

// Handle RecommendDoctorVisit event
const handleRecommendDoctorVisit = (event: SSEEvent) => {
  console.log('[DoctorVisit] Processing RecommendDoctorVisit event:', event)

  try {
    // Extract event data
    const eventWithPayload = event as any
    const eventData = eventWithPayload.payload?.data || eventWithPayload.data || {}

    // Create a confirmation message for doctor visit
    const message = eventData.message ||
      'За описаними симптомами варто записатися до ветеринара. Забронювати візит?'

    addMessage({
      content: message,
      sender: 'assistant',
      type: 'confirmation',
      metadata: {
        confirmationOptions: {
          yesLabel: 'Так, записатися',
          noLabel: 'Не зараз',
          yesEvent: 'doctor_visit:confirmed',
          noEvent: 'doctor_visit:declined',
          eventPayload: {
            source: 'recommend_doctor_visit',
            timestamp: event.timestamp,
            eventId: event.id,
            ...eventData
          }
        }
      }
    })

    console.log('[DoctorVisit] Added confirmation message to chat')
  } catch (error) {
    console.error('[DoctorVisit] Error processing RecommendDoctorVisit event:', error)
  }
}

onMounted(() => {
  eventQueueStore.setPublishCallback((event: SSEEvent) => {
    publishToListeners(event.type, event)
  })

  watch(isTyping, (newValue) => {
    eventQueueStore.setAgentThinking(newValue)
  }, { immediate: true })

  onEvent('claim_status', (event) => {
    console.log('[EventBus] Claim status update:', event)
    latestClaimEvent.value = event
  })

  onEvent('PolicyDetailsRetrieved', (event) => {
    console.log('[EventBus] PolicyDetailsRetrieved received:', event)
    latestPolicyEvent.value = event
    applyPolicyDetailsFromEvent(event)
  })

  onEvent('ReccomendDoctorVisit', (event) => {
    console.log('[EventBus] ReccomendDoctorVisit event received:', event)
    handleRecommendDoctorVisit(event)
  })

  onEvent('doctor_visit:confirmed', (event) => {
    console.log('[EventBus] User confirmed doctor visit:', event)
    addMessage({
      content: 'Чудово! Допоможу знайти доступні записи до ветеринарів у вашій зоні.',
      sender: 'assistant'
    })
    sendMessage('Забронюйте для мене візит у ветклініку. Які клініки доступні і на який час?', true);
  })

  onEvent('doctor_visit:declined', (event) => {
    console.log('[EventBus] User declined doctor visit:', event)
    addMessage({
      content: 'Зрозуміло. Якщо стан погіршиться або передумаєте — звертайтесь, допоможу з записом.',
      sender: 'assistant'
    })
  })

  onEvent('RequestEmergency', (event) => {
    console.log('[EventBus] RequestEmergency event received:', event)
  })

  onEvent('*', (event) => {
    console.log('[EventBus] All events:', event.type, event)
  })
})
</script>