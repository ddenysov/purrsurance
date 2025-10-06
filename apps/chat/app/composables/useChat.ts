import type { ChatMessage } from '~/types'
import { generateAIResponse, generateFollowUpSuggestions, containsPolicyId } from '~/utils/aiReply'
import { usePetProfile } from './usePetProfile'
import { apiClient } from '~/utils/apiClient'

export const useChat = () => {
  // Chat messages state
  const messages = ref<ChatMessage[]>([
    {
      id: '1',
      content: 'Hello! I\'m your Purrsurance AI assistant. I\'m here to help you with your pet insurance needs. How can I assist you today?',
      sender: 'assistant',
      timestamp: new Date()
    }
  ])

  // Typing indicator state
  const isTyping = ref(false)

  // Generate unique ID for messages
  const generateMessageId = (): string => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9)
  }

  // Add message to chat
  const addMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: generateMessageId(),
      timestamp: new Date()
    }
    messages.value.push(newMessage)
  }

  // Send user message and generate AI response
  const sendMessage = async (text: string) => {
    if (!text.trim()) return

    // Add user message
    addMessage({
      content: text.trim(),
      sender: 'user'
    })

    // Show typing indicator
    isTyping.value = true

    // Simulate AI thinking time
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))

    // Generate AI response
    const aiResponse = generateAIResponse(text)

    // Hide typing indicator
    isTyping.value = false

      // Check if message contains policy ID and unlock pet details
      if (containsPolicyId(text)) {
          // Get access to pet profile composable
          const { unlockPetDetails } = usePetProfile()
          unlockPetDetails()
          
          // Send request to backend to verify policy
          try {
            const response = await apiClient.get('/hello/', {
              baseURL: 'https://cbx2umgj5k.execute-api.us-east-1.amazonaws.com/Prod'
            })
            console.log('Backend response:', response.data)
          } catch (error) {
            console.error('Backend request failed:', error)
          }
      }

    // Add AI response
    addMessage({
      content: aiResponse,
      sender: 'assistant'
    })
  }

  // Simulate typing with delay
  const simulateTyping = async (delay: number = 1000) => {
    isTyping.value = true
    await new Promise(resolve => setTimeout(resolve, delay))
    isTyping.value = false
  }

  // Clear all messages
  const clearMessages = () => {
    messages.value = []
  }

  // Get last message
  const getLastMessage = (): ChatMessage | undefined => {
    return messages.value[messages.value.length - 1]
  }

  // Get messages by sender
  const getMessagesBySender = (sender: 'user' | 'assistant'): ChatMessage[] => {
    return messages.value.filter(msg => msg.sender === sender)
  }

  return {
    messages: readonly(messages),
    isTyping: readonly(isTyping),
    sendMessage,
    addMessage,
    simulateTyping,
    clearMessages,
    getLastMessage,
    getMessagesBySender
  }
}
