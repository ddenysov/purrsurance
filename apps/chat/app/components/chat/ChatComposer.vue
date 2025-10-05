<template>
  <div class="p-4 border-t border-gray-100">
    <!-- Help Text -->
    <div class="text-xs text-gray-500 mb-3">
      Press Enter to send, Shift+Enter for new line
    </div>
    
    <!-- Input Area -->
    <div class="flex items-end space-x-3">
      <!-- Textarea -->
      <div class="flex-1 relative">
        <textarea
          ref="textareaRef"
          v-model="message"
          @keydown="handleKeydown"
          @input="autoResize"
          placeholder="Type your message..."
          class="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-mint-500 focus:border-transparent"
          rows="1"
        ></textarea>
        
        <!-- Attach Button -->
        <button
          class="absolute right-3 top-3 p-1 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Attach file"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>
      </div>
      
      <!-- Send Button -->
      <button
        @click="sendMessage"
        :disabled="!message.trim()"
        class="px-4 py-3 bg-mint-500 text-white rounded-xl hover:bg-mint-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        aria-label="Send message"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const message = ref('')
const textareaRef = ref<HTMLTextAreaElement>()

const emit = defineEmits<{
  send: [message: string]
}>()

// Auto-resize textarea
const autoResize = () => {
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
    textareaRef.value.style.height = `${textareaRef.value.scrollHeight}px`
  }
}

// Handle keyboard events
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}

// Send message
const sendMessage = () => {
  if (message.value.trim()) {
    emit('send', message.value.trim())
    message.value = ''
    // Reset textarea height
    if (textareaRef.value) {
      textareaRef.value.style.height = 'auto'
    }
  }
}

// Focus textarea on mount
onMounted(() => {
  textareaRef.value?.focus()
})
</script>
