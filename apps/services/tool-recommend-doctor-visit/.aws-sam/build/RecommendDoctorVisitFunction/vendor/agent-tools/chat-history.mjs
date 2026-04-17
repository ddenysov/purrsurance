/**
 * Chat History Service
 * 
 * Provides functions for saving and retrieving chat messages from DynamoDB
 * Part of @vet-expert/agent-tools package
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

// Initialize DynamoDB client (singleton)
let dynamoDBInstance = null;

/**
 * Get or create DynamoDB Document Client instance
 * @returns {DynamoDBDocumentClient}
 */
function getDynamoDBClient() {
  if (!dynamoDBInstance) {
    const client = new DynamoDBClient({});
    dynamoDBInstance = DynamoDBDocumentClient.from(client);
  }
  return dynamoDBInstance;
}

/**
 * Create a chat history service instance
 * @param {Object} options - Configuration options
 * @param {string} options.tableName - DynamoDB table name
 * @param {Object} [options.logger] - Logger instance (optional)
 * @returns {Object} Chat history service methods
 */
export function createChatHistoryService({ tableName, logger = console }) {
  if (!tableName) {
    throw new Error('tableName is required');
  }
  
  const dynamoDB = getDynamoDBClient();
  
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
  async function saveChatMessage({
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
        TableName: tableName,
        Item: item,
      }));
      
      logger.info?.('Chat message saved to DynamoDB', {
        sessionId,
        messageId,
        sender,
        contentLength: content.length,
      });
      
      return item;
      
    } catch (error) {
      logger.error?.('Failed to save chat message', {
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
  async function getChatHistory(sessionId, limit = 100, fromTimestamp = 0) {
    if (!sessionId) {
      throw new Error('sessionId is required');
    }
    
    try {
      const params = {
        TableName: tableName,
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
      
      logger.info?.('Retrieved chat history', {
        sessionId,
        messageCount: result.Items?.length || 0,
      });
      
      return result.Items || [];
      
    } catch (error) {
      logger.error?.('Failed to retrieve chat history', {
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
  async function getRecentMessages(sessionId, count = 10) {
    if (!sessionId) {
      throw new Error('sessionId is required');
    }
    
    try {
      const params = {
        TableName: tableName,
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
      
      logger.info?.('Retrieved recent messages', {
        sessionId,
        messageCount: messages.length,
      });
      
      return messages;
      
    } catch (error) {
      logger.error?.('Failed to retrieve recent messages', {
        sessionId,
        error: error.message,
        stack: error.stack,
      });
      
      throw error;
    }
  }
  
  /**
   * Initialize or get session context
   * Creates a new context if it doesn't exist, or returns existing context
   * 
   * @param {string} sessionId - Global session ID
   * @returns {Promise<Object>} Session context object
   */
  async function initializeSessionContext(sessionId) {
    if (!sessionId) {
      throw new Error('sessionId is required');
    }
    
    try {
      // Check if context already exists
      const existingContext = await getSessionContext(sessionId);
      
      if (existingContext) {
        logger.info?.('Session context already exists', {
          sessionId,
          createdAt: existingContext.createdAt,
        });
        return existingContext;
      }
      
      // Create new context
      const timestamp = Date.now();
      const contextId = `context-${sessionId}`;
      
      // Calculate TTL (90 days from now)
      const ttl = Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60);
      
      const contextItem = {
        sessionId,
        timestamp: 0, // Use 0 to make it always first in sorted results
        messageId: contextId,
        sender: 'system',
        content: 'session_context',
        context: {}, // Empty context object
        createdAt: timestamp,
        updatedAt: timestamp,
        ttl,
      };
      
      await dynamoDB.send(new PutCommand({
        TableName: tableName,
        Item: contextItem,
        ConditionExpression: 'attribute_not_exists(sessionId) AND attribute_not_exists(#ts)',
        ExpressionAttributeNames: {
          '#ts': 'timestamp',
        },
      }));
      
      logger.info?.('Session context created', {
        sessionId,
        contextId,
        timestamp,
      });
      
      return contextItem;
      
    } catch (error) {
      // If condition failed, context was created by another request
      if (error.name === 'ConditionalCheckFailedException') {
        logger.info?.('Session context created by concurrent request', { sessionId });
        return await getSessionContext(sessionId);
      }
      
      logger.error?.('Failed to initialize session context', {
        sessionId,
        error: error.message,
        stack: error.stack,
      });
      
      throw error;
    }
  }
  
  /**
   * Get session context
   * 
   * @param {string} sessionId - Global session ID
   * @returns {Promise<Object|null>} Session context object or null if not found
   */
  async function getSessionContext(sessionId) {
    if (!sessionId) {
      throw new Error('sessionId is required');
    }
    
    try {
      const params = {
        TableName: tableName,
        KeyConditionExpression: 'sessionId = :sessionId AND #ts = :timestamp',
        ExpressionAttributeNames: {
          '#ts': 'timestamp',
        },
        ExpressionAttributeValues: {
          ':sessionId': sessionId,
          ':timestamp': 0,
        },
        Limit: 1,
      };
      
      const result = await dynamoDB.send(new QueryCommand(params));
      
      if (result.Items && result.Items.length > 0) {
        const context = result.Items[0];
        logger.info?.('Session context retrieved', {
          sessionId,
          hasContext: !!context.context,
        });
        return context;
      }
      
      return null;
      
    } catch (error) {
      logger.error?.('Failed to retrieve session context', {
        sessionId,
        error: error.message,
        stack: error.stack,
      });
      
      throw error;
    }
  }
  
  /**
   * Update session context
   * 
   * @param {string} sessionId - Global session ID
   * @param {Object} contextData - Context data to update
   * @returns {Promise<Object>} Updated context object
   */
  async function updateSessionContext(sessionId, contextData) {
    if (!sessionId) {
      throw new Error('sessionId is required');
    }
    
    if (!contextData || typeof contextData !== 'object') {
      throw new Error('contextData must be an object');
    }
    
    try {
      const timestamp = Date.now();
      
      const params = {
        TableName: tableName,
        Key: {
          sessionId,
          timestamp: 0,
        },
        UpdateExpression: 'SET context = :context, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':context': contextData,
          ':updatedAt': timestamp,
        },
        ReturnValues: 'ALL_NEW',
      };
      
      const result = await dynamoDB.send(new UpdateCommand(params));
      
      logger.info?.('Session context updated', {
        sessionId,
        timestamp,
      });
      
      return result.Attributes;
      
    } catch (error) {
      logger.error?.('Failed to update session context', {
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
  async function checkTableHealth() {
    try {
      await dynamoDB.send(new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: 'sessionId = :sessionId',
        ExpressionAttributeValues: {
          ':sessionId': 'health-check',
        },
        Limit: 1,
      }));
      
      return true;
    } catch (error) {
      logger.error?.('Chat history table health check failed', {
        error: error.message,
      });
      
      return false;
    }
  }
  
  // Return service methods
  return {
    saveChatMessage,
    getChatHistory,
    getRecentMessages,
    initializeSessionContext,
    getSessionContext,
    updateSessionContext,
    checkTableHealth,
  };
}

