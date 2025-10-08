/**
 * Event Publisher Lambda Function
 * 
 * Receives HTTP POST requests and directly saves events to DynamoDB
 * Combines Producer and Saver logic into a single service
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const tableName = process.env.EVENTS_TABLE_NAME;

/**
 * Lambda handler for publishing events directly to DynamoDB
 * 
 * @param {Object} event - API Gateway event object
 * @param {Object} context - Lambda context
 * @returns {Object} Response object with status and message
 */
export const handler = async (event, context) => {
  const requestId = context.requestId || 'local-' + Date.now();
  
  console.log('Received event to publish:', {
    requestId,
    body: event.body,
    headers: event.headers,
  });

  // Validate DynamoDB table name configuration
  if (!tableName) {
    console.error('EVENTS_TABLE_NAME environment variable is not set');
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        error: 'Internal configuration error',
        message: 'Table name is not configured',
      }),
    };
  }

  // Validate request body
  if (!event.body) {
    console.warn('Request body is empty', { requestId });
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        error: 'Bad Request',
        message: 'Request body is empty',
      }),
    };
  }

  try {
    // Parse body to validate JSON format
    let parsedBody;
    try {
      parsedBody = JSON.parse(event.body);
    } catch (parseError) {
      console.error('Invalid JSON in request body', { requestId, error: parseError.message });
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          error: 'Bad Request',
          message: 'Invalid JSON format',
        }),
      };
    }

    // Extract sessionId from body or headers
    const sessionId = parsedBody.sessionId || event.headers?.['x-session-id'] || event.headers?.['X-Session-Id'];
    
    // Validate sessionId is provided
    if (!sessionId) {
      console.warn('Missing sessionId in request', { requestId });
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          error: 'Bad Request',
          message: 'sessionId is required (in body or X-Session-Id header)',
        }),
      };
    }

    // Extract event type from body or use default
    const eventType = parsedBody.eventType || 'PolicyUpdate';
    const timestamp = Date.now();
    
    // Prepare DynamoDB item
    const item = {
      partitionKey: sessionId,    // Use sessionId as partition key for session isolation
      timestamp: timestamp,        // Time in milliseconds for sorting
      payload: parsedBody.data || parsedBody, // Event payload
      eventType: eventType,
      requestId: requestId,
    };

    console.log('Saving event to DynamoDB', { 
      requestId,
      sessionId,
      tableName, 
      eventType,
      timestamp,
    });

    // Save to DynamoDB
    const command = new PutCommand({
      TableName: tableName,
      Item: item,
    });

    await docClient.send(command);

    console.log('Event saved successfully', { 
      requestId,
      sessionId,
      eventType,
      timestamp,
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        message: 'Event published successfully',
        sessionId,
        eventType,
        timestamp: new Date(timestamp).toISOString(),
        requestId,
      }),
    };
  } catch (error) {
    console.error('Error saving event to DynamoDB', { 
      requestId,
      error: error.message,
      stack: error.stack,
      code: error.code,
    });
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        error: 'Internal Server Error',
        message: 'Failed to publish event',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      }),
    };
  }
};

