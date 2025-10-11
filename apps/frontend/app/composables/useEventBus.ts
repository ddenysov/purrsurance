import { ref, reactive } from 'vue'

// Event types
export interface SSEEvent {
  type: string
  id: string
  timestamp: string | number
  data?: any
  payload?: any
}

// Event bus state
const events = ref<SSEEvent[]>([])
const listeners = reactive<Record<string, Function[]>>({})

// Event bus composable
export const useEventBus = () => {
  // Internal method to publish event to listeners (used by both emit and queue)
  const publishToListeners = (eventType: string, event: SSEEvent) => {
    // Add to events history
    events.value.unshift(event)
    
    // Keep only last 100 events to prevent memory issues
    if (events.value.length > 100) {
      events.value = events.value.slice(0, 100)
    }
    
    // Notify listeners
    if (listeners[eventType]) {
      listeners[eventType].forEach(callback => {
        try {
          callback(event)
        } catch (error) {
          console.error(`[EventBus] Error in listener for ${eventType}:`, error)
        }
      })
    }
    
    // Also notify general listeners
    if (listeners['*']) {
      listeners['*'].forEach(callback => {
        try {
          callback(event)
        } catch (error) {
          console.error('[EventBus] Error in general listener:', error)
        }
      })
    }
    
    console.log(`[EventBus] Published event: ${eventType}`, event)
  }
  
  // Emit an event (legacy method - now uses queue)
  const emit = (eventType: string, event: SSEEvent) => {
    publishToListeners(eventType, event)
  }
  
  // Listen to specific event type
  const on = (eventType: string, callback: (event: SSEEvent) => void) => {
    if (!listeners[eventType]) {
      listeners[eventType] = []
    }
    listeners[eventType].push(callback)
    
    return () => {
      const index = listeners[eventType].indexOf(callback)
      if (index > -1) {
        listeners[eventType].splice(index, 1)
      }
    }
  }
  
  // Listen to all events
  const onAll = (callback: (event: SSEEvent) => void) => {
    return on('*', callback)
  }
  
  // Remove all listeners for a specific event type
  const off = (eventType: string) => {
    if (listeners[eventType]) {
      listeners[eventType] = []
    }
  }
  
  // Remove all listeners
  const offAll = () => {
    Object.keys(listeners).forEach(key => {
      listeners[key] = []
    })
  }
  
  // Get events by type
  const getEventsByType = (eventType: string) => {
    return events.value.filter(event => event.type === eventType)
  }
  
  // Get latest event by type
  const getLatestEventByType = (eventType: string) => {
    return events.value.find(event => event.type === eventType)
  }
  
  // Clear events history
  const clearEvents = () => {
    events.value = []
  }
  
  return {
    events: readonly(events),
    emit,
    publishToListeners, // Exposed for event queue integration
    on,
    onAll,
    off,
    offAll,
    getEventsByType,
    getLatestEventByType,
    clearEvents
  }
}
