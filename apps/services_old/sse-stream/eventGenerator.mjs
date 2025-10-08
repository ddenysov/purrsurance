/**
 * Mock event generator for testing SSE
 * Generates sample events to demonstrate functionality
 */

import { logger } from './logger.mjs';

/**
 * Generate mock pet insurance event
 * @param {number} eventNumber - Sequential event number
 * @returns {Object} Mock event data
 */
export function generateMockEvent(eventNumber) {
  const eventTypes = [
    'policy_update',
    'claim_status',
    'reminder',
    'notification',
    'alert',
  ];
  
  const pets = ['Whiskers', 'Mittens', 'Shadow', 'Luna', 'Max'];
  const statuses = ['approved', 'pending', 'processing', 'completed'];
  const messages = [
    'Your policy has been updated',
    'Claim has been processed',
    'Vaccination reminder for your pet',
    'New benefit available',
    'Important notification',
  ];
  
  // Pick random values
  const eventType = eventTypes[eventNumber % eventTypes.length];
  const pet = pets[eventNumber % pets.length];
  const status = statuses[eventNumber % statuses.length];
  const message = messages[eventNumber % messages.length];
  
  const event = {
    type: eventType,
    id: `evt_${Date.now()}_${eventNumber}`,
    timestamp: new Date().toISOString(),
    data: {
      pet: pet,
      status: status,
      message: message,
      details: {
        eventNumber: eventNumber,
        randomValue: Math.floor(Math.random() * 1000),
      },
    },
  };
  
  logger.debug('Generated mock event', { eventType, eventNumber });
  
  return event;
}

/**
 * Generate a series of mock events
 * @param {number} count - Number of events to generate
 * @returns {Array} Array of mock events
 */
export function generateMockEvents(count) {
  const events = [];
  for (let i = 0; i < count; i++) {
    events.push(generateMockEvent(i));
  }
  return events;
}

/**
 * Async generator for mock events with delay
 * @param {number} intervalMs - Interval between events in milliseconds
 * @param {number} maxEvents - Maximum number of events (optional)
 */
export async function* mockEventStream(intervalMs, maxEvents = Infinity) {
  let eventNumber = 0;
  
  logger.info('Starting mock event stream', { intervalMs, maxEvents });
  
  while (eventNumber < maxEvents) {
    // Generate and yield event
    const event = generateMockEvent(eventNumber);
    yield event;
    
    eventNumber++;
    
    // Wait for interval (if not the last event)
    if (eventNumber < maxEvents) {
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }
  
  logger.info('Mock event stream completed', { totalEvents: eventNumber });
}


