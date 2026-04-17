<template>
  <div>
    <!-- Question text -->
    <div 
      class="prose prose-sm max-w-none mb-4"
      v-html="message.content"
    />
    
    <!-- Action buttons -->
    <div class="flex gap-3 mt-3">
      <button
        @click="handleChoice('yes')"
        :disabled="isAnswered"
        :class="[
          'px-4 py-2 rounded-lg text-sm font-medium transition-all',
          isAnswered && selectedChoice === 'yes'
            ? 'bg-green-600 text-white'
            : isAnswered
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-green-500 text-white hover:bg-green-600'
        ]"
      >
        {{ confirmationOptions?.yesLabel || 'Так' }}
      </button>
      
      <button
        @click="handleChoice('no')"
        :disabled="isAnswered"
        :class="[
          'px-4 py-2 rounded-lg text-sm font-medium transition-all',
          isAnswered && selectedChoice === 'no'
            ? 'bg-red-600 text-white'
            : isAnswered
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-red-500 text-white hover:bg-red-600'
        ]"
      >
        {{ confirmationOptions?.noLabel || 'Ні' }}
      </button>
    </div>
    
    <!-- Answer indication -->
    <div v-if="isAnswered" class="mt-2 text-xs text-gray-600 italic">
      Ви обрали: {{ selectedChoice === 'yes' ? confirmationOptions?.yesLabel || 'Так' : confirmationOptions?.noLabel || 'Ні' }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ChatMessage } from '~/types'
import { useEventBus } from '~/composables/useEventBus'
import { useChat } from '~/composables/useChat'

interface Props {
  message: ChatMessage
}

const props = defineProps<Props>()

const eventBus = useEventBus()
const { addMessage } = useChat()
const isAnswered = ref(false)
const selectedChoice = ref<'yes' | 'no' | null>(null)

const confirmationOptions = computed(() => props.message.metadata?.confirmationOptions)

const handleChoice = (choice: 'yes' | 'no') => {
  if (isAnswered.value) return
  
  const eventName = choice === 'yes' 
    ? confirmationOptions.value?.yesEvent 
    : confirmationOptions.value?.noEvent
  
  // Send invisible message with user choice
  const choiceLabel = choice === 'yes' 
    ? (confirmationOptions.value?.yesLabel || 'Так')
    : (confirmationOptions.value?.noLabel || 'Ні')
  
  addMessage({
    content: choiceLabel,
    sender: 'user',
    visible: false // This message will not be displayed in UI
  })
  
  if (eventName) {
    eventBus.emit(eventName, {
      type: eventName,
      id: props.message.id,
      timestamp: Date.now(),
      data: {
        choice,
        messageId: props.message.id,
        ...confirmationOptions.value?.eventPayload
      }
    })
  }
  
  isAnswered.value = true
  selectedChoice.value = choice
}
</script>

