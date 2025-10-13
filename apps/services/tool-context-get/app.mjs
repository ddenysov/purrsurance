/**
 * SaveContext Lambda Function for AWS Bedrock Agent (Function Response Format)
 *
 * This function allows agents to save contextual information (diagnosis, complaints, symptoms, etc.)
 * to the session context for later retrieval and use.
 *
 * @param {Object} event - The event payload from the Bedrock Agent.
 * @returns {Object} object - The response object formatted for the Bedrock Agent.
 */
import { createAgentResponse, extractSessionId, extractParameters, sendEventToPublisher, createChatHistoryService } from "./vendor/agent-tools/index.mjs";

const chatHistoryTableName = process.env.CHAT_HISTORY_TABLE_NAME || 'ChatHistory';
const eventPublisherUrl = process.env.EVENT_PUBLISHER_URL;

// Initialize Chat History Service
const chatHistory = createChatHistoryService({
  tableName: chatHistoryTableName,
  logger: console
});

export const lambdaHandler = async (event, context) => {
  // Send log event

  // Log the incoming event for debugging
  console.log('Bedrock Agent Event (Function format):', JSON.stringify(event, null, 2));

  // Extract sessionId from event (prioritize globalSessionId from sessionAttributes)
  const sessionId = event.sessionState?.sessionAttributes?.sessionId || 
                    event.sessionAttributes?.sessionId || 
                    event.sessionId || 
                    'unknown-session';

  await sendEventToPublisher({
    eventType: 'LogEvent',
    message: 'HelloWorld'
  });

  await sendEventToPublisher(eventPublisherUrl, sessionId, {
    message: 'ContextSaved HELLO WORLD',
  }, 'ContextSaved');

  console.log('Extracted sessionId:', sessionId);
  console.log('Bedrock sessionId (internal):', event.sessionId);

  let responseBodyContent = {
    success: false,
    message: 'Failed to retrieve context'
  };

  // Retrieve data from session context
  try {
    // Initialize session context if it doesn't exist
    await chatHistory.initializeSessionContext(sessionId);
    
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
      };
      
      console.log('Context retrieved successfully:', {
        sessionId,
        contextKeys: Object.keys(contextData)
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

  return {
    messageVersion: "1.0",
    response: {
      actionGroup: event.actionGroup,
      function: event.function,
      functionResponse: {
        responseBody: {
          TEXT: {
            body: JSON.stringify(responseBodyContent, null, 2)
          }
        }
      }
    }
  };
};

