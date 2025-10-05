<template>
  <div class="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
    <!-- Messages -->
    <ChatMessage
      v-for="message in messages"
      :key="message.id"
      :message="message"
    />
    
    <!-- Typing Indicator -->
    <ChatTypingIndicator v-if="isTyping" />
    
    <!-- Welcome Message with Suggestions (if no messages) -->
    <div v-if="messages.length === 0" class="space-y-4">
      <div class="text-center text-gray-500 text-sm">
        Start a conversation with your Purrsurance AI assistant
      </div>
      
      <!-- Suggestion Buttons -->
      <div class="flex flex-wrap gap-2 justify-center">
        <button
          v-for="suggestion in suggestions"
          :key="suggestion"
          @click="$emit('suggestion-click', suggestion)"
          class="px-3 py-2 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
        >
          {{ suggestion }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChatMessage } from '~/types'

interface Props {
  messages: ChatMessage[]
  isTyping: boolean
}

defineProps<Props>()

defineEmits<{
  'suggestion-click': [suggestion: string]
}>()

// Default suggestions
const suggestions = [
  'Tell me about my policy',
  'Find a veterinarian',
  'Submit a claim'
]
</script>
