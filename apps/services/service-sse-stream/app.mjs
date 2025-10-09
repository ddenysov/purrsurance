/**
 * Lambda function handler with Server-Sent Events (SSE) streaming
 * 
 * Uses Lambda Response Streaming to send SSE events to clients
 * Polls DynamoDB for new events and streams them via SSE
 */

/* global awslambda */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { config, getPrintableConfig } from './config.mjs';
import { logger } from './logger.mjs';
import { 
  formatSSE, 
  createHeartbeat, 
  createError, 
  createConnectionMessage,
  createGoodbyeMessage,
} from './sseFormatter.mjs';

// Initialize DynamoDB client
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

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
 * Query DynamoDB for new events since last timestamp
 * DEBUG MODE: Disabled session filter to see all events
 * @param {string} sessionId - Session ID to query events for (currently not filtered)
 * @param {number} lastTimestamp - Last event timestamp
 * @returns {Promise<Array>} Array of new events
 */
async function queryNewEvents(sessionId, lastTimestamp) {
  const params = {
    TableName: config.dynamodb.tableName,
    FilterExpression: '#ts > :lastTs',
    ExpressionAttributeNames: {
      '#ts': 'timestamp',
    },
    ExpressionAttributeValues: {
      ':lastTs': lastTimestamp,
    },
  };

  try {
    logger.info('DEBUG: Scanning all events (session filter disabled)', {
      tableName: config.dynamodb.tableName,
      lastTimestamp,
      sessionId: sessionId + ' (ignored)',
    });
    
    const command = new ScanCommand(params);
    const result = await docClient.send(command);
    
    logger.info('DEBUG: Found events', {
      count: result.Items?.length || 0,
      items: result.Items?.map(item => ({
        partitionKey: item.partitionKey,
        timestamp: item.timestamp,
        eventType: item.eventType,
      })),
    });
    
    return result.Items || [];
  } catch (error) {
    logger.error('Error scanning DynamoDB', {
      error: error.message,
      tableName: config.dynamodb.tableName,
      sessionId,
    });
    throw error;
  }
}

/**
 * Stream mock events for testing
 * Sends test events at regular intervals
 * @param {Object} responseStream - Lambda response stream
 * @param {string} requestId - Request identifier
 * @param {string} sessionId - Session ID
 */
async function streamMockEvents(responseStream, requestId, sessionId) {
  let eventCount = 0;
  let mockTimer = null;
  let maxDurationTimer = null;
  let isStreamActive = true;
  const startTime = Date.now();
  
  const mockEventTypes = ['claim_status', 'policy_updated', 'message', 'notification'];
  
  try {
    // Send connection established message
    const connectionMsg = createConnectionMessage(requestId);
    responseStream.write(connectionMsg);
    logger.info('SSE mock connection established', { requestId, sessionId });
    
    // Setup max duration timer
    maxDurationTimer = setTimeout(() => {
      logger.info('Max stream duration reached', { 
        requestId, 
        duration: config.sse.maxStreamDuration 
      });
      isStreamActive = false;
    }, config.sse.maxStreamDuration);
    
    // Send mock events every 5 seconds
    const sendMockEvent = () => {
      if (!isStreamActive) return;
      
      try {
        eventCount++;
        const mockEventType = mockEventTypes[eventCount % mockEventTypes.length];
        
        // Create mock event data
        const mockData = {
          type: mockEventType,
          id: `mock-${eventCount}`,
          timestamp: Date.now(),
          payload: {
            eventType: mockEventType,
            timestamp: Date.now(),
            data: {
              message: `Mock event ${eventCount} - ${mockEventType}`,
              count: eventCount,
              sessionId: sessionId,
            }
          }
        };
        
        // Format as SSE message
        const sseMessage = formatSSE({
          id: eventCount,
          data: mockData,
        });
        
        // Write to stream
        responseStream.write(sseMessage);
        
        logger.info('Sent mock SSE event', { 
          requestId,
          sessionId,
          eventCount, 
          eventType: mockEventType,
        });
        
      } catch (error) {
        logger.error('Error sending mock event', {
          requestId,
          error: error.message,
        });
      }
      
      // Schedule next mock event
      if (isStreamActive) {
        mockTimer = setTimeout(sendMockEvent, 5000); // Every 5 seconds
      }
    };
    
    // Start sending mock events
    sendMockEvent();
    
    // Wait for stream to end
    await new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (!isStreamActive) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 1000);
    });
    
    // Send goodbye message
    const goodbyeMsg = createGoodbyeMessage();
    responseStream.write(goodbyeMsg);
    
  } catch (error) {
    logger.error('Error streaming mock events', {
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
    isStreamActive = false;
    
    if (mockTimer) {
      clearTimeout(mockTimer);
    }
    if (maxDurationTimer) {
      clearTimeout(maxDurationTimer);
    }
    
    const duration = Date.now() - startTime;
    logger.info('SSE mock stream ended', { 
      requestId, 
      eventCount, 
      duration: `${duration}ms` 
    });
    
    // End the stream
    responseStream.end();
  }
}

/**
 * Stream events from DynamoDB using SSE protocol
 * Polls DynamoDB at regular intervals and sends new events to client
 * @param {Object} responseStream - Lambda response stream
 * @param {string} requestId - Request identifier
 * @param {string} sessionId - Session ID for filtering events
 */
async function streamDynamoDBEvents(responseStream, requestId, sessionId) {
  let eventCount = 0;
  let keepAliveTimer = null;
  let pollTimer = null;
  let maxDurationTimer = null;
  let isStreamActive = true;
  const startTime = Date.now();
  
  // Track last processed timestamp
  let lastTimestamp = Date.now() - 60000; // Start from 1 minute ago
  
  try {
    // Send connection established message
    const connectionMsg = createConnectionMessage(requestId);
    responseStream.write(connectionMsg);
    logger.info('SSE connection established', { requestId, sessionId, lastTimestamp });
    
    // Setup keep-alive timer
    keepAliveTimer = setInterval(() => {
      if (!isStreamActive) return;
      
      try {
        const heartbeat = createHeartbeat();
        responseStream.write(heartbeat);
        logger.debug('Sent heartbeat', { requestId });
      } catch (error) {
        logger.error('Error sending heartbeat', { requestId, error: error.message });
        isStreamActive = false;
      }
    }, config.sse.keepAliveInterval);
    
    // Setup max duration timer
    maxDurationTimer = setTimeout(() => {
      logger.info('Max stream duration reached', { 
        requestId, 
        duration: config.sse.maxStreamDuration 
      });
      isStreamActive = false;
    }, config.sse.maxStreamDuration);
    
    // Poll DynamoDB for new events
    const pollForEvents = async () => {
      if (!isStreamActive) {
        return;
      }
      
      try {
        // Query for new events
        const newEvents = await queryNewEvents(sessionId, lastTimestamp);
        
        if (newEvents.length > 0) {
          logger.info('Found new events', { 
            requestId,
            sessionId,
            count: newEvents.length 
          });
          
          // Send each event via SSE
          for (const item of newEvents) {
            if (!isStreamActive) break;
            
            eventCount++;
            
            // Update last timestamp
            if (item.timestamp > lastTimestamp) {
              lastTimestamp = item.timestamp;
            }
            
            // Format event data
            const eventData = {
              type: item.eventType || 'event',
              id: item.requestId,
              timestamp: item.timestamp,
              payload: item.payload,
            };
            
            // Format as SSE message
            const sseMessage = formatSSE({
              id: eventCount,
              data: eventData,
            });
            
            // Write to stream
            responseStream.write(sseMessage);
            
            logger.info('Sent SSE event', { 
              requestId,
              sessionId,
              eventCount, 
              eventType: item.eventType,
              itemRequestId: item.requestId,
            });
          }
        } else {
          logger.debug('No new events', { requestId, sessionId, lastTimestamp });
        }
        
      } catch (error) {
        logger.error('Error polling for events', {
          requestId,
          error: error.message,
          stack: error.stack,
        });
      }
      
      // Schedule next poll
      if (isStreamActive) {
        pollTimer = setTimeout(pollForEvents, config.sse.pollInterval);
      }
    };
    
    // Start polling
    await pollForEvents();
    
    // Wait for stream to end
    await new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (!isStreamActive) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 1000);
    });
    
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
    isStreamActive = false;
    
    if (keepAliveTimer) {
      clearInterval(keepAliveTimer);
    }
    if (pollTimer) {
      clearTimeout(pollTimer);
    }
    if (maxDurationTimer) {
      clearTimeout(maxDurationTimer);
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
    const requestId = context.requestId;
    
    // Extract sessionId from query parameters
    const queryParams = event.queryStringParameters || {};
    const sessionId = queryParams.sessionId;
    
    logger.info('Processing SSE request', {
      requestId,
      sessionId: sessionId || 'DEBUG: no session filter',
      httpMethod: event.httpMethod || event.requestContext?.http?.method,
      path: event.path || event.requestContext?.http?.path,
    });
    
    // DEBUG MODE: sessionId validation disabled
    // if (!sessionId) {
    //   logger.error('Missing sessionId in request', { requestId });
    //   const errorMsg = createError('Missing sessionId parameter');
    //   
    //   const metadata = {
    //     statusCode: 400,
    //     headers: {
    //       'Content-Type': 'text/event-stream',
    //       'Access-Control-Allow-Origin': config.cors.allowOrigin,
    //       'Access-Control-Allow-Methods': config.cors.allowMethods,
    //       'Access-Control-Allow-Headers': config.cors.allowHeaders,
    //     },
    //   };
    //   responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);
    //   responseStream.write(errorMsg);
    //   responseStream.end();
    //   return;
    // }
    
    // Set SSE headers with CORS
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
      
      // Stream events from DynamoDB
      await streamDynamoDBEvents(responseStream, requestId, sessionId);
      
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
  
  // Extract sessionId from query parameters
  const queryParams = event.queryStringParameters || {};
  const sessionId = queryParams.sessionId || 'test-session-id';
  
  logger.info('Local test mode - checking DynamoDB connection', { requestId, sessionId });
  
  try {
    // Try to query recent events from DynamoDB
    const lastTimestamp = Date.now() - 60000; // Last 1 minute
    const recentEvents = await queryNewEvents(sessionId, lastTimestamp);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'SSE test response (local mode)',
        note: 'In production, this will stream SSE events from DynamoDB.',
        dynamodb: {
          tableName: config.dynamodb.tableName,
          connected: true,
          recentEventsCount: recentEvents.length,
        },
        config: {
          pollInterval: config.sse.pollInterval,
          maxDuration: config.sse.maxStreamDuration,
          keepAliveInterval: config.sse.keepAliveInterval,
        },
        recentEvents: recentEvents.slice(0, 5), // Show max 5 recent events
      }),
    };
  } catch (error) {
    logger.error('Error in local test mode', {
      requestId,
      error: error.message,
    });
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Error testing DynamoDB connection',
        error: error.message,
        config: {
          tableName: config.dynamodb.tableName,
        },
      }),
    };
  }
};

