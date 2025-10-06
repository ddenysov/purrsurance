/**
 * Event Producer Lambda Function
 * 
 * Publishes events to SNS topic for downstream processing
 * Receives HTTP POST requests and forwards them to SNS
 */

import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const snsClient = new SNSClient({});
const topicArn = process.env.EVENTS_TOPIC_ARN;

/**
 * Lambda handler for publishing events to SNS
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

  // Validate topic ARN configuration
  if (!topicArn) {
    console.error('EVENTS_TOPIC_ARN environment variable is not set');
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        error: 'Internal configuration error',
        message: 'Topic ARN is not configured',
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

    // Extract event type from body or use default
    const eventType = parsedBody.eventType || 'PolicyUpdate';
    
    // Prepare SNS message parameters
    const params = {
      TopicArn: topicArn,
      Message: event.body, // Send original body as-is
      MessageAttributes: {
        eventType: {
          DataType: 'String',
          StringValue: eventType,
        },
        timestamp: {
          DataType: 'String',
          StringValue: new Date().toISOString(),
        },
        requestId: {
          DataType: 'String',
          StringValue: requestId,
        },
      },
    };

    // Add optional subject if provided
    if (parsedBody.subject) {
      params.Subject = parsedBody.subject;
    }

    console.log('Publishing message to SNS', { 
      requestId,
      topicArn, 
      eventType,
      messageSize: event.body.length,
    });

    const command = new PublishCommand(params);
    const response = await snsClient.send(command);

    console.log('Message published successfully', { 
      requestId,
      messageId: response.MessageId,
      eventType,
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        message: 'Event published successfully',
        messageId: response.MessageId,
        eventType,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error('Error publishing message to SNS', { 
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

