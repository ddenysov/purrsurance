<template>
  <div class="bg-white rounded-xl shadow-soft flex flex-col" style="height: 72vh;">
    <!-- Chat Header -->
    <ChatHeader />
    
    <!-- Chat Messages -->
    <ChatMessages 
      :messages="messages"
      :is-typing="isTyping"
      @suggestion-click="$emit('suggestion-click', $event)"
    />
    
    <!-- Chat Composer -->
    <ChatComposer @send="$emit('send', $event)" />
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
  send: [message: string]
  'suggestion-click': [suggestion: string]
}>()
</script>
