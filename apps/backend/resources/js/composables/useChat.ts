import { usePage } from '@inertiajs/vue3';
import { computed, ref } from 'vue';
import type { SSEEvent } from '@/composables/useEventBus';
import { usePetProfileStore } from '@/stores/petProfile';
import { useEventQueueStore } from '@/stores/eventQueue';
import type { ChatMessage, ChatSession } from '@/types';
import type { SharedClientConfig } from '@/types/client';
import { sendChatMessage } from '@/utils/chatService';
import { parseMarkdown } from '@/utils/markdown';
import { useSession } from './useSession';

export const useChat = () => {
    const page = usePage();
    const client = computed(() => page.props.client as SharedClientConfig);

    const { sessionId: globalSessionId } = useSession();
    const eventQueueStore = useEventQueueStore();

  // Get pet profile store to access policyId
  const petProfileStore = usePetProfileStore()
  
  // Chat messages state
  const messages = ref<ChatMessage[]>([
    {
      id: '1',
      content: 'Вітаю! 😊\n' +
          'Раді допомогти. Будь ласка, вкажіть номер вашого полісу.\n' +
          'Він потрібен, щоб знайти ваш план і підказати точну інформацію.',
      sender: 'assistant',
      timestamp: new Date()
    }
  ])

  // Typing indicator state
  const isTyping = ref(false)
  
  // Session tracking (for Bedrock Agent session continuity)
  const session = ref<ChatSession>({
    sessionId: null,
    lastMessageTimestamp: undefined,
  })
  
  // Error state
  const error = ref<string | null>(null)

  // Generate unique ID for messages
  const generateMessageId = (): string => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9)
  }

  // Add message to chat
  const addMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: generateMessageId(),
      timestamp: new Date(),
      // If visible is not specified, default to true
      visible: message.visible !== undefined ? message.visible : true
    }
    messages.value.push(newMessage)
    session.value.lastMessageTimestamp = newMessage.timestamp
  }

  // Send user message and get AI response from backend
  const sendMessage = async (text: string, isHidden: boolean = false) => {
    if (!text.trim()) {
return
}

    // Clear any previous errors
    error.value = null

    // Prepare chat history including the current message
    // We send only content and sender to reduce payload size
    const chatHistory = messages.value.map(msg => ({
      content: msg.content,
      sender: msg.sender
    }))
    
    // Add current user message to the history that will be sent
    chatHistory.push({
      content: text.trim(),
      sender: 'user'
    })

    // Add user message to UI
    if (!isHidden) {
        addMessage({
            content: text.trim(),
            sender: 'user'
        })
    }

    
    // Test command for confirmation message
    if (text.trim().toLowerCase() === 'test_form') {
      isTyping.value = false
      addMessage({
        content: 'Бажаєте подати заяву на відшкодування для вашого улюбленця?',
        sender: 'assistant',
        type: 'confirmation',
        metadata: {
          confirmationOptions: {
            yesLabel: 'Так, продовжити',
            noLabel: 'Ні, скасувати',
            yesEvent: 'claim:confirmed',
            noEvent: 'claim:cancelled',
            eventPayload: { source: 'chat', action: 'file_claim' }
          }
        }
      })

      return
    }

    // Show typing indicator
    isTyping.value = true

    try {
      // Get policyId from store if available
      const policyId = petProfileStore.petProfile.policy?.policyId || null
      
      if (policyId) {
        console.log('[Chat] Sending message with policyId:', policyId)
      }
      
      console.log('[Chat] Sending message with chat history:', chatHistory.length, 'messages')
      
      // Send message to backend with sessionIds, policyId, and chat history
      const response = await sendChatMessage(
        text.trim(),
        session.value.sessionId,
        globalSessionId.value,
        policyId,
        chatHistory,
        client.value,
      );
      
      // Update Bedrock session ID for conversation continuity
      if (response.data.sessionId) {
        session.value.sessionId = response.data.sessionId
      }
      
      // Parse markdown in response
      const parsedResponse = parseMarkdown(response.data.response)
      
      // Extract agent name from metadata
      const agentName = response.metadata?.classification || undefined
      
      if (agentName) {
        console.log('[Chat] Message processed by agent:', agentName)
      }
      
      // Hide typing indicator
      isTyping.value = false

      const sideEffectEvents = response.metadata?.events ?? [];
      if (sideEffectEvents.length > 0) {
        console.log('[Chat] Processing side-effect events:', sideEffectEvents.length);
        sideEffectEvents.forEach((event) => {
          eventQueueStore.enqueueEvent(event as SSEEvent);
        });
      }

      const doctorVisitConfirmation = {
        yesLabel: 'Записатися до лікаря',
        noLabel: 'Не зараз',
        yesEvent: 'doctor_visit:confirmed',
        noEvent: 'doctor_visit:declined',
        eventPayload: { source: 'doctor_kotry_chat' },
      } as const

      // Доктор Котик: текст + кнопки запису до ветеринара
      if (agentName === 'DoctorKotryAgent') {
        addMessage({
          content: parsedResponse,
          sender: 'assistant',
          type: 'confirmation',
          agentName,
          metadata: {
            confirmationOptions: { ...doctorVisitConfirmation },
          },
        })
      } else {
        addMessage({
          content: parsedResponse,
          sender: 'assistant',
          agentName: agentName,
        })
      }

    } catch (err: any) {
      // Hide typing indicator
      isTyping.value = false
      
      // Store error
      error.value = err.message || 'Не вдалося надіслати повідомлення'
      
      // Add error message to chat
      addMessage({
        content: `Вибачте, сталася помилка: ${error.value}. Спробуйте ще раз.`,
        sender: 'assistant'
      })
      
      console.error('Error sending message:', err)
    }
  }

  // Simulate typing with delay (for testing purposes)
  const simulateTyping = async (delay: number = 1000) => {
    isTyping.value = true
    await new Promise(resolve => setTimeout(resolve, delay))
    isTyping.value = false
  }

  // Clear all messages and reset session
  const clearMessages = () => {
    messages.value = [{
      id: '1',
      content: 'Вітаю! Я ваш ШІ-помічник Вет Експерт. Допоможу зі страхуванням улюбленця. Чим можу бути корисним?',
      sender: 'assistant',
      timestamp: new Date()
    }]
    session.value = {
      sessionId: null,
      lastMessageTimestamp: undefined,
    }
    error.value = null
  }

  // Get last message
  const getLastMessage = (): ChatMessage | undefined => {
    return messages.value[messages.value.length - 1]
  }

  // Get messages by sender
  const getMessagesBySender = (sender: 'user' | 'assistant'): ChatMessage[] => {
    return messages.value.filter(msg => msg.sender === sender)
  }
  
  // Get current session ID
  const getSessionId = (): string | null => {
    return session.value.sessionId
  }
  
  // Reset session (start new conversation)
  const resetSession = () => {
    session.value = {
      sessionId: null,
      lastMessageTimestamp: undefined,
    }
  }

  return {
    messages,
    isTyping,
    error,
    sessionId: computed(() => session.value.sessionId),
    sendMessage,
    addMessage,
    simulateTyping,
    clearMessages,
    getLastMessage,
    getMessagesBySender,
    getSessionId,
    resetSession,
  }
}
