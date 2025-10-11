import { defineStore } from 'pinia'
import type { SSEEvent } from '~/composables/useEventBus'

interface QueuedEvent {
  event: SSEEvent
  queuedAt: number
}

export const useEventQueueStore = defineStore('eventQueue', () => {
  // Queue of events waiting to be published
  const queue = ref<QueuedEvent[]>([])
  
  // Flag indicating if agent is thinking
  const isAgentThinking = ref(false)
  
  // Callback to publish events to the bus
  let publishCallback: ((event: SSEEvent) => void) | null = null
  
  // Statistics
  const stats = ref({
    totalQueued: 0,
    totalPublished: 0,
    maxQueueSize: 0
  })
  
  // Set the publish callback (will be called from useEventBus)
  const setPublishCallback = (callback: (event: SSEEvent) => void) => {
    publishCallback = callback
  }
  
  // Add event to queue
  const enqueueEvent = (event: SSEEvent) => {
    const queuedEvent: QueuedEvent = {
      event,
      queuedAt: Date.now()
    }
    
    queue.value.push(queuedEvent)
    stats.value.totalQueued++
    
    // Track max queue size
    if (queue.value.length > stats.value.maxQueueSize) {
      stats.value.maxQueueSize = queue.value.length
    }
    
    console.log('[EventQueue] Event queued:', event.type, 'Queue size:', queue.value.length)
    
    // If agent is not thinking, flush immediately
    if (!isAgentThinking.value) {
      flushQueue()
    }
  }
  
  // Flush all events from queue to the bus
  const flushQueue = () => {
    if (queue.value.length === 0) {
      return
    }
    
    if (!publishCallback) {
      console.warn('[EventQueue] No publish callback set, cannot flush queue')
      return
    }
    
    console.log('[EventQueue] Flushing queue, size:', queue.value.length)
    
    const eventsToPublish = [...queue.value]
    queue.value = []
    
    // Publish events in order
    eventsToPublish.forEach(({ event }) => {
      if (publishCallback) {
        publishCallback(event)
        stats.value.totalPublished++
      }
    })
    
    console.log('[EventQueue] Queue flushed, published:', eventsToPublish.length, 'events')
  }
  
  // Set agent thinking status
  const setAgentThinking = (thinking: boolean) => {
    const wasThinking = isAgentThinking.value
    isAgentThinking.value = thinking
    
    console.log('[EventQueue] Agent thinking status changed:', thinking)
    
    // If agent finished thinking, flush the queue
    if (wasThinking && !thinking) {
      console.log('[EventQueue] Agent finished thinking, flushing queue')
      flushQueue()
    }
  }
  
  // Clear the queue (useful for cleanup)
  const clearQueue = () => {
    const clearedCount = queue.value.length
    queue.value = []
    console.log('[EventQueue] Queue cleared, removed:', clearedCount, 'events')
  }
  
  // Get current queue size
  const getQueueSize = () => {
    return queue.value.length
  }
  
  // Get all queued events (for debugging)
  const getQueuedEvents = () => {
    return queue.value.map(qe => ({
      ...qe.event,
      queuedAt: qe.queuedAt,
      waitTime: Date.now() - qe.queuedAt
    }))
  }
  
  // Reset stats
  const resetStats = () => {
    stats.value = {
      totalQueued: 0,
      totalPublished: 0,
      maxQueueSize: 0
    }
  }
  
  return {
    // State
    queue: readonly(queue),
    isAgentThinking: readonly(isAgentThinking),
    stats: readonly(stats),
    
    // Actions
    setPublishCallback,
    enqueueEvent,
    flushQueue,
    setAgentThinking,
    clearQueue,
    getQueueSize,
    getQueuedEvents,
    resetStats
  }
})

