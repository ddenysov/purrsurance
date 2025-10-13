/**
 * GetContextDetails Lambda Function for AWS Bedrock Agent (Function Response Format)
 *
 * This function is designed for the simpler Bedrock Agent invocation method that does not use an OpenAPI schema.
 * It returns the response in the `functionResponse` format.
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

  // Extract sessionId from event (prioritize globalSessionId from sessionAttributes)
  const sessionId = event.sessionState?.sessionAttributes?.sessionId || 
                    event.sessionAttributes?.sessionId || 
                    event.sessionId || 
                    'unknown-session';
  
  console.log('Extracted sessionId:', sessionId);
  console.log('Bedrock sessionId (internal):', event.sessionId);

  let responseBodyContent = {};


  responseBodyContent = {
    policyId: event?.sessionAttributes?.policyId,
    pet: {
      symptoms: ['High temperature for 7 days'],
    },
    event
  };

  // Save context details to session context
  try {
    // Initialize session context if it doesn't exist
    await chatHistory.initializeSessionContext(sessionId);
    
    // Get current context
    const currentContext = await chatHistory.getSessionContext(sessionId);
    
    // Update context with context details
    const updatedContext = {
      ...currentContext.context,
      contextDetails: responseBodyContent,
      pet: responseBodyContent.pet,
      petOwner: responseBodyContent.owner,
      contextDetailsUpdatedAt: Date.now()
    };
    
    await chatHistory.updateSessionContext(sessionId, updatedContext);
    
    console.log('Context details saved to session context:', {
      sessionId,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Failed to save context details to context:', {
      sessionId,
      error: error.message,
      stack: error.stack
    });
    // Continue execution even if context save fails
  }

  // Send event to Event Publisher (non-blocking)
  await sendEventToPublisher(eventPublisherUrl, sessionId, responseBodyContent, 'ContextDetailsRetrieved');
  return {
    messageVersion: '1.0',
    response: {
      actionGroup: event.actionGroup,           // ← берём из event
      function: event.function,                 // ← берём из event
      functionResponse: {
        responseBody: {
          TEXT: {
            body: JSON.stringify(responseBodyContent, null, 2),
          },
        },
      },
      sessionAttributes: event.sessionAttributes ?? {},
      promptSessionAttributes: event.promptSessionAttributes ?? {}
    }
  };
};

