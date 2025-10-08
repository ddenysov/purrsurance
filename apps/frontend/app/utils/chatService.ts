import type { BackendChatResponse, BackendErrorResponse } from '~/types'
import { apiClient } from './apiClient'

/**
 * Chat service configuration
 */
const CHAT_API_CONFIG = {
  // Production endpoint
  baseURL: 'https://cbx2umgj5k.execute-api.us-east-1.amazonaws.com/Prod',
  
  // API path
  endpoint: '/hello/',
  
  // Request timeout (30 seconds for AI processing)
  timeout: 30000,
}

/**
 * Send message to backend chat API
 * @param message - User message text
 * @param bedrockSessionId - Optional Bedrock Agent session ID for conversation continuity
 * @param globalSessionId - Global session ID for SSE event routing
 * @returns Backend response with AI reply
 * @throws Error if request fails
 */
export async function sendChatMessage(
  message: string,
  bedrockSessionId: string | null = null,
  globalSessionId: string | null = null
): Promise<BackendChatResponse> {
  try {
    // Prepare request payload
    const payload: { message: string; sessionId?: string; globalSessionId?: string } = {
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
    
    console.log('Sending chat message:', {
      messageLength: message.length,
      hasBedrockSessionId: !!bedrockSessionId,
      hasGlobalSessionId: !!globalSessionId,
    })
    
    // Make API request
    const response = await apiClient.post<BackendChatResponse>(
      CHAT_API_CONFIG.endpoint,
      payload,
      {
        baseURL: CHAT_API_CONFIG.baseURL,
        timeout: CHAT_API_CONFIG.timeout,
      }
    )
    
    console.log('Chat response received:', {
      requestId: response.data.metadata?.requestId,
      bedrockSessionId: response.data.data?.sessionId,
      responseLength: response.data.data?.response?.length,
    })
    
    // Validate response structure
    if (!response.data?.data?.response) {
      throw new Error('Invalid response structure from backend')
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
        `Server error: ${error.response.status}`
      )
    } else if (error.request) {
      // Request made but no response received
      throw new Error(
        'No response from server. Please check your connection and try again.'
      )
    } else {
      // Error in request setup
      throw new Error(
        error.message || 'Failed to send message. Please try again.'
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
    await sendChatMessage('Hello', null)
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
  return {
    baseURL: CHAT_API_CONFIG.baseURL,
    endpoint: CHAT_API_CONFIG.endpoint,
    timeout: CHAT_API_CONFIG.timeout,
  }
}
