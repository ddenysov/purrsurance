<template>
  <div>
    <!-- Render HTML content from markdown for assistant -->
    <div 
      v-if="message.sender === 'assistant'"
      class="prose prose-sm max-w-none"
      v-html="message.content"
    />
    
    <!-- Plain text for user messages -->
    <p 
      v-else
      class="text-sm whitespace-pre-wrap break-words"
    >
      {{ message.content }}
    </p>
  </div>
</template>

<script setup lang="ts">
import type { ChatMessage } from '~/types'

interface Props {
  message: ChatMessage
}

defineProps<Props>()
</script>

