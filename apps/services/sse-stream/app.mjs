/**
 * Lambda function handler with Server-Sent Events (SSE) streaming
 * 
 * Uses Lambda Response Streaming to send SSE events to clients
 * Supports both local testing and AWS deployment
 */

import { config, getPrintableConfig } from './config.mjs';
import { logger } from './logger.mjs';
import { 
  formatSSE, 
  createHeartbeat, 
  createError, 
  createConnectionMessage,
  createGoodbyeMessage,
} from './sseFormatter.mjs';
import { mockEventStream } from './eventGenerator.mjs';

/**
 * Initialize handler
 */
function initialize() {
  logger.info('Initializing SSE Lambda function', {
    config: getPrintableConfig(),
  });
}

// Initialize on cold start
initialize();

/**
 * Stream mock events using SSE protocol
 * @param {Object} responseStream - Lambda response stream
 * @param {string} requestId - Request identifier
 */
async function streamMockEvents(responseStream, requestId) {
  let eventCount = 0;
  let keepAliveTimer = null;
  let streamTimer = null;
  const startTime = Date.now();
  
  try {
    // Send connection established message
    const connectionMsg = createConnectionMessage(requestId);
    responseStream.write(connectionMsg);
    logger.info('SSE connection established', { requestId });
    
    // Setup keep-alive timer
    keepAliveTimer = setInterval(() => {
      try {
        const heartbeat = createHeartbeat();
        responseStream.write(heartbeat);
        logger.debug('Sent heartbeat', { requestId });
      } catch (error) {
        logger.error('Error sending heartbeat', { requestId, error: error.message });
      }
    }, config.sse.keepAliveInterval);
    
    // Setup max duration timer
    streamTimer = setTimeout(() => {
      logger.info('Max stream duration reached', { 
        requestId, 
        duration: config.sse.maxStreamDuration 
      });
      responseStream.end();
    }, config.sse.maxStreamDuration);
    
    // Calculate max events based on duration and interval
    const maxEvents = Math.floor(config.sse.maxStreamDuration / config.sse.eventInterval);
    
    // Stream mock events
    for await (const event of mockEventStream(config.sse.eventInterval, maxEvents)) {
      eventCount++;
      
      // Format as SSE message
      const sseMessage = formatSSE({
        event: event.type,
        id: eventCount,
        data: event,
      });
      
      // Write to stream
      responseStream.write(sseMessage);
      
      logger.info('Sent SSE event', { 
        requestId, 
        eventCount, 
        eventType: event.type 
      });
    }
    
    // Send goodbye message
    const goodbyeMsg = createGoodbyeMessage();
    responseStream.write(goodbyeMsg);
    
  } catch (error) {
    logger.error('Error streaming events', {
      requestId,
      error: error.message,
      stack: error.stack,
    });
    
    // Try to send error message
    try {
      const errorMsg = createError(error.message);
      responseStream.write(errorMsg);
    } catch (writeError) {
      logger.error('Failed to write error message', { 
        requestId, 
        error: writeError.message 
      });
    }
  } finally {
    // Cleanup
    if (keepAliveTimer) {
      clearInterval(keepAliveTimer);
    }
    if (streamTimer) {
      clearTimeout(streamTimer);
    }
    
    const duration = Date.now() - startTime;
    logger.info('SSE stream ended', { 
      requestId, 
      eventCount, 
      duration: `${duration}ms` 
    });
    
    // End the stream
    responseStream.end();
  }
}

/**
 * Lambda handler with response streaming
 * 
 * Note: This uses Lambda Response Streaming which requires:
 * - Lambda Function URL or API Gateway with streaming enabled
 * - InvokeMode: RESPONSE_STREAM in SAM template
 */
export const lambdaHandler = awslambda.streamifyResponse(
  async (event, responseStream, context) => {
    const requestId = context.requestId || 'local-' + Date.now();
    
    logger.info('Processing SSE request', {
      requestId,
      httpMethod: event.httpMethod || event.requestContext?.http?.method,
      path: event.path || event.requestContext?.http?.path,
    });
    
    // Set SSE headers
    const metadata = {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
      },
    };
    
    responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);
    
    try {
      // Handle CORS preflight
      const method = event.httpMethod || event.requestContext?.http?.method;
      if (method === 'OPTIONS') {
        logger.debug('Handling CORS preflight request', { requestId });
        responseStream.write('');
        responseStream.end();
        return;
      }
      
      // Stream events
      await streamMockEvents(responseStream, requestId);
      
    } catch (error) {
      logger.error('Error in lambda handler', {
        requestId,
        error: error.message,
        stack: error.stack,
      });
      
      // Try to send error
      try {
        const errorMsg = createError(`Server error: ${error.message}`);
        responseStream.write(errorMsg);
      } catch (writeError) {
        logger.error('Failed to write error to stream', { 
          requestId, 
          error: writeError.message 
        });
      }
      
      responseStream.end();
    }
  }
);

// For local testing without streaming (SAM local doesn't fully support streaming yet)
export const lambdaHandlerLocal = async (event, context) => {
  const requestId = context.requestId || 'local-' + Date.now();
  
  logger.info('Local test mode - generating sample events', { requestId });
  
  // Generate a few sample events for testing
  const events = [];
  for (let i = 0; i < 3; i++) {
    const mockEvent = {
      type: 'test_event',
      id: `evt_${Date.now()}_${i}`,
      timestamp: new Date().toISOString(),
      data: {
        message: `Test event ${i}`,
        eventNumber: i,
      },
    };
    events.push(mockEvent);
  }
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: 'SSE test response (local mode)',
      note: 'In production, this will stream SSE events. Local testing shows sample events.',
      sampleEvents: events,
      config: {
        eventInterval: config.sse.eventInterval,
        maxDuration: config.sse.maxStreamDuration,
      },
    }),
  };
};


