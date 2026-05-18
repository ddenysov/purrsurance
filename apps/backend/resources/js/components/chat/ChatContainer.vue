<template>
  <div
    class="flex h-[min(72vh,900px)] min-h-[20rem] w-full flex-col rounded-xl border border-gray-200 bg-white shadow-sm"
  >
    <!-- Chat Header -->
    <ChatHeader />
    
    <!-- Chat Messages -->
    <ChatMessages 
      :messages="messages"
      :is-typing="isTyping"
      :error="error"
    />
    
    <!-- Chat Composer -->
    <ChatComposer @send="$emit('send', $event)" />
  </div>
</template>

<script setup lang="ts">
import type { ChatMessage } from '@/types'
import ChatComposer from './ChatComposer.vue'
import ChatHeader from './ChatHeader.vue'
import ChatMessages from './ChatMessages.vue'

interface Props {
    messages: ReadonlyArray<ChatMessage> | ChatMessage[];
    isTyping: boolean;
    error?: string | null;
}

defineProps<Props>()

defineEmits<{
  send: [message: string]
  'suggestion-click': [suggestion: string]
}>()
</script>
