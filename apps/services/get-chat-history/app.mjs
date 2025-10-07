/**
 * Get Chat History Lambda Function
 * 
 * Retrieves chat history for a given session ID
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

// Initialize DynamoDB client
const client = new DynamoDBClient({});
const dynamoDB = DynamoDBDocumentClient.from(client);

const CHAT_HISTORY_TABLE = process.env.CHAT_HISTORY_TABLE_NAME || 'ChatHistory';

/**
 * Lambda handler
 */
export const lambdaHandler = async (event, context) => {
  const requestId = context.requestId || 'local-' + Date.now();

  console.log('Get chat history invoked', {
    requestId,
    event: JSON.stringify(event),
  });

  try {
    // Parse request
    const queryParams = event.queryStringParameters || {};
    const { sessionId, limit = '100' } = queryParams;

    // Validate sessionId
    if (!sessionId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Bad Request',
          message: 'sessionId query parameter is required',
        }),
      };
    }

    // Query DynamoDB
    const result = await dynamoDB.send(new QueryCommand({
      TableName: CHAT_HISTORY_TABLE,
      KeyConditionExpression: 'sessionId = :sessionId',
      ExpressionAttributeValues: {
        ':sessionId': sessionId,
      },
      Limit: parseInt(limit, 10),
      ScanIndexForward: true, // Oldest first
    }));

    const messages = result.Items || [];

    console.log('Retrieved chat history', {
      requestId,
      sessionId,
      messageCount: messages.length,
    });

    // Return messages
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Success',
        data: {
          sessionId,
          messages,
          count: messages.length,
        },
        metadata: {
          requestId,
          timestamp: new Date().toISOString(),
        },
      }),
    };

  } catch (error) {
    console.error('Error retrieving chat history', {
      requestId,
      error: error.message,
      stack: error.stack,
    });

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: 'Failed to retrieve chat history',
        requestId,
      }),
    };
  }
};
