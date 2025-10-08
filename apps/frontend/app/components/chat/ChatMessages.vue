<template>
  <div class="flex-1 overflow-y-auto p-4 space-y-2">
    <!-- Error banner -->
    <div 
      v-if="error"
      class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
    >
      <svg 
        class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" 
        fill="currentColor" 
        viewBox="0 0 20 20"
      >
        <path 
          fill-rule="evenodd" 
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
          clip-rule="evenodd" 
        />
      </svg>
      <div class="flex-1">
        <h4 class="text-sm font-semibold text-red-800">Connection Error</h4>
        <p class="text-sm text-red-700 mt-1">{{ error }}</p>
      </div>
    </div>

    <!-- Messages -->
    <ChatMessageComponent
      v-for="message in messages"
      :key="message.id"
      :message="message"
    />
    
    <!-- Typing indicator -->
    <ChatTypingIndicator v-if="isTyping" />
  </div>
</template>

<script setup lang="ts">
import type { ChatMessage } from '~/types'
import ChatMessageComponent from './ChatMessage.vue'
import ChatTypingIndicator from './ChatTypingIndicator.vue'

interface Props {
  messages: readonly ChatMessage[]
  isTyping: boolean
  error?: string | null
}

defineProps<Props>()
</script>
