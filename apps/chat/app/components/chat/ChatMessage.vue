<template>
  <div 
    :class="messageClasses"
    class="flex items-start space-x-3 max-w-xs lg:max-w-md"
  >
    <!-- Avatar (Assistant only) -->
    <AssistantAvatar 
      v-if="message.sender === 'assistant'"
      size="sm"
    />
    
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
import AssistantAvatar from './AssistantAvatar.vue'

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
