<template>
  <div 
    :class="messageClasses"
    class="flex items-start space-x-3 max-w-xs lg:max-w-md"
  >
    <!-- Avatar (Assistant only) -->
    <div v-if="message.sender === 'assistant'" class="flex-shrink-0">
      <div class="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center">
        <svg class="w-4 h-4 text-brand-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C8.5 2 6 4.5 6 8c0 1.5.5 2.8 1.3 3.8L12 22l4.7-10.2C17.5 10.8 18 9.5 18 8c0-3.5-2.5-6-6-6zm0 8c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
        </svg>
      </div>
    </div>
    
    <!-- Message Content -->
    <div class="flex-1">
      <div 
        :class="bubbleClasses"
        class="px-4 py-3 rounded-2xl"
      >
        <!-- HTML content for assistant messages, plain text for user messages -->
        <div 
          v-if="message.sender === 'assistant'"
          v-html="sanitizedContent"
          class="text-sm text-gray-900"
        ></div>
        <div 
          v-else
          class="text-sm text-white"
        >
          {{ message.content }}
        </div>
      </div>
      
      <!-- Timestamp -->
      <div 
        :class="timestampClasses"
        class="text-xs mt-1"
      >
        {{ formatTime(message.timestamp) }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChatMessage } from '~/types'
import { sanitizeHtml } from '~/utils/sanitize'
import { formatTime } from '~/utils/dateFormatter'

interface Props {
  message: ChatMessage
}

const props = defineProps<Props>()

// Computed properties for styling
const messageClasses = computed(() => {
  return props.message.sender === 'user' 
    ? 'flex-row-reverse space-x-reverse ml-auto' 
    : 'mr-auto'
})

const bubbleClasses = computed(() => {
  return props.message.sender === 'user'
    ? 'bg-mint-500'
    : 'bg-gray-100'
})

const timestampClasses = computed(() => {
  return props.message.sender === 'user'
    ? 'text-gray-400 text-right'
    : 'text-gray-500'
})

// Sanitize HTML content for assistant messages
const sanitizedContent = computed(() => {
  if (props.message.sender === 'assistant') {
    return sanitizeHtml(props.message.content)
  }
  return props.message.content
})
</script>
