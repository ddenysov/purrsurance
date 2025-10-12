/**
 * GetContext Lambda Function for AWS Bedrock Agent (Function Response Format)
 *
 * This function allows agents to retrieve contextual information (diagnosis, complaints, symptoms, etc.)
 * from the session context that was previously saved.
 *
 * @param {Object} event - The event payload from the Bedrock Agent.
 * @returns {Object} object - The response object formatted for the Bedrock Agent.
 */
import { createAgentResponse, extractSessionId, extractParameters, sendEventToPublisher, createChatHistoryService } from "./vendor/agent-tools/index.mjs";

const eventPublisherUrl = process.env.EVENT_PUBLISHER_URL;
const chatHistoryTableName = process.env.CHAT_HISTORY_TABLE_NAME || 'ChatHistory';

// Initialize Chat History Service
const chatHistory = createChatHistoryService({
  tableName: chatHistoryTableName,
  logger: console
});

export const lambdaHandler = async (event, context) => {
  // Log the incoming event for debugging
  console.log('Bedrock Agent Event (Function format):', JSON.stringify(event, null, 2));

  // Extract sessionId from parameters (required parameter from agent)
  const sessionId = event.sessionState?.sessionAttributes?.sessionId || 
                    event.sessionAttributes?.sessionId || 
                    event.sessionId || 
                    'unknown-session';
  
  console.log('Extracted sessionId:', sessionId);
  console.log('Bedrock sessionId (internal):', event.sessionId);
  
  if (!sessionId) {
    console.error('Missing required parameter: sessionId');
    const errorResponse = {
      success: false,
      message: 'Missing required parameter: sessionId',
      error: 'sessionId is required'
    };
    return createAgentResponse('GetContext', errorResponse, 'ContextActionGroup');
  }
  
  console.log('Using sessionId from parameters:', sessionId);
  console.log('Bedrock sessionId (internal):', event.sessionId);

  let responseBodyContent = {
    success: false,
    message: 'Failed to retrieve context'
  };

  // Retrieve all data from session context
  try {
    // Get current context
    const currentContext = await chatHistory.getSessionContext(sessionId);
    
    if (!currentContext || !currentContext.context) {
      responseBodyContent = {
        success: false,
        message: 'No context found for this session',
        contextData: null
      };
      
      console.log('No context found:', { sessionId });
    } else {
      const contextData = currentContext.context.contextData || {};
      
      // Always return all context data
      responseBodyContent = {
        success: true,
        message: 'All context retrieved successfully',
        contextData: contextData,
        contextKeys: Object.keys(contextData),
        lastUpdate: currentContext.context.lastContextUpdate
      };
      
      console.log('All context retrieved:', {
        sessionId,
        keys: Object.keys(contextData),
        lastUpdate: currentContext.context.lastContextUpdate
      });
    }
  } catch (error) {
    console.error('Failed to retrieve context:', {
      sessionId,
      error: error.message,
      stack: error.stack
    });
    
    responseBodyContent = {
      success: false,
      error: error.message,
      message: 'Failed to retrieve context from session storage'
    };
  }

  // Send event to Event Publisher (non-blocking)
  try {
    await sendEventToPublisher(eventPublisherUrl, sessionId, {
      success: responseBodyContent.success
    }, 'ContextRetrieved');
  } catch (error) {
    console.error('Failed to send event to publisher:', error);
    // Continue execution even if event publishing fails
  }

  // Return response using utility function
  return createAgentResponse('GetContext', responseBodyContent, 'ContextActionGroup');
};

