/**
 * Session management composable
 * 
 * Generates and manages a unique session ID for each browser window/tab
 * This ensures that chat side-effect events are isolated per session
 */

import { ref, readonly } from 'vue'

// Generate a unique session ID using crypto API
function generateSessionId(): string {
  // Use crypto.randomUUID() if available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  
  // Fallback: generate UUID v4 manually
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)

    return v.toString(16)
  })
}

// Session ID is stored at module level to persist across component re-renders
// but will be unique per browser window/tab (not shared via localStorage)
let sessionId: string | null = null

/**
 * Composable for session management
 * 
 * @returns Object with sessionId and utility functions
 */
export function useSession() {
  // Initialize session ID if not already set
  if (!sessionId) {
    sessionId = generateSessionId()
    console.log('[Session] Generated new session ID:', sessionId)
  }
  
  const currentSessionId = ref<string>(sessionId)
  
  /**
   * Reset session ID (generates a new one)
   * Useful for testing or manual session refresh
   */
  const resetSession = () => {
    sessionId = generateSessionId()
    currentSessionId.value = sessionId
    console.log('[Session] Reset session ID:', sessionId)
  }
  
  /**
   * Get session ID as readonly
   */
  const getSessionId = () => readonly(currentSessionId)
  
  return {
    sessionId: getSessionId(),
    resetSession,
  }
}

