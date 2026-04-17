import type { ChatMessage } from '~/types'
import { useChatApi } from './useApi'
import { generateAIResponse, generateFollowUpSuggestions, containsPolicyId } from '~/utils/aiReply'
import { usePetProfile } from './usePetProfile'

// Example of how to integrate the API client with existing chat functionality
export const useChatWithApi = () => {
  // Use the API composable
  const { sendMessage: apiSendMessage, isLoading: apiLoading, error: apiError } = useChatApi()
  
  // Chat messages state
  const messages = ref<ChatMessage[]>([
    {
      id: '1',
      content: 'Hello! I\'m your Вет Експерт AI assistant. I\'m here to help you with your pet insurance needs. How can I assist you today?',
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

  // Send user message with API integration
  const sendMessage = async (text: string, userId?: string, conversationId?: string) => {
    if (!text.trim()) return

    // Add user message
    addMessage({
      content: text.trim(),
      sender: 'user'
    })

    // Show typing indicator
    isTyping.value = true

    try {
      // Try to send message via API first
      if (userId && conversationId) {
        const apiResponse = await apiSendMessage(text, conversationId, userId)
        
        if (apiResponse?.data) {
          // Add API response
          addMessage({
            content: apiResponse.data.message,
            sender: 'assistant'
          })
          
          // Check if message contains policy ID and unlock pet details
          if (containsPolicyId(text)) {
            const { unlockPetDetails } = usePetProfile()
            unlockPetDetails()
          }
          
          return
        }
      }
      
      // Fallback to local AI response if API fails or no user/conversation ID
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
      
      const aiResponse = generateAIResponse(text)
      
      // Check if message contains policy ID and unlock pet details
      if (containsPolicyId(text)) {
        const { unlockPetDetails } = usePetProfile()
        unlockPetDetails()
      }
      
      // Add AI response
      addMessage({
        content: aiResponse,
        sender: 'assistant'
      })
      
    } catch (error) {
      console.error('Error sending message:', error)
      
      // Fallback to local AI response on error
      const aiResponse = generateAIResponse(text)
      addMessage({
        content: aiResponse,
        sender: 'assistant'
      })
    } finally {
      // Hide typing indicator
      isTyping.value = false
    }
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
    isLoading: readonly(apiLoading),
    error: readonly(apiError),
    sendMessage,
    addMessage,
    simulateTyping,
    clearMessages,
    getLastMessage,
    getMessagesBySender
  }
}
