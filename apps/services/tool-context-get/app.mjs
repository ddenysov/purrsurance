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

  // Extract sessionId from event (prioritize globalSessionId from sessionAttributes)
  const sessionId = event.sessionState?.sessionAttributes?.sessionId || 
                    event.sessionAttributes?.sessionId || 
                    event.sessionId || 
                    'unknown-session';
  
  console.log('Extracted sessionId:', sessionId);
  console.log('Bedrock sessionId (internal):', event.sessionId);

  // Extract parameters from the event
  const parameters = event.parameters || [];
  const contextKey = parameters.find(p => p.name === 'contextKey')?.value;
  const includeAll = parameters.find(p => p.name === 'includeAll')?.value === 'true';

  let responseBodyContent = {
    success: false,
    message: 'Failed to retrieve context'
  };

  // Retrieve data from session context
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
      
      // If includeAll is true, return all context
      if (includeAll) {
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
      // If contextKey is specified, return only that key
      else if (contextKey) {
        if (contextData[contextKey]) {
          responseBodyContent = {
            success: true,
            message: `Context retrieved successfully for key: ${contextKey}`,
            contextKey: contextKey,
            contextData: contextData[contextKey],
            entryCount: Array.isArray(contextData[contextKey]) ? contextData[contextKey].length : 1
          };
          
          console.log('Context retrieved:', {
            sessionId,
            contextKey,
            entryCount: Array.isArray(contextData[contextKey]) ? contextData[contextKey].length : 1
          });
        } else {
          responseBodyContent = {
            success: false,
            message: `No context found for key: ${contextKey}`,
            contextKey: contextKey,
            contextData: null,
            availableKeys: Object.keys(contextData)
          };
          
          console.log('Context key not found:', {
            sessionId,
            contextKey,
            availableKeys: Object.keys(contextData)
          });
        }
      } 
      // If no parameters specified, return list of available keys
      else {
        responseBodyContent = {
          success: true,
          message: 'Context keys available',
          availableKeys: Object.keys(contextData),
          lastUpdate: currentContext.context.lastContextUpdate,
          hint: 'Specify contextKey parameter to get specific data, or set includeAll=true to get all context'
        };
        
        console.log('Available context keys listed:', {
          sessionId,
          keys: Object.keys(contextData)
        });
      }
    }
  } catch (error) {
    console.error('Failed to retrieve context:', {
      sessionId,
      contextKey,
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
      contextKey,
      includeAll,
      success: responseBodyContent.success
    }, 'ContextRetrieved');
  } catch (error) {
    console.error('Failed to send event to publisher:', error);
    // Continue execution even if event publishing fails
  }

  return {
    'messageVersion': '1.0',
    'response': {
      'actionGroup': 'ContextActionGroup',
      'function': 'GetContext',
      'functionResponse': {
        'responseBody': {
          'TEXT': {
            'body': JSON.stringify(responseBodyContent, null, 2),
          },
        },
      }
    }
  };
};

