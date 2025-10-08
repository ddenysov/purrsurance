/**
 * Server-Sent Events (SSE) formatter
 * Handles SSE protocol formatting
 */

/**
 * Format SSE message
 * @param {Object} options - Message options
 * @param {string} options.event - Event type (optional)
 * @param {any} options.data - Event data
 * @param {string|number} options.id - Event ID (optional)
 * @param {number} options.retry - Retry interval in ms (optional)
 * @returns {string} Formatted SSE message
 */
export function formatSSE({ event, data, id, retry }) {
  let message = '';
  
  // Add event type
  if (event) {
    message += `event: ${event}\n`;
  }
  
  // Add event ID
  if (id !== undefined) {
    message += `id: ${id}\n`;
  }
  
  // Add retry interval
  if (retry !== undefined) {
    message += `retry: ${retry}\n`;
  }
  
  // Add data (can be multi-line)
  const dataString = typeof data === 'string' ? data : JSON.stringify(data);
  const dataLines = dataString.split('\n');
  
  for (const line of dataLines) {
    message += `data: ${line}\n`;
  }
  
  // SSE messages end with double newline
  message += '\n';
  
  return message;
}

/**
 * Create a heartbeat/keep-alive message
 * @returns {string} SSE heartbeat message
 */
export function createHeartbeat() {
  return formatSSE({
    event: 'heartbeat',
    data: {
      status: 'alive',
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Create an error message
 * @param {string} error - Error message
 * @returns {string} SSE error message
 */
export function createError(error) {
  return formatSSE({
    event: 'error',
    data: {
      error: error,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Create a connection established message
 * @param {string} connectionId - Connection identifier
 * @returns {string} SSE connection message
 */
export function createConnectionMessage(connectionId) {
  return formatSSE({
    event: 'connected',
    id: 0,
    data: {
      connectionId: connectionId,
      message: 'Connection established',
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Create a goodbye message
 * @returns {string} SSE goodbye message
 */
export function createGoodbyeMessage() {
  return formatSSE({
    event: 'goodbye',
    data: {
      message: 'Stream closing',
      timestamp: new Date().toISOString(),
    },
  });
}


