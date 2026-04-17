import type { BackendChatResponse, BackendErrorResponse } from '~/types'
import { apiClient } from './apiClient'

function mockChatResponse(
  _message: string,
  bedrockSessionId: string | null
): BackendChatResponse {
  const sessionId = bedrockSessionId || `session-${Date.now()}`

  return {
    message: 'OK',
    data: {
      response:
        'Привіт! Я — Доктор Котик, ваш віртуальний ветеринарний консультант. ' +
        'За симптомами, які ви описали — підвищена температура вже другий день і тварина майже нічого не їсть — таке поєднання може вказувати на інфекційний процес, запалення або проблеми з травленням; точний діагноз без огляду й за потреби аналізів поставити не можна. ' +
        'Тому я прийняв рішення рекомендувати запис у ветеринарну клініку: на прийомі лікар огляне улюбленця, за потреби призначить обстеження й пояснить, що саме відбувається та як діяти далі.',
      sessionId,
    },
    metadata: {
      requestId: `req-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      timestamp: new Date().toISOString(),
      environment: 'development',
      classification: 'DoctorKotryAgent',
    },
  }
}

/**
 * Get chat API configuration from runtime config
 */
function getChatApiConfig() {
  const config = useRuntimeConfig()

  const chatApiUrl = config.public.chatApiUrl as string
  
  return {
    // Full URL from ServiceRouter stack output
    fullUrl: chatApiUrl,
    
    // Request timeout (30 seconds for AI processing)
    timeout: 30000,
  }
}

/**
 * Send message to backend chat API
 * @param message - User message text
 * @param bedrockSessionId - Optional Bedrock Agent session ID for conversation continuity
 * @param globalSessionId - Global session ID for SSE event routing
 * @param policyId - Optional policy ID from pet profile
 * @param chatHistory - Optional chat history (array of messages)
 * @returns Backend response with AI reply
 * @throws Error if request fails
 */
export async function sendChatMessage(
  message: string,
  bedrockSessionId: string | null = null,
  globalSessionId: string | null = null,
  policyId: string | null = null,
  chatHistory: Array<{ content: string; sender: 'user' | 'assistant' }> = []
): Promise<BackendChatResponse> {
  try {
    const runtimeConfig = useRuntimeConfig()
    if (runtimeConfig.public.chatApiMock) {
      await new Promise((r) => setTimeout(r, 400))
      return mockChatResponse(message, bedrockSessionId)
    }

    // Prepare request payload
    const payload: { 
      message: string; 
      sessionId?: string; 
      globalSessionId?: string; 
      policyId?: string;
      chatHistory?: Array<{ content: string; sender: 'user' | 'assistant' }>
    } = {
      message: message.trim(),
    }
    
    // Include Bedrock sessionId if available (for conversation continuity)
    if (bedrockSessionId) {
      payload.sessionId = bedrockSessionId
    }
    
    // Include global sessionId if available (for SSE event routing)
    if (globalSessionId) {
      payload.globalSessionId = globalSessionId
    }
    
    // Include policyId if available (from pet profile)
    if (policyId) {
      payload.policyId = policyId
    }
    
    // Include chat history if available
    if (chatHistory && chatHistory.length > 0) {
      payload.chatHistory = chatHistory
    }
    
    console.log('Sending chat message:', {
      messageLength: message.length,
      hasBedrockSessionId: !!bedrockSessionId,
      hasGlobalSessionId: !!globalSessionId,
      hasPolicyId: !!policyId,
      historyLength: chatHistory.length,
    })
    
    // Get chat API configuration
    const apiConfig = getChatApiConfig()
    
    // Make API request (apiClient will detect full URL and not prepend baseURL)
    const response = await apiClient.post<BackendChatResponse>(
      apiConfig.fullUrl,
      payload,
      {
        timeout: apiConfig.timeout,
      }
    )
    
    console.log('Chat response received:', {
      requestId: response.data.metadata?.requestId,
      bedrockSessionId: response.data.data?.sessionId,
      responseLength: response.data.data?.response?.length,
      logsCount: response.data.metadata?.logs?.length,
    })
    
    // Log backend logs if available
    if (response.data.metadata?.logs && response.data.metadata.logs.length > 0) {
      console.group(`Backend Logs (${response.data.metadata.logs.length} entries)`)
      response.data.metadata.logs.forEach(log => {
        const logMethod = log.level === 'ERROR' ? 'error' : 
                         log.level === 'WARN' ? 'warn' : 
                         log.level === 'DEBUG' ? 'debug' : 'log'
        console[logMethod](`[${log.timestamp}] ${log.message}`, log)
      })
      console.groupEnd()
    }
    
    // Validate response structure
    if (!response.data?.data?.response) {
      throw new Error('Некоректна структура відповіді від сервера')
    }
    
    return response.data
    
  } catch (error: any) {
    console.error('Chat API error:', error)
    
    // Handle different error types
    if (error.response) {
      // Server responded with error status
      const errorData = error.response.data as BackendErrorResponse
      
      throw new Error(
        errorData.message || 
        `Помилка сервера: ${error.response.status}`
      )
    } else if (error.request) {
      // Request made but no response received
      throw new Error(
        'Немає відповіді від сервера. Перевірте з’єднання й спробуйте ще раз.'
      )
    } else {
      // Error in request setup
      throw new Error(
        error.message || 'Не вдалося надіслати повідомлення. Спробуйте ще раз.'
      )
    }
  }
}

/**
 * Test backend connection
 * Useful for health checks
 * @returns true if backend is reachable
 */
export async function testBackendConnection(): Promise<boolean> {
  try {
    await sendChatMessage('Hello', null, null, null, [])
    return true
  } catch (error) {
    console.error('Backend connection test failed:', error)
    return false
  }
}

/**
 * Get chat API status
 * @returns Status information
 */
export function getChatAPIStatus() {
  const config = getChatApiConfig()
  return {
    fullUrl: config.fullUrl,
    timeout: config.timeout,
  }
}
