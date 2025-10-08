/**
 * Chat History Service
 * 
 * Provides functions for saving and retrieving chat messages from DynamoDB
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { logger } from './logger.mjs';

// Initialize DynamoDB client
const client = new DynamoDBClient({});
const dynamoDB = DynamoDBDocumentClient.from(client);

// Get table name from environment
const CHAT_HISTORY_TABLE = process.env.CHAT_HISTORY_TABLE_NAME || 'ChatHistory';

/**
 * Save a chat message to DynamoDB
 * 
 * @param {Object} params - Message parameters
 * @param {string} params.sessionId - Global session ID
 * @param {string} params.sender - "user" or "assistant"
 * @param {string} params.content - Message content
 * @param {string} [params.bedrockSessionId] - Optional Bedrock session ID
 * @param {Object} [params.metadata] - Optional metadata
 * @returns {Promise<Object>} Saved message item
 */
export async function saveChatMessage({
  sessionId,
  sender,
  content,
  bedrockSessionId = null,
  metadata = {}
}) {
  // Validate required fields
  if (!sessionId || !sender || !content) {
    throw new Error('Missing required fields: sessionId, sender, content');
  }
  
  if (!['user', 'assistant'].includes(sender)) {
    throw new Error('Invalid sender type. Must be "user" or "assistant"');
  }
  
  // Generate timestamp and message ID
  const timestamp = Date.now();
  const messageId = `msg-${timestamp}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Calculate TTL (90 days from now)
  const ttl = Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60);
  
  // Prepare item
  const item = {
    sessionId,
    timestamp,
    messageId,
    sender,
    content,
    ttl,
  };
  
  // Add optional fields
  if (bedrockSessionId) {
    item.bedrockSessionId = bedrockSessionId;
  }
  
  if (metadata && Object.keys(metadata).length > 0) {
    item.metadata = metadata;
  }
  
  try {
    // Save to DynamoDB
    await dynamoDB.send(new PutCommand({
      TableName: CHAT_HISTORY_TABLE,
      Item: item,
    }));
    
    logger.info('Chat message saved to DynamoDB', {
      sessionId,
      messageId,
      sender,
      contentLength: content.length,
    });
    
    return item;
    
  } catch (error) {
    logger.error('Failed to save chat message', {
      sessionId,
      sender,
      error: error.message,
      stack: error.stack,
    });
    
    throw error;
  }
}

/**
 * Get chat history for a session
 * 
 * @param {string} sessionId - Global session ID
 * @param {number} [limit] - Maximum number of messages to retrieve
 * @param {number} [fromTimestamp] - Only get messages after this timestamp
 * @returns {Promise<Array>} Array of chat messages
 */
export async function getChatHistory(sessionId, limit = 100, fromTimestamp = 0) {
  if (!sessionId) {
    throw new Error('sessionId is required');
  }
  
  try {
    const params = {
      TableName: CHAT_HISTORY_TABLE,
      KeyConditionExpression: 'sessionId = :sessionId AND #ts > :fromTimestamp',
      ExpressionAttributeNames: {
        '#ts': 'timestamp',
      },
      ExpressionAttributeValues: {
        ':sessionId': sessionId,
        ':fromTimestamp': fromTimestamp,
      },
      Limit: limit,
      ScanIndexForward: true, // Sort by timestamp ascending (oldest first)
    };
    
    const result = await dynamoDB.send(new QueryCommand(params));
    
    logger.info('Retrieved chat history', {
      sessionId,
      messageCount: result.Items?.length || 0,
    });
    
    return result.Items || [];
    
  } catch (error) {
    logger.error('Failed to retrieve chat history', {
      sessionId,
      error: error.message,
      stack: error.stack,
    });
    
    throw error;
  }
}

/**
 * Get recent messages for a session
 * 
 * @param {string} sessionId - Global session ID
 * @param {number} [count=10] - Number of recent messages to retrieve
 * @returns {Promise<Array>} Array of recent chat messages
 */
export async function getRecentMessages(sessionId, count = 10) {
  if (!sessionId) {
    throw new Error('sessionId is required');
  }
  
  try {
    const params = {
      TableName: CHAT_HISTORY_TABLE,
      KeyConditionExpression: 'sessionId = :sessionId',
      ExpressionAttributeValues: {
        ':sessionId': sessionId,
      },
      Limit: count,
      ScanIndexForward: false, // Sort by timestamp descending (newest first)
    };
    
    const result = await dynamoDB.send(new QueryCommand(params));
    
    // Reverse to get chronological order (oldest to newest)
    const messages = (result.Items || []).reverse();
    
    logger.info('Retrieved recent messages', {
      sessionId,
      messageCount: messages.length,
    });
    
    return messages;
    
  } catch (error) {
    logger.error('Failed to retrieve recent messages', {
      sessionId,
      error: error.message,
      stack: error.stack,
    });
    
    throw error;
  }
}

/**
 * Check if table exists and is accessible
 * 
 * @returns {Promise<boolean>} True if table is accessible
 */
export async function checkTableHealth() {
  try {
    await dynamoDB.send(new QueryCommand({
      TableName: CHAT_HISTORY_TABLE,
      KeyConditionExpression: 'sessionId = :sessionId',
      ExpressionAttributeValues: {
        ':sessionId': 'health-check',
      },
      Limit: 1,
    }));
    
    return true;
  } catch (error) {
    logger.error('Chat history table health check failed', {
      error: error.message,
    });
    
    return false;
  }
}
