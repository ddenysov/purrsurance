<template>
  <div 
    :class="[
      'flex gap-3 p-4',
      message.sender === 'user' ? 'justify-end' : 'justify-start'
    ]"
  >
    <!-- Assistant Avatar (left side) -->
    <AssistantAvatar 
      v-if="message.sender === 'assistant'"
      class="flex-shrink-0"
    />
    
    <!-- Message Bubble -->
    <div
      :class="[
        'max-w-[70%] rounded-2xl px-4 py-3',
        message.sender === 'user'
          ? 'bg-purple-600 text-white'
          : 'bg-gray-100 text-gray-900'
      ]"
    >
      <!-- Agent Badge (only for assistant messages) -->
      <div 
        v-if="message.sender === 'assistant' && agentDisplayName"
        class="inline-flex items-center gap-1.5 mb-2 px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs font-medium"
      >
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ agentDisplayName }}</span>
      </div>
      
      <!-- Dynamic message type rendering -->
      <component 
        :is="messageComponent"
        :message="message"
      />
      
      <!-- Timestamp -->
      <div 
        :class="[
          'text-xs mt-1',
          message.sender === 'user' ? 'text-purple-200' : 'text-gray-500'
        ]"
      >
        {{ formatTime(message.timestamp) }}
      </div>
    </div>
    
    <!-- User Avatar (right side) -->
    <div 
      v-if="message.sender === 'user'"
      class="flex-shrink-0 w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-semibold"
    >
      U
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ChatMessage } from '~/types'
import { formatTime } from '~/utils/dateFormatter'
import { getAgentDisplayName } from '~/utils/agentMapper'
import AssistantAvatar from './AssistantAvatar.vue'
import TextMessage from './message-types/TextMessage.vue'
import ConfirmationMessage from './message-types/ConfirmationMessage.vue'

interface Props {
  message: ChatMessage
}

const props = defineProps<Props>()

const messageComponent = computed(() => {
  const type = props.message.type || 'text'
  
  switch (type) {
    case 'confirmation':
      return ConfirmationMessage
    case 'text':
    default:
      return TextMessage
  }
})

// Get user-friendly agent display name
const agentDisplayName = computed(() => {
  return getAgentDisplayName(props.message.agentName)
})
</script>

<style scoped>
/* Markdown prose styles for assistant messages */
.prose {
  @apply text-gray-900;
}

.prose :deep(p) {
  @apply mb-2 last:mb-0;
}

.prose :deep(strong) {
  @apply font-semibold text-gray-900;
}

.prose :deep(em) {
  @apply italic;
}

.prose :deep(h1),
.prose :deep(h2),
.prose :deep(h3),
.prose :deep(h4) {
  @apply font-bold mt-4 mb-2 first:mt-0;
}

.prose :deep(h1) {
  @apply text-xl;
}

.prose :deep(h2) {
  @apply text-lg;
}

.prose :deep(h3) {
  @apply text-base;
}

.prose :deep(ul),
.prose :deep(ol) {
  @apply ml-4 mb-2;
}

.prose :deep(li) {
  @apply mb-1;
}

.prose :deep(ul li) {
  @apply list-disc;
}

.prose :deep(ol li) {
  @apply list-decimal;
}

.prose :deep(a) {
  @apply text-purple-600 hover:text-purple-700 underline;
}

.prose :deep(code) {
  @apply bg-gray-200 px-1 py-0.5 rounded text-sm font-mono;
}

.prose :deep(pre) {
  @apply bg-gray-200 p-2 rounded overflow-x-auto mb-2;
}

.prose :deep(blockquote) {
  @apply border-l-4 border-gray-300 pl-4 italic my-2;
}

.prose :deep(hr) {
  @apply border-gray-300 my-4;
}
</style>
